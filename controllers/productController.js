import Product from "../models/productSchema.js";
import cloudinary from "../config/cloudinary.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const newProduct = new Product({
      ...req.body,
      images,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE PRODUCT
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...(images.length > 0 && { images }) },
      { new: true }
    );

    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, message: "Product updated", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Delete images from cloudinary
    for (let img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
