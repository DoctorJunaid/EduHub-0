import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateKey } from "@/hooks/useFacultyAttendance";

export default function FiltersBar({
  date,
  setDate,
  tab,
  setTab,
  filters,
  setFilters,
  departments = [],
}) {
  const dateStr = formatDateKey(date);
  const isToday = dateStr === formatDateKey(new Date());

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split("-").map(Number);
    const newDate = new Date(y, m - 1, d);
    setDate(newDate);
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleDepartmentChange = (val) => {
    setFilters((prev) => ({ ...prev, department: val }));
  };

  const handleStatusChange = (val) => {
    setFilters((prev) => ({ ...prev, status: val }));
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Date Navigation + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Date Navigator */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            aria-label="Previous day"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="relative flex items-center">
            <CalendarIcon className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateStr}
              onChange={handleDateChange}
              className="pl-8 h-9 text-sm font-medium w-auto cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            aria-label="Next day"
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant={isToday ? "secondary" : "outline"}
            size="sm"
            onClick={handleToday}
            className="h-9 font-medium"
          >
            Today
          </Button>
        </div>

        {/* View Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-[280px]">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Row (Daily tab only) */}
      {tab === "daily" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search teacher, department..."
              value={filters.search}
              onChange={handleSearchChange}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Department Select */}
          <Select
            value={filters.department}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="h-9 text-sm w-full">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Departments">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select
            value={filters.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-9 text-sm w-full">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Unrecorded">Unrecorded</SelectItem>
            </SelectContent>
          </Select>

          {/* Section Select (Disabled / Placeholder) */}
          <Select disabled value="All Sections">
            <SelectTrigger className="h-9 text-sm w-full opacity-60">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Sections">All Sections</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
