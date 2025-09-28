import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true }, // optional
  isVerified: { type: Boolean, default: false },
  otp: { type: String }, // temporary OTP storage
  otpExpires: { type: Date },
  address: [
    {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
  ],
  favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  createdAt: { type: Date, default: Date.now },
});

// Optional password hash if using password login too
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
