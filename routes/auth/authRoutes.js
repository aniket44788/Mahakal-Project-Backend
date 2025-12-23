import express from "express";
import {
  deleteAddress,
  // googleTokenLogin,
  sendContactMail,
  sendOtp,
  updateAddress,
  updateUserProfile,
  userAddress,
  userProfile,
  verifyOtp,
} from "../../controllers/authcontrollers/userController.js";
import { protect } from "../../middleware/protectuser.js";
import upload from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// router.post("/google/token", googleTokenLogin);
router.post("/register", sendOtp);
router.post("/verifyOtp", verifyOtp);

router.get("/profile", protect, userProfile);

router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateUserProfile
);

router.post("/address", protect, userAddress);
router.put("/address/update/:id", protect, updateAddress);
router.delete("/address/delete/:id", protect, deleteAddress);
router.post("/email", protect, sendContactMail);

export default router;
