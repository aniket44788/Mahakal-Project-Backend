import express from "express";
import {
  googleTokenLogin,
} from "../../controllers/authcontrollers/userController.js";

const router = express.Router();

// Token-based Google
router.post("/google/token", googleTokenLogin);

export default router;
