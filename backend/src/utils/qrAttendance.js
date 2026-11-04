import crypto from "crypto";
import QRCode from "qrcode";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";

const QR_SECRET = process.env.JWT_SECRET || "eduhub-qr-secret-key";

/**
 * Generate a deterministic HMAC signature for a student attendance token
 */
export function generateStudentSignature(studentId, campusId) {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${String(studentId)}:${String(campusId || "")}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Generate standard QR Code Payload structure for a student
 * Contains stable student ID, campus, human-readable roll number, and security signature
 */
export function createStudentQrPayload(student) {
  const studentId = student.userId?._id || student.userId || student._id || student.id;
  const campusId = student.campusId?._id || student.campusId || "";
  const rollNo = student.rollNo || student.roll || student.rollNumber || "";
  const studentIdStr = String(studentId);
  const campusIdStr = String(campusId);

  const sig = generateStudentSignature(studentIdStr, campusIdStr);

  return JSON.stringify({
    app: "EduHub",
    v: 1,
    type: "STUDENT_ATTENDANCE",
    studentId: studentIdStr,
    campusId: campusIdStr,
    rollNo: String(rollNo),
    sig,
  });
}

/**
 * Generate base64 Data URL for sharp QR Code image
 */
export async function generateQrDataUrl(payloadString, options = {}) {
  const defaultOpts = {
    errorCorrectionLevel: options.errorCorrectionLevel || "Q", // 25% damage recovery for year-long plastic card durability
    width: options.width || 256,
    margin: options.margin !== undefined ? options.margin : 1,
    color: {
      dark: "#0f172a", // slate-900 for high-contrast crisp scanning
      light: "#ffffff",
    },
  };
  return await QRCode.toDataURL(payloadString, defaultOpts);
}

/**
 * Verify and parse incoming QR / Barcode scanner payload with maximum resilience.
 * Handles:
 *  1. Standard EduHub JSON string or object
 *  2. Malformed JSON (missing opening '{', missing closing '}', dropped quotes, etc.)
 *  3. CapsLock-inverted / shifted strings (STUDENTiD, CAMPUSiD, ROLLnO, student_attendance, uppercase hex)
 *  4. Key-Value pairs without quotes: V:1,TYPE:student_attendance,STUDENTiD:6AB...,ROLLnO:4,SIG:68A...
 *  5. AIM scanner prefixes (e.g. ]Q1, ]C1) and non-printable control characters
 *  6. Concatenated / burst multiple inputs in scanner buffer (extracts latest valid segment)
 *  7. Raw 24-character hex ObjectId (case-insensitive)
 *  8. Legacy string format: EDUHUB-STUDENT-<id_or_roll>
 *  9. Clean manual roll number input fallback
 */
export function parseQrPayload(rawInput) {
  if (!rawInput) {
    return { success: false, message: "Empty QR code data provided." };
  }

  let parsed = null;

  // 1. If payload is already a parsed JavaScript object
  if (typeof rawInput === "object" && rawInput !== null) {
    const obj = rawInput;
    const findKey = (candidates) => {
      for (const k of Object.keys(obj)) {
        if (candidates.some((c) => c.toLowerCase() === k.toLowerCase())) {
          return obj[k];
        }
      }
      return undefined;
    };

    const studentIdRaw = findKey(["studentId", "userId", "id"]);
    const campusIdRaw = findKey(["campusId", "campus_id"]);
    const rollNoRaw = findKey(["rollNo", "roll", "rollNumber"]);
    const sigRaw = findKey(["sig", "signature", "token"]);

    if (studentIdRaw) {
      parsed = {
        app: "EduHub",
        studentId: String(studentIdRaw).trim().toLowerCase(),
        campusId: campusIdRaw ? String(campusIdRaw).trim().toLowerCase() : "",
        rollNo: rollNoRaw !== undefined ? String(rollNoRaw).trim() : "",
        sig: sigRaw ? String(sigRaw).trim().toLowerCase() : "",
      };
    }
  }

  // 2. If payload is a string
  if (!parsed && typeof rawInput === "string") {
    let str = rawInput.trim();

    // Strip AIM barcode symbology identifiers (e.g. ]Q1, ]C1, ]e0, ]d1) and ASCII control chars
    str = str.replace(/^\][A-Za-z0-9]{2}/, "").replace(/[\x00-\x1F\x7F]/g, " ").trim();

    // Handle concatenated / multiple rapid inputs in scanner buffer
    if ((str.match(/studentId|studentid|STUDENT/gi) || []).length > 1) {
      const parts = str.split(/(?=\{|\bV:|\bv:)/i).filter(Boolean);
      if (parts.length > 0) {
        str = parts[parts.length - 1].trim();
      }
    }

    // Auto-repair missing braces (common when hardware HID scanners drop '{' or '}')
    let trimmed = str;
    if (!trimmed.startsWith("{") && (trimmed.includes('"app"') || trimmed.includes('"studentId"'))) {
      trimmed = "{" + trimmed;
    }
    if (trimmed.startsWith("{") && !trimmed.endsWith("}")) {
      trimmed = trimmed + "}";
    }
    if (trimmed.includes('"type"') && !trimmed.includes('"type":"STUDENT_ATTENDANCE"')) {
      trimmed = trimmed.replace(/"type"\s*:\s*"[^"]*"/, '"type":"STUDENT_ATTENDANCE"');
    }

    // Attempt standard JSON parse
    try {
      const jsonCandidate = JSON.parse(trimmed);
      if (jsonCandidate && typeof jsonCandidate === "object") {
        const sid = jsonCandidate.studentId || jsonCandidate.userId || jsonCandidate.id;
        if (sid) {
          parsed = {
            app: jsonCandidate.app || "EduHub",
            studentId: String(sid).trim().toLowerCase(),
            campusId: jsonCandidate.campusId ? String(jsonCandidate.campusId).trim().toLowerCase() : "",
            rollNo: jsonCandidate.rollNo !== undefined ? String(jsonCandidate.rollNo).trim() : "",
            sig: jsonCandidate.sig ? String(jsonCandidate.sig).trim().toLowerCase() : "",
          };
        }
      }
    } catch {
      // JSON parse failed; proceed to robust regex key-value extraction
    }

    // 3. Robust Regex Extraction: Handles CapsLock, unquoted colons, missing braces, uppercase hex
    if (!parsed) {
      const studentIdMatch = str.match(
        /["']?(?:student[_-]?id|studentid|user[_-]?id|userid)["']?\s*[:=]\s*["']?([0-9a-fA-F]{24})["']?/i
      );
      if (studentIdMatch) {
        const campusIdMatch = str.match(
          /["']?(?:campus[_-]?id|campusid)["']?\s*[:=]\s*["']?([0-9a-fA-F]{24})["']?/i
        );
        const rollNoMatch = str.match(
          /["']?(?:roll[_-]?no|rollno|roll[_-]?number|rollnumber|roll)["']?\s*[:=]\s*["']?([^"',;}\r\n\s]+)["']?/i
        );
        const sigMatch = str.match(
          /["']?(?:sig|signature|token)["']?\s*[:=]\s*["']?([0-9a-fA-F]+)["']?/i
        );

        parsed = {
          app: "EduHub",
          studentId: studentIdMatch[1].toLowerCase(),
          campusId: campusIdMatch ? campusIdMatch[1].toLowerCase() : "",
          rollNo: rollNoMatch ? rollNoMatch[1].trim() : "",
          sig: sigMatch ? sigMatch[1].toLowerCase() : "",
        };
      }
    }
  }

  // If structured student payload was extracted
  if (parsed && parsed.studentId) {
    const studentId = parsed.studentId;
    const campusId = parsed.campusId || "";
    const rollNo = parsed.rollNo || "";

    // Signature check
    let isSigned = false;
    if (parsed.sig) {
      const expectedSig = generateStudentSignature(studentId, campusId);
      isSigned = parsed.sig === expectedSig;
    }

    return {
      success: true,
      studentId,
      campusId,
      rollNo,
      isSigned,
      raw: rawInput,
    };
  }

  // 4. Handle plain string formats
  const cleanStr = (typeof rawInput === "string" ? rawInput : JSON.stringify(rawInput))
    .trim()
    .replace(/^\][A-Za-z0-9]{2}/, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();

  // If raw 24-character hex ObjectId (case-insensitive)
  if (/^[0-9a-fA-F]{24}$/.test(cleanStr)) {
    return {
      success: true,
      studentId: cleanStr.toLowerCase(),
      campusId: "",
      rollNo: "",
      isSigned: false,
      raw: rawInput,
    };
  }

  // If legacy EDUHUB-STUDENT- prefix (case-insensitive)
  if (/^EDUHUB-STUDENT-/i.test(cleanStr)) {
    const remainder = cleanStr.replace(/^EDUHUB-STUDENT-/i, "").trim();
    if (/^[0-9a-fA-F]{24}$/.test(remainder)) {
      return {
        success: true,
        studentId: remainder.toLowerCase(),
        campusId: "",
        rollNo: "",
        isSigned: false,
        raw: rawInput,
      };
    }
    return {
      success: true,
      studentId: null,
      rollNo: remainder,
      campusId: "",
      isSigned: false,
      raw: rawInput,
    };
  }

  // 5. Guard against broken structured payloads masquerading as roll numbers:
  // If input contains braces or colons & commas, it is a corrupted QR/JSON structure, NOT a roll number!
  if (/[{}]/.test(cleanStr) || (cleanStr.includes(":") && (cleanStr.includes(",") || cleanStr.includes(";")))) {
    return {
      success: false,
      message: "Unrecognized or malformed QR data. Please re-scan the student card.",
      raw: rawInput,
    };
  }

  // 6. Treat as manual roll number entry
  return {
    success: true,
    studentId: null,
    rollNo: cleanStr,
    campusId: "",
    isSigned: false,
    raw: rawInput,
  };
}

/**
 * Safely resolves an active, valid student from a parsed QR payload within context.
 * Performs deep database validation:
 *  - Verifies user exists with role: 'student'
 *  - Verifies enrollment status (active)
 *  - Verifies campus matching
 *  - If resolved by rollNo fallback, verifies uniqueness within context (class/section/campus)
 */
export async function resolveStudentFromPayload(rawOrParsedPayload, { campusId, classId, className, section } = {}) {
  let userDoc = null;
  let studentDoc = null;

  const parsedPayload =
    typeof rawOrParsedPayload === "string"
      ? parseQrPayload(rawOrParsedPayload)
      : rawOrParsedPayload || {};

  // 1. If studentId is known directly
  if (parsedPayload.studentId && mongoose.Types.ObjectId.isValid(parsedPayload.studentId)) {
    userDoc = await User.findOne({
      _id: parsedPayload.studentId,
      role: "student",
    }).lean();

    if (userDoc) {
      studentDoc = await Student.findOne({ userId: userDoc._id }).lean();
    } else {
      // Check if studentId was the _id of a Student document
      studentDoc = await Student.findById(parsedPayload.studentId).lean();
      if (studentDoc && studentDoc.userId) {
        userDoc = await User.findOne({
          _id: studentDoc.userId,
          role: "student",
        }).lean();
      }
    }
  }

  // 2. Fallback: Search by roll number within campus / class context
  if (!userDoc && parsedPayload.rollNo) {
    const conditions = [
      { role: "student" },
      {
        $or: [
          { roll: parsedPayload.rollNo },
          { rollNo: parsedPayload.rollNo },
          { rollNumber: parsedPayload.rollNo },
        ],
      },
    ];

    if (campusId) {
      conditions.push({ campusId });
    }

    if (className) {
      const cleanClass = className.split(" - ")[0].split(" • ")[0].trim();
      conditions.push({
        $or: [
          { gradeOrClass: new RegExp(`^${cleanClass}$`, "i") },
          { program: new RegExp(`^${cleanClass}$`, "i") },
        ],
      });
    }

    if (section && section !== "All" && section !== "All sections") {
      const cleanSec = section.replace(/^Section\s*/i, "").trim();
      conditions.push({
        section: new RegExp(`^(Section\\s*)?${cleanSec}$`, "i"),
      });
    }

    const matches = await User.find({ $and: conditions }).limit(5).lean();

    if (matches.length === 1) {
      userDoc = matches[0];
      studentDoc = await Student.findOne({ userId: userDoc._id }).lean();
    } else if (matches.length > 1) {
      // Ambiguous roll number across multiple classes
      const matchDescriptions = matches.map(
        (m) => `${m.name} (${m.gradeOrClass || m.program || "Class"} - ${m.section || "A"})`
      ).join("; ");
      const err = new Error(
        `Roll number '${parsedPayload.rollNo}' matches multiple students in different classes: ${matchDescriptions}. Please specify the class or scan the student's unique QR code.`
      );
      err.statusCode = 400;
      err.code = "AMBIGUOUS_ROLL_NUMBER";
      err.matches = matches;
      throw err;
    } else if (matches.length === 0) {
      // Also check Student collection by rollNo if User collection had no matching roll
      const studentMatches = await Student.find({
        rollNo: parsedPayload.rollNo,
        ...(campusId ? { campusId } : {}),
      }).limit(5).lean();

      if (studentMatches.length === 1) {
        studentDoc = studentMatches[0];
        userDoc = await User.findOne({
          _id: studentDoc.userId,
          role: "student",
        }).lean();
      }
    }
  }

  if (!userDoc) {
    const err = new Error("Unrecognized student QR code or roll number.");
    err.statusCode = 404;
    err.code = "STUDENT_NOT_FOUND";
    throw err;
  }

  // Verify campus membership
  if (campusId && userDoc.campusId && String(userDoc.campusId) !== String(campusId)) {
    const err = new Error("This student is registered at another campus.");
    err.statusCode = 403;
    err.code = "CAMPUS_MISMATCH";
    throw err;
  }

  // Check enrollment eligibility
  const statusLower = (userDoc.status || "Active").toLowerCase();
  const isEligible =
    userDoc.isActive !== false &&
    !["inactive", "suspended", "withdrawn", "transferred", "graduated"].includes(statusLower);

  if (!isEligible) {
    const err = new Error(
      `Student '${userDoc.name}' is currently not eligible for attendance (Status: ${userDoc.status || "Inactive"}).`
    );
    err.statusCode = 400;
    err.code = "STUDENT_INELIGIBLE";
    throw err;
  }

  // Resolve roll number, class and section snapshots
  const effectiveRollNo =
    userDoc.rollNo ||
    userDoc.roll ||
    userDoc.rollNumber ||
    studentDoc?.rollNo ||
    "";

  const effectiveClass =
    userDoc.gradeOrClass ||
    userDoc.program ||
    studentDoc?.classProgram?.split("•")[0]?.trim() ||
    "Class 10";

  const effectiveSection =
    userDoc.section ||
    studentDoc?.classProgram?.split("•")[1]?.replace(/Section\s*/i, "")?.trim() ||
    "A";

  return {
    userDoc,
    studentDoc,
    student: studentDoc || userDoc,
    studentId: userDoc._id,
    name: userDoc.name,
    rollNo: effectiveRollNo,
    className: effectiveClass,
    section: effectiveSection,
    campusId: userDoc.campusId,
    instituteId: userDoc.instituteId,
    avatar: userDoc.avatar || studentDoc?.avatar || "",
    status: userDoc.status || "Active",
  };
}
