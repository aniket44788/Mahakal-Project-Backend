import express from "express";
import {
  createTempleProduct,
  getAllTempleProducts,
  getTempleProductById,
  updateTempleProduct,
  deleteTempleProduct,
} from "../../controllers/Dashboard Products Controllers/DashboardProducts.js";
import upload from "../../middleware/uploadMiddleware.js";
const DashboardProductRouter = express.Router();
DashboardProductRouter.post(
  "/post",
  upload.array("templeImages", 5),
  createTempleProduct
);
DashboardProductRouter.get("/get", getAllTempleProducts);
DashboardProductRouter.get("/get/:id", getTempleProductById);
// ✅ Use your existing multer for temple update
DashboardProductRouter.patch(
  "/update/:id",
  upload.array("templeImages", 5), // same field name used in frontend FormData
  updateTempleProduct
);

DashboardProductRouter.delete("/delete/:id", deleteTempleProduct);

export default DashboardProductRouter;
