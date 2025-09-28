import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // एक ही नाम दोबारा ना बने
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // subcategory support (e.g. "Pooja Samagri" -> "Sindoor")
      default: null,
    },
    image: {
      type: String, // Category banner image (Cloudinary url)
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
