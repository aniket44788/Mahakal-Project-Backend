import Admin from "../../models/adminSchema.js";
import generateToken from "../../utils/generateToken.js";
import jwt from "jsonwebtoken";

// 1️⃣ Admin Register with email + password
export const adminRegisterEmail = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create new admin
    const admin = new Admin({ name, email, password });
    await admin.save();

    // Generate JWT with name MahakalToken
    const MahakalToken = generateTqoken(admin);

    // Exclude password from response
    const { password: _, ...adminWithoutPassword } = admin.toObject();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: adminWithoutPassword,
      MahakalToken,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const adminLogin = async (req, res) => {
  console.log("login controller hitting ")
  const { email, password } = req.body;

  try {
    // 1️⃣ Find admin
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // 2️⃣ Block check
    if (admin.isBlocked) {
      return res.status(403).json({ message: "Admin is blocked" });
    }

    // 3️⃣ Password match
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 4️⃣ JWT ASSIGN FUNCTION (INLINE) 🔐
    const MahakalToken = jwt.sign(
      {
        id: admin._id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3h",
      }
    );

    // 5️⃣ Remove password before sending response
    const { password: _, ...adminWithoutPassword } = admin.toObject();

    // 6️⃣ Send response with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      admin: adminWithoutPassword,
      MahakalToken,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// 3️⃣ Admin Dashboard (Protected)
export const adminProfile = async (req, res) => {
  const { password, ...adminWithoutPassword } = req.user.toObject();

  res.json({
    success: true,
    message: `Welcome ${req.user.name} to the Admin Dashboard`,
    admin: adminWithoutPassword,
  });
};
