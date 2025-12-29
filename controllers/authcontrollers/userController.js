
import User from "../../models/userSchema.js";
import bcrypt from "bcrypt";
import { generateOTP } from "../../utils/sendOTP.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/sendEmail.js";
// 3️⃣ Token-exchange Google login
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
    }

    user.emailOtp = hashedOtp;
    user.emailOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.isVerified = false;

    await user.save();

    console.log("✅ User saved:", user.email); // <-- Debug log
    console.log("📧 Sending email to:", email); // <-- Debug log

    // 🔹 Change here: wrap sendEmail in try/catch
    try {
      await sendEmail(
        email,
        "Your Login OTP",
        `Your OTP is ${otp}. It is valid for 5 minutes.`
      );
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp, // For testing, remove in production
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email }).select("+emailOtp");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found. Please request OTP again.",
      });
    }

    if (!user.emailOtp || !user.emailOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request again.",
      });
    }

    if (user.emailOtpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, user.emailOtp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ✅ OTP verified
    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET_AUTH,
      {
        expiresIn: process.env.JWT_EXPIRE || "70d",
      }
    );

    const cleanUser = await User.findById(user._id).select(
      "-password -emailOtp -emailOtpExpiry -__v"
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: cleanUser,
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const userProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.id || req.query.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId)
      .select("-password -emailOtp -emailOtpExpiry -__v")
      .populate({
        path: "favoriteProducts",
        select: "title price image category",
      })
      .populate({
        path: "orders",
        select: "totalAmount status createdAt",
      })
      .populate({
        path: "cart.product",
        select: "title price image",
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Clean response (schema-based)
    const userData = {
      _id: user._id,
      name: user.name || null,
      email: user.email,
      profileImage: user.profileImage || null,
      authMethod: user.authMethod, // "email"
      isVerified: user.isVerified,
      addresses: user.addresses, // embedded schema
      favoriteProducts: user.favoriteProducts,
      orders: user.orders,
      cart: user.cart,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user: userData,
    });
  } catch (error) {
    console.error("USER PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { name } = req.body;

    const updateData = {};

    if (name) updateData.name = name;

    // ☁ Cloudinary image
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -emailOtp -emailOtpExpiry -__v");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const userAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      alternatePhone,
      houseNumber,
      street,
      landmark,
      townCity,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    // Optional: Validate required fields
    if (
      !fullName ||
      !phone ||
      !houseNumber ||
      !street ||
      !townCity ||
      !state ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    // If isDefault is true, set all other addresses to false
    if (isDefault) {
      req.user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // Add new address
    req.user.addresses.push({
      fullName,
      phone,
      alternatePhone,
      houseNumber,
      street,
      landmark,
      townCity,
      state,
      pincode,
      addressType: addressType || "Home",
      isDefault: isDefault || false,
    });

    await req.user.save();
    res.status(201).json({
      message: "Address added successfully",
      addresses: req.user.addresses,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAddress = async (req, res) => {
  console.log("Address update controller hit ");
  try {
    const userId = req.user?._id || req.params.id || req.query.id;
    const addressId = req.params.id;
    const updateData = req.body;
    console.log("User ID:", userId);
    console.log("Address ID:", addressId);
    console.log("Update Data:", updateData);

    if (!updateData) {
      return res
        .status(400)
        .json({ success: false, message: "No data provided to update" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Find the address to update
    const address = user.addresses.id(addressId);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });

    // If isDefault is true, unset other addresses
    if (updateData.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // Update address fields
    Object.keys(updateData).forEach((key) => {
      address[key] = updateData[key];
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const deleteAddress = async (req, res) => {
  console.log("Delete address controller hit");

  try {
    // Pick user ID from authentication middleware or params
    const userId = req.user?._id || req.params.userId || req.query.userId;

    // Address ID from URL -> /address/delete/:id
    const addressId = req.params.id;

    console.log("User ID:", userId);
    console.log("Address ID:", addressId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find the address subdocument
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove the address
    address.deleteOne();

    // Save user
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    console.error("Delete Address Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const sendContactMail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER, // you receive mails here
      subject: `New Contact Message from ${name}`,
      html: `
        <h2>New Message Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};
