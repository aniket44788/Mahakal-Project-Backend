import express from "express";
import {
  registerOrSendOTP,
  verifyOTP,
  googleTokenLogin,
} from "../../controllers/authcontrollers/userController.js";

const router = express.Router();

// Phone OTP
router.post("/register", registerOrSendOTP);
router.post("/verify", verifyOTP);

// Token-based Google
router.post("/google/token", googleTokenLogin);

export default router;
