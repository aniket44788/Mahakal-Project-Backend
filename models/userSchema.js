import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },

  // ✅ Make phone optional for Google OAuth users
  phone: {
    type: String,
    unique: true,
    sparse: true, // allows multiple null values
    required: function () {
      // Phone is required only if not using Google OAuth
      return !this.googleId;
    },
  },

  // ✅ Email for Google OAuth users
  email: {
    type: String,
    unique: true,
    sparse: true,
    required: function () {
      // Email is required only for Google OAuth users
      return !!this.googleId;
    },
  },

  // ✅ Add googleId for OAuth identification
  googleId: { type: String, unique: true, sparse: true },

  // ✅ Add password field (optional)
  password: { type: String },

  isVerified: { type: Boolean, default: false },
  otp: { type: String }, // temporary OTP storage for phone auth
  otpExpires: { type: Date },

  // ✅ Add authentication method tracking
  authMethod: {
    type: String,
    enum: ["phone", "google", "email"],
    default: "phone",
  },

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

// ✅ Create compound index for better query performance
userSchema.index({ phone: 1, email: 1, googleId: 1 });

// Password hashing middleware
userSchema.pre("save", async function (next) {
  // Only hash if password field exists and is modified
  if (!this.isModified("password") || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Helper method to check authentication method
userSchema.methods.isGoogleUser = function () {
  return !!this.googleId;
};

userSchema.methods.isPhoneUser = function () {
  return !!this.phone && !this.googleId;
};

export default mongoose.model("User", userSchema);
