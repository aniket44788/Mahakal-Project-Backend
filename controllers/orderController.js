import User from "../models/userSchema.js";
import Order from "../models/orderSchema.js";
import Razorpay from "razorpay";

// ✅ Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY,
});

// ✅ Create Order
export const createOrder = async (req, res) => {
  const { products, amount, currency = "INR" } = req.body;

  try {
    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt: "receipt_" + Date.now(),
      payment_capture: 1,
    };
    const razorpayOrder = await razorpay.orders.create(options);

    // Save in DB
    const order = await Order.create({
      user: req.user.id,
      products,
      amount,
      currency,
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get User Orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate(
      "products.product"
    );
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Verify Payment
export const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

  try {
    const order = await Order.findOne({ razorpayOrderId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Add order to user and clear cart
    const user = await User.findById(req.user.id);
    user.orders.push(order._id);
    user.cart = [];
    await user.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
