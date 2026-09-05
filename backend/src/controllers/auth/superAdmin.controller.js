import User from "../../models/user.js";
import generateToken from "../../utils/generateToken.js";

// ─────────────────────────────────────────────
// POST /api/v1/auth/super-admin/register
// Protected by SUPER_ADMIN_SECRET in request body
// ─────────────────────────────────────────────
export const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    // Guard: require the server-side secret to prevent unauthorized registrations
    if (!secretKey || secretKey !== process.env.SUPER_ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid or missing Super Admin secret key",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: "super_admin",
    });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      success: true,
      message: "Super Admin registered successfully",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/super-admin/login
// ─────────────────────────────────────────────
export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Role guard — campus admin must use /campus-admin/login
    if (user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Use the appropriate login endpoint for your role.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────
// CRUD helpers (used by superAdminRoutes.js)
// ─────────────────────────────────────────────

export const createSuperAdmin = registerSuperAdmin;

export const getAllSuperAdmins = async (req, res) => {
  try {
    const users = await User.find({ role: "super_admin" });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

export const getSuperAdminById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "super_admin" });
    if (!user) {
      return res.status(404).json({ success: false, message: "Super Admin not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

export const updateSuperAdmin = async (req, res) => {
  try {
    // Never allow role or passwordHash to be patched via this route
    const { password, role, passwordHash, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Super Admin not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

export const deleteSuperAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Super Admin not found" });
    }
    return res.status(200).json({ success: true, message: "Super Admin deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};