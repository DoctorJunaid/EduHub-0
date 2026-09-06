import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";

// CREATE Campus Admin
export const createCampusAdmin = async (req, res) => {
  try {
    const { fullName, email, password, instituteId } = req.body;

    // Verify assigned institute exists
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Assigned institute does not exist" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const campusAdmin = await User.create({
      fullName,
      email,
      passwordHash,
      role: "campus_admin",
      instituteId,
    });

    const result = campusAdmin.toObject();
    delete result.passwordHash;

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Campus Admins
export const getCampusAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "campus_admin" })
      .populate("instituteId", "name type email")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Campus Admin
export const getCampusAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "campus_admin",
    }).populate("instituteId", "name type email");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Campus Admin not found" });
    }
    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Campus Admin
export const updateCampusAdmin = async (req, res) => {
  try {
    const { fullName, email, instituteId, status, password } = req.body;

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;
    if (instituteId) updateFields.instituteId = instituteId;
    if (status) updateFields.status = status;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.passwordHash = await bcrypt.hash(password, salt);
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "campus_admin" },
      updateFields,
      { new: true, runValidators: true },
    ).populate("instituteId", "name type");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Campus Admin not found" });
    }

    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Campus Admin
export const deleteCampusAdmin = async (req, res) => {
  try {
    const admin = await User.findOneAndDelete({
      _id: req.params.id,
      role: "campus_admin",
    });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Campus Admin not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Campus Admin deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
