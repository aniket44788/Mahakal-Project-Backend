import express from "express";
import {
  deleteAddress,
  googleTokenLogin,
  sendContactMail,
  updateAddress,
  userAddress,
  userProfile,
} from "../../controllers/authcontrollers/userController.js";
import { protect } from "../../middleware/protectuser.js";

const router = express.Router();

router.post("/google/token", googleTokenLogin);
router.get("/profile", protect, userProfile);
router.post("/address", protect, userAddress);
router.put("/address/update/:id", protect, updateAddress);
router.delete("/address/delete/:id", protect, deleteAddress);
router.post("/email", protect, sendContactMail);



export default router;
