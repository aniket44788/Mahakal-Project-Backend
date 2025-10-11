export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. HTTPS-only cookie (optional)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .populate("cart")
      .populate("orders")
      .populate("favoriteProducts")
      .select("-password -otp -otpExpires");

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
