// controllers/auth/userController.js
import User from "../../models/userSchema.js";
import { generateOTP } from "../../utils/sendOTP.js";
import generateToken from "../../utils/generateToken.js";

// 1️⃣ Phone OTP
export const registerOrSendOTP = async (req, res) => {
  const { phone, name } = req.body;
  try {
    let user = await User.findOne({ phone });
    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    if (!user) {
      user = await User.create({
        phone,
        name,
        otp,
        otpExpires,
        authMethod: "phone",
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    console.log(`OTP for ${phone}: ${otp}`);
    return res.json({ success: true, message: "OTP sent", phone });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
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
    return res.json({ success: true, token, user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// 3️⃣ Redirect-based Google callback
export const googleCallback = async (req, res) => {
  try {
    const profile = req.user;
    if (!profile?.emails?.[0]?.value) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Google profile" });
    }

    let user = await User.findOne({
      $or: [{ email: profile.emails[0].value }, { googleId: profile.id }],
    });

    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        isVerified: true,
        authMethod: "google",
      });
    } else if (!user.googleId) {
      user.googleId = profile.id;
      user.isVerified = true;
      user.authMethod = "google";
      await user.save();
    }

    const token = generateToken(user);
    return res.redirect(`${process.env.ORIGIN_URL}/dashboard?token=${token}`);
  } catch (err) {
    console.error("Google callback error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
