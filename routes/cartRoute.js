import express from "express";
import { protect } from "../middleware/protectuser.js";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const cartRouter = express.Router();

// 🛒 Cart Routes
cartRouter.get("/get", protect, getCart); // Get user's cart
cartRouter.post("/add", protect, addToCart); // Add product to cart or increase quantity
cartRouter.post("/update-quantity", protect, updateQuantity); // Update quantity for a product (increase/decrease)
cartRouter.post("/remove", protect, removeFromCart); // Remove product from cart (set quantity to 0)
cartRouter.post("/clear", protect, clearCart); // Clear all items from cart

export default cartRouter;
