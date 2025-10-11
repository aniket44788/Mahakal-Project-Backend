import express from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userSchema.js";
import generateToken from "../utils/generateToken.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post("/token", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "No ID token provided" });
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;

    // Find or create the user in your database
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email,
        googleId,
        isVerified: true,
        authMethod: "google",
      });
    }

    const token = generateToken(user);

    return res.json({ success: true, user, token });
  } catch (err) {
    console.error("Google token error:", err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid Google token" });
  }
});

export default router;
