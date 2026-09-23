import {
  ClassSchedule,
  ExamSchedule,
  StudentAttendance,
  FeeRecord,
  Performance,
} from "../models/profile.model.js";
import User from "../models/user.model.js";
import {
  StudentAssignment,
  StudentDiary,
  StudentConversation,
} from "../models/studentPortal.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";

const id = (value) => (value ? String(value) : "");

export const getStudentPortal = async (req, res) => {
  const student = req.user;
  if (!student || student.role !== "student") {
    return res
      .status(403)
      .json({ success: false, message: "Student access required." });
  }
  if (!student.campusId) {
    return res.status(422).json({
      success: false,
      message: "Student is not assigned to a campus.",
    });
  }

  const campusId = student.campusId;
  const className = student.gradeOrClass || student.program;
  if (!className || !student.section) {
    return res.status(422).json({
      success: false,
      error: {
        code: "CLASS_NOT_LINKED",
        message: "Student class and section are not linked to this account.",
      },
    });
  }
  const classFilter = {
    campusId,
    $or: [{ className }, { gradeOrClass: className }],
    section: student.section,
  };
  const [schedules, exams, attendance, fees, payments, results] = await Promise.all([
    ClassSchedule.find(classFilter).sort({ dayOfWeek: 1, startTime: 1 }).lean(),
    ExamSchedule.find({
      campusId,
      $or: [{ className }, { gradeOrClass: className }],
      section: student.section,
    })
      .sort({ examDate: 1 })
      .lean(),
    StudentAttendance.find({ campusId, studentId: student._id })
      .sort({ date: -1 })
      .lean(),
    FeeRecord.find({ campusId, studentId: student._id })
      .sort({ dueDate: -1 })
      .lean(),
    PaymentTransaction.find({ campusId, studentId: student._id })
      .sort({ createdAt: -1 })
      .lean(),
    Performance.find({ campusId, studentId: student._id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const scheduleIds = schedules.map((row) => row._id);
  const [assignments, diary, conversations] = await Promise.all([
    StudentAssignment.find({
      campusId,
      classId: { $in: scheduleIds },
      $or: [
        { publicationStatus: "Published" },
        { publicationStatus: { $exists: false } },
      ],
    }).lean(),
    StudentDiary.find({
      campusId,
      classId: { $in: scheduleIds },
      $or: [
        { publicationStatus: "Published" },
        { publicationStatus: { $exists: false } },
      ],
    }).lean(),
    StudentConversation.find({ campusId, participantIds: student._id }).lean(),
  ]);
  const participantIds = [
    ...new Set(conversations.flatMap((row) => row.participantIds.map(id))),
  ];
  const participants = await User.find({
    _id: { $in: participantIds },
    role: { $in: ["student", "faculty", "teacher"] },
  })
    .select("name email role avatar")
    .lean();
  const participantMap = new Map(participants.map((row) => [id(row._id), row]));

  return res.json({
    success: true,
    data: {
      student: {
        ...student.toObject(),
        id: id(student._id),
        _id: id(student._id),
      },
      schedules: schedules.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
      })),
      exams: exams.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
      })),
      attendance: attendance.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
        studentId: id(row.studentId),
      })),
      fees: fees.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
        studentId: id(row.studentId),
      })),
      payments: payments.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
        feeRecordId: id(row.feeRecordId),
        studentId: id(row.studentId),
      })),
      results: results.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
        studentId: id(row.studentId),
      })),
      assignments: assignments.map(({ submissions, ...row }) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
        classId: id(row.classId),
      })),
      submissions: assignments.flatMap((row) =>
        (row.submissions || [])
          .filter((submission) => id(submission.studentId) === id(student._id))
          .map((submission) => ({
            ...submission,
            id: id(submission._id),
            _id: id(submission._id),
            studentId: id(student._id),
            assignmentId: id(row._id),
          })),
      ),
      diary: diary.map((row) => ({
        ...row,
        id: id(row._id),
        _id: id(row._id),
        classId: id(row.classId),
        assignmentId: id(row.assignmentId),
      })),
      faculty: participants
        .filter((participant) => participant.role !== "student")
        .map((participant) => ({
          ...participant,
          id: id(participant._id),
          _id: id(participant._id),
        })),
      conversations: conversations.map((row) => ({
        id: `thread:${id(row._id)}`,
        participantIds: row.participantIds.map((participantId) => {
          const participant = participantMap.get(id(participantId));
          return `${participant?.role === "student" ? "student" : "faculty"}:${id(participantId)}`;
        }),
        messages: row.messages.map((message) => ({
          id: id(message._id),
          conversationId: `thread:${id(row._id)}`,
          senderId: `${participantMap.get(id(message.senderId))?.role === "student" ? "student" : "faculty"}:${id(message.senderId)}`,
          receiverId: `${participantMap.get(id(message.receiverId))?.role === "student" ? "student" : "faculty"}:${id(message.receiverId)}`,
          body: message.body,
          createdAt: message.createdAt,
        })),
        updatedAt: row.updatedAt,
      })),
    },
  });
};

export const submitAssignment = async (req, res) => {
  const notes =
    typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
  if (!notes)
    return res
      .status(400)
      .json({ success: false, message: "Submission notes are required." });
  const assignment = await StudentAssignment.findOne({
    _id: req.params.id,
    campusId: req.user.campusId,
    $or: [
      { publicationStatus: "Published" },
      { publicationStatus: { $exists: false } },
    ],
  });
  if (!assignment)
    return res
      .status(404)
      .json({ success: false, message: "Assignment not found." });
  const existing = assignment.submissions.find(
    (submission) => id(submission.studentId) === id(req.user._id),
  );
  if (existing?.status === "Graded")
    return res.status(409).json({
      success: false,
      message: "Graded submissions cannot be edited.",
    });
  const studentClass = req.user.gradeOrClass || req.user.program;
  const assignmentClass = await ClassSchedule.findOne({
    _id: assignment.classId,
    campusId: req.user.campusId,
    $or: [{ className: studentClass }, { gradeOrClass: studentClass }],
    section: req.user.section,
  }).select("_id");
  if (!studentClass || !req.user.section || !assignmentClass) {
    return res.status(403).json({
      success: false,
      message: "Assignment is not available for this class or section.",
    });
  }
  if (existing) {
    existing.notes = notes;
    existing.status = "Submitted";
    existing.submittedAt = new Date();
  } else {
    assignment.submissions.push({
      studentId: req.user._id,
      notes,
      status: "Submitted",
    });
  }
  await assignment.save();
  const submission = assignment.submissions.find(
    (row) => id(row.studentId) === id(req.user._id),
  );
  return res.json({
    success: true,
    data: {
      ...submission.toObject(),
      id: id(submission._id),
      assignmentId: id(assignment._id),
      studentId: id(req.user._id),
    },
  });
};

export const sendConversationMessage = async (req, res) => {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body)
    return res
      .status(400)
      .json({ success: false, message: "Message body is required." });
  const conversation = await StudentConversation.findOne({
    _id: req.params.id,
    campusId: req.user.campusId,
    participantIds: req.user._id,
  });
  if (!conversation)
    return res
      .status(404)
      .json({ success: false, message: "Conversation not found." });
  const receiverId = conversation.participantIds.find(
    (participantId) => id(participantId) !== id(req.user._id),
  );
  conversation.messages.push({ senderId: req.user._id, receiverId, body });
  await conversation.save();
  const message = conversation.messages.at(-1);
  return res.status(201).json({
    success: true,
    data: {
      ...message.toObject(),
      id: id(message._id),
      conversationId: `thread:${id(conversation._id)}`,
      senderId: `student:${id(req.user._id)}`,
      receiverId: `faculty:${id(receiverId)}`,
    },
  });
};

export const submitFeePayment = async (req, res) => {
  try {
    const feeRecord = await FeeRecord.findOne({
      _id: req.params.id,
      campusId: req.user.campusId,
      studentId: req.user._id,
    });
    if (!feeRecord) {
      return res.status(404).json({ success: false, message: "Fee record not found." });
    }

    const amount = Number(req.body.amount || 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than zero." });
    }

    const remaining = feeRecord.amount - feeRecord.paidAmount;
    if (amount > remaining) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (${amount}) exceeds remaining balance (${remaining}).` 
      });
    }

    const payment = await PaymentTransaction.create({
      feeRecordId: feeRecord._id,
      studentId: req.user._id,
      campusId: req.user.campusId,
      instituteId: req.user.instituteId || null,
      amount,
      paymentDate: new Date(),
      paymentMethod: req.body.paymentMethod || "Bank Transfer",
      referenceNo: req.body.referenceNo || "",
      receiptUrl: req.body.receiptUrl || "",
      status: "PENDING",
      submittedBy: req.user._id,
      notes: req.body.notes || "Submitted by student via portal",
    });

    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
