import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
});

const bankAccountSchema = new mongoose.Schema({
  accountNumber: { type: String },
  bankName: { type: String },
  swiftCode: { type: String },
});

const teacherSalaryProfileSchema = new mongoose.Schema({
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
  teacherProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  baseSalary: { type: Number, required: true, min: 0 },
  allowances: [allowanceSchema],
  bankAccount: bankAccountSchema,
  taxDeduction: { type: Number, default: 0, min: 0 },
  otherDeduction: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compound index to ensure uniqueness per campus+teacher
teacherSalaryProfileSchema.index({ campusId: 1, teacherProfileId: 1 }, { unique: true });

export const TeacherSalaryProfile = mongoose.model('TeacherSalaryProfile', teacherSalaryProfileSchema);
