import { OAuth2Client } from "google-auth-library";
import User from "../../models/userSchema.js";
import { generateOTP } from "../../utils/sendOTP.js";
import generateToken from "../../utils/generateToken.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1️⃣ Phone OTP registration/login
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

// 3️⃣ Token-exchange Google login
export const googleTokenLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing idToken" });
    }

    // Verify with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Google account" });
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture,
        isVerified: true,
        authMethod: "google",
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.profileImage = picture;
      user.isVerified = true;
      user.authMethod = "google";
      await user.save();
    }

    const token = generateToken(user);
    return res.json({ success: true, token, user });
  } catch (err) {
    console.error("Google token verification error:", err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid Google token" });
  }
};
