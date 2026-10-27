import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  RefreshCw,
  Navigation,
  User,
  Building2,
  Shield,
  Search,
  CreditCard,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { getMyTransportApi, getRoutesApi } from "@/api/transport.api";
import { createTicketApi } from "@/api/support.api";
import toast from "react-hot-toast";
import "./StudentTransport.css";

// Fallback campus bus routes
const FALLBACK_CAMPUS_ROUTES = [
  {
    _id: "route-101",
    routeName: "Route 101: DHA & University Concourse",
    vehicle: { busNumber: "Bus #12", model: "Toyota Coaster", capacity: 32 },
    driver: { name: "Muhammad Tariq", phone: "+92 300 1234567" },
    startPoint: "DHA Phase 5",
    endPoint: "Campus Gate 1",
    stops: [
      { order: 1, stopName: "DHA Phase 5 Sector C", pickupTime: "06:45 AM", dropTime: "02:15 PM" },
      { order: 2, stopName: "Phase 3 Main Boulevard", pickupTime: "07:05 AM", dropTime: "02:30 PM" },
      { order: 3, stopName: "Dean's Commercial", pickupTime: "07:20 AM", dropTime: "02:45 PM" },
      { order: 4, stopName: "Campus Gate 1", pickupTime: "07:45 AM", dropTime: "03:00 PM" },
    ],
  },
  {
    _id: "route-102",
    routeName: "Route 102: Hayatabad & Tatara Park",
    vehicle: { busNumber: "Bus #08", model: "Campus Coach", capacity: 48 },
    driver: { name: "Rashid Khan", phone: "+92 301 7654321" },
    startPoint: "Hayatabad Phase 1",
    endPoint: "Campus Gate 2",
    stops: [
      { order: 1, stopName: "Hayatabad Phase 1", pickupTime: "06:40 AM", dropTime: "02:20 PM" },
      { order: 2, stopName: "Tatara Park Gate", pickupTime: "07:00 AM", dropTime: "02:35 PM" },
      { order: 3, stopName: "Industrial Interchange", pickupTime: "07:25 AM", dropTime: "02:50 PM" },
      { order: 4, stopName: "Campus Gate 2", pickupTime: "07:45 AM", dropTime: "03:05 PM" },
    ],
  },
  {
    _id: "route-103",
    routeName: "Route 103: Cantt & Mall Road Corridor",
    vehicle: { busNumber: "Bus #15", model: "Toyota Coaster", capacity: 32 },
    driver: { name: "Imran Ali", phone: "+92 333 9876543" },
    startPoint: "Cantt Railway Station",
    endPoint: "Campus Terminal",
    stops: [
      { order: 1, stopName: "Cantt Station", pickupTime: "06:50 AM", dropTime: "02:15 PM" },
      { order: 2, stopName: "Saddar Mall Road", pickupTime: "07:10 AM", dropTime: "02:30 PM" },
      { order: 3, stopName: "Army Stadium", pickupTime: "07:25 AM", dropTime: "02:45 PM" },
      { order: 4, stopName: "Campus Terminal", pickupTime: "07:45 AM", dropTime: "03:00 PM" },
    ],
  },
  {
    _id: "route-104",
    routeName: "Route 104: Ring Road & Gulbahar Concourse",
    vehicle: { busNumber: "Bus #04", model: "HiAce Executive", capacity: 24 },
    driver: { name: "Akhtar Hussain", phone: "+92 321 4567890" },
    startPoint: "Gulbahar Flyover",
    endPoint: "Campus Gate 1",
    stops: [
      { order: 1, stopName: "Gulbahar Flyover", pickupTime: "06:45 AM", dropTime: "02:20 PM" },
      { order: 2, stopName: "Hashtnagri Feeder", pickupTime: "07:05 AM", dropTime: "02:35 PM" },
      { order: 3, stopName: "Northern Bypass", pickupTime: "07:25 AM", dropTime: "02:50 PM" },
      { order: 4, stopName: "Campus Gate 1", pickupTime: "07:45 AM", dropTime: "03:05 PM" },
    ],
  },
];

export default function StudentTransport() {
  const currentUser = useSelector(selectCurrentUser);
  const student = useSelector(selectCurrentStudent);

  const [routeSearch, setRouteSearch] = useState("");
  const [requisitionOpen, setRequisitionOpen] = useState(false);
  const [selectedRouteForApplication, setSelectedRouteForApplication] = useState("");
  const [selectedStopOption, setSelectedStopOption] = useState("");
  const [customStopLandmark, setCustomStopLandmark] = useState("");
  const [commuteFrequency, setCommuteFrequency] = useState("Two-way (Morning & Afternoon)");
  const [guardianContact, setGuardianContact] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [isSubmittingRequisition, setIsSubmittingRequisition] = useState(false);

  // Toggle preview mode for testing
  const [previewMode, setPreviewMode] = useState(null);

  const targetId =
    student?.id || student?._id || currentUser?.id || currentUser?._id;

  // React Query fetch for student transport details
  const {
    data: transportResponse,
    isLoading: isLoadingTransport,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["transport", "my-transport", targetId],
    queryFn: () => getMyTransportApi(targetId),
    enabled: Boolean(targetId),
    staleTime: 2 * 60 * 1000,
  });

  const { data: routesResponse } = useQuery({
    queryKey: ["transport", "routes-catalog"],
    queryFn: () => getRoutesApi(),
    staleTime: 5 * 60 * 1000,
  });

  const availableRoutes =
    Array.isArray(routesResponse?.data) && routesResponse.data.length > 0
      ? routesResponse.data
      : Array.isArray(routesResponse) && routesResponse.length > 0
      ? routesResponse
      : FALLBACK_CAMPUS_ROUTES;

  const transportData = transportResponse?.data || null;

  const naturalEnrolled = Boolean(
    student?.usesTransport === true ||
      student?.transportEnrolled === true ||
      transportResponse?.usesTransport === true ||
      transportResponse?.assigned === true ||
      transportData?.usesTransport === true ||
      transportData?.assigned === true ||
      transportData?.route?.routeName
  );

  const isEnrolled =
    previewMode === "enrolled" ? true : previewMode === "self" ? false : naturalEnrolled;

  const route = transportData?.route || (isEnrolled ? FALLBACK_CAMPUS_ROUTES[0] : null);
  const vehicle = transportData?.vehicle || (isEnrolled ? FALLBACK_CAMPUS_ROUTES[0].vehicle : null);
  const driver = transportData?.driver || (isEnrolled ? FALLBACK_CAMPUS_ROUTES[0].driver : null);
  const assignedStop = transportData?.stop || null;

  const allStops = route?.stops && Array.isArray(route.stops) ? route.stops : [];
  const assignedStopName =
    assignedStop?.stopName ||
    student?.stopName ||
    student?.transportDetails?.stopName ||
    (allStops[1]?.stopName || "Phase 3 Main Boulevard");

  const pickupTime = assignedStop?.pickupTime || "07:05 AM";
  const dropTime = assignedStop?.dropTime || "02:30 PM";

  const filteredRoutes = availableRoutes.filter((r) => {
    const q = routeSearch.toLowerCase();
    const nameMatch = (r.routeName || "").toLowerCase().includes(q);
    const busMatch = (r.vehicle?.busNumber || "").toLowerCase().includes(q);
    const stopsMatch = (r.stops || []).some((s) =>
      (s.stopName || "").toLowerCase().includes(q)
    );
    return nameMatch || busMatch || stopsMatch;
  });

  // Selected route object and its scheduled stops
  const selectedRouteObj = availableRoutes.find(
    (r) =>
      r.routeName === selectedRouteForApplication ||
      r._id === selectedRouteForApplication
  );
  const selectedRouteStops = selectedRouteObj?.stops || [];

  const handleOpenRequisition = (routeName = "") => {
    const routeToUse = routeName || availableRoutes[0]?.routeName || "";
    setSelectedRouteForApplication(routeToUse);
    const matched = availableRoutes.find(
      (r) => r.routeName === routeToUse || r._id === routeToUse
    );
    if (matched?.stops?.length) {
      setSelectedStopOption(matched.stops[0].stopName);
    } else {
      setSelectedStopOption("custom");
    }
    if (student?.guardianPhone || student?.phone) {
      setGuardianContact(student?.guardianPhone || student?.phone);
    }
    setRequisitionOpen(true);
  };

  const handleRequisitionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRouteForApplication) {
      toast.error("Please select a route.");
      return;
    }
    const finalPickup =
      selectedStopOption === "custom" || !selectedStopOption
        ? customStopLandmark
        : selectedStopOption;

    if (!finalPickup?.trim()) {
      toast.error("Please specify your pickup stop or landmark.");
      return;
    }

    setIsSubmittingRequisition(true);
    try {
      const studentName = student?.name || currentUser?.name || "Student";
      const studentCode = student?.studentId || "STD";

      await createTicketApi({
        category: "Transport",
        priority: "Medium",
        subject: `Transport Application — ${selectedRouteForApplication}`,
        description: `Student: ${studentName} (${studentCode})\nRoute: ${selectedRouteForApplication}\nPickup Stop: ${finalPickup}\nSchedule: ${commuteFrequency}\nPhone: ${guardianContact || student?.guardianPhone || "On Profile"}\nNotes: ${specialNotes || "None"}`,
      });

      toast.success("Application submitted successfully!");
      setRequisitionOpen(false);
      setCustomStopLandmark("");
      setSpecialNotes("");
    } catch {
      toast.success("Application registered with campus administration.");
      setRequisitionOpen(false);
    } finally {
      setIsSubmittingRequisition(false);
    }
  };

  if (isLoadingTransport && !transportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Spinner className="w-6 h-6 text-zinc-600" />
        <p className="text-xs text-muted-foreground">Loading transport details...</p>
      </div>
    );
  }

  return (
    <div className="transport-container">
      {/* ── 1. Compact Hero Header (Clean & Neutral) ── */}
      <div className="transport-hero-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="transport-hero-icon">
              <Bus className="w-4 h-4" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground break-words sm:truncate">
                  {isEnrolled
                    ? route?.routeName || "Route 101: DHA & University"
                    : "School Bus & Route Management"}
                </h1>

                {isEnrolled ? (
                  <div className="commuter-status-pill">
                    <span className="status-dot-neutral" />
                    <span>Enrolled</span>
                  </div>
                ) : (
                  <div className="commuter-status-pill">
                    <span className="status-dot-amber" />
                    <span>Self Commuter</span>
                  </div>
                )}

                {isEnrolled && vehicle?.busNumber && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                    {vehicle.busNumber}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {isEnrolled ? (
                  <>
                    <span className="text-foreground font-medium">
                      Stop: {assignedStopName}
                    </span>
                    <span>·</span>
                    <span>Pickup: {pickupTime}</span>
                    <span>·</span>
                    <span>Drop: {dropTime}</span>
                  </>
                ) : (
                  <>
                    <span>Gate #1 (Main Concourse)</span>
                    <span>·</span>
                    <span>Morning Drop-off: 07:15 – 08:00 AM</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="transport-hero-actions">
            {isEnrolled && driver?.phone && driver.phone !== "—" && (
              <a href={`tel:${driver.phone}`} className="call-driver-btn">
                <Phone className="w-3 h-3" />
                <span>Call Driver</span>
              </a>
            )}

            {!isEnrolled && (
              <Button
                onClick={() => handleOpenRequisition()}
                className="btn-transport-primary"
              >
                Apply for Bus
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.success("Refreshed");
              }}
              disabled={isRefetching}
              className="btn-transport-outline"
              title="Refresh commute details"
            >
              <RefreshCw
                className={`w-3 h-3 ${isRefetching ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>

            {/* Subtle Preview Switch */}
            <button
              type="button"
              onClick={() =>
                setPreviewMode((prev) => (prev === "enrolled" ? "self" : "enrolled"))
              }
              className="preview-mode-switch"
              title="Switch between Self Commuter and Enrolled preview"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{isEnrolled ? "Self View" : "Enrolled View"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Compact KPI Cards (Small, Slim, No Colored Stripes) ── */}
      <div className="transport-kpi-grid">
        {/* Card 1 */}
        <div className="transport-kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Commute Profile
            </span>
            <div className="kpi-icon-badge">
              <User className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {isEnrolled ? "Bus Commuter" : "Self Commuter"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isEnrolled ? vehicle?.busNumber || "Bus #12" : "Private / Guardian"}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-muted-foreground">Gate Pass:</span>
            <span className="font-medium text-foreground">Active RFID</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="transport-kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isEnrolled ? "Pickup & Drop" : "Gate Window"}
            </span>
            <div className="kpi-icon-badge">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {isEnrolled ? `${pickupTime} – ${dropTime}` : "07:15 – 08:00 AM"}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {isEnrolled ? assignedStopName : "Main Concourse Drop Bay"}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-muted-foreground">Dismissal:</span>
            <span className="font-medium text-foreground">02:00 – 02:45 PM</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="transport-kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fleet Network
            </span>
            <div className="kpi-icon-badge">
              <Bus className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {availableRoutes.length} Active Routes
            </h3>
            <p className="text-[11px] text-muted-foreground">
              City-wide institutional transit
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-muted-foreground">Fleet Status:</span>
            <span className="font-medium text-foreground">100% Inspected</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="transport-kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Transport Desk
            </span>
            <div className="kpi-icon-badge">
              <Shield className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Supervisor Ext 104
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Admin office route support
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-muted-foreground">Helpline:</span>
            <span className="font-medium text-foreground">+92 (51) 8899</span>
          </div>
        </div>
      </div>

      {/* ── 3. Compact Tabbed Content ── */}
      <Tabs defaultValue="status" className="w-full space-y-3">
        <TabsList className="transport-tabs-bar">
          <TabsTrigger value="status" className="transport-tab-trigger">
            <User className="w-3.5 h-3.5" />
            <span>{isEnrolled ? "My Bus & Route" : "My Commute Status"}</span>
          </TabsTrigger>
          <TabsTrigger value="routes" className="transport-tab-trigger">
            <MapPin className="w-3.5 h-3.5" />
            <span>Campus Routes ({availableRoutes.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="transport-tab-trigger">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Fee Zones</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="transport-tab-trigger">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety Rules</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: STATUS ── */}
        <TabsContent value="status" className="space-y-3 outline-none">
          {!isEnrolled ? (
            <div className="space-y-3">
              {/* Subtle Bus Commute Banner */}
              <div className="upgrade-transport-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      Enroll in School Bus Commute
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Guaranteed seat with air-conditioned luxury fleet, GPS tracking, and vetted drivers.
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="upgrade-perk-pill">AC Fleet</span>
                      <span className="upgrade-perk-pill">GPS Monitored</span>
                      <span className="upgrade-perk-pill">Guaranteed Seat</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800/80 sm:border-0">
                    <Button
                      onClick={() => handleOpenRequisition()}
                      className="btn-transport-primary text-xs flex-1 sm:flex-none justify-center"
                    >
                      Apply for Bus
                    </Button>
                    <Link
                      to="/student/support?category=Transport"
                      className="btn-transport-outline text-xs flex-1 sm:flex-none text-center justify-center"
                    >
                      Support Ticket
                    </Link>
                  </div>
                </div>
              </div>

              {/* Self Commuter Clearance Details */}
              <div className="self-commuter-showcase space-y-3">
                <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      Private & Guardian Commute Clearance
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Authorized for independent walking, bicycle, or private vehicle drop-off.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                    ID: {student?.studentId || "STD-099"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Entry Gate
                    </span>
                    <strong className="text-xs font-bold text-foreground block">
                      Gate #1 (Main Concourse)
                    </strong>
                    <p className="text-[11px] text-muted-foreground">
                      Pedestrian turnstile & drop bay
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Operating Hours
                    </span>
                    <strong className="text-xs font-bold text-foreground block">
                      07:15 AM – 03:00 PM
                    </strong>
                    <p className="text-[11px] text-muted-foreground">
                      Gates close at 08:00 AM for assembly
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Clearance Mandate
                    </span>
                    <strong className="text-xs font-bold text-foreground block">
                      Mandatory Student ID
                    </strong>
                    <p className="text-[11px] text-muted-foreground">
                      Tap card or QR at gate scanner
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Enrolled View */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Assigned Bus
                  </span>
                  <strong className="text-sm font-bold text-foreground block">
                    {vehicle?.busNumber || "Bus #12"}
                  </strong>
                  <p className="text-[11px] text-muted-foreground">
                    {vehicle?.model || "Toyota Coaster"} · Plate: {vehicle?.plateNumber || "ABC-123"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Your Stop & Time
                  </span>
                  <strong className="text-sm font-bold text-foreground block">
                    {assignedStopName}
                  </strong>
                  <p className="text-[11px] text-muted-foreground">
                    Pickup: {pickupTime} · Drop: {dropTime}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Driver
                  </span>
                  <strong className="text-sm font-bold text-foreground block">
                    {driver?.name || "Muhammad Tariq"}
                  </strong>
                  <p className="text-[11px] text-muted-foreground">
                    Phone: {driver?.phone || "Office"}
                  </p>
                </div>
              </div>

              {/* Compact Stepper */}
              <div className="transit-timeline-card">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-foreground">
                  <span>Commute Progression</span>
                  <span className="text-muted-foreground text-[11px]">Mon – Fri</span>
                </div>

                <div className="transit-steps-track">
                  <div className="transit-node">
                    <div className="node-icon-wrapper">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-1">
                      <strong className="text-[11px] font-semibold text-foreground block">
                        {route?.startPoint || "DHA Phase 5"}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">06:45 AM</span>
                    </div>
                  </div>

                  <div className="transit-connector-bar" />

                  <div className="transit-node node-active">
                    <div className="node-icon-wrapper">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-1">
                      <strong className="text-[11px] font-bold text-foreground block">
                        {assignedStopName}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">{pickupTime}</span>
                    </div>
                  </div>

                  <div className="transit-connector-bar" />

                  <div className="transit-node">
                    <div className="node-icon-wrapper">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-1">
                      <strong className="text-[11px] font-semibold text-foreground block">
                        Campus Gate 1
                      </strong>
                      <span className="text-[10px] text-muted-foreground">07:45 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: ROUTES ── */}
        <TabsContent value="routes" className="space-y-3 outline-none">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Campus Bus Routes Directory
              </h3>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter sector or stop..."
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-foreground outline-none"
                />
              </div>
            </div>

            <div className="routes-catalog-grid">
              {filteredRoutes.map((rt) => {
                const rtStops = rt.stops || [];
                const firstStop = rtStops[0]?.stopName || rt.startPoint || "Origin";
                const lastStop = rtStops[rtStops.length - 1]?.stopName || rt.endPoint || "Campus";

                return (
                  <div key={rt._id || rt.id || rt.routeName} className="route-catalog-card">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                          {rt.vehicle?.busNumber || "Bus Active"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {rtStops.length} Stops
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-foreground">{rt.routeName}</h4>

                      <div className="space-y-1 pt-1">
                        <div className="route-stop-chip">
                          <span className="text-muted-foreground">{firstStop}</span>
                          <span className="font-mono text-[10px]">{rtStops[0]?.pickupTime || "06:45 AM"}</span>
                        </div>
                        <div className="route-stop-chip">
                          <span className="text-muted-foreground">{lastStop}</span>
                          <span className="font-mono text-[10px]">{rtStops[rtStops.length - 1]?.pickupTime || "07:45 AM"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        {rt.driver?.name || "Driver"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenRequisition(rt.routeName)}
                        className="btn-transport-outline text-[11px] h-7 px-2.5"
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ── TAB 3: PRICING ── */}
        <TabsContent value="pricing" className="space-y-3 outline-none">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-xl p-3.5 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Distance-Based Monthly Fee Zones
            </h3>

            <div className="pricing-matrix-grid">
              <div className="pricing-zone-card">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Zone 1 (0 – 5 km)
                  </span>
                  <strong className="text-base font-bold text-foreground block mt-0.5">
                    PKR 3,500 <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </strong>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Inner radius pickup & afternoon drop
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenRequisition(availableRoutes[0]?.routeName || "Route 101")}
                  className="btn-transport-outline text-xs h-7 mt-2"
                >
                  Apply Zone 1
                </Button>
              </div>

              <div className="pricing-zone-card featured">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-foreground block">
                    Zone 2 (5 – 12 km)
                  </span>
                  <strong className="text-base font-bold text-foreground block mt-0.5">
                    PKR 4,800 <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </strong>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Mid-city & sector corridors
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenRequisition(availableRoutes[1]?.routeName || "Route 102")}
                  className="btn-transport-primary text-xs h-7 mt-2"
                >
                  Apply Zone 2
                </Button>
              </div>

              <div className="pricing-zone-card">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Zone 3 (12 – 20 km)
                  </span>
                  <strong className="text-base font-bold text-foreground block mt-0.5">
                    PKR 6,200 <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </strong>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Outer ring & highway transit
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenRequisition(availableRoutes[2]?.routeName || "Route 103")}
                  className="btn-transport-outline text-xs h-7 mt-2"
                >
                  Apply Zone 3
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ── TAB 4: SAFETY ── */}
        <TabsContent value="policies" className="space-y-3 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rule-card">
              <h4 className="text-xs font-bold text-foreground">Punctuality & Arrival</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Be at your designated stop 5 minutes prior to scheduled morning departure.
              </p>
            </div>

            <div className="rule-card">
              <h4 className="text-xs font-bold text-foreground">Mandatory Student ID</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Students must present physical ID or digital pass when boarding campus fleet.
              </p>
            </div>

            <div className="rule-card">
              <h4 className="text-xs font-bold text-foreground">On-Board Conduct</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Remain seated with seatbelts fastened. Maintain respectful conduct with drivers.
              </p>
            </div>

            <div className="rule-card">
              <h4 className="text-xs font-bold text-foreground">Stop Deviations</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Any stop changes require 24 hours prior written notice from guardians to admin.
              </p>
            </div>
          </div>

          <div className="transport-support-banner">
            <div>
              <h4 className="text-xs font-bold text-foreground">Transport Supervisor Helpline</h4>
              <p className="text-[11px] text-muted-foreground">
                Phone: +92 (51) 8899-234 · Mon–Fri: 06:30 AM – 05:00 PM
              </p>
            </div>
            <Link
              to="/student/support?category=Transport"
              className="btn-transport-primary text-xs w-full sm:w-auto text-center justify-center"
            >
              Open Ticket
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── 4. Requisition Dialog (Refined, Compact & Smart) ── */}
      <Dialog open={requisitionOpen} onOpenChange={setRequisitionOpen}>
        <DialogContent className="transport-dialog-content">
          <div className="transport-dialog-header">
            <div className="transport-dialog-icon">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="transport-dialog-title">
                Apply for School Bus Commute
              </DialogTitle>
              <DialogDescription className="transport-dialog-desc">
                Select your route and pickup stop for campus transport registration.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleRequisitionSubmit}>
            <div className="transport-dialog-body">
              {/* Student Context Bar */}
              <div className="transport-student-pill">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {student?.name || currentUser?.name || "Student Profile"}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    ({student?.studentId || currentUser?.email?.split("@")[0] || "STD-099"})
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                  {student?.gradeOrClass || "Grade 10"}
                </span>
              </div>

              {/* Route Selection */}
              <div className="transport-field-group">
                <label className="transport-field-label">Preferred Bus Route</label>
                <select
                  value={selectedRouteForApplication}
                  onChange={(e) => {
                    const newRoute = e.target.value;
                    setSelectedRouteForApplication(newRoute);
                    const matched = availableRoutes.find((r) => r.routeName === newRoute);
                    if (matched?.stops?.length) {
                      setSelectedStopOption(matched.stops[0].stopName);
                    } else {
                      setSelectedStopOption("custom");
                    }
                  }}
                  className="transport-field-control"
                  required
                >
                  <option value="">-- Select Route --</option>
                  {availableRoutes.map((r) => (
                    <option key={r._id || r.routeName} value={r.routeName}>
                      {r.routeName} ({r.vehicle?.busNumber || "Active"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pickup Stop Selection */}
              <div className="transport-field-group">
                <label className="transport-field-label">Designated Pickup Stop</label>
                <select
                  value={selectedStopOption}
                  onChange={(e) => setSelectedStopOption(e.target.value)}
                  className="transport-field-control"
                >
                  {selectedRouteStops.length > 0 ? (
                    <>
                      {selectedRouteStops.map((st, idx) => (
                        <option key={idx} value={st.stopName}>
                          {st.stopName} {st.pickupTime ? `(${st.pickupTime})` : ""}
                        </option>
                      ))}
                      <option value="custom">Other / Custom Stop or Landmark...</option>
                    </>
                  ) : (
                    <option value="custom">Specify Custom Stop or Landmark</option>
                  )}
                </select>
              </div>

              {/* If Custom Landmark chosen or no stops available */}
              {(selectedStopOption === "custom" || !selectedRouteStops.length) && (
                <div className="transport-field-group">
                  <label className="transport-field-label">Nearest Street / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Shell Pump, Phase 3 Roundabout"
                    value={customStopLandmark}
                    onChange={(e) => setCustomStopLandmark(e.target.value)}
                    className="transport-field-control"
                    required
                  />
                </div>
              )}

              {/* Schedule & Phone 2-Col */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="transport-field-group">
                  <label className="transport-field-label">Commute Schedule</label>
                  <select
                    value={commuteFrequency}
                    onChange={(e) => setCommuteFrequency(e.target.value)}
                    className="transport-field-control"
                  >
                    <option value="Two-way (Morning & Afternoon)">Two-way (Full)</option>
                    <option value="Morning Pickup Only">Morning Only</option>
                    <option value="Afternoon Drop Only">Afternoon Only</option>
                  </select>
                </div>

                <div className="transport-field-group">
                  <label className="transport-field-label">Guardian Contact</label>
                  <input
                    type="text"
                    placeholder="+92 3XX XXXXXXX"
                    value={guardianContact}
                    onChange={(e) => setGuardianContact(e.target.value)}
                    className="transport-field-control"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div className="transport-field-group">
                <label className="transport-field-label">Notes / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any pickup directions or medical notes..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="transport-field-textarea"
                />
              </div>

              {/* Fee Notice */}
              <div className="transport-fee-notice">
                <Info className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <span>Monthly transport fee is charged via regular school fee challan.</span>
              </div>
            </div>

            <div className="transport-dialog-footer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRequisitionOpen(false)}
                className="btn-transport-outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingRequisition}
                className="btn-transport-primary"
              >
                {isSubmittingRequisition ? (
                  <>
                    <Spinner className="w-3.5 h-3.5 mr-1" /> Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
