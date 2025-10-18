import User from "../models/userSchema.js";
import Product from "../models/productSchema.js";

// ✅ Get Cart
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");

    // Fix: Convert to plain objects to avoid Buffer serialization of ObjectIds
    const cartData = user.cart.map((item) => item.toObject({ virtuals: true }));

    res.json({ success: true, cart: cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Add product to cart (or increase quantity if already present)
export const addToCart = async (req, res) => {
  const { productId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const user = await User.findById(req.user.id);

    // Check if product is already in cart
    const existingItem = user.cart.find(
      (item) => item.product && item.product.toString() === productId
    );
    if (existingItem) {
      // Increase quantity
      existingItem.quantity += 1;
    } else {
      // Add new item
      user.cart.push({ product: productId, quantity: 1 });
    }

    await user.save();

    await user.populate({
      path: "cart.product",
      model: "Product",
    });

    // Fix: Convert to plain objects to avoid Buffer serialization of ObjectIds
    const cartData = user.cart.map((item) => item.toObject({ virtuals: true }));

    res.json({ success: true, cart: cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update quantity for a product (increase/decrease)
export const updateQuantity = async (req, res) => {
  const { productId, quantity, setQuantity } = req.body; // Support both delta and setQuantity
  const delta = quantity; // For backward compat, but check setQuantity first
  if (delta < 0 && !setQuantity) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity cannot be negative" });
  }
  try {
    const user = await User.findById(req.user.id);
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId
    );
    if (existingItemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not in cart" });
    }

    const existingItem = user.cart[existingItemIndex];

    let newQuantity;
    if (setQuantity !== undefined) {
      // Set absolute quantity (min 1)
      newQuantity = Math.max(1, parseInt(setQuantity));
    } else {
      // Adjust by delta (min 1)
      newQuantity = Math.max(1, existingItem.quantity + parseInt(delta));
    }

    existingItem.quantity = newQuantity;

    // If quantity reaches 0, remove the item
    if (newQuantity === 0) {
      user.cart.splice(existingItemIndex, 1);
    }

    await user.save();

    await user.populate({
      path: "cart.product",
      model: "Product",
    });

    // Fix: Convert to plain objects to avoid Buffer serialization of ObjectIds
    const cartData = user.cart.map((item) => item.toObject({ virtuals: true }));

    res.json({ success: true, cart: cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Remove product from cart (delete entirely)
export const removeFromCart = async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId
    );
    if (existingItemIndex !== -1) {
      user.cart.splice(existingItemIndex, 1);
      await user.save();
    }

    await user.populate({
      path: "cart.product",
      model: "Product",
    });

    // Fix: Convert to plain objects to avoid Buffer serialization of ObjectIds
    const cartData = user.cart.map((item) => item.toObject({ virtuals: true }));

    res.json({ success: true, cart: cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Clear Cart
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
