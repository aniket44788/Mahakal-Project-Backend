import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },

  // ✅ Email for Google or Email login
  email: {
    type: String,
    unique: true,
    sparse: true, // allows users without email if ever needed
    required: true,
    lowercase: true,
    trim: true,
  },

  // ✅ Google OAuth ID
  googleId: {
    type: String,
    unique: true,
    sparse: true, // allows normal email users too
  },

  // ✅ Password (for normal email-based login)
  password: { type: String },

  // ✅ Account verification flag
  isVerified: { type: Boolean, default: false },

  // ✅ Auth method tracking
  authMethod: {
    type: String,
    enum: ["google", "email"],
    default: "google",
  },

  // ✅ Optional address info
  address: [
    {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
  ],

  // ✅ Relations,
  favoriteProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
    },
  ],

  
  createdAt: { type: Date, default: Date.now },
});

// ✅ Create useful indexes
userSchema.index({ email: 1, googleId: 1 });

// ✅ Hash password if changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Auth helpers
userSchema.methods.isGoogleUser = function () {
  return !!this.googleId;
};

userSchema.methods.isEmailUser = function () {
  return !this.googleId && !!this.email;
};

export default mongoose.model("User", userSchema);
