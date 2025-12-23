import mongoose from "mongoose";
import bcrypt from "bcrypt";
import addressSchema from "./addressSchema.js";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },

  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },

  // 🔐 Optional password (future use)
  password: {
    type: String,
    select: false,
  },

  // 📩 Email OTP login
  emailOtp: {
    type: String,
  },

  emailOtpExpiry: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  authMethod: {
    type: String,
    enum: ["email", "google"],

    default: "email",
  },

  profileImage: { type: String, default: "" },

  addresses: [addressSchema],

  favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

// 🔐 Hash password if used
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
