import User from "../models/user.model.js";

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

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Super Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("instituteId", "name type")
      .populate("campusId", "name");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Super Admin
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
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user role
// @route   PUT /api/v1/users/:id/role
// @access  Private/Super Admin
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["student", "teacher", "campus_admin", "institute_admin", "super_admin"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Super Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
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

// @desc    Update user profile by ID (excluding email)
// @route   PUT /api/v1/users/:id/profile
// @access  Private/Super Admin
export const updateUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, bio, gender, dateOfBirth } = req.body;

    const updateFields = {};

    if (fullName !== undefined) updateFields.fullName = fullName.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (gender !== undefined) updateFields.gender = gender;
    if (dateOfBirth !== undefined) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth format",
        });
      }
      updateFields.dateOfBirth = dob;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};