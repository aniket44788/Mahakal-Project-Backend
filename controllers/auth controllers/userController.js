import User from "../../models/userSchema.js";
import { generateOTP } from "../../utils/sendOTP.js";
import generateToken from "../../utils/generateToken.js";

// 1️⃣ Start registration or login with phone
export const registerOrSendOTP = async (req, res) => {
  const { phone, name } = req.body;
  try {
    let user = await User.findOne({ phone });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    if (!user) {
      // New user
      user = await User.create({ phone, name, otp, otpExpires });
    } else {
      // Existing user - update OTP
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // TODO: Send OTP via SMS service (Twilio / Fast2SMS / MSG91)
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ success: true, message: "OTP sent", phone, otp });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 2️⃣ Verify OTP
export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user);

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
