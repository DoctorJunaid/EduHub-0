import Inquiry from "../models/inqueries.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";
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

/**
 * Public Institutes Directory
 * Fetches all registered active educational institutions from live database
 */
export const getPublicInstitutes = async (req, res) => {
  try {
    const rawInstitutes = await Institute.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .lean();

    const instituteIds = rawInstitutes.map((i) => i._id);

    const [allCampuses, allStudents, allTeachers] = await Promise.all([
      Campus.find({ instituteId: { $in: instituteIds }, status: "Active" })
        .select("instituteId name city address code")
        .lean(),
      User.find({ instituteId: { $in: instituteIds }, role: "student" })
        .select("instituteId")
        .lean(),
      User.find({ instituteId: { $in: instituteIds }, role: "teacher" })
        .select("instituteId")
        .lean(),
    ]);

    const data = rawInstitutes.map((inst) => {
      const instCampuses = allCampuses.filter(
        (c) => String(c.instituteId) === String(inst._id)
      );
      const studentCount = allStudents.filter(
        (s) => String(s.instituteId) === String(inst._id)
      ).length;
      const facultyCount = allTeachers.filter(
        (t) => String(t.instituteId) === String(inst._id)
      ).length;

      const cityName =
        inst.address?.city ||
        instCampuses[0]?.city ||
        "Islamabad";

      const formattedAddress =
        typeof inst.address === "string"
          ? inst.address
          : [inst.address?.street, inst.address?.city, inst.address?.province, inst.address?.country]
              .filter(Boolean)
              .join(", ") || "Pakistan";

      return {
        _id: inst._id,
        id: String(inst._id),
        name: inst.name,
        shortName: inst.name.length <= 10 ? inst.name : inst.name.split(" ").slice(0, 3).map((w) => w[0]).join("").toUpperCase(),
        fullName: inst.name,
        type: inst.type,
        board: inst.board,
        email: inst.email,
        phone: inst.phone,
        city: cityName,
        address: formattedAddress,
        rating: inst.rating || 4.9,
        reviewsCount: inst.reviewsCount ? `${inst.reviewsCount} reviews` : "Verified",
        campusCount: instCampuses.length,
        studentCount,
        facultyCount,
        establishedYear: inst.createdAt ? new Date(inst.createdAt).getFullYear() : 2024,
        overview:
          inst.overview ||
          `${inst.name} is a premier accredited ${inst.type.toLowerCase()} affiliated with ${inst.board}, delivering cutting-edge educational programs across Pakistan.`,
        campuses: instCampuses.map((c) => ({
          _id: c._id,
          name: c.name,
          city: c.city,
        })),
        admissions: {
          cycle: "Admissions Open",
          deadline: "Rolling Intake",
          entryTest: "Standard Institutional Evaluation",
          feeRange: "Contact Campus Administration",
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching public institutes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch institutions directory",
    });
  }
};

/**
 * Public Single Institute Profile
 */
export const getPublicInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    let institute = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      institute = await Institute.findById(id).lean();
    } else {
      institute = await Institute.findOne({
        $or: [{ name: new RegExp(`^${id}$`, "i") }, { email: id.toLowerCase() }],
      }).lean();
    }

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    const [campuses, studentCount, facultyCount] = await Promise.all([
      Campus.find({ instituteId: institute._id, status: "Active" }).lean(),
      User.countDocuments({ instituteId: institute._id, role: "student" }),
      User.countDocuments({ instituteId: institute._id, role: "teacher" }),
    ]);

    const formattedAddress =
      typeof institute.address === "string"
        ? institute.address
        : [institute.address?.street, institute.address?.city, institute.address?.province, institute.address?.country]
            .filter(Boolean)
            .join(", ") || "Pakistan";

    return res.status(200).json({
      success: true,
      data: {
        _id: institute._id,
        id: String(institute._id),
        name: institute.name,
        shortName: institute.name.length <= 10 ? institute.name : institute.name.split(" ").slice(0, 3).map((w) => w[0]).join("").toUpperCase(),
        fullName: institute.name,
        type: institute.type,
        board: institute.board,
        email: institute.email,
        phone: institute.phone,
        city: institute.address?.city || campuses[0]?.city || "Islamabad",
        address: formattedAddress,
        rating: institute.rating || 4.9,
        reviewsCount: institute.reviewsCount ? `${institute.reviewsCount} reviews` : "Verified",
        campusCount: campuses.length,
        studentCount,
        facultyCount,
        establishedYear: institute.createdAt ? new Date(institute.createdAt).getFullYear() : 2024,
        overview:
          institute.overview ||
          `${institute.name} is a premier accredited ${institute.type.toLowerCase()} affiliated with ${institute.board}, delivering cutting-edge educational programs across Pakistan.`,
        campuses: campuses.map((c) => ({
          _id: c._id,
          name: c.name,
          city: c.city,
          address: c.address,
        })),
        admissions: {
          cycle: "Admissions Open",
          deadline: "Rolling Intake",
          entryTest: "Standard Institutional Evaluation",
          feeRange: "Contact Campus Administration",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching institute profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch institute profile",
    });
  }
};
