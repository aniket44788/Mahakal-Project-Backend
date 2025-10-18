import express from "express";
import {
  adminLogin,
  adminProfile,
  adminRegisterEmail,
} from "../../controllers/authcontrollers/adminController.js";
import { adminProtect } from "../../middleware/adminauth.js";

const adminRouter = express.Router();

adminRouter.post("/register", adminRegisterEmail);

// Admin login
adminRouter.post("/login", adminLogin);

// Admin dashboard (protected)
adminRouter.get("/profile", adminProtect, adminProfile);

export default adminRouter;
