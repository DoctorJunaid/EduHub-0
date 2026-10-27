import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  Users,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  Gauge,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Route,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

import {
  getDriversApi,
  createDriverApi,
  updateDriverApi,
  deleteDriverApi,
  getVehiclesApi,
  createVehicleApi,
  updateVehicleApi,
  deleteVehicleApi,
  getRoutesApi,
  createRouteApi,
  updateRouteApi,
  deleteRouteApi,
  assignStudentToRouteApi,
  getTransportStudentsApi,
  getTransportStatsApi,
  seedTransportPresetApi,
} from "@/api/transport.api";

import "./TransportManagement.css";

export default function TransportManagement() {
  const [activeTab, setActiveTab] = useState("routes"); // 'routes' | 'vehicles' | 'drivers' | 'students'
  const [loading, setLoading] = useState(true);

  // Data states
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    totalRoutes: 0,
    assignedStudents: 0,
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Dialog states
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    cnic: "",
    status: "Active",
    experienceYears: 5,
    emergencyContact: "",
  });

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    busNumber: "",
    model: "",
    plateNumber: "",
    capacity: 30,
    driverId: "",
    status: "Active",
  });

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    routeName: "",
    vehicleId: "",
    status: "Active",
    stops: [
      { stopName: "Stop 1: Park", pickupTime: "07:00 AM", dropTime: "02:15 PM", order: 1 },
      { stopName: "Stop 2: Market", pickupTime: "07:15 AM", dropTime: "02:30 PM", order: 2 },
    ],
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState(null);
  const [assignForm, setAssignForm] = useState({
    studentId: "",
    routeId: "",
    stopName: "",
  });

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type, id, title }

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all transport data
  const loadTransportData = async () => {
    setLoading(true);
    try {
      const [rRes, vRes, dRes, sRes, statsRes] = await Promise.allSettled([
        getRoutesApi(),
        getVehiclesApi(),
        getDriversApi(),
        getTransportStudentsApi(),
        getTransportStatsApi(),
      ]);

      const loadedRoutes = rRes.status === "fulfilled" ? rRes.value?.data || [] : [];
      const loadedVehicles = vRes.status === "fulfilled" ? vRes.value?.data || [] : [];
      const loadedDrivers = dRes.status === "fulfilled" ? dRes.value?.data || [] : [];
      const loadedStudents = sRes.status === "fulfilled" ? sRes.value?.data || [] : [];
      const loadedStats = statsRes.status === "fulfilled" ? statsRes.value?.data || {} : {};

      setRoutes(loadedRoutes);
      setVehicles(loadedVehicles);
      setDrivers(loadedDrivers);
      setStudents(loadedStudents);
      setStats({
        totalDrivers: loadedStats.totalDrivers ?? loadedDrivers.length,
        totalVehicles: loadedStats.totalVehicles ?? loadedVehicles.length,
        totalRoutes: loadedStats.totalRoutes ?? loadedRoutes.length,
        assignedStudents:
          loadedStats.assignedStudents ??
          loadedStudents.filter((s) => s.transportEnrolled).length,
      });

      // If system has no routes and no vehicles, auto-seed preset for convenience
      if (loadedRoutes.length === 0 && loadedVehicles.length === 0) {
        try {
          const seedRes = await seedTransportPresetApi();
          if (seedRes?.success) {
            toast.success("Loaded EduHub standard transport preset!");
            // Refresh
            const [r2, v2, d2, s2] = await Promise.all([
              getRoutesApi(),
              getVehiclesApi(),
              getDriversApi(),
              getTransportStudentsApi(),
            ]);
            setRoutes(r2.data || []);
            setVehicles(v2.data || []);
            setDrivers(d2.data || []);
            setStudents(s2.data || []);
          }
        } catch {
          // ignore background auto-seed error
        }
      }
    } catch (err) {
      console.error("Failed to load transport data:", err);
      toast.error("Could not load transport data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransportData();
  }, []);

  // Quick Seed Button
  const handleSeedPreset = async () => {
    setIsSubmitting(true);
    try {
      const res = await seedTransportPresetApi();
      if (res?.success) {
        toast.success(res.message || "Transport preset seeded successfully!");
        await loadTransportData();
      } else {
        toast.error(res?.message || "Failed to seed preset.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DRIVER ACTIONS
  // ==========================================
  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      name: "",
      phone: "",
      licenseNumber: "",
      cnic: "",
      status: "Active",
      experienceYears: 5,
      emergencyContact: "",
    });
    setDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name || "",
      phone: driver.phone || "",
      licenseNumber: driver.licenseNumber || "",
      cnic: driver.cnic || "",
      status: driver.status || "Active",
      experienceYears: driver.experienceYears || 0,
      emergencyContact: driver.emergencyContact || "",
    });
    setDriverModalOpen(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim() || !driverForm.licenseNumber.trim()) {
      toast.error("Name, phone, and license number are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingDriver) {
        await updateDriverApi(editingDriver._id, driverForm);
        toast.success("Driver updated successfully.");
      } else {
        await createDriverApi(driverForm);
        toast.success("Driver added successfully.");
      }
      setDriverModalOpen(false);
      await loadTransportData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // VEHICLE ACTIONS
  // ==========================================
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      busNumber: "",
      model: "",
      plateNumber: "",
      capacity: 30,
      driverId: drivers.length > 0 ? drivers[0]._id : "",
      status: "Active",
    });
    setVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh) => {
    setEditingVehicle(veh);
    setVehicleForm({
      busNumber: veh.busNumber || "",
      model: veh.model || "",
      plateNumber: veh.plateNumber || "",
      capacity: veh.capacity || 30,
      driverId: veh.driverId?._id || veh.driverId || "",
      status: veh.status || "Active",
    });
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.busNumber.trim() || !vehicleForm.plateNumber.trim()) {
      toast.error("Bus number and license plate are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingVehicle) {
        await updateVehicleApi(editingVehicle._id, vehicleForm);
        toast.success("Vehicle updated successfully.");
      } else {
        await createVehicleApi(vehicleForm);
        toast.success("Vehicle added successfully.");
      }
      setVehicleModalOpen(false);
      await loadTransportData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ROUTE ACTIONS
  // ==========================================
  const handleOpenAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      routeName: "",
      vehicleId: vehicles.length > 0 ? vehicles[0]._id : "",
      status: "Active",
      stops: [
        { stopName: "Stop 1: Park", pickupTime: "07:00 AM", dropTime: "02:15 PM", order: 1 },
        { stopName: "Stop 2: Market", pickupTime: "07:15 AM", dropTime: "02:30 PM", order: 2 },
      ],
    });
    setRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route) => {
    setEditingRoute(route);
    setRouteForm({
      routeName: route.routeName || "",
      vehicleId: route.vehicleId?._id || route.vehicleId || "",
      status: route.status || "Active",
      stops:
        route.stops && route.stops.length > 0
          ? route.stops.map((s, idx) => ({
              stopName: s.stopName,
              pickupTime: s.pickupTime || "07:15 AM",
              dropTime: s.dropTime || "02:30 PM",
              order: s.order || idx + 1,
            }))
          : [{ stopName: "Stop 1: Campus Gate", pickupTime: "07:15 AM", dropTime: "02:30 PM", order: 1 }],
    });
    setRouteModalOpen(true);
  };

  const handleAddStopToForm = () => {
    const nextOrder = routeForm.stops.length + 1;
    setRouteForm((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          stopName: `Stop ${nextOrder}: New Landmark`,
          pickupTime: "07:20 AM",
          dropTime: "02:40 PM",
          order: nextOrder,
        },
      ],
    }));
  };

  const handleRemoveStopFromForm = (index) => {
    if (routeForm.stops.length <= 1) {
      toast.error("A route must have at least one stop.");
      return;
    }
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const handleStopChange = (index, field, value) => {
    setRouteForm((prev) => {
      const updated = [...prev.stops];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stops: updated };
    });
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.routeName.trim()) {
      toast.error("Route name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingRoute) {
        await updateRouteApi(editingRoute._id, routeForm);
        toast.success("Route updated successfully.");
      } else {
        await createRouteApi(routeForm);
        toast.success("Route created successfully.");
      }
      setRouteModalOpen(false);
      await loadTransportData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // STUDENT ASSIGNMENT ACTIONS
  // ==========================================
  const handleOpenAssignStudent = (student = null) => {
    setSelectedStudentForAssign(student);
    const initialRoute = student?.routeId
      ? routes.find((r) => r._id === student.routeId || r.routeName === student.routeName)
      : routes[0];

    setAssignForm({
      studentId: student ? student.userId || student._id : (students[0]?.userId || students[0]?._id || ""),
      routeId: initialRoute ? initialRoute._id : "",
      stopName: student?.stopName || (initialRoute?.stops?.[0]?.stopName || ""),
    });
    setAssignModalOpen(true);
  };

  const handleAssignRouteChange = (newRouteId) => {
    const selectedRoute = routes.find((r) => r._id === newRouteId);
    setAssignForm((prev) => ({
      ...prev,
      routeId: newRouteId,
      stopName: selectedRoute?.stops?.[0]?.stopName || "",
    }));
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.studentId) {
      toast.error("Please select a student.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignStudentToRouteApi(assignForm);
      toast.success(res?.message || "Student transport assigned successfully.");
      setAssignModalOpen(false);
      await loadTransportData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignStudent = async (student) => {
    if (!window.confirm(`Unassign ${student.name} from transport?`)) return;
    try {
      await assignStudentToRouteApi({
        studentId: student.userId || student._id,
        routeId: null,
        stopName: "",
      });
      toast.success(`Unassigned ${student.name} from transport.`);
      await loadTransportData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // ==========================================
  // DELETE HANDLERS
  // ==========================================
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      if (itemToDelete.type === "driver") {
        await deleteDriverApi(itemToDelete.id);
        toast.success("Driver deleted.");
      } else if (itemToDelete.type === "vehicle") {
        await deleteVehicleApi(itemToDelete.id);
        toast.success("Vehicle deleted.");
      } else if (itemToDelete.type === "route") {
        await deleteRouteApi(itemToDelete.id);
        toast.success("Route deleted.");
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await loadTransportData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered routes list for search
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase();
    return routes.filter(
      (r) =>
        r.routeName?.toLowerCase().includes(q) ||
        r.vehicleId?.busNumber?.toLowerCase().includes(q) ||
        r.vehicleId?.plateNumber?.toLowerCase().includes(q) ||
        r.vehicleId?.driverId?.name?.toLowerCase().includes(q) ||
        r.stops?.some((st) => st.stopName?.toLowerCase().includes(q))
    );
  }, [routes, searchQuery]);

  // Filtered vehicles list for search
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.busNumber?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.plateNumber?.toLowerCase().includes(q) ||
        v.driverId?.name?.toLowerCase().includes(q) ||
        v.assignedRoute?.routeName?.toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  // Filtered drivers list for search
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q) ||
        d.licenseNumber?.toLowerCase().includes(q) ||
        d.cnic?.toLowerCase().includes(q) ||
        d.assignedVehicle?.busNumber?.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  // Filtered students list for search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.routeName?.toLowerCase().includes(q) ||
        s.stopName?.toLowerCase().includes(q) ||
        s.vehicleNumber?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="campus-tab-page transport-page">
      {/* ── 1. Flush Border-to-Border Thin KPI Cards ── */}
      <div className="campus-kpi-track transport-kpi-track">
        <div
          className={`campus-kpi-card ${activeTab === "routes" ? "kpi-card-active" : ""}`}
          onClick={() => {
            setActiveTab("routes");
            setSearchQuery("");
          }}
          title="Click to switch to Routes & Stops"
        >
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Active Routes</span>
              <span className="kpi-value">{routes.length}</span>
            </div>
          </div>
        </div>

        <div
          className={`campus-kpi-card ${activeTab === "vehicles" ? "kpi-card-active" : ""}`}
          onClick={() => {
            setActiveTab("vehicles");
            setSearchQuery("");
          }}
          title="Click to switch to Vehicles & Buses"
        >
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Bus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Fleet Size</span>
              <span className="kpi-value">{vehicles.length}</span>
            </div>
          </div>
        </div>

        <div
          className={`campus-kpi-card ${activeTab === "drivers" ? "kpi-card-active" : ""}`}
          onClick={() => {
            setActiveTab("drivers");
            setSearchQuery("");
          }}
          title="Click to switch to Drivers"
        >
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Drivers on Record</span>
              <span className="kpi-value">{drivers.length}</span>
            </div>
          </div>
        </div>

        <div
          className={`campus-kpi-card ${activeTab === "students" ? "kpi-card-active" : ""}`}
          onClick={() => {
            setActiveTab("students");
            setSearchQuery("");
          }}
          title="Click to switch to Student Commuters"
        >
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Students Enrolled</span>
              <span className="kpi-value">
                {students.filter((s) => s.transportEnrolled).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Contiguous 48px Toolbar Directly Below KPI Cards ── */}
      <div className="campus-toolbar transport-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={13} />
            <input
              type="text"
              placeholder={
                activeTab === "routes"
                  ? "Search routes or stops..."
                  : activeTab === "vehicles"
                  ? "Search buses or plates..."
                  : activeTab === "drivers"
                  ? "Search drivers or phone..."
                  : "Search students or routes..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search records"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            onClick={loadTransportData}
            disabled={loading}
            title="Refresh transport records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            className="toolbar-btn toolbar-btn-preset"
            onClick={handleSeedPreset}
            disabled={isSubmitting}
            title="Load standard demo scenario"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Load Sample Scenario
          </button>

          <Link
            to="/campus/transport-directory"
            className="toolbar-btn toolbar-btn-outline inline-flex items-center gap-1.5"
            title="View Enrolled Students Transport Directory"
          >
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            Transport Directory
          </Link>

          <span className="toolbar-separator" />

          <button
            type="button"
            className={`toolbar-btn ${activeTab === "drivers" ? "toolbar-btn-primary" : "toolbar-btn-outline"}`}
            onClick={handleOpenAddDriver}
          >
            <Users className="w-3.5 h-3.5" />
            Add Driver
          </button>

          <button
            type="button"
            className={`toolbar-btn ${activeTab === "vehicles" ? "toolbar-btn-primary" : "toolbar-btn-outline"}`}
            onClick={handleOpenAddVehicle}
          >
            <Bus className="w-3.5 h-3.5" />
            Add Vehicle
          </button>

          <button
            type="button"
            className={`toolbar-btn ${activeTab === "routes" || activeTab === "students" ? "toolbar-btn-primary" : "toolbar-btn-outline"}`}
            onClick={activeTab === "students" ? () => handleOpenAssignStudent(null) : handleOpenAddRoute}
          >
            <Plus className="w-3.5 h-3.5" />
            {activeTab === "students" ? "Assign Student" : "Add Route"}
          </button>
        </div>
      </div>

      {/* ── 4. Content Area ── */}
      <div className="transport-content">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="w-8 h-8 text-primary" />
            <p className="text-sm text-muted-foreground">Loading transport records...</p>
          </div>
        ) : (
          <>
            {/* 1. ROUTES TAB */}
            {activeTab === "routes" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Active Transit Routes</h2>
                    <p className="text-xs text-muted-foreground">
                      Each route maps a designated bus and driver to multiple pickup & drop stops.
                    </p>
                  </div>
                  <Button size="sm" onClick={handleOpenAddRoute} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    New Route
                  </Button>
                </div>

                {routes.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-sm">No Routes Registered</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Create your first route (e.g. Route A: DHA Phase 5) or click "Load Sample Scenario" to get started immediately.
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button size="sm" onClick={handleSeedPreset} variant="outline" className="text-xs">
                        Load Sample Scenario
                      </Button>
                      <Button size="sm" onClick={handleOpenAddRoute} className="text-xs">
                        Create Route
                      </Button>
                    </div>
                  </Card>
                ) : filteredRoutes.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-sm">No Matching Routes</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      No routes match your search "{searchQuery}".
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="mt-3 text-xs">
                      Clear Search
                    </Button>
                  </Card>
                ) : (
                  <div className="routes-grid">
                    {filteredRoutes.map((route) => {
                      const veh = route.vehicleId;
                      const driver = veh?.driverId;
                      return (
                        <div key={route._id} className="route-card">
                          <div className="route-card-header">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="route-title">{route.routeName}</h3>
                                <Badge
                                  variant="outline"
                                  className={
                                    route.status === "Active"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                  }
                                >
                                  {route.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground mt-0.5 inline-block">
                                {route.stops?.length || 0} Scheduled Stops
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditRoute(route)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                onClick={() => {
                                  setItemToDelete({
                                    type: "route",
                                    id: route._id,
                                    title: route.routeName,
                                  });
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Vehicle & Driver Banner */}
                          <div className="route-vehicle-banner">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0">
                              <Bus className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground truncate">
                                  {veh ? veh.busNumber : "No Bus Assigned"}
                                </span>
                                {veh?.plateNumber && (
                                  <Badge variant="outline" className="text-[10px] font-mono py-0">
                                    {veh.plateNumber}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                Driver: {driver ? `${driver.name} (${driver.phone})` : "Unassigned"}
                              </p>
                            </div>
                          </div>

                          {/* Stops Timeline */}
                          <div className="route-stops-list">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                              Transit Stops & Routine
                            </span>
                            {route.stops && route.stops.length > 0 ? (
                              route.stops.map((stop, idx) => (
                                <div key={stop._id || idx} className="stop-timeline-item">
                                  <div className="stop-timeline-node">{idx + 1}</div>
                                  <div className="stop-info">
                                    <span className="stop-name">{stop.stopName}</span>
                                    <span className="stop-time-tag">
                                      {stop.pickupTime || "07:15 AM"}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                No stops configured yet.
                              </p>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="route-card-footer">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5" />
                              <strong>{route.assignedStudentsCount || 0}</strong> Students Mapped
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setActiveTab("students");
                                setSearchQuery(route.routeName);
                              }}
                            >
                              View Students
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. VEHICLES TAB */}
            {activeTab === "vehicles" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Campus Fleet & Buses</h2>
                    <p className="text-xs text-muted-foreground">
                      Buses and vans registered with their capacity and assigned drivers.
                    </p>
                  </div>
                  <Button size="sm" onClick={handleOpenAddVehicle} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add Vehicle
                  </Button>
                </div>

                {vehicles.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <Bus className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-sm">No Vehicles in Fleet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Add a bus (e.g. Bus #12, Toyota Coaster, Plate ABC-123) to assign drivers and routes.
                    </p>
                    <Button size="sm" onClick={handleOpenAddVehicle} className="mt-4 text-xs">
                      Register Bus
                    </Button>
                  </Card>
                ) : filteredVehicles.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-sm">No Matching Vehicles</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      No vehicles match your search "{searchQuery}".
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="mt-3 text-xs">
                      Clear Search
                    </Button>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                          <TableHead className="font-bold">Bus / Identifier</TableHead>
                          <TableHead className="font-bold">Vehicle Model</TableHead>
                          <TableHead className="font-bold">License Plate</TableHead>
                          <TableHead className="font-bold">Capacity</TableHead>
                          <TableHead className="font-bold">Assigned Driver</TableHead>
                          <TableHead className="font-bold">Assigned Route</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVehicles.map((v) => (
                          <TableRow key={v._id}>
                            <TableCell className="font-bold flex items-center gap-2">
                              <Bus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                              {v.busNumber}
                            </TableCell>
                            <TableCell>{v.model || "Standard Bus"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {v.plateNumber}
                              </Badge>
                            </TableCell>
                            <TableCell>{v.capacity} seats</TableCell>
                            <TableCell>
                              {v.driverId ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-xs text-foreground">
                                    {v.driverId.name}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {v.driverId.phone}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Unassigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {v.assignedRoute ? (
                                <Badge variant="secondary" className="text-xs">
                                  {v.assignedRoute.routeName}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No route</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  v.status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }
                              >
                                {v.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenEditVehicle(v)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setItemToDelete({
                                      type: "vehicle",
                                      id: v._id,
                                      title: v.busNumber,
                                    });
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            )}

            {/* 3. DRIVERS TAB */}
            {activeTab === "drivers" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Driver Profiles</h2>
                    <p className="text-xs text-muted-foreground">
                      Drivers are administrative records (they do not require login accounts).
                    </p>
                  </div>
                  <Button size="sm" onClick={handleOpenAddDriver} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add Driver
                  </Button>
                </div>

                {drivers.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-sm">No Drivers Registered</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Add a driver profile (e.g. Ali Ahmed, Phone, License No.) to assign them to a bus.
                    </p>
                    <Button size="sm" onClick={handleOpenAddDriver} className="mt-4 text-xs">
                      Add Driver Record
                    </Button>
                  </Card>
                ) : filteredDrivers.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-semibold text-sm">No Matching Drivers</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      No drivers match your search "{searchQuery}".
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="mt-3 text-xs">
                      Clear Search
                    </Button>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                          <TableHead className="font-bold">Driver Name</TableHead>
                          <TableHead className="font-bold">Phone Number</TableHead>
                          <TableHead className="font-bold">License Number</TableHead>
                          <TableHead className="font-bold">CNIC</TableHead>
                          <TableHead className="font-bold">Assigned Bus</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDrivers.map((d) => (
                          <TableRow key={d._id}>
                            <TableCell className="font-bold">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                                  {d.name.charAt(0).toUpperCase()}
                                </div>
                                {d.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <a
                                href={`tel:${d.phone}`}
                                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                              >
                                <Phone className="w-3 h-3" />
                                {d.phone}
                              </a>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                {d.licenseNumber}
                              </code>
                            </TableCell>
                            <TableCell>{d.cnic || "—"}</TableCell>
                            <TableCell>
                              {d.assignedVehicle ? (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Bus className="w-3 h-3" />
                                  {d.assignedVehicle.busNumber}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  No bus assigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  d.status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                }
                              >
                                {d.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenEditDriver(d)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setItemToDelete({
                                      type: "driver",
                                      id: d._id,
                                      title: d.name,
                                    });
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            )}

            {/* 4. STUDENT COMMUTERS TAB */}
            {activeTab === "students" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Student Transport Mapping</h2>
                    <p className="text-xs text-muted-foreground">
                      Map students to a designated Route and Stop. Students and parents immediately see their Bus & Driver.
                    </p>
                  </div>

                  <Button size="sm" onClick={() => handleOpenAssignStudent(null)} className="h-8 text-xs gap-1.5 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                    Assign Student
                  </Button>
                </div>

                <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableHead className="font-bold">Student Name</TableHead>
                        <TableHead className="font-bold">Grade / Section</TableHead>
                        <TableHead className="font-bold">Transport Status</TableHead>
                        <TableHead className="font-bold">Assigned Route</TableHead>
                        <TableHead className="font-bold">Designated Stop</TableHead>
                        <TableHead className="font-bold">Bus # & Driver</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                            No student records matching current search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((s) => (
                          <TableRow key={s._id}>
                            <TableCell className="font-bold">
                              <div>
                                <span>{s.name}</span>
                                {s.email && (
                                  <span className="block text-[11px] font-normal text-muted-foreground">
                                    {s.email}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-medium">
                                {s.gradeOrClass || "Class 9"} {s.section ? `(${s.section})` : ""}
                              </span>
                            </TableCell>
                            <TableCell>
                              {s.transportEnrolled ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 text-[11px]">
                                  Enrolled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground text-[11px]">
                                  Not Enrolled
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {s.routeName ? (
                                <span className="font-medium text-xs text-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-indigo-500" />
                                  {s.routeName}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {s.stopName ? (
                                <Badge variant="secondary" className="text-xs">
                                  {s.stopName}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {s.vehicleNumber ? (
                                <div className="text-xs">
                                  <span className="font-bold text-foreground">
                                    {s.vehicleNumber}
                                  </span>
                                  {s.driverName && (
                                    <span className="block text-[11px] text-muted-foreground">
                                      {s.driverName} {s.driverPhone ? `(${s.driverPhone})` : ""}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => handleOpenAssignStudent(s)}
                                >
                                  {s.transportEnrolled ? "Change Route" : "Assign Route"}
                                </Button>
                                {s.transportEnrolled && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-red-500 hover:text-red-700"
                                    onClick={() => handleUnassignStudent(s)}
                                  >
                                    Unassign
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── DRIVER MODAL ── */}
      <Dialog open={driverModalOpen} onOpenChange={setDriverModalOpen}>
        <DialogContent className="transport-dialog-content sm:max-w-lg">
          <div className="transport-modal-header">
            <div className="transport-modal-icon-badge">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6">
              <DialogTitle className="transport-modal-title">
                {editingDriver ? "Edit Driver Profile" : "Register New Driver"}
              </DialogTitle>
              <DialogDescription className="transport-modal-desc">
                Drivers do not need app logins; they are purely operational records.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSaveDriver}>
            <div className="transport-modal-body">
              <div className="transport-form-group">
                <label className="transport-label">
                  <span>
                    Driver Full Name <span className="transport-label-req">*</span>
                  </span>
                </label>
                <div className="transport-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Ali Ahmed"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    required
                    className="transport-input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>
                      Phone Number <span className="transport-label-req">*</span>
                    </span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. +92 300 1234567"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      required
                      className="transport-input-field"
                    />
                  </div>
                </div>

                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>
                      License Number <span className="transport-label-req">*</span>
                    </span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. LIC-98765-PK"
                      value={driverForm.licenseNumber}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                      required
                      className="transport-input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>CNIC / ID (Optional)</span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="text"
                      placeholder="42101-1234567-1"
                      value={driverForm.cnic}
                      onChange={(e) => setDriverForm({ ...driverForm, cnic: e.target.value })}
                      className="transport-input-field"
                    />
                  </div>
                </div>

                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>Status</span>
                  </label>
                  <div className="transport-input-wrapper">
                    <select
                      className="transport-select-field"
                      value={driverForm.status}
                      onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="transport-select-chevron" />
                  </div>
                </div>
              </div>
            </div>

            <div className="transport-modal-footer">
              <span className="text-xs text-zinc-500 font-medium">Status: {driverForm.status}</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDriverModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-modal-submit"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingDriver ? (
                    "Update Driver"
                  ) : (
                    "Register Driver"
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VEHICLE MODAL ── */}
      <Dialog open={vehicleModalOpen} onOpenChange={setVehicleModalOpen}>
        <DialogContent className="transport-dialog-content sm:max-w-lg">
          <div className="transport-modal-header">
            <div className="transport-modal-icon-badge">
              <Bus className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6">
              <DialogTitle className="transport-modal-title">
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle / Bus"}
              </DialogTitle>
              <DialogDescription className="transport-modal-desc">
                Register a bus or coaster and link an assigned driver to it.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSaveVehicle}>
            <div className="transport-modal-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>
                      Bus Number / ID <span className="transport-label-req">*</span>
                    </span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. Bus #12"
                      value={vehicleForm.busNumber}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, busNumber: e.target.value })}
                      required
                      className="transport-input-field"
                    />
                  </div>
                </div>

                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>
                      License Plate <span className="transport-label-req">*</span>
                    </span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. ABC-123"
                      value={vehicleForm.plateNumber}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                      required
                      className="transport-input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>Model / Make</span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. Toyota Coaster"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      className="transport-input-field"
                    />
                  </div>
                </div>

                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>Seat Capacity</span>
                  </label>
                  <div className="transport-input-wrapper">
                    <input
                      type="number"
                      placeholder="30"
                      value={vehicleForm.capacity}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                      className="transport-input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="transport-form-group">
                <label className="transport-label">
                  <span>Assigned Driver</span>
                </label>
                <div className="transport-input-wrapper">
                  <select
                    className="transport-select-field"
                    value={vehicleForm.driverId}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverId: e.target.value })}
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="transport-select-chevron" />
                </div>
              </div>

              <div className="transport-form-group">
                <label className="transport-label">
                  <span>Status</span>
                </label>
                <div className="transport-input-wrapper">
                  <select
                    className="transport-select-field"
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Under Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown className="transport-select-chevron" />
                </div>
              </div>
            </div>

            <div className="transport-modal-footer">
              <span className="text-xs text-zinc-500 font-medium">Capacity: {vehicleForm.capacity || 0} seats</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setVehicleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-modal-submit"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingVehicle ? (
                    "Update Vehicle"
                  ) : (
                    "Add Vehicle"
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ROUTE MODAL (WITH DYNAMIC STOPS BUILDER) ── */}
      <Dialog open={routeModalOpen} onOpenChange={setRouteModalOpen}>
        <DialogContent className="transport-dialog-content sm:max-w-2xl">
          {/* Header */}
          <div className="transport-modal-header">
            <div className="transport-modal-icon-badge">
              <Route className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6">
              <DialogTitle className="transport-modal-title">
                {editingRoute ? "Edit Transport Route" : "Create Transport Route"}
              </DialogTitle>
              <DialogDescription className="transport-modal-desc">
                Define the route name, assign a vehicle, and configure transit stops with pickup timings.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSaveRoute}>
            {/* Modal Body */}
            <div className="transport-modal-body">
              {/* Route Name Field */}
              <div className="transport-form-group">
                <label className="transport-label">
                  <span>
                    Route Name <span className="transport-label-req">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    e.g. Campus Express or Sector line
                  </span>
                </label>
                <div className="transport-input-wrapper">
                  <MapPin className="transport-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Route A: DHA Phase 5"
                    value={routeForm.routeName}
                    onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                    required
                    className="transport-input-field has-icon"
                  />
                </div>
              </div>

              {/* Vehicle & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>Assign Vehicle (Bus)</span>
                  </label>
                  <div className="transport-input-wrapper">
                    <Bus className="transport-input-icon" />
                    <select
                      className="transport-select-field has-icon"
                      value={routeForm.vehicleId}
                      onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}
                    >
                      <option value="">-- No Vehicle Assigned --</option>
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.busNumber} {v.model ? `(${v.model})` : ""} - {v.plateNumber}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="transport-select-chevron" />
                  </div>
                </div>

                <div className="transport-form-group">
                  <label className="transport-label">
                    <span>Status</span>
                  </label>
                  <div className="transport-input-wrapper">
                    <select
                      className="transport-select-field"
                      value={routeForm.status}
                      onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="transport-select-chevron" />
                  </div>
                </div>
              </div>

              {/* Dynamic Stops Builder */}
              <div className="stops-builder-container">
                <div className="stops-builder-header">
                  <div className="flex items-center gap-2">
                    <span className="transport-label !mb-0">Route Stops & Timetable</span>
                    <span className="stops-badge-pill">
                      {routeForm.stops.length} {routeForm.stops.length === 1 ? "Stop" : "Stops"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStopToForm}
                    className="btn-add-stop-trigger"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Stop
                  </button>
                </div>

                {/* Column Headers */}
                <div className="stops-column-header-row">
                  <span className="text-center">#</span>
                  <span>Stop Name / Landmark</span>
                  <span className="text-center">Pickup (AM)</span>
                  <span className="text-center">Drop (PM)</span>
                  <span></span>
                </div>

                {/* Stops List */}
                <div className="stops-card-scroll">
                  {routeForm.stops.map((stop, idx) => (
                    <div key={idx} className="stop-row-card-item">
                      <div className="stop-sequence-num">{idx + 1}</div>
                      <input
                        type="text"
                        placeholder="Stop Name (e.g. Stop 1: Park Gate)"
                        value={stop.stopName}
                        onChange={(e) => handleStopChange(idx, "stopName", e.target.value)}
                        required
                        className="stop-inner-input"
                      />
                      <input
                        type="text"
                        placeholder="07:15 AM"
                        value={stop.pickupTime}
                        onChange={(e) => handleStopChange(idx, "pickupTime", e.target.value)}
                        className="stop-inner-input stop-inner-time"
                      />
                      <input
                        type="text"
                        placeholder="02:30 PM"
                        value={stop.dropTime}
                        onChange={(e) => handleStopChange(idx, "dropTime", e.target.value)}
                        className="stop-inner-input stop-inner-time"
                      />
                      <button
                        type="button"
                        className="stop-delete-action-btn"
                        onClick={() => handleRemoveStopFromForm(idx)}
                        title="Remove Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="stops-micro-hint">
                  <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>Enter transit stops and scheduled arrival timings for student route mapping.</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="transport-modal-footer">
              <div className="text-xs text-zinc-500 font-medium">
                {routeForm.stops.length} stops configured •{" "}
                <span
                  className={
                    routeForm.status === "Active"
                      ? "text-emerald-600 font-semibold dark:text-emerald-400"
                      : "text-zinc-500 font-semibold"
                  }
                >
                  {routeForm.status}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setRouteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-modal-submit"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingRoute ? (
                    "Update Route"
                  ) : (
                    "Create Route"
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN STUDENT MODAL ── */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="transport-dialog-content sm:max-w-lg">
          <div className="transport-modal-header">
            <div className="transport-modal-icon-badge">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6">
              <DialogTitle className="transport-modal-title">Assign Student to Transport</DialogTitle>
              <DialogDescription className="transport-modal-desc">
                Maps student to Route → Stop → Bus → Driver for dashboard visibility.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSaveAssignment}>
            <div className="transport-modal-body">
              <div className="transport-form-group">
                <label className="transport-label">
                  <span>
                    Select Student <span className="transport-label-req">*</span>
                  </span>
                </label>
                <div className="transport-input-wrapper">
                  <select
                    className="transport-select-field"
                    value={assignForm.studentId}
                    onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((stu) => (
                      <option key={stu.userId || stu._id} value={stu.userId || stu._id}>
                        {stu.name} ({stu.gradeOrClass || "Class 9"} {stu.section || ""})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="transport-select-chevron" />
                </div>
              </div>

              <div className="transport-form-group">
                <label className="transport-label">
                  <span>
                    Select Route <span className="transport-label-req">*</span>
                  </span>
                </label>
                <div className="transport-input-wrapper">
                  <select
                    className="transport-select-field"
                    value={assignForm.routeId}
                    onChange={(e) => handleAssignRouteChange(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Route --</option>
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.routeName} (Vehicle: {r.vehicleId?.busNumber || "None"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="transport-select-chevron" />
                </div>
              </div>

              <div className="transport-form-group">
                <label className="transport-label">
                  <span>
                    Designated Pickup / Drop Stop <span className="transport-label-req">*</span>
                  </span>
                </label>
                {(() => {
                  const currentRoute = routes.find((r) => r._id === assignForm.routeId);
                  const stops = currentRoute?.stops || [];
                  if (stops.length > 0) {
                    return (
                      <div className="transport-input-wrapper">
                        <select
                          className="transport-select-field"
                          value={assignForm.stopName}
                          onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Stop --</option>
                          {stops.map((s, idx) => (
                            <option key={s._id || idx} value={s.stopName}>
                              {s.stopName} (Pickup: {s.pickupTime || "07:15 AM"})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="transport-select-chevron" />
                      </div>
                    );
                  }
                  return (
                    <div className="transport-input-wrapper">
                      <input
                        type="text"
                        placeholder="e.g. Stop 2: Market"
                        value={assignForm.stopName}
                        onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })}
                        required
                        className="transport-input-field"
                      />
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="transport-modal-footer">
              <span className="text-xs text-zinc-500 font-medium">Link student to active transit pass</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-modal-submit"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Confirm Assignment"
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="transport-dialog-content sm:max-w-md">
          <div className="transport-modal-header !bg-red-50/50 dark:!bg-red-950/20 !border-red-100 dark:!border-red-900/30">
            <div className="transport-modal-icon-badge !bg-red-500 !text-white shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6">
              <DialogTitle className="transport-modal-title text-red-600 dark:text-red-400">
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="transport-modal-desc">
                This action cannot be undone and permanently removes this record.
              </DialogDescription>
            </div>
          </div>

          <div className="transport-modal-body py-5">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                {itemToDelete?.title}
              </strong>
              ?
            </p>
          </div>

          <div className="transport-modal-footer">
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setItemToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Record"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
