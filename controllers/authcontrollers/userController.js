import { OAuth2Client } from "google-auth-library";
import User from "../../models/userSchema.js";
import { generateOTP } from "../../utils/sendOTP.js";
import generateToken from "../../utils/generateToken.js";
import orderSchema from "../../models/orderSchema.js";
import productSchema from "../../models/productSchema.js";

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

export const userProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.id || req.query.id;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // 🔍 Find the user, but exclude sensitive fields like password
    const user = await User.findById(userId)
      .select("-password")
      .populate("favoriteProducts")
      .populate("orders")
      .populate("cart");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Send user profile
    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user profile",
      error: error.message,
    });
  }
};
