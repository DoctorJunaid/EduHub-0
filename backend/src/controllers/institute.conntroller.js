import Institute from "../models/institute.model.js";

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
    return res.status(500).json({ success: false, message: error.message });
  }
};
