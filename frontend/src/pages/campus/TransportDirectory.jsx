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
  Filter,
  ArrowUpDown,
  Phone,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import toast from "react-hot-toast";
import axiosInstance from "@/api/axiosInstance";
import { getRoutesApi, getTransportStudentsApi } from "@/api/transport.api";
import { Link } from "react-router-dom";

export default function TransportDirectory() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");

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
      // Query students enrolled in transport
      const res = await axiosInstance.get("/transport/students", {
        params: { usesTransport: true },
      });
      const list = res.data?.data || res.data || [];
      // Guarantee only students who require transport
      return list.filter((s) => s.usesTransport === true || s.transportEnrolled === true);
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch Available Transit Routes using React Query
  const { data: routes = [], isLoading: isRoutesLoading } = useQuery({
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

  // Filter students by search text and route dropdown
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

      return matchesSearch && matchesRoute;
    });
  }, [students, searchQuery, routeFilter]);

  return (
    <div className="campus-tab-page transport-directory-page p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header / Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/transport" className="hover:underline flex items-center gap-1">
              <Bus className="w-3.5 h-3.5" />
              Transport & Drivers
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Transport Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Student Transport Directory
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold">
              {students.length} Enrolled
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Directory of all students where Requires Transport is active. View assigned routes, stops, and fleet vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStudents()}
            disabled={isStudentsLoading || isStudentsRefetching}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStudentsRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" asChild className="h-9 gap-1.5 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90">
            <Link to="/students">
              <UserCheck className="w-3.5 h-3.5" />
              Admission / Students
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Toolbar: Search & Route Filter ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by student name, roll number, route, or stop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs w-full bg-zinc-50 dark:bg-zinc-950/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="route-filter" className="text-xs font-medium text-muted-foreground shrink-0 hidden md:inline">
            Route:
          </Label>
          <Select value={routeFilter} onValueChange={(val) => setRouteFilter(val)}>
            <SelectTrigger id="route-filter" className="h-9 text-xs w-full sm:w-[220px] bg-zinc-50 dark:bg-zinc-950/50">
              <SelectValue placeholder="All Transit Routes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transit Routes ({students.length})</SelectItem>
              {routes.map((r) => (
                <SelectItem key={r._id} value={r._id}>
                  {r.routeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        {isStudentsLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner className="w-6 h-6 text-indigo-600" />
            <p className="text-xs text-muted-foreground font-medium">
              Loading enrolled transport students...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground">
              <Bus className="w-6 h-6 opacity-60" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {searchQuery || routeFilter !== "all"
                  ? "No matching commuters found"
                  : "No students currently enrolled in transport"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {searchQuery || routeFilter !== "all"
                  ? "Try clearing your search query or route filter to see all transport records."
                  : "When students are admitted or edited with Requires Transport toggled ON, they will appear here."}
              </p>
            </div>
            {(searchQuery || routeFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setRouteFilter("all");
                }}
                className="text-xs h-8 mt-1"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/75 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3">Student Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3">Class</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3">Route Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3">Designated Stop</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const studentId = student.userId || student._id;
                  const hasRoute = Boolean(student.routeName && student.routeId);

                  return (
                    <TableRow
                      key={studentId}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors"
                    >
                      {/* Column 1: Student Name */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-foreground block truncate">
                              {student.name || "Unnamed Student"}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                              <span>Roll: {student.rollNumber || "—"}</span>
                              {student.email && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-[160px]">{student.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 2: Class */}
                      <TableCell className="py-3.5">
                        <span className="font-semibold text-xs text-foreground block">
                          {student.gradeOrClass || "Unassigned"}
                        </span>
                        {student.section && (
                          <span className="text-[11px] text-muted-foreground block">
                            Section: {student.section}
                          </span>
                        )}
                      </TableCell>

                      {/* Column 3: Route Name (Safe Null Handling) */}
                      <TableCell className="py-3.5">
                        {hasRoute ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>{student.routeName}</span>
                            {student.vehicleNumber && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-1 font-normal bg-zinc-50 dark:bg-zinc-800">
                                {student.vehicleNumber}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0.5 px-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 font-medium flex items-center gap-1 w-fit"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Route Unassigned
                          </Badge>
                        )}
                      </TableCell>

                      {/* Column 4: Stop Name */}
                      <TableCell className="py-3.5">
                        {student.stopName ? (
                          <div>
                            <span className="text-xs font-medium text-foreground block">
                              {student.stopName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No stop designated
                          </span>
                        )}
                      </TableCell>

                      {/* Column 5: Action (Edit / Remove) */}
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(student)}
                            className="h-8 px-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Edit transit route and stop"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(student)}
                            disabled={updateTransportMutation.isPending}
                            className="h-8 px-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Remove transport requirement"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

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
                Designated Stop & Pickup Time *
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
