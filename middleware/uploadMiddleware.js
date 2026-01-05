import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Customize folder based on type if you want
    let folder = "products"; // default folder

    if (file.mimetype.startsWith("image/")) folder = "images";
    else if (file.mimetype.startsWith("video/")) folder = "videos";
    else if (file.mimetype.startsWith("audio/")) folder = "audios";

    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mp3", "wav"],
      // optional: use original filename or custom public_id
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

// Multer middleware
const upload = multer({ storage });

export default upload;

