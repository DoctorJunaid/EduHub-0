import user from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "30d",
  });
};

export const register = async (req, res) => {
  try {
    const { fullName, email, role = "student" } = req.body;
    const password = req.body.password || req.body.passwordHash;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // password will be hashed by the pre-save hook
    const newUser = await user.create({
      fullName,
      email,
      passwordHash: password,
      role,
      // status defaults to "active"
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password || req.body.passwordHash;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const existingUser = await user.findOne({ email }).select("+passwordHash");
    if (!existingUser) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await existingUser.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Check status field
    if (existingUser.status !== "active") {
      return res.status(403).json({ success: false, message: "Account is suspended" });
    }

    const token = generateToken(existingUser._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const currentUser = await user.findById(req.user._id).select("-passwordHash");
    res.status(200).json({ success: true, user: currentUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Update authenticated user's profile
// @route   PUT /api/v1/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
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

    const updatedUser = await user.findByIdAndUpdate(
      userId,
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