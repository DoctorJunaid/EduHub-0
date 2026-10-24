import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
  Calendar,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Navigation,
  User,
  Radio,
  FileText,
  Building2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Sun,
  Sunset,
  Shield,
  Gauge,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Spinner } from "@/components/ui/spinner";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { getMyTransportApi } from "@/api/transport.api";
import { useInstitution } from "@/context/InstitutionContext";
import "./StudentTransport.css";

export default function StudentTransport() {
  const { isSchool } = useInstitution();
  const currentUser = useSelector(selectCurrentUser);
  const student = useSelector(selectCurrentStudent);

  const targetId =
    student?.id || student?._id || currentUser?.id || currentUser?._id;

  // React Query fetch for student transport details
  const {
    data: transportResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["transport", "my-transport", targetId],
    queryFn: () => getMyTransportApi(targetId),
    enabled: Boolean(targetId),
    staleTime: 2 * 60 * 1000,
  });

  const transportData = transportResponse?.data || null;

  // Determine if transport is active
  const isEnrolled = Boolean(
    student?.usesTransport === true ||
      student?.transportEnrolled === true ||
      transportResponse?.usesTransport === true ||
      transportResponse?.assigned === true ||
      transportData?.usesTransport === true ||
      transportData?.assigned === true ||
      transportData?.route?.routeName
  );

  const route = transportData?.route || null;
  const vehicle = transportData?.vehicle || null;
  const driver = transportData?.driver || null;
  const assignedStop = transportData?.stop || null;

  if (isLoading && !transportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-3">
        <Spinner className="w-8 h-8 text-blue-600" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading assigned commute schedule & route details...
        </p>
      </div>
    );
  }

  // If student is not registered for transport / Self Commuter
  if (!isEnrolled) {
    return (
      <div className="transport-container">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 rounded-2xl shadow-xs">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center shadow-xs">
              <Bus className="w-8 h-8 text-zinc-400" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">
                Self Commuter · Campus Transport Not Assigned
              </h2>
              <p className="text-sm text-muted-foreground">
                Your student profile is currently registered as a Self Commuter.
                Campus bus service and scheduled route stops have not been
                assigned to your account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 text-left text-xs space-y-2 text-muted-foreground">
              <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Want to Enroll in School Bus Commute?
              </p>
              <p>
                If you or your guardian wish to enroll in the institutional bus
                commute program:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Contact your Campus Transport Officer or visit the Campus
                  Admin Office.
                </li>
                <li>
                  Submit a transport requisition ticket through Help & Support.
                </li>
                <li>
                  Upon verification and route seat availability, your designated
                  bus and stop will appear here immediately.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <Button asChild variant="default" className="gap-2">
                <Link to="/student/support?category=Transport">
                  <HelpCircle className="w-4 h-4" />
                  Contact Campus Administration
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="gap-2"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
                />
                Check Status
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const allStops = route?.stops && Array.isArray(route.stops) ? route.stops : [];
  const assignedStopName =
    assignedStop?.stopName ||
    student?.stopName ||
    student?.transportDetails?.stopName ||
    "Stop 2: Market";

  const pickupTime = assignedStop?.pickupTime || "07:15 AM";
  const dropTime = assignedStop?.dropTime || "02:30 PM";

  return (
    <div className="transport-container">
      {/* ── 1. Hero Header Card ── */}
      <div className="transport-hero-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="transport-hero-icon">
              <Bus className="w-6 h-6" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
                  {route?.routeName || "Route A: DHA Phase 5"}
                </h1>
                <div className="commuter-status-pill">
                  <span className="status-dot-pulse" />
                  <span>Enrolled Commuter</span>
                </div>
                {vehicle?.busNumber && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold text-xs"
                  >
                    {vehicle.busNumber}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap pt-0.5">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Designated Stop:{" "}
                  <strong className="text-foreground">{assignedStopName}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Pickup: {pickupTime}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Return: {dropTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            {driver?.phone && driver.phone !== "—" && (
              <a href={`tel:${driver.phone}`} className="call-driver-btn">
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 text-xs border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 rounded-xl gap-1.5 font-medium shadow-xs"
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Refresh commute details"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Segmented Tabs Navigation ── */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="inline-flex max-w-md w-full bg-zinc-100/90 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
          <TabsTrigger
            value="overview"
            className="flex-1 text-xs sm:text-sm font-semibold gap-2 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <Bus className="w-4 h-4 text-blue-600" />
            <span>Bus & Commute</span>
          </TabsTrigger>
          <TabsTrigger
            value="stops"
            className="flex-1 text-xs sm:text-sm font-semibold gap-2 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Stops & Timetable</span>
          </TabsTrigger>
          <TabsTrigger
            value="guidelines"
            className="flex-1 text-xs sm:text-sm font-semibold gap-2 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Rules & Safety</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Live Commute & Vehicle Overview ── */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          {/* 3 Modern Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Vehicle Card */}
            <div className="transport-kpi-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-blue">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Assigned Bus
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold py-0.5 px-2 text-blue-600 bg-blue-50/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
                  >
                    {vehicle?.status || "Active Fleet"}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                    {vehicle?.busNumber || "Bus #12"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vehicle?.model || "Toyota Coaster"} · {vehicle?.capacity || 32} Passenger Seats
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plate Registration:</span>
                    <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-foreground px-2 py-0.5 rounded-md text-xs">
                      {vehicle?.plateNumber || "ABC-123"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fleet Verification:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Campus Inspected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Pickup & Drop Stop Card */}
            <div className="transport-kpi-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-emerald">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Pickup & Drop Stop
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold py-0.5 px-2 text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                  >
                    Your Stop
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                    {assignedStopName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Assigned on {route?.routeName || "Route A: DHA Phase 5"}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block flex items-center justify-center gap-1">
                      <Sun className="w-3 h-3" /> Morning
                    </span>
                    <strong className="text-sm font-bold text-amber-900 dark:text-amber-200 block mt-0.5">
                      {pickupTime}
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block flex items-center justify-center gap-1">
                      <Sunset className="w-3 h-3" /> Afternoon
                    </span>
                    <strong className="text-sm font-bold text-blue-900 dark:text-blue-200 block mt-0.5">
                      {dropTime}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Driver & Contact Card */}
            <div className="transport-kpi-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-purple">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Assigned Driver
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold py-0.5 px-2 text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800"
                  >
                    Verified Driver
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
                    <span>{driver?.name || "Ali Ahmed"}</span>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    License: {driver?.licenseNumber || "LIC-98765-PK"}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {driver?.phone && driver.phone !== "—" ? (
                    <a
                      href={`tel:${driver.phone}`}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Direct Dial ({driver.phone})</span>
                    </a>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      Emergency contact managed via campus office
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Visual Journey Stepper ── */}
          <div className="transit-timeline-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  Commute Trajectory & Path Progression
                </span>
                <h4 className="text-sm font-bold text-foreground mt-0.5">
                  {route?.routeName || "Route A: DHA Phase 5"} Schedule
                </h4>
              </div>
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                Operates Monday – Friday
              </Badge>
            </div>

            {/* Step Track */}
            <div className="transit-steps-track">
              {/* Node 1: Origin */}
              <div className="transit-node">
                <div className="node-icon-wrapper">
                  <Navigation className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 space-y-0.5">
                  <strong className="text-xs font-bold text-foreground block">
                    {route?.startPoint || "Campus Gate 1"}
                  </strong>
                  <span className="text-[11px] text-muted-foreground block">
                    Route Departure · 06:45 AM
                  </span>
                </div>
              </div>

              {/* Connector Bar */}
              <div className="transit-connector-bar transit-connector-active" />

              {/* Node 2: Assigned Stop */}
              <div className="transit-node node-active">
                <div className="node-icon-wrapper">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 space-y-0.5">
                  <strong className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                    {assignedStopName}
                  </strong>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                    Pickup: {pickupTime} · Drop: {dropTime}
                  </span>
                  <Badge className="bg-emerald-600 text-white font-bold text-[9px] py-0 px-1.5 mt-0.5 shadow-xs">
                    Your Assigned Stop
                  </Badge>
                </div>
              </div>

              {/* Connector Bar */}
              <div className="transit-connector-bar transit-connector-completed" />

              {/* Node 3: Destination */}
              <div className="transit-node node-destination">
                <div className="node-icon-wrapper">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 space-y-0.5">
                  <strong className="text-xs font-bold text-foreground block">
                    {route?.endPoint || "DHA Phase 5 Commercial"}
                  </strong>
                  <span className="text-[11px] text-muted-foreground block">
                    Terminus Stop · 07:45 AM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: Stops & Timetable ── */}
        <TabsContent value="stops" className="space-y-4 outline-none">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {route?.routeName || "Route"} Complete Stops Sequence
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sequential scheduled route stops. Please be at your pickup point at least 5 minutes early.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-bold text-blue-700 bg-blue-50 border-blue-200 py-1 px-2.5">
                {allStops.length > 0 ? `${allStops.length} Registered Stops` : "3 Stops Active"}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-50/70">
                    <TableHead className="w-16 font-bold text-xs">#</TableHead>
                    <TableHead className="font-bold text-xs">Stop Name & Landmark</TableHead>
                    <TableHead className="font-bold text-xs">Morning Pickup</TableHead>
                    <TableHead className="font-bold text-xs">Afternoon Drop-off</TableHead>
                    <TableHead className="text-right font-bold text-xs">Your Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(allStops.length > 0
                    ? allStops
                    : [
                        { order: 1, stopName: "Stop 1: Main Boulevard", pickupTime: "07:00 AM", dropTime: "02:15 PM" },
                        { order: 2, stopName: assignedStopName, pickupTime: pickupTime, dropTime: dropTime },
                        { order: 3, stopName: "Stop 3: Commercial Zone", pickupTime: "07:30 AM", dropTime: "02:45 PM" },
                      ]
                  ).map((stopItem, index) => {
                    const isTarget =
                      assignedStopName &&
                      stopItem.stopName?.trim().toLowerCase() ===
                        assignedStopName.trim().toLowerCase();

                    return (
                      <TableRow
                        key={stopItem._id || index}
                        className={
                          isTarget
                            ? "bg-emerald-50/80 dark:bg-emerald-950/30 font-medium hover:bg-emerald-50/90"
                            : "hover:bg-zinc-50/60 transition-colors"
                        }
                      >
                        <TableCell className="text-xs font-mono font-bold text-muted-foreground">
                          {stopItem.order || index + 1}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isTarget
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <span
                              className={
                                isTarget
                                  ? "font-bold text-emerald-950 dark:text-emerald-100 text-sm"
                                  : "text-foreground font-medium"
                              }
                            >
                              {stopItem.stopName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            {stopItem.pickupTime || "07:15 AM"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Sunset className="w-3.5 h-3.5 text-blue-500" />
                            {stopItem.dropTime || "02:30 PM"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {isTarget ? (
                            <Badge className="bg-emerald-600 text-white font-bold text-xs py-0.5 px-2.5 shadow-xs">
                              Your Assigned Stop
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              En-route
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── TAB 3: Commute Rules & Safety Guidelines ── */}
        <TabsContent value="guidelines" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Punctuality */}
            <div className="rule-card">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-blue">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Punctuality & Morning Boarding
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800">
                    Arrival Policy
                  </Badge>
                </div>

                <div className="rule-highlight-box">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Arrive at least 5 minutes prior to scheduled departure</span>
                </div>

                <div className="rule-points-list">
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Buses adhere to strict morning sync schedules and cannot hold departures for unannounced delays.</span>
                  </div>
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Morning boarding at {assignedStopName} departs promptly at {pickupTime}.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Student ID Card */}
            <div className="rule-card">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-emerald">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Student ID Card Mandate
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                    Security Mandate
                  </Badge>
                </div>

                <div className="rule-highlight-box rule-highlight-emerald">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Physical or Digital ID Card required upon boarding</span>
                </div>

                <div className="rule-points-list">
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Present your Institutional Student ID Card to the bus conductor or driver for identity check.</span>
                  </div>
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Unverified commuters are restricted from boarding in compliance with campus security regulations.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: On-Board Conduct */}
            <div className="rule-card">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-purple">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        On-Board Conduct & Safety
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800">
                    Safety First
                  </Badge>
                </div>

                <div className="rule-highlight-box rule-highlight-purple">
                  <AlertCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Remain seated with safety belts fastened at all times</span>
                </div>

                <div className="rule-points-list">
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Extending hands, heads, or littering out of windows is strictly prohibited while in transit.</span>
                  </div>
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Maintain respectful, quiet, and disciplined conduct with fellow commuters and drivers.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Stop Changes */}
            <div className="rule-card">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="kpi-icon-badge kpi-icon-blue">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Stop or Address Adjustments
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                    24h Advance Notice
                  </Badge>
                </div>

                <div className="rule-highlight-box rule-highlight-amber">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Written guardian authorization required for route change</span>
                </div>

                <div className="rule-points-list">
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Any temporary or permanent stop adjustments must be approved 24 hours in advance by the Admin Office.</span>
                  </div>
                  <div className="rule-point-item">
                    <span className="rule-point-bullet" />
                    <span>Drivers are not authorized to make unapproved stop deviations without administrative sign-off.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Support & Emergency Helpline Banner */}
          <div className="transport-support-banner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Need Commute Assistance or Route Help?
                </h4>
              </div>
              <p className="text-xs text-muted-foreground pl-9">
                Campus Transport Supervisor helpline is active during morning and afternoon transit hours.
              </p>
              <div className="flex items-center gap-3 text-xs font-medium text-foreground pl-9 pt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Phone className="w-3 h-3" /> Helpline: +92 (51) 8899-234
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Mon–Fri: 06:30 AM – 05:00 PM</span>
              </div>
            </div>

            <Link
              to="/student/support?category=Transport"
              className="support-btn-primary shrink-0 self-start sm:self-center"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Open Support Ticket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
