import express from "express";
import {
  googleTokenLogin,
  userProfile,
} from "../../controllers/authcontrollers/userController.js";
import { protect } from "../../middleware/protectuser.js";

const router = express.Router();

router.post("/google/token", googleTokenLogin);
router.get("/profile", protect, userProfile);

export default router;
