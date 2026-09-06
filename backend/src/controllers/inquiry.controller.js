import Inquiry from "../models/inqueries.model.js";

export const createInquiry = async (req, res) => {
  try {
    // Destructure payload (handles both camelCase and snake_case inputs gracefully)
    const {
      fullName,
      full_name,
      instituteName,
      institute_name,
      instituteType,
      institute_type,
      email,
      phone,
      message,
    } = req.body;

    // Normalize field names to match schema requirements
    const payload = {
      fullName: fullName || full_name,
      instituteName: instituteName || institute_name,
      instituteType: instituteType || institute_type,
      email,
      phone,
      message,
    };

    // Quick validation for required missing body fields before hit database
    if (
      !payload.fullName ||
      !payload.instituteName ||
      !payload.instituteType ||
      !payload.email ||
      !payload.phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: fullName, instituteName, instituteType, email, phone",
      });
    }

    // Create inquiry instance
    const newInquiry = await Inquiry.create(payload);

    return res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: newInquiry,
    });
  } catch (error) {
    // Handle Mongoose validation errors nicely
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }

    console.error("Error creating inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, failed to submit inquiry",
    });
  }
};
