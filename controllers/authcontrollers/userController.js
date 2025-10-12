import { OAuth2Client } from "google-auth-library";
import User from "../../models/userSchema.js";
import { generateOTP } from "../../utils/sendOTP.js";
import generateToken from "../../utils/generateToken.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
