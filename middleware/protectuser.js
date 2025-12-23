import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 🔐 Get token from header or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
    
    // 🔑 Verify token (IMPORTANT FIX)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_AUTH);

    // 👤 Attach user to request
    req.user = await User.findById(decoded.id)
      .select("-password -emailOtp -emailOtpExpiry -__v")
      .populate({
        path: "cart.product",
        select: "title price image",
      })
      .populate({
        path: "orders",
        select: "totalAmount status createdAt",
      })
      .populate({
        path: "favoriteProducts",
        select: "title price image category",
      });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid or expired token",
    });
  }
};
