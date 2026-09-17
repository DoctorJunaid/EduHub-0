import User from "../models/user.model.js";

/**
 * TODO: Add OpenAPI documentation for user management endpoints
 */

// Get all users
// @desc    Get all users (super admin / admin directory)
// @route   GET /api/v1/users
// @query   search (text), role, unassigned (true/false), instituteId, campusId
// @access  Private/Super Admin
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, unassigned, instituteId, campusId } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (unassigned === "true") {
      filter.instituteId = null;
    } else if (instituteId) {
      filter.instituteId = instituteId;
    }

    if (campusId) {
      filter.campusId = campusId;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-passwordHash")
      .populate("instituteId", "name type")
      .populate("campusId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("instituteId", "name type")
      .populate("campusId", "name");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user details (excluding password)
export const updateUser = async (req, res) => {
  try {
    // Prevent password update here
    const { password, passwordHash, ...updateData } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change user role (super_admin, campus_admin, student)
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["student", "teacher", "campus_admin", "institute_admin", "super_admin"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle user status (active/suspended)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prevent super admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["active", "suspended"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either active or suspended",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfileById = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
