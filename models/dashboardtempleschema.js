import mongoose from "mongoose";

const templeSchema = new mongoose.Schema(
  {
    templeImages: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    templeAddress: {
      type: String,
      required: true,
      trim: true,
    },
    templePrasadTitle: {
      type: String,
      required: true,
      trim: true,
    },
    templePrasadDescription: {
      type: String,
      required: true,
      trim: true,
    },
    templePrasadPrice: {
      type: Number,
      required: true,
    },
    templePrasadDiscountPrice: {
      type: Number,
      default: 0,
    },
    templePrasadMaterial: {
      type: [String],
      required: true,
    },
    templePrasadRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  { timestamps: true }
);

const Temple = mongoose.model("Temple", templeSchema);
export default Temple;
