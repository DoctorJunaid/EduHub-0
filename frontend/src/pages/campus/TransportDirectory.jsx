import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bus,
  MapPin,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DataPagination from "@/components/shared/DataPagination";
import { usePaginationParams } from "@/hooks/usePaginationParams";
import toast from "react-hot-toast";
import axiosInstance from "@/api/axiosInstance";
import { getRoutesApi } from "@/api/transport.api";
import { Link } from "react-router-dom";
import "./TransportDirectory.css";

export default function TransportDirectory() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });

  // Edit Dialog State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editRouteId, setEditRouteId] = useState("");
  const [editStopName, setEditStopName] = useState("");

  // 1. Fetch Transport Students using React Query
  const {
    data: students = [],
    isLoading: isStudentsLoading,
    isRefetching: isStudentsRefetching,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["transport", "students", "enrolled"],
    queryFn: async () => {
      const res = await axiosInstance.get("/transport/students", {
        params: { usesTransport: true },
      });
      const list = res.data?.data || res.data || [];
      return list.filter((s) => s.usesTransport === true || s.transportEnrolled === true);
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch Available Transit Routes using React Query
  const { data: routes = [] } = useQuery({
    queryKey: ["transport", "routes"],
    queryFn: async () => {
      const res = await getRoutesApi();
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // 3. Mutation: Update / Assign Student Transport
  const updateTransportMutation = useMutation({
    mutationFn: async ({ studentId, usesTransport, routeId, stopName }) => {
      const res = await axiosInstance.put(
        `/campus-admin/students/${studentId}/transport`,
        {
          usesTransport,
          routeId,
          stopName,
        }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transport", "students"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      if (variables.usesTransport) {
        toast.success("Student transit details updated successfully!");
      } else {
        toast.success("Student removed from transport successfully.");
      }
      setEditingStudent(null);
    },
    onError: (err) => {
      console.error("Transport mutation error:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to update student transport"
      );
    },
  });

  // Handle Edit Click
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditRouteId(student.routeId || "");
    setEditStopName(student.stopName || "");
  };

  // Handle Remove Click
  const handleRemove = (student) => {
    const studentName = student.name || "Student";
    if (
      window.confirm(
        `Are you sure you want to remove transport for "${studentName}"? This will clear their bus and stop assignment.`
      )
    ) {
      updateTransportMutation.mutate({
        studentId: student.userId || student._id,
        usesTransport: false,
        routeId: null,
        stopName: "",
      });
    }
  };

  // Handle Save Edit Dialog
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editRouteId) {
      toast.error("Please select a transit route.");
      return;
    }

    updateTransportMutation.mutate({
      studentId: editingStudent.userId || editingStudent._id,
      usesTransport: true,
      routeId: editRouteId,
      stopName: editStopName,
    });
  };

  // Stops for currently selected route in Edit dialog
  const editRouteStops = useMemo(() => {
    if (!editRouteId) return [];
    const r = routes.find((rt) => rt._id === editRouteId);
    return r?.stops || [];
  }, [routes, editRouteId]);

  // KPI Metrics Calculation
  const totalCommuters = students.length;
  const assignedCommuters = useMemo(
    () => students.filter((s) => Boolean(s.routeId && s.routeName)).length,
    [students]
  );
  const unassignedCommuters = useMemo(
    () => students.filter((s) => !s.routeId || !s.routeName).length,
    [students]
  );
  const activeRoutesCount = routes.length;

  // Filter students by search text, route, and assignment status
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.gradeOrClass?.toLowerCase().includes(q) ||
        s.section?.toLowerCase().includes(q) ||
        s.routeName?.toLowerCase().includes(q) ||
        s.stopName?.toLowerCase().includes(q) ||
        s.vehicleNumber?.toLowerCase().includes(q);

      const matchesRoute =
        routeFilter === "all" ||
        String(s.routeId) === String(routeFilter);

      const hasRoute = Boolean(s.routeId && s.routeName);
      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && hasRoute) ||
        (assignmentFilter === "unassigned" && !hasRoute);

      return matchesSearch && matchesRoute && matchesAssignment;
    });
  }, [students, searchQuery, routeFilter, assignmentFilter]);

  // Pagination Slice
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  return (
    <div className="campus-tab-page transport-directory-page">
      {/* ── 1. Top Enterprise Header ── */}
      <div className="transport-directory-header">
        <div className="header-breadcrumbs">
          <Link to="/transport" className="breadcrumb-parent">
            <Bus size={13} />
            <span>Transport &amp; Drivers</span>
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Transport Directory</span>
        </div>

        <div className="header-main-row">
          <div className="header-title-group">
            <div className="title-with-badge">
              <h1 className="page-heading">Student Transport Directory</h1>
              <span className="commuters-count-pill">
                {students.length} {students.length === 1 ? "Commuter" : "Commuters"}
              </span>
            </div>
            <p className="page-description">
              Directory of all students where Requires Transport is active. View assigned transit routes, designated stops, and vehicle assignments.
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="action-btn-secondary"
              onClick={() => refetchStudents()}
              disabled={isStudentsLoading || isStudentsRefetching}
              title="Sync student transport records"
            >
              <RefreshCw size={13} className={isStudentsRefetching ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              to="/students"
              className="action-btn-primary"
              title="Open Student Admissions Directory"
            >
              <UserCheck size={13} />
              <span>Admission / Students</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Top Metric Cards (Flush 4-Card Track) ── */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Commuter Students</span>
              <strong className="kpi-value">{totalCommuters}</strong>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon" style={{ color: "#16a34a" }}>
              <CheckCircle2 size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Route Assigned</span>
              <strong className="kpi-value">{assignedCommuters}</strong>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon" style={{ color: unassignedCommuters > 0 ? "#ea580c" : "#71717a" }}>
              <AlertCircle size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Pending Route</span>
              <strong className="kpi-value">{unassignedCommuters}</strong>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Bus size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Active Transit Routes</span>
              <strong className="kpi-value">{activeRoutesCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Contiguous Toolbar Directly Under KPI Track ── */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search" style={{ minWidth: "240px", maxWidth: "340px" }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search student name, roll, route, or stop..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Search student transport"
            />
          </div>

          <select
            className="toolbar-select"
            value={routeFilter}
            onChange={(e) => {
              setRouteFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by route"
            style={{ minWidth: "170px", maxWidth: "230px" }}
          >
            <option value="all">All Transit Routes ({students.length})</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.routeName}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={assignmentFilter}
            onChange={(e) => {
              setAssignmentFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by assignment status"
            style={{ minWidth: "140px", maxWidth: "180px" }}
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Route Assigned</option>
            <option value="unassigned">Pending Route</option>
          </select>
        </div>

        <div className="toolbar-actions">
          {(searchQuery || routeFilter !== "all" || assignmentFilter !== "all") && (
            <button
              type="button"
              className="toolbar-btn text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchQuery("");
                setRouteFilter("all");
                setAssignmentFilter("all");
                setPage(1);
              }}
              title="Clear all filters"
            >
              Reset Filters
            </button>
          )}
          <span className="text-xs text-zinc-500 font-medium">
            {filteredStudents.length} of {students.length} students
          </span>
        </div>
      </div>

      {/* ── 4. Fixed Table Container with Zero Overflow ── */}
      <div className="campus-table-container relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "30%" }}>Student Name &amp; Roll</TableHead>
              <TableHead style={{ width: "18%" }}>Class &amp; Section</TableHead>
              <TableHead style={{ width: "26%" }}>Route &amp; Fleet Vehicle</TableHead>
              <TableHead style={{ width: "16%" }}>Designated Stop</TableHead>
              <TableHead className="text-center" style={{ width: "10%" }}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isStudentsLoading && students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <TableSkeleton rows={6} columns={5} />
                </TableCell>
              </TableRow>
            ) : displayedStudents.length > 0 ? (
              displayedStudents.map((student) => {
                const studentId = student.userId || student._id;
                const hasRoute = Boolean(student.routeName && student.routeId);
                const initialChar = student.name ? student.name.charAt(0).toUpperCase() : "S";

                return (
                  <TableRow key={studentId}>
                    {/* Column 1: Student Name & Roll */}
                    <TableCell style={{ width: "30%", overflow: "hidden" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {initialChar}
                        </div>
                        <div className="min-w-0">
                          <span className="transport-student-name block truncate">
                            {student.name || "Unnamed Student"}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
                            <span>Roll: {student.rollNumber || "—"}</span>
                            {student.email && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[150px]">{student.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Class & Section */}
                    <TableCell style={{ width: "18%" }}>
                      <span className="font-semibold text-xs text-foreground block">
                        {student.gradeOrClass || "Unassigned Class"}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                        {student.section ? `Section: ${student.section}` : "No section"}
                      </span>
                    </TableCell>

                    {/* Column 3: Route & Fleet Vehicle */}
                    <TableCell style={{ width: "26%" }}>
                      {hasRoute ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="transport-route-pill">
                            <MapPin size={12} className="shrink-0" />
                            <span>{student.routeName}</span>
                          </span>
                          {student.vehicleNumber && (
                            <span className="transport-vehicle-badge">
                              {student.vehicleNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="transport-pending-pill">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>Route Unassigned</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Column 4: Designated Stop */}
                    <TableCell style={{ width: "16%" }}>
                      {student.stopName ? (
                        <span className="transport-stop-text block truncate" title={student.stopName}>
                          {student.stopName}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          No stop designated
                        </span>
                      )}
                    </TableCell>

                    {/* Column 5: Actions */}
                    <TableCell className="text-center" style={{ width: "10%" }}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit transit route and stop assignment"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(student)}
                          disabled={updateTransportMutation.isPending}
                          className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                          title="Remove student from transport"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  style={{ textAlign: "center", padding: "48px 16px", color: "#71717a" }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Bus size={32} className="text-zinc-300 dark:text-zinc-600 mb-1" />
                    <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                      {searchQuery || routeFilter !== "all" || assignmentFilter !== "all"
                        ? "No commuter students match your filter criteria."
                        : "No students currently enrolled in campus transport."}
                    </p>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      {searchQuery || routeFilter !== "all" || assignmentFilter !== "all"
                        ? "Try clearing your search query or route filters to view all records."
                        : "When students are admitted or edited with Requires Transport toggled ON, they will appear here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── 5. Standardized DataPagination Footer ── */}
      <DataPagination
        page={currentPage}
        pageSize={pageSize}
        total={filteredStudents.length}
        pageCount={pageCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemLabel="commuters"
      />

      {/* ── Edit Transport Modal Dialog ── */}
      <Dialog open={Boolean(editingStudent)} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Bus className="w-4 h-4 text-indigo-600" />
              Edit Student Transport Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update transit route and stop assignment for {editingStudent?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dialog-route-select" className="text-xs font-semibold">
                Transit Route *
              </Label>
              <Select
                value={editRouteId}
                onValueChange={(val) => {
                  setEditRouteId(val);
                  const r = routes.find((rt) => rt._id === val);
                  setEditStopName(r?.stops?.[0]?.stopName || "");
                }}
              >
                <SelectTrigger id="dialog-route-select" className="w-full text-xs">
                  <SelectValue placeholder="-- Select Transit Route --" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.routeName} ({r.vehicleId?.busNumber || "Bus pending"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dialog-stop-select" className="text-xs font-semibold">
                Designated Stop &amp; Pickup Time *
              </Label>
              {editRouteStops.length > 0 ? (
                <Select
                  value={editStopName}
                  onValueChange={(val) => setEditStopName(val)}
                >
                  <SelectTrigger id="dialog-stop-select" className="w-full text-xs">
                    <SelectValue placeholder="-- Select Stop --" />
                  </SelectTrigger>
                  <SelectContent>
                    {editRouteStops.map((s, idx) => (
                      <SelectItem key={s._id || idx} value={s.stopName}>
                        {s.stopName} (Pickup: {s.pickupTime || "07:15 AM"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="dialog-stop-select"
                  placeholder={editRouteId ? "e.g. Stop 2: Market" : "Select a transit route first"}
                  value={editStopName}
                  disabled={!editRouteId}
                  onChange={(e) => setEditStopName(e.target.value)}
                  className="text-xs"
                />
              )}
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
                disabled={updateTransportMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateTransportMutation.isPending}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {updateTransportMutation.isPending && <Spinner className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
