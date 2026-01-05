import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        category: {
          type: String,
          required: true,
          enum: [
            "Prasad",
            "Pooja Samagri",
            "Rudraksha & Malas",
            "Dhup / Shankh",
            "Tulsi Mala",
            "Chandan",
            "Tabeez",
            "Books",
            "Mantra Books",
            "God Idols & Frames",
            "Kanwar Yatra Samagri",
            "Sindoor",
            "Roli",
            "Haldi",
            "Akshat (Chawal)",
            "Festival Kits",
            "Digital Items (Aarti / Video / Pen drive)",
            "Custom Tabeez",
          ],
        },
        images: [
          {
            url: { type: String, required: true },
            public_id: { type: String },
          },
        ],
        quantity: { type: Number, default: 1 },
        price: Number,
        unit: {
          type: String,
          enum: ["piece", "pack", "gm", "kg", "ml", "set"],
          default: "piece",
        },
      },
    ],
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    invoicePath: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    // ⭐ ADD THIS ⭐
    address: {
      fullName: String,
      phone: String,
      pincode: String,
      townCity: String,
      state: String,
      houseNumber: String,
      street: String,
      landmark: String,
      _id: false, // (optional) to avoid auto _id creation
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
