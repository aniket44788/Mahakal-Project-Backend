import Temple from "../../models/dashboardtempleschema.js"; 
import cloudinary from "../../config/cloudinary.js";

// ✅ CREATE TEMPLE PRODUCT (with image upload)
export const createTempleProduct = async (req, res) => {
  try {
    let templeImages = [];

    // 🖼️ If images are uploaded
    if (req.files && req.files.length > 0) {
      // Upload all images to Cloudinary
      const uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "temple_products",
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );

      templeImages = uploadedImages;
    }

    const {
      templeAddress,
      templePrasadTitle,
      templePrasadDescription,
      templePrasadPrice,
      templePrasadDiscountPrice,
      templePrasadMaterial,
      templePrasadRating,
    } = req.body;

    // ⚙️ Validation
    if (!templePrasadTitle || !templeAddress) {
      return res.status(400).json({
        success: false,
        message: "Temple title and address are required.",
      });
    }

    // 🕉️ Create new Temple Product
    const newTemple = new Temple({
      templeImages,
      templeAddress,
      templePrasadTitle,
      templePrasadDescription,
      templePrasadPrice,
      templePrasadDiscountPrice,
      templePrasadMaterial,
      templePrasadRating,
    });

    const savedTemple = await newTemple.save();

    res.status(201).json({
      success: true,
      message: "Temple product created successfully",
      data: savedTemple,
    });
  } catch (error) {
    console.error("❌ Error creating temple product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all temple products
export const getAllTempleProducts = async (req, res) => {
  try {
    const temples = await Temple.find().sort({ createdAt: -1 });

    if (!temples || temples.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No temple products found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Temple products fetched successfully.",
      count: temples.length,
      data: temples,
    });
  } catch (error) {
    console.error("❌ Error fetching temple products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch temple products.",
      error: error.message,
    });
  }
};

// ✅ Get single temple product by ID
export const getTempleProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format before querying
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid temple product ID format.",
      });
    }

    const temple = await Temple.findById(id);

    if (!temple) {
      return res.status(404).json({
        success: false,
        message: "Temple product not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Temple product fetched successfully.",
      data: temple,
    });
  } catch (error) {
    console.error("❌ Error fetching temple by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch temple product.",
      error: error.message,
    });
  }
};

export const updateTempleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { removeImages } = req.body; 
    
    console.log("🟢 Incoming update request for:", id);
    console.log("🟢 Images to remove:", removeImages);

    const existingTemple = await Temple.findById(id);
    if (!existingTemple) {
      return res
        .status(404)
        .json({ success: false, message: "Temple product not found" });
    }

    let templeImages = [...(existingTemple.templeImages || [])];

    // 🧹 1️⃣ Remove deselected images
    if (
      removeImages &&
      Array.isArray(removeImages) &&
      removeImages.length > 0
    ) {
      const imagesToKeep = templeImages.filter(
        (img) => !removeImages.includes(img.public_id)
      );

      // Delete from Cloudinary
      await Promise.all(
        templeImages.map(async (img) => {
          if (removeImages.includes(img.public_id)) {
            try {
              await cloudinary.uploader.destroy(img.public_id);
              console.log("🗑️ Deleted:", img.public_id);
            } catch (err) {
              console.error("⚠️ Cloudinary delete error:", err.message);
            }
          }
        })
      );

      templeImages = imagesToKeep;
    }

    // 🆕 2️⃣ Upload new images if any
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "temple_products",
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );

      // Append new ones to remaining old ones
      templeImages = [...templeImages, ...uploadedImages];
    }

    // 🧩 3️⃣ Prepare updated data
    const updatableFields = [
      "templeAddress",
      "templePrasadTitle",
      "templePrasadDescription",
      "templePrasadPrice",
      "templePrasadDiscountPrice",
      "templePrasadMaterial",
      "templePrasadRating",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        existingTemple[field] = req.body[field];
      }
    });

    existingTemple.templeImages = templeImages;

    // 💾 Save
    const updatedTemple = await existingTemple.save();

    res.status(200).json({
      success: true,
      message: "Temple product updated successfully (images synced)",
      data: updatedTemple,
    });
  } catch (error) {
    console.error("❌ Error updating temple product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete temple product
export const deleteTempleProduct = async (req, res) => {
  try {
    const temple = await Temple.findByIdAndDelete(req.params.id);
    if (!temple) {
      return res.status(404).json({
        success: false,
        message: "Temple product not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Temple product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting temple product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
