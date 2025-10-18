import express from "express";
import { protect } from "../middleware/protectuser.js";
import {
  createOrder,
  getOrders,
  verifyPayment,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// 🧾 Order Routes
orderRouter.post("/create-order", protect, createOrder);
orderRouter.get("/", protect, getOrders);
orderRouter.post("/verify-payment", protect, verifyPayment);

export default orderRouter;
