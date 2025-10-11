// routes/auth/userRoutes.js
import express from "express";
import passport from "passport";
import {
  registerOrSendOTP,
  verifyOTP,
  googleCallback,
} from "../../controllers/auth controllers/userController.js";

const router = express.Router();

// Phone OTP
router.post("/register", registerOrSendOTP);
router.post("/verify", verifyOTP);

// Redirect-based Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/google/fail" }),
  googleCallback
);
router.get("/google/fail", (req, res) =>
  res.status(400).json({ success: false, message: "Google login failed" })
);

export default router;
