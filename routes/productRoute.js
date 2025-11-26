import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { adminProtect } from "../middleware/adminauth.js";
import upload from "../middleware/uploadMiddleware.js";

const productRouter = express.Router();

// ✅ Admin Routes
productRouter.post(
  "/createproduct",
  adminProtect,
  upload.array("images", 5),
  createProduct
);

productRouter.patch(
  "/update/:id",
  adminProtect,
  upload.array("images", 5),
  updateProduct
);

productRouter.delete("/delete/:id", adminProtect, deleteProduct);

// ✅ Public Routes
productRouter.get("/all", getProducts);
productRouter.get("/single/:id", getProduct);

export default productRouter;
