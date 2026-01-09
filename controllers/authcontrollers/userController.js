import User from "../../models/userSchema.js";
import bcrypt from "bcrypt";
import { generateOTP } from "../../utils/sendOTP.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/sendEmail.js";
// 3️⃣ Token-exchange Google login

export const sendOtp = async (req, res) => {
  try {
    // 👇 ADD THESE TWO LINES
    const DUMMY_EMAIL = "dummy@mahakalbazar.com";
    const DUMMY_OTP = "111111";

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let otp;
    if (email === DUMMY_EMAIL) {
      otp = DUMMY_OTP;
      console.log("🧪 Dummy user detected");
    } else {
      otp = generateOTP();
    }

    const hashedOtp = await bcrypt.hash(otp, 10);

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
    }

    user.emailOtp = hashedOtp;
    user.emailOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.isVerified = false;

    await user.save();

    console.log("✅ User saved:", user.email);
    console.log("📧 Sending OTP email to:", email);

    if (email !== DUMMY_EMAIL) {
      await sendEmail(
        email,
        "🔐 Your Login OTP – Mahakal Bazar",
        `
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;
              box-shadow:0 10px 25px rgba(0,0,0,0.08);
              font-family:Arial,Helvetica,sans-serif;overflow:hidden">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f97316,#ef4444);
                padding:20px;text-align:center;color:#ffffff">
      <h2 style="margin:0;font-size:20px;">Mahakal Bazar</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9">
        Secure Login Verification
      </p>
    </div>

    <!-- Body -->
    <div style="padding:24px;color:#333333">
      <p style="font-size:14px;margin:0 0 12px">
        Hello,
      </p>

      <p style="font-size:14px;margin:0 0 16px;line-height:1.6">
        Use the following One Time Password (OTP) to complete your login.
        This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="text-align:center;margin:24px 0">
        <div style="display:inline-block;
                    background:#fff7ed;
                    color:#ea580c;
                    font-size:32px;
                    letter-spacing:6px;
                    font-weight:700;
                    padding:14px 28px;
                    border-radius:10px;
                    border:1px dashed #fdba74">
          ${otp}
        </div>
      </div>

      <p style="font-size:13px;color:#555555;margin:0 0 10px">
        ⚠️ Do not share this OTP with anyone for security reasons.
      </p>

      <p style="font-size:13px;color:#555555;margin:0">
        If you did not request this login, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:14px;text-align:center;
                font-size:12px;color:#777777">
      © ${new Date().getFullYear()} Mahakal Bazar. All rights reserved.
    </div>

  </div>
  `
      );
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      // ❌ REMOVE otp in production
      otp: email === DUMMY_EMAIL ? otp : undefined,
    });
  } catch (error) {
    console.error("❌ SEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending OTP",
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
