import Admin from "../../models/adminSchema.js";
import generateToken from "../../utils/generateToken.js";

// 1️⃣ Admin Register with email + password
export const adminRegisterEmail = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create new admin
    const admin = new Admin({ name, email, password });
    await admin.save();

    // Generate JWT with name MahakalToken
    const MahakalToken = generateToken(admin);

    // Exclude password from response
    const { password: _, ...adminWithoutPassword } = admin.toObject();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: adminWithoutPassword,
      MahakalToken, // ✅ token named MahakalToken
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 2️⃣ Admin Login (Email + Password)
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) return res.status(401).json({ message: "Admin not found" });
    if (admin.isBlocked)
      return res.status(403).json({ message: "Admin is blocked" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // Generate JWT with name MahakalToken
    const MahakalToken = generateToken(admin);

    const { password: _, ...adminWithoutPassword } = admin.toObject();

    res.json({
      success: true,
      message: "Login successful",
      admin: adminWithoutPassword,
      MahakalToken, // ✅ token named MahakalToken
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
