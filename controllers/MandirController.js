import Temple from "../models/MandirSchema.js";
import cloudinary from "../config/cloudinary.js";

// CREATE TEMPLE
export const createTemple = async (req, res) => {
  try {
    let images = [];

    // If files uploaded
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const newTemple = new Temple({
      ...req.body,
      images,
    });

    const savedTemple = await newTemple.save();

    res.status(201).json({
      success: true,
      message: "Temple created successfully",
      temple: savedTemple,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getTemples = async (req, res) => {
  try {
    const temples = await Temple.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, temples });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getTempleById = async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id);
    if (!temple)
      return res
        .status(404)
        .json({ success: false, message: "Temple not found" });

    res.status(200).json({ success: true, temple });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
