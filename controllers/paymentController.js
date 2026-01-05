import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import Order from "../models/orderSchema.js";
import User from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";
import path from "path";
import fs from "fs";

import { generateInvoicePDF } from "../utils/generateInvoice.js";

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

    // 2️⃣ Save order in MongoDB
    const newOrder = await Order.create({
      user: req.user.id,
      products: products, // frontend must send this
      amount: amount,
      currency: currency || "INR",
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
      deliveryStatus: "pending",
      address: selectedAddress, // ⭐ ADD THIS
    });

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      razorpayOrder: razorpayOrder, // Full Razorpay order object
      orderInDB: newOrder, // Full MongoDB order object
      orderIdInDB: newOrder._id, // Only ID (optional)
      address: selectedAddress, // ⭐ ADD THIS
    });
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

  try {
    // Check if secret key is available
    if (!process.env.RAZORPAY_KEY) {
      console.error(
        "RAZORPAY_KEY_SECRET is not defined in environment variables"
      );
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please contact support.",
      });
    }

    // 1️⃣ Fetch the order from DB
    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 2️⃣ Generate HMAC to verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature. Payment verification failed.",
      });
    }

    // 3️⃣ Update order as paid
    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = signature;

    const invoicePath = generateInvoicePDF(order);
    order.invoicePath = invoicePath;

    await order.save();

    console.log("Order saved successfully:", order._id);

    // 4️⃣ Add order to user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.orders.push(order._id);
    user.cart = [];
    await user.save();

    // 📩 SEND ORDER CONFIRMATION EMAIL HERE
    await sendEmail(
      user.email,
      "🙏 Order Confirmation – Mahakal Bhakti Bazzar",
      `
  <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
    <h2 style="color:#d35400; text-align:center;">🙏 Har Har Mahadev 🙏</h2>
    <h3 style="text-align:center;">Your Sacred Prasad Order Is Confirmed</h3>

    <p>Dear <strong>${order.address.fullName}</strong>,</p>
    <p>Thank you for placing your divine Prasad order with <strong>Mahakal Bhakti Bazzar</strong>.</p>

    <h3>📦 Order Details</h3>
    <ul>
      <li><strong>Order ID:</strong> ${order._id}</li>
      <li><strong>Payment ID:</strong> ${razorpayPaymentId}</li>
      <li><strong>Total Amount:</strong> ₹${order.amount}</li>
    </ul>

    <h3>📍 Delivery Address</h3>
    <ul>
      <li><strong>Name:</strong> ${order.address.fullName}</li>
      <li><strong>Phone:</strong> ${order.address.phone}</li>
      <li><strong>Address:</strong> ${order.address.houseNumber}, ${
        order.address.street
      }, ${order.address.landmark || ""}</li>
      <li><strong>City:</strong> ${order.address.townCity}</li>
      <li><strong>State:</strong> ${order.address.state}</li>
      <li><strong>Pincode:</strong> ${order.address.pincode}</li>
    </ul>

    <h3>🛍 Products Ordered</h3>

    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
      <thead>
        <tr style="background:#f4f4f4;">
          <th style="padding:8px 10px; text-align:left;">Product</th>
          <th style="padding:8px 10px; text-align:left;">Qty</th>
          <th style="padding:8px 10px; text-align:left;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.products
          .map(
            (item) => `
          <tr>
            <td style="padding:8px 10px;">${item.name}</td>
            <td style="padding:8px 10px;">${item.quantity}</td>
            <td style="padding:8px 10px;">₹${item.price}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <p style="margin-top:20px;">We will notify you once your Prasad is shipped. May Lord Mahakal always bless you.</p>

    <p style="margin-top:18px;">With Divine Regards,<br/><strong>Mahakal Bhakti Bazzar Team</strong></p>

    <hr style="margin:25px 0; border:0; border-top:1px solid #ccc;">
    <p style="font-size:13px; text-align:center; color:#777;">
      Need help? Reply to this email or reach our support anytime.
    </p>
  </div>
`
    );

    return res.json({
      success: true,
      message: "Order Placed & Email Sent",
      order,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
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

export const getOrdersByUserAdmin = async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user",
      });
    }

    // 🔥 Attach invoice download URL
    const formattedOrders = orders.map((order) => ({
      ...order.toObject(),
      invoiceDownloadUrl: order.invoicePath
        ? `/admin/orders/${order._id}/invoice`
        : null,
    }));

    res.status(200).json({
      success: true,
      totalOrders: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Admin Get Orders By User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone") // user data
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const downloadInvoiceAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1️⃣ Order fetch
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!order.invoicePath) {
      return res.status(404).json({
        success: false,
        message: "Invoice not generated for this order",
      });
    }

    // 2️⃣ Absolute file path
    const invoiceFullPath = path.join(process.cwd(), order.invoicePath);

    // 3️⃣ File exists check
    if (!fs.existsSync(invoiceFullPath)) {
      return res.status(404).json({
        success: false,
        message: "Invoice file not found on server",
      });
    }

    // 4️⃣ Send file
    res.download(invoiceFullPath, path.basename(invoiceFullPath));
  } catch (error) {
    console.error("Invoice download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download invoice",
    });
  }
};
