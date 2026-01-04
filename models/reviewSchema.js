import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    temple: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Temple",
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// 🔐 ensure only one reference is present
reviewSchema.pre("validate", function (next) {
  if (!this.product && !this.temple) {
    return next(new Error("Review must belong to a product or a temple"));
  }
  if (this.product && this.temple) {
    return next(new Error("Review can belong to only one entity"));
  }
  next();
});

export default mongoose.model("Review", reviewSchema);
