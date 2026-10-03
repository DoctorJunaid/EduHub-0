import Inquiry from "../models/inqueries.model.js";
import { logAuditEvent } from "../services/auditLog.service.js";

export const createInquiry = async (req, res) => {
  try {
    // Destructure payload (handles both camelCase and snake_case inputs gracefully)
    const {
      fullName,
      full_name,
      contactName,
      contact_name,
      name,
      instituteName,
      institute_name,
      instituteType,
      institute_type,
      email,
      phone,
      message,
      city,
      studentCount,
      student_count,
    } = req.body;

    const resolvedFullName =
      fullName || full_name || contactName || contact_name || name;

    let composedMessage = message || "";
    const extraDetails = [];
    if (city) extraDetails.push(`City: ${city}`);
    if (studentCount || student_count) extraDetails.push(`Student Count: ${studentCount || student_count}`);
    if (extraDetails.length > 0) {
      composedMessage = composedMessage
        ? `${composedMessage} (${extraDetails.join(" | ")})`
        : extraDetails.join(" | ");
    }

    // Normalize field names to match schema requirements
    const payload = {
      fullName: resolvedFullName,
      instituteName: instituteName || institute_name,
      instituteType: instituteType || institute_type || "University",
      email,
      phone,
      message: composedMessage,
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

    // Write real platform audit log
    await logAuditEvent(req, {
      entityType: "Inquiry",
      entityId: newInquiry._id,
      action: "created",
      changes: {
        after: {
          instituteName: newInquiry.instituteName,
          fullName: newInquiry.fullName,
          email: newInquiry.email,
          phone: newInquiry.phone,
        },
      },
      reason: `Prospective partner inquiry submitted for "${newInquiry.instituteName}" via landing page`,
    });

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
