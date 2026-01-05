import express from "express";
import {
  createOrder,
  downloadInvoiceAdmin,
  getAllUsers,
  getOrderById,
  getorders,
  getOrdersByUserAdmin,
  getRecentOrders,
  updateOrderStatus,
  verifyPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/protectuser.js";
import { adminProtect } from "../middleware/adminauth.js";

const paymentRouter = express.Router();
paymentRouter.post("/create-order", protect, createOrder);

paymentRouter.post("/verify-payment", protect, verifyPayment);

paymentRouter.get("/myorders", protect, getorders);

paymentRouter.get("/getAllUsers", adminProtect, getAllUsers);

paymentRouter.get("/myorders/:id", protect, getOrderById);

paymentRouter.put("/order/update/:orderId", adminProtect, updateOrderStatus);

paymentRouter.get(
  "/admin/user/:userId/orders",
  adminProtect,
  getOrdersByUserAdmin
);

paymentRouter.get("/getrecentorders", adminProtect, getRecentOrders);

paymentRouter.get(
  "/admin/order/:orderId/invoice",
  adminProtect,
  downloadInvoiceAdmin
);

export default paymentRouter;
