import mongoose from "mongoose";

/**
 * Driver Model
 * Records driver credentials and contact details.
 * Drivers are administrative records and do not require user credentials.
 */
const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "Driver license number is required"],
      trim: true,
    },
    cnic: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave"],
      default: "Active",
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: "",
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * Vehicle Model
 * Represents a school or campus bus, van, or coaster.
 * Can be linked to an assigned driver.
 */
const vehicleSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, "Bus number / identifier is required"],
      trim: true,
    },
    model: {
      type: String,
      trim: true,
      default: "",
    },
    plateNumber: {
      type: String,
      required: [true, "License plate number is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      default: 30,
      min: 1,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Maintenance", "Inactive"],
      default: "Active",
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * Route Stop Subdocument Schema
 */
const routeStopSchema = new mongoose.Schema(
  {
    stopName: {
      type: String,
      required: [true, "Stop name is required"],
      trim: true,
    },
    pickupTime: {
      type: String,
      trim: true,
      default: "07:15 AM",
    },
    dropTime: {
      type: String,
      trim: true,
      default: "02:30 PM",
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  { _id: true }
);

/**
 * Route Model
 * Represents a transit route with multiple pickup/drop stops,
 * linked to a designated vehicle.
 */
const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, "Route name is required"],
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    stops: [routeStopSchema],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Helpful Indexes
vehicleSchema.index({ campusId: 1, busNumber: 1 });
routeSchema.index({ campusId: 1, routeName: 1 });

export const Driver = mongoose.model("Driver", driverSchema);
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export const Route = mongoose.model("Route", routeSchema);

export default {
  Driver,
  Vehicle,
  Route,
};
