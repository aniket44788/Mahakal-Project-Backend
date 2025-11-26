import { OAuth2Client } from "google-auth-library";
import User from "../../models/userSchema.js";
import { generateOTP } from "../../utils/sendOTP.js";
import generateToken from "../../utils/generateToken.js";
import orderSchema from "../../models/orderSchema.js";
import productSchema from "../../models/productSchema.js";
import nodemailer from "nodemailer";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 3️⃣ Token-exchange Google login
export const googleTokenLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing idToken" });
    }

    // Verify with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Google account" });
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture,
        isVerified: true,
        authMethod: "google",
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.profileImage = picture;
      user.isVerified = true;
      user.authMethod = "google";
      await user.save();
    }

    const token = generateToken(user);
    return res.json({ success: true, token, user });
  } catch (err) {
    console.error("Google token verification error:", err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid Google token" });
  }
};

export const userProfile = async (req, res) => {
  try {
    // ✅ Get user ID from authenticated request or params
    const userId = req.user?._id || req.params.id || req.query.id;
    console.log(userId, "this is user id ");
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ✅ Fetch user (exclude sensitive fields)
    const user = await User.findById(userId)
      .select("-password -__v")
      .populate({
        path: "favoriteProducts",
        select: "title price image category", // only important fields
      })
      .populate({
        path: "orders",
        select: "totalAmount status createdAt",
      })
      .populate({
        path: "cart.product",
        select: "title price image",
      })
      .populate({
        path: "addresses",
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Clean response: add profile image safely
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || null, // show Google image
      authMethod: user.authMethod,
      isVerified: user.isVerified,
      favoriteProducts: user.favoriteProducts,
      orders: user.orders,
      cart: user.cart,
      addresses: user.addresses,
      createdAt: user.createdAt,
    };

    // ✅ Send clean response
    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user profile",
      error: error.message,
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
