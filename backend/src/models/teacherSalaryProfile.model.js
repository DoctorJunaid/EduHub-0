import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    iban: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const teacherSalaryProfileSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
      index: true,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherProfile',
      required: true,
      unique: true,
    },
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Base salary cannot be negative'],
    },
    allowances: {
      type: [allowanceSchema],
      default: [],
    },
    taxDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Tax deduction cannot be negative'],
    },
    otherDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Other deduction cannot be negative'],
    },
    bankAccount: {
      type: bankAccountSchema,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual field: grossSalary = baseSalary + sum of all allowances
teacherSalaryProfileSchema.virtual('grossSalary').get(function grossSalary() {
  const allowanceTotal = (this.allowances || []).reduce(
    (total, allowance) => total + (Number(allowance.amount) || 0),
    0
  );
  return (Number(this.baseSalary) || 0) + allowanceTotal;
});

// Method: calculateDailySalary based on working days per month (default or passed)
teacherSalaryProfileSchema.methods.calculateDailySalary = function calculateDailySalary(workingDaysPerMonth = 26) {
  const days = Number(workingDaysPerMonth);
  if (!days || days <= 0) return 0;
  return (Number(this.baseSalary) || 0) / days;
};

teacherSalaryProfileSchema.set('toJSON', { virtuals: true });
teacherSalaryProfileSchema.set('toObject', { virtuals: true });

// Compound Index for fast campus active profile lookups
teacherSalaryProfileSchema.index({ campusId: 1, isActive: 1 });

export const TeacherSalaryProfile = mongoose.model(
  'TeacherSalaryProfile',
  teacherSalaryProfileSchema
);

export default TeacherSalaryProfile;
