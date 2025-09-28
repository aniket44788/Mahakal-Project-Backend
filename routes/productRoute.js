import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { adminProtect } from "../middleware/adminauth.js";

const productRouter = express.Router();

// ✅ Admin Routes
productRouter.post("/", adminProtect, createProduct); // create product
productRouter.put("/:id", adminProtect, updateProduct); // update product
productRouter.delete("/:id", adminProtect, deleteProduct); // delete product

// ✅ Public Routes
productRouter.get("/", getProducts); // list all products
productRouter.get("/:id", getProduct); // get single product

export default productRouter;
