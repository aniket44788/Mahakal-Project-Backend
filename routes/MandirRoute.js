import express from "express";
import {
  createTemple,
  getTemples,
  getTempleById,
} from "../controllers/MandirController.js";
import upload from "../middleware/uploadMiddleware.js";
import { adminProtect } from "../middleware/adminauth.js";
import { protect } from "../middleware/protectuser.js";

const MandirRoute = express.Router();

// Add Temple
MandirRoute.post(
  "/create",
  adminProtect,
  upload.array("images", 5),
  createTemple
);

// Get All Temples
MandirRoute.get("/getall", protect, getTemples);

// Get Temple By ID
MandirRoute.get("/getby/:id", getTempleById);

export default MandirRoute;
