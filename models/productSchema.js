import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // अब यहाँ से Category का link होगा
      required: true,
    },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, enum: ["piece", "pack", "gm", "kg", "ml", "set"], default: "piece" },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],
    isAvailable: { type: Boolean, default: true },

    // Extra fields
    material: { type: String },
    size: { type: String },
    weight: { type: Number },
    language: { type: String },
    deity: { type: String },
    occasion: { type: String },
    customOptions: { type: mongoose.Schema.Types.Mixed },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
