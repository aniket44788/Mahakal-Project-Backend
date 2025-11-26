import express from "express";
import {
  createOrder,
  getOrderById,
  getorders,
  updateOrderStatus,
  verifyPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/protectuser.js";
import { adminProtect } from "../middleware/adminauth.js";

const paymentRouter = express.Router();
paymentRouter.post("/create-order", protect, createOrder);
paymentRouter.post("/verify-payment", protect, verifyPayment);
paymentRouter.get("/myorders", protect, getorders);
paymentRouter.get("/myorders/:id", protect, getOrderById);

paymentRouter.put("/order/update/:orderId", adminProtect, updateOrderStatus);

export default paymentRouter;
