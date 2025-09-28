import express from "express";
import {
  registerOrSendOTP,
  verifyOTP,
} from "../../controllers/auth controllers/userController.js";
import { protect } from "../../middleware/auth.js";

const userRouter = express.Router();

// Start registration / login with phone
userRouter.post("/register", registerOrSendOTP);

// Verify OTP
userRouter.post("/verify", verifyOTP);

export default userRouter;
