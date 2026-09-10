import Institute from "../models/institute.model.js";
import User from "../models/user.model.js";

// CREATE Institute
export const createInstitute = async (req, res) => {
  try {
    const { name, type, email, phone, address } = req.body;

    const existing = await Institute.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Institute name already exists" });
    }

    const institute = await Institute.create({
      name,
      type,
      email,
      phone,
      address,
    });
    return res.status(201).json({ success: true, data: institute });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Institutes
export const getInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: institutes.length, data: institutes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Institute
export const getInstituteById = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Institute not found" });
    }
    return res.status(200).json({ success: true, data: institute });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Institute ID format" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Institute
export const updateInstitute = async (req, res) => {
  try {
    const institute = await Institute.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Institute not found" });
    }
    return res.status(200).json({ success: true, data: institute });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Institute ID format" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Institute
export const deleteInstitute = async (req, res) => {
  try {
    const institute = await Institute.findByIdAndDelete(req.params.id);
    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Institute not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Institute deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Institute ID format" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ASSIGN Institute Admin
// POST /api/v1/super-admin/institutes/:id/assign-admin
export const assignInstituteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide either userId or email of the user to assign",
      });
    }

    const institute = await Institute.findById(id);
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    // Find the user by ID or email
    const query = userId ? { _id: userId } : { email: email.toLowerCase().trim() };
    const userToAssign = await User.findOne(query);

    if (!userToAssign) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Assign institute admin role and institute ID
    userToAssign.role = "institute_admin";
    userToAssign.instituteId = institute._id;
    await userToAssign.save();

    // Link admin to institute
    institute.adminId = userToAssign._id;
    await institute.save();

    const userResponse = userToAssign.toObject();
    delete userResponse.passwordHash;

    return res.status(200).json({
      success: true,
      message: `User ${userToAssign.fullName} has been assigned as Institute Admin for ${institute.name}`,
      data: {
        institute: {
          _id: institute._id,
          name: institute.name,
          adminId: institute.adminId,
        },
        admin: userResponse,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
