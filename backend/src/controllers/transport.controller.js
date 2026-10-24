import mongoose from "mongoose";
import { Driver, Vehicle, Route } from "../models/transport.model.js";
import { StudentProfile } from "../models/profile.model.js";
import User from "../models/user.model.js";

/**
 * Helper to extract campusId safely
 */
const getCampusId = (req) => {
  return (
    req.user?.campusId?._id ||
    req.user?.campusId ||
    req.body?.campusId ||
    req.query?.campusId ||
    null
  );
};

// ==========================================
// DRIVERS CONTROLLER
// ==========================================

/**
 * POST /api/v1/transport/drivers
 * Add a new driver record
 */
export const createDriver = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus ID is required to register a driver.",
      });
    }

    const {
      name,
      phone,
      licenseNumber,
      cnic = "",
      status = "Active",
      experienceYears = 0,
      emergencyContact = "",
    } = req.body;

    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({
        success: false,
        message: "Driver name, phone, and license number are required.",
      });
    }

    const driver = await Driver.create({
      name: name.trim(),
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim(),
      cnic: cnic.trim(),
      status,
      experienceYears: Number(experienceYears) || 0,
      emergencyContact: emergencyContact.trim(),
      campusId,
      instituteId: req.user?.instituteId || null,
    });

    return res.status(201).json({
      success: true,
      message: "Driver registered successfully.",
      data: driver,
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create driver.",
    });
  }
};

/**
 * GET /api/v1/transport/drivers
 * Get all drivers for campus
 */
export const getDrivers = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const filter = campusId ? { campusId } : {};

    const drivers = await Driver.find(filter).sort({ createdAt: -1 }).lean();

    // Map which vehicle each driver is currently assigned to
    const vehicles = await Vehicle.find(filter).select("busNumber plateNumber driverId").lean();
    const vehicleByDriverId = {};
    for (const v of vehicles) {
      if (v.driverId) {
        vehicleByDriverId[String(v.driverId)] = {
          _id: v._id,
          busNumber: v.busNumber,
          plateNumber: v.plateNumber,
        };
      }
    }

    const driversWithAssignedVehicle = drivers.map((d) => ({
      ...d,
      assignedVehicle: vehicleByDriverId[String(d._id)] || null,
    }));

    return res.status(200).json({
      success: true,
      data: driversWithAssignedVehicle,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch drivers.",
    });
  }
};

/**
 * PUT /api/v1/transport/drivers/:id
 * Update driver details
 */
export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const campusId = getCampusId(req);

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const updated = await Driver.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Driver not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update driver.",
    });
  }
};

/**
 * DELETE /api/v1/transport/drivers/:id
 * Remove driver and unlink from any vehicles
 */
export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const campusId = getCampusId(req);

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const driver = await Driver.findOneAndDelete(query);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found or access denied.",
      });
    }

    // Unlink driver from any vehicles
    await Vehicle.updateMany({ driverId: id }, { $set: { driverId: null } });

    return res.status(200).json({
      success: true,
      message: "Driver removed successfully.",
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete driver.",
    });
  }
};

// ==========================================
// VEHICLES CONTROLLER
// ==========================================

/**
 * POST /api/v1/transport/vehicles
 * Add a new vehicle and link driver if provided
 */
export const createVehicle = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus ID is required to register a vehicle.",
      });
    }

    const {
      busNumber,
      model = "",
      plateNumber,
      capacity = 30,
      driverId = null,
      status = "Active",
    } = req.body;

    if (!busNumber || !plateNumber) {
      return res.status(400).json({
        success: false,
        message: "Bus number and license plate number are required.",
      });
    }

    // If driverId is provided, verify driver exists in campus
    let validDriverId = driverId;
    if (driverId && mongoose.isValidObjectId(driverId)) {
      const driverExists = await Driver.findOne({ _id: driverId, campusId });
      if (!driverExists) {
        return res.status(400).json({
          success: false,
          message: "Specified driver does not exist in this campus.",
        });
      }
    } else {
      validDriverId = null;
    }

    const vehicle = await Vehicle.create({
      busNumber: busNumber.trim(),
      model: model.trim(),
      plateNumber: plateNumber.trim(),
      capacity: Number(capacity) || 30,
      driverId: validDriverId,
      status,
      campusId,
      instituteId: req.user?.instituteId || null,
    });

    const populated = await Vehicle.findById(vehicle._id).populate("driverId");

    return res.status(201).json({
      success: true,
      message: "Vehicle registered successfully.",
      data: populated,
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create vehicle.",
    });
  }
};

/**
 * GET /api/v1/transport/vehicles
 * Get all vehicles for campus with populated drivers
 */
export const getVehicles = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const filter = campusId ? { campusId } : {};

    const vehicles = await Vehicle.find(filter)
      .populate("driverId")
      .sort({ createdAt: -1 })
      .lean();

    // Map which route each vehicle is assigned to
    const routes = await Route.find(filter).select("routeName vehicleId").lean();
    const routeByVehicleId = {};
    for (const r of routes) {
      if (r.vehicleId) {
        routeByVehicleId[String(r.vehicleId)] = {
          _id: r._id,
          routeName: r.routeName,
        };
      }
    }

    const enrichedVehicles = vehicles.map((v) => ({
      ...v,
      assignedRoute: routeByVehicleId[String(v._id)] || null,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedVehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vehicles.",
    });
  }
};

/**
 * PUT /api/v1/transport/vehicles/:id
 * Update vehicle info or assign driver
 */
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const campusId = getCampusId(req);

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const payload = { ...req.body };
    if (payload.driverId === "" || payload.driverId === "none") {
      payload.driverId = null;
    }

    const updated = await Vehicle.findOneAndUpdate(query, payload, {
      new: true,
      runValidators: true,
    }).populate("driverId");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update vehicle.",
    });
  }
};

/**
 * DELETE /api/v1/transport/vehicles/:id
 * Delete vehicle and unlink from routes
 */
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const campusId = getCampusId(req);

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const vehicle = await Vehicle.findOneAndDelete(query);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or access denied.",
      });
    }

    // Unlink from routes
    await Route.updateMany({ vehicleId: id }, { $set: { vehicleId: null } });

    return res.status(200).json({
      success: true,
      message: "Vehicle removed successfully.",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete vehicle.",
    });
  }
};

// ==========================================
// ROUTES CONTROLLER
// ==========================================

/**
 * POST /api/v1/transport/routes
 * Create a new route with stops and optional vehicle link
 */
export const createRoute = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus ID is required to create a route.",
      });
    }

    const {
      routeName,
      vehicleId = null,
      stops = [],
      status = "Active",
    } = req.body;

    if (!routeName) {
      return res.status(400).json({
        success: false,
        message: "Route name is required (e.g. Route A: DHA Phase 5).",
      });
    }

    let validVehicleId = vehicleId;
    if (vehicleId && mongoose.isValidObjectId(vehicleId)) {
      const vExists = await Vehicle.findOne({ _id: vehicleId, campusId });
      if (!vExists) {
        return res.status(400).json({
          success: false,
          message: "Specified vehicle does not exist in this campus.",
        });
      }
    } else {
      validVehicleId = null;
    }

    // Sanitize stops array
    const formattedStops = (Array.isArray(stops) ? stops : []).map(
      (stop, idx) => ({
        stopName: (stop.stopName || `Stop ${idx + 1}`).trim(),
        pickupTime: (stop.pickupTime || "07:15 AM").trim(),
        dropTime: (stop.dropTime || "02:30 PM").trim(),
        order: Number(stop.order) || idx + 1,
      })
    );

    const route = await Route.create({
      routeName: routeName.trim(),
      vehicleId: validVehicleId,
      stops: formattedStops,
      status,
      campusId,
      instituteId: req.user?.instituteId || null,
    });

    const populated = await Route.findById(route._id).populate({
      path: "vehicleId",
      populate: { path: "driverId" },
    });

    return res.status(201).json({
      success: true,
      message: "Route created successfully.",
      data: populated,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create route.",
    });
  }
};

/**
 * GET /api/v1/transport/routes
 * List all routes with populated vehicle & driver, plus assigned student count
 */
export const getRoutes = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const filter = campusId ? { campusId } : {};

    const routes = await Route.find(filter)
      .populate({
        path: "vehicleId",
        populate: { path: "driverId" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Compute assigned students count for each route
    const studentCounts = await StudentProfile.aggregate([
      { $match: { routeId: { $ne: null } } },
      { $group: { _id: "$routeId", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    studentCounts.forEach((sc) => {
      countMap[String(sc._id)] = sc.count;
    });

    const enriched = routes.map((r) => ({
      ...r,
      assignedStudentsCount: countMap[String(r._id)] || 0,
    }));

    return res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch routes.",
    });
  }
};

/**
 * PUT /api/v1/transport/routes/:id
 * Update route stops, vehicle, or status
 */
export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const campusId = getCampusId(req);

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const payload = { ...req.body };
    if (payload.vehicleId === "" || payload.vehicleId === "none") {
      payload.vehicleId = null;
    }

    if (payload.stops && Array.isArray(payload.stops)) {
      payload.stops = payload.stops.map((stop, idx) => ({
        ...stop,
        order: Number(stop.order) || idx + 1,
      }));
    }

    const updated = await Route.findOneAndUpdate(query, payload, {
      new: true,
      runValidators: true,
    }).populate({
      path: "vehicleId",
      populate: { path: "driverId" },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Route not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Route updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update route.",
    });
  }
};

/**
 * DELETE /api/v1/transport/routes/:id
 * Delete route and unassign students
 */
export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const campusId = getCampusId(req);

    const query = { _id: id };
    if (campusId) query.campusId = campusId;

    const route = await Route.findOneAndDelete(query);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found or access denied.",
      });
    }

    // Unassign students from this deleted route
    await StudentProfile.updateMany(
      { routeId: id },
      {
        $set: {
          routeId: null,
          stopName: "",
          transportEnrolled: false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Route deleted and student allocations updated successfully.",
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete route.",
    });
  }
};

// ==========================================
// STUDENT ASSIGNMENT CONTROLLER
// ==========================================

/**
 * POST /api/v1/transport/assign-student
 * Assign or unassign a student to/from a transport route & stop
 * Body: { studentId, routeId, stopName }
 */
export const assignStudentToRoute = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const { studentId, routeId, stopName } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
    }

    // Locate student profile (studentId can be StudentProfile._id or User._id)
    let profile = await StudentProfile.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(studentId) ? studentId : null },
        { user: mongoose.isValidObjectId(studentId) ? studentId : null },
        { studentId: studentId },
      ],
    });

    if (!profile) {
      // If student is a User without a StudentProfile yet, attempt to find user and initialize profile
      const userDoc = await User.findOne({
        _id: mongoose.isValidObjectId(studentId) ? studentId : null,
      });

      if (userDoc && userDoc.role === "student") {
        profile = await StudentProfile.create({
          user: userDoc._id,
          studentId: `STU-${Date.now().toString().slice(-6)}`,
          gradeOrClass: userDoc.gradeOrClass || "Class 9",
          section: userDoc.section || "A",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }
    }

    // If routeId is null or empty, unassign student from transport
    if (!routeId || routeId === "none" || routeId === "") {
      profile.usesTransport = false;
      profile.transportDetails = null;
      profile.routeId = null;
      profile.stopName = "";
      profile.transportEnrolled = false;
      await profile.save();

      if (profile.user) {
        await User.findByIdAndUpdate(profile.user, {
          usesTransport: false,
          transportDetails: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Student unassigned from transport successfully.",
        data: {
          studentId: profile._id,
          usesTransport: false,
          transportEnrolled: false,
          route: null,
          stopName: "",
        },
      });
    }

    // Verify route exists
    const route = await Route.findById(routeId).populate({
      path: "vehicleId",
      populate: { path: "driverId" },
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Specified transport route was not found.",
      });
    }

    // Validate stop
    let finalStopName = (stopName || "").trim();
    if (!finalStopName && route.stops && route.stops.length > 0) {
      finalStopName = route.stops[0].stopName;
    }

    const transportDetails = {
      routeId: route._id,
      stopName: finalStopName,
      assignedAt: new Date(),
      assignedBy: req.user?._id || null,
    };

    profile.usesTransport = true;
    profile.transportDetails = transportDetails;
    profile.routeId = route._id;
    profile.stopName = finalStopName;
    profile.transportEnrolled = true;
    await profile.save();

    if (profile.user) {
      await User.findByIdAndUpdate(profile.user, {
        usesTransport: true,
        transportDetails,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student successfully mapped to ${route.routeName} at ${finalStopName}.`,
      data: {
        studentId: profile._id,
        usesTransport: true,
        transportEnrolled: true,
        routeId: route._id,
        routeName: route.routeName,
        stopName: finalStopName,
        vehicle: route.vehicleId,
        transportDetails,
      },
    });
  } catch (error) {
    console.error("Error assigning student to transport:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign student to transport.",
    });
  }
};

/**
 * GET /api/v1/transport/students
 * Get students with their transport assignment info
 */
export const getTransportStudents = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const filter = campusId ? { campusId } : {};

    // Get all student users in this campus
    const studentUsers = await User.find({
      ...filter,
      role: "student",
      isActive: { $ne: false },
    })
      .select("name email phone studentPhone gradeOrClass section roll rollNumber avatar usesTransport transportDetails")
      .populate({
        path: "transportDetails.routeId",
        populate: {
          path: "vehicleId",
          populate: { path: "driverId" },
        },
      })
      .lean();

    const userIds = studentUsers.map((u) => u._id);

    // Get profiles
    const profiles = await StudentProfile.find({
      user: { $in: userIds },
    })
      .populate({
        path: "transportDetails.routeId",
        populate: {
          path: "vehicleId",
          populate: { path: "driverId" },
        },
      })
      .populate({
        path: "routeId",
        populate: {
          path: "vehicleId",
          populate: { path: "driverId" },
        },
      })
      .lean();

    const profileByUserId = {};
    profiles.forEach((p) => {
      profileByUserId[String(p.user)] = p;
    });

    const students = studentUsers.map((user) => {
      const prof = profileByUserId[String(user._id)];
      const route = user.transportDetails?.routeId || prof?.transportDetails?.routeId || prof?.routeId || null;
      const vehicle = route?.vehicleId || null;
      const driver = vehicle?.driverId || null;
      const usesTransport = Boolean(
        user.usesTransport ||
        prof?.usesTransport ||
        (prof?.transportEnrolled && (prof?.routeId || prof?.transportDetails?.routeId))
      );
      const stopName = user.transportDetails?.stopName || prof?.transportDetails?.stopName || prof?.stopName || "";

      return {
        _id: user._id,
        userId: user._id,
        profileId: prof?._id || user._id,
        name: user.name,
        email: user.email,
        phone: user.studentPhone || user.phone || prof?.guardianDetails?.phone || "",
        gradeOrClass: prof?.gradeOrClass || user.gradeOrClass || "",
        section: prof?.section || user.section || "",
        rollNumber: prof?.rollNumber || user.roll || user.rollNumber || "",
        usesTransport,
        transportEnrolled: usesTransport,
        routeId: route?._id || null,
        routeName: route?.routeName || (usesTransport ? "Route Pending" : ""),
        stopName,
        vehicleNumber: vehicle?.busNumber || "",
        driverName: driver?.name || "",
        driverPhone: driver?.phone || "",
        transportDetails: user.transportDetails || prof?.transportDetails || null,
      };
    });

    const enrolledOnly = req.query.enrolledOnly === "true" || req.query.usesTransport === "true";
    const filtered = enrolledOnly ? students.filter((s) => s.usesTransport) : students;

    return res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error("Error fetching transport students:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transport students.",
    });
  }
};

// ==========================================
// VISIBILITY CONTROLLER (STUDENT & PARENT)
// ==========================================

/**
 * GET /api/v1/transport/my-transport
 * Returns the logged-in student's or parent's bus, driver, and stop details
 */
export const getMyTransport = async (req, res) => {
  try {
    // Student can be req.user or specified by studentId query param (for parents/admins)
    const targetUserId = req.query.studentId || req.user?._id;

    if (!targetUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to view transport details.",
      });
    }

    // Find student profile and user document
    const [profile, userDoc] = await Promise.all([
      StudentProfile.findOne({
        $or: [
          { user: mongoose.isValidObjectId(targetUserId) ? targetUserId : null },
          { _id: mongoose.isValidObjectId(targetUserId) ? targetUserId : null },
          { studentId: targetUserId },
        ],
      })
        .populate({
          path: "transportDetails.routeId",
          populate: {
            path: "vehicleId",
            populate: { path: "driverId" },
          },
        })
        .populate({
          path: "routeId",
          populate: {
            path: "vehicleId",
            populate: { path: "driverId" },
          },
        }),
      User.findById(targetUserId)
        .populate({
          path: "transportDetails.routeId",
          populate: {
            path: "vehicleId",
            populate: { path: "driverId" },
          },
        })
        .lean(),
    ]);

    const assignedRoute =
      profile?.transportDetails?.routeId ||
      userDoc?.transportDetails?.routeId ||
      profile?.routeId;

    const assignedStopName =
      profile?.transportDetails?.stopName ||
      userDoc?.transportDetails?.stopName ||
      profile?.stopName ||
      "";

    const usesTransport = Boolean(
      profile?.usesTransport ||
      userDoc?.usesTransport ||
      assignedRoute ||
      profile?.transportEnrolled
    );

    if (!usesTransport && !assignedRoute) {
      return res.status(200).json({
        success: true,
        assigned: false,
        usesTransport: false,
        data: null,
        message: "No transport is currently active for this student.",
      });
    }

    // Handle deleted route or unassigned route gracefully without crashes
    if (!assignedRoute || typeof assignedRoute !== "object" || !assignedRoute.routeName) {
      return res.status(200).json({
        success: true,
        assigned: true,
        usesTransport: true,
        data: {
          assigned: true,
          usesTransport: true,
          student: {
            profileId: profile?._id,
            stopName: assignedStopName || "Stop Pending",
            transportEnrolled: true,
          },
          route: {
            id: null,
            routeName: "Assigned Route (Updated / Unassigned)",
            status: "Inactive",
            totalStops: 0,
          },
          stop: {
            stopName: assignedStopName || "Pending Assignment",
            pickupTime: "07:15 AM",
            dropTime: "02:30 PM",
            order: 1,
          },
          vehicle: {
            id: null,
            busNumber: "Pending Vehicle",
            model: "—",
            plateNumber: "—",
            capacity: 0,
            status: "Inactive",
          },
          driver: {
            id: null,
            name: "Driver Pending",
            phone: "—",
            licenseNumber: "—",
            status: "Inactive",
          },
        },
      });
    }

    const route = assignedRoute;
    const vehicle = route.vehicleId || null;
    const driver = vehicle?.driverId || null;

    // Find assigned stop details
    const matchedStop = (route.stops || []).find(
      (s) =>
        (s.stopName || "").trim().toLowerCase() ===
        assignedStopName.trim().toLowerCase()
    ) || (route.stops && route.stops[0]) || {
      stopName: assignedStopName || "Designated Campus Stop",
      pickupTime: "07:15 AM",
      dropTime: "02:30 PM",
      order: 1,
    };

    const transportData = {
      assigned: true,
      usesTransport: true,
      student: {
        profileId: profile?._id,
        stopName: assignedStopName || matchedStop.stopName,
        transportEnrolled: true,
      },
      route: {
        id: route._id,
        routeName: route.routeName,
        status: route.status,
        totalStops: route.stops ? route.stops.length : 0,
      },
      stop: {
        stopName: matchedStop.stopName,
        pickupTime: matchedStop.pickupTime || "07:15 AM",
        dropTime: matchedStop.dropTime || "02:30 PM",
        order: matchedStop.order ?? 1,
      },
      vehicle: vehicle
        ? {
            id: vehicle._id,
            busNumber: vehicle.busNumber,
            model: vehicle.model || "Standard Van/Bus",
            plateNumber: vehicle.plateNumber,
            capacity: vehicle.capacity,
            status: vehicle.status,
          }
        : {
            id: null,
            busNumber: "Pending Vehicle",
            model: "—",
            plateNumber: "—",
            capacity: 0,
            status: "Inactive",
          },
      driver: driver
        ? {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            status: driver.status,
          }
        : {
            id: null,
            name: "Driver to be assigned",
            phone: "—",
            licenseNumber: "—",
            status: "Inactive",
          },
    };

    return res.status(200).json({
      success: true,
      assigned: true,
      usesTransport: true,
      data: transportData,
    });
  } catch (error) {
    console.error("Error fetching my-transport:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student transport card data.",
    });
  }
};

/**
 * GET /api/v1/transport/stats
 * Overview counts for transport dashboard
 */
export const getTransportStats = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const filter = campusId ? { campusId } : {};

    const [totalDrivers, totalVehicles, totalRoutes, assignedStudents] =
      await Promise.all([
        Driver.countDocuments({ ...filter, status: "Active" }),
        Vehicle.countDocuments({ ...filter, status: "Active" }),
        Route.countDocuments({ ...filter, status: "Active" }),
        StudentProfile.countDocuments({
          routeId: { $ne: null },
          transportEnrolled: true,
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalDrivers,
        totalVehicles,
        totalRoutes,
        assignedStudents,
      },
    });
  } catch (error) {
    console.error("Error fetching transport stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transport stats.",
    });
  }
};

/**
 * POST /api/v1/transport/seed-preset
 * Seeds the exact scenario from user requirements:
 * Bus #12 -> Driver Ali Ahmed -> Route A: DHA Phase 5 (Stops: Park, Market) -> Assigned Student
 */
export const seedTransportPreset = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus ID is required to seed transport.",
      });
    }

    const instituteId = req.user?.instituteId || null;

    // 1. Driver: Ali Ahmed
    let driver = await Driver.findOne({ campusId, name: "Ali Ahmed" });
    if (!driver) {
      driver = await Driver.create({
        name: "Ali Ahmed",
        phone: "+92 300 1234567",
        licenseNumber: "LIC-98765-PK",
        cnic: "42101-1234567-1",
        status: "Active",
        experienceYears: 6,
        emergencyContact: "+92 321 7654321",
        campusId,
        instituteId,
      });
    }

    // 2. Additional Driver for fleet
    let driver2 = await Driver.findOne({ campusId, name: "Tariq Mahmood" });
    if (!driver2) {
      driver2 = await Driver.create({
        name: "Tariq Mahmood",
        phone: "+92 333 9876543",
        licenseNumber: "LIC-54321-PK",
        cnic: "42101-7654321-3",
        status: "Active",
        experienceYears: 8,
        emergencyContact: "+92 312 3456789",
        campusId,
        instituteId,
      });
    }

    // 3. Vehicle: Bus #12 (Toyota Coaster, Plate ABC-123)
    let vehicle = await Vehicle.findOne({ campusId, busNumber: "Bus #12" });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        busNumber: "Bus #12",
        model: "Toyota Coaster",
        plateNumber: "ABC-123",
        capacity: 32,
        driverId: driver._id,
        status: "Active",
        campusId,
        instituteId,
      });
    } else if (!vehicle.driverId) {
      vehicle.driverId = driver._id;
      await vehicle.save();
    }

    // 4. Vehicle: Van #05
    let vehicle2 = await Vehicle.findOne({ campusId, busNumber: "Van #05" });
    if (!vehicle2) {
      vehicle2 = await Vehicle.create({
        busNumber: "Van #05",
        model: "Toyota HiAce",
        plateNumber: "KHI-456",
        capacity: 15,
        driverId: driver2._id,
        status: "Active",
        campusId,
        instituteId,
      });
    }

    // 5. Route: Route A: DHA Phase 5
    let route = await Route.findOne({ campusId, routeName: "Route A: DHA Phase 5" });
    const stopsData = [
      { stopName: "Stop 1: Park", pickupTime: "07:00 AM", dropTime: "02:15 PM", order: 1 },
      { stopName: "Stop 2: Market", pickupTime: "07:15 AM", dropTime: "02:30 PM", order: 2 },
      { stopName: "Stop 3: Commercial Hub", pickupTime: "07:30 AM", dropTime: "02:45 PM", order: 3 },
    ];

    if (!route) {
      route = await Route.create({
        routeName: "Route A: DHA Phase 5",
        vehicleId: vehicle._id,
        stops: stopsData,
        status: "Active",
        campusId,
        instituteId,
      });
    } else {
      route.vehicleId = vehicle._id;
      if (!route.stops || route.stops.length === 0) route.stops = stopsData;
      await route.save();
    }

    // 6. Route: Route B: Gulberg Express
    let route2 = await Route.findOne({ campusId, routeName: "Route B: Gulberg Express" });
    if (!route2) {
      route2 = await Route.create({
        routeName: "Route B: Gulberg Express",
        vehicleId: vehicle2._id,
        stops: [
          { stopName: "Stop 1: Main Boulevard", pickupTime: "07:10 AM", dropTime: "02:20 PM", order: 1 },
          { stopName: "Stop 2: Roundabout", pickupTime: "07:25 AM", dropTime: "02:40 PM", order: 2 },
        ],
        status: "Active",
        campusId,
        instituteId,
      });
    }

    // 7. Auto-map at least one student to Route A -> Stop 2: Market
    let mappedStudent = null;
    const studentUser = await User.findOne({ campusId, role: "student", isActive: { $ne: false } });
    if (studentUser) {
      let stuProfile = await StudentProfile.findOne({ user: studentUser._id });
      if (!stuProfile) {
        stuProfile = await StudentProfile.create({
          user: studentUser._id,
          studentId: `STU-${Date.now().toString().slice(-6)}`,
          gradeOrClass: studentUser.gradeOrClass || "Class 9",
          section: studentUser.section || "A",
          routeId: route._id,
          stopName: "Stop 2: Market",
          transportEnrolled: true,
        });
      } else {
        stuProfile.routeId = route._id;
        stuProfile.stopName = "Stop 2: Market";
        stuProfile.transportEnrolled = true;
        await stuProfile.save();
      }
      mappedStudent = {
        name: studentUser.name,
        email: studentUser.email,
        stopName: "Stop 2: Market",
      };
    }

    return res.status(200).json({
      success: true,
      message: "Transport preset seeded successfully with Bus #12, Ali Ahmed, Route A, and student mapping.",
      data: {
        driver,
        vehicle,
        route,
        mappedStudent,
      },
    });
  } catch (error) {
    console.error("Error seeding transport preset:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to seed transport preset.",
    });
  }
};

