import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import Order from "../models/orderSchema.js";
import User from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createOrder = async (req, res) => {
  console.log("Create order hitting");
  const { amount, currency, products, addressId } = req.body;

  try {
    // 🛑 Validate products
    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products are required to create order",
      });
    }
    // ⭐ INSERT ADDRESS CHECK HERE ⭐
    const user = await User.findById(req.user.id);
    console.log("user found", user);

    if (!user.addresses || user.addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No address found. Please add an address before ordering.",
      });
    }

    const selectedAddressId = addressId;
    console.log(selectedAddressId, "Address selected successfully");
    if (!selectedAddressId) {
      return res.status(400).json({
        success: false,
        message: "Please select an address",
        addresses: user.addresses,
      });
    }

    const selectedAddress = user.addresses.id(selectedAddressId);

    if (!selectedAddress) {
      return res.status(404).json({
        success: false,
        message: "Selected address not found",
      });
    }

    // 1️⃣ Create order on Razorpay
    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1,
    };

    console.log(options, "options");

    const razorpayOrder = await razorpay.orders.create(options);

    // // 2️⃣ Save order in MongoDB
    // const newOrder = await Order.create({
    //   user: req.user.id,
    //   products: products, // frontend must send this
    //   amount: amount,
    //   currency: currency || "INR",
    //   razorpayOrderId: razorpayOrder.id,
    //   paymentStatus: "pending",
    //   deliveryStatus: "pending",
    //   address: selectedAddress, // ⭐ ADD THIS
    // });

    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      razorpayOrder,
      address: selectedAddress,
    });
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Verify Payment Controller
export const verifyPayment = async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    signature,
    products,
    amount,
    address,
  } = req.body;

  try {
    if (!process.env.RAZORPAY_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // Validate Razorpay Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Now create order in DB only after payment success
    const newOrder = await Order.create({
      user: req.user.id,
      products,
      amount,
      currency: "INR",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: signature,
      paymentStatus: "paid",
      deliveryStatus: "pending",
      address,
    });

    // Update user
    const user = await User.findById(req.user.id);
    user.orders.push(newOrder._id);
    user.cart = [];
    await user.save();

    // Send Email
    await sendEmail(
      user.email,
      "🙏 Order Confirmation – Mahakal Bhakti Bazzar",
      `
      <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
        <h2 style="color:#d35400; text-align:center;">🙏 Har Har Mahadev 🙏</h2>
        <h3 style="text-align:center;">Your Sacred Prasad Order Is Confirmed</h3>

        <p>Dear <strong>${address.fullName}</strong>,</p>
        <p>Thank you for placing your sacred Prasad order with <strong>Mahakal Bhakti Bazzar</strong>.</p>

        <h3>📦 Order Details</h3>
        <ul>
          <li><strong>Order ID:</strong> ${newOrder._id}</li>
          <li><strong>Payment ID:</strong> ${razorpayPaymentId}</li>
          <li><strong>Total Amount:</strong> ₹${amount}</li>
        </ul>

        <h3>📍 Delivery Address</h3>
        <ul>
          <li><strong>Name:</strong> ${address.fullName}</li>
          <li><strong>Phone:</strong> ${address.phone}</li>
          <li><strong>Address:</strong> ${address.houseNo}, ${address.area}, ${
        address.landmark || ""
      }</li>
          <li><strong>City:</strong> ${address.city}</li>
          <li><strong>State:</strong> ${address.state}</li>
          <li><strong>Pincode:</strong> ${address.pincode}</li>
        </ul>

        <h3>🛍 Products Ordered</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead>
            <tr style="background:#f4f4f4;">
              <th style="padding:8px 10px;">Product</th>
              <th style="padding:8px 10px;">Qty</th>
              <th style="padding:8px 10px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (item) => `
              <tr>
                <td style="padding:8px 10px;">${item.name}</td>
                <td style="padding:8px 10px;">${item.quantity}</td>
                <td style="padding:8px 10px;">₹${item.price}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin-top:20px;">We will update you once your sacred Prasad is shipped.</p>
        <p style="margin-top:18px;">With Divine Regards,<br/><strong>Mahakal Bhakti Bazzar Team</strong></p>
      </div>
      `
    );

    return res.json({
      success: true,
      message: "Payment verified, order saved & email sent",
      order: newOrder,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getorders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.product") // populate product details
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus, paymentStatus } = req.body;

    // Validation
    if (!deliveryStatus && !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Provide deliveryStatus or paymentStatus to update",
      });
    }

    // Update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        ...(deliveryStatus && { deliveryStatus }),
        ...(paymentStatus && { paymentStatus }),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log("oder found successfully", orderId);
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id, // Ensure only the owner can fetch
    })
      .populate("products.product") // product details
      .populate("address"); // address details

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order by ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};
