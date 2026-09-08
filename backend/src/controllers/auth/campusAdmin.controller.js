import User from "../../models/user.model.js";
import generateToken from "../../utils/generateToken.js";

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/campus-admin/register
// Access: Super Admin only  (protect + isSuperAdmin in route)
// Body  : { name, email, password, campusId }
// ─────────────────────────────────────────────────────────────────
export const registerCampusAdmin = async (req, res) => {
  try {
    const { name, email, password, campusId } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "campusId is required — a Campus Admin must belong to a campus",
      });
    }

    // Check for duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Create the campus admin — role is always "campus_admin" (never from body)
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: "campus_admin",
      campusId,            // ties this admin to their campus
    });

    return res.status(201).json({
      success: true,
      message: "Campus Admin registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/campus-admin/login
// Access: Public
// Body  : { email, password }
// ─────────────────────────────────────────────────────────────────
export const loginCampusAdmin = async (req, res) => {
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

    // Reject if not a campus admin
    if (user.role !== "campus_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Use the appropriate login endpoint for your role.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact the Super Admin.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Token carries id, role AND campusId so campus-scoped middleware
    // can read req.user.campusId without an extra DB query
    const token = generateToken({
      id: user._id,
      role: user.role,
      campusId: user.campusId,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};