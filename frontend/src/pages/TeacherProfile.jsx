import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  User,
  Clock,
  CalendarCheck,
  Wallet,
  Users,
  FileText,
  History,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageLoader, Spinner, SpinnerCustom } from "@/components/ui/spinner";
import TeacherHeader from "@/components/teacher-profile/TeacherHeader";
import TeacherStatsCards from "@/components/teacher-profile/TeacherStatsCards";
import TeacherQuickSidebar from "@/components/teacher-profile/TeacherQuickSidebar";
import OverviewTab from "@/components/teacher-profile/tabs/OverviewTab";
import ClassesTab from "@/components/teacher-profile/tabs/ClassesTab";
import TimetableTab from "@/components/teacher-profile/tabs/TimetableTab";
import AttendanceTab from "@/components/teacher-profile/tabs/AttendanceTab";
import PayrollTab from "@/components/teacher-profile/tabs/PayrollTab";
import SubstitutesTab from "@/components/teacher-profile/tabs/SubstitutesTab";
import DocumentsTab from "@/components/teacher-profile/tabs/DocumentsTab";
import ActivityTab from "@/components/teacher-profile/tabs/ActivityTab";
import AssignClassDialog from "@/components/teacher-profile/AssignClassDialog";
import FacultyForm from "@/Admins/Campus Admin/Faculty/FacultyForm";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { useDispatch } from "react-redux";
import { updateFaculty, fetchFaculty } from "@/store/Slices/facultySlice";
import toast from "react-hot-toast";

import "./TeacherProfile.css";

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Tab state synced with URL search parameter (?tab=...)
  const activeTab = searchParams.get("tab") || "classes";
  const [timetableClassFilter, setTimetableClassFilter] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const {
    teacher,
    stats,
    loading,
    error,
    refetchProfile,

    // Tab data & Loaders
    classesData,
    timetableData,
    attendanceData,
    payrollData,
    substitutesData,
    activityData,
    loadingTab,

    loadClasses,
    loadTimetable,
    loadAttendance,
    loadPayroll,
    loadSubstitutes,
    loadActivity,

    assignClass,
    unassignClass,
  } = useTeacherProfile(teacherId);

  const handleTabChange = (val) => {
    setSearchParams({ tab: val });
  };

  const handleViewTimetableForClass = (classItem) => {
    setTimetableClassFilter(classItem.className || "");
    handleTabChange("timetable");
  };

  // 404 / 403 Error States
  if (error) {
    const isForbidden = error.status === 403;

    return (
      <div className="campus-tab-page flex flex-col items-center justify-center p-12 text-center bg-white min-h-[500px]">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            isForbidden ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-1">
          {isForbidden ? "Access Denied (403)" : "Teacher Profile Not Found (404)"}
        </h2>
        <p className="text-xs text-zinc-500 max-w-md mb-6">
          {error.message ||
            (isForbidden
              ? "This teacher profile belongs to another campus or you do not have permission to view it."
              : "The requested teacher profile could not be found in your campus registry.")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/faculty")}
          className="toolbar-btn toolbar-btn-primary"
        >
          <ArrowLeft size={13} />
          <span>Back to Faculty Directory</span>
        </button>
      </div>
    );
  }

  // Loading Spinner State
  if (loading && !teacher) {
    return (
      <div className="campus-tab-page">
        <PageLoader text="Loading teacher profile..." />
      </div>
    );
  }

  const tabsList = [
    { id: "classes", label: "Classes Assigned", icon: <BookOpen size={13} /> },
    { id: "overview", label: "Overview", icon: <User size={13} /> },
    { id: "timetable", label: "Timetable", icon: <Clock size={13} /> },
    { id: "attendance", label: "Attendance", icon: <CalendarCheck size={13} /> },
    { id: "payroll", label: "Salary & Payroll", icon: <Wallet size={13} /> },
    { id: "substitutes", label: "Substitutes", icon: <Users size={13} /> },
    { id: "documents", label: "Documents", icon: <FileText size={13} /> },
    { id: "activity", label: "Activity", icon: <History size={13} /> },
  ];

  return (
    <div className="campus-tab-page teacher-profile-page">
      {/* 1. Profile Topbar */}
      <TeacherHeader
        teacher={teacher}
        onEditProfile={() => setEditProfileOpen(true)}
        onAssignClasses={() => setAssignDialogOpen(true)}
        onSwitchTab={handleTabChange}
      />

      {/* 2. Flush 56px KPI Track */}
      <TeacherStatsCards stats={stats} />

      {/* 3. Sub-Toolbar Tabs Navigation */}
      <div className="teacher-tabs-bar">
        {tabsList.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`teacher-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Split Body */}
      <div className="teacher-profile-body">
        {/* Left Main Column */}
        <div className="teacher-main-col">
          {activeTab === "classes" && (
            <ClassesTab
              teacher={teacher}
              classesData={classesData}
              loading={loadingTab.classes}
              onLoadClasses={loadClasses}
              onAssignClass={assignClass}
              onUnassignClass={unassignClass}
              onViewTimetable={handleViewTimetableForClass}
            />
          )}

          {activeTab === "overview" && <OverviewTab teacher={teacher} />}

          {activeTab === "timetable" && (
            <TimetableTab
              timetableData={timetableData}
              loading={loadingTab.timetable}
              onLoadTimetable={loadTimetable}
              initialClassFilter={timetableClassFilter}
            />
          )}

          {activeTab === "attendance" && (
            <AttendanceTab
              attendanceData={attendanceData}
              loading={loadingTab.attendance}
              onLoadAttendance={loadAttendance}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollTab
              teacher={teacher}
              payrollData={payrollData}
              loading={loadingTab.payroll}
              onLoadPayroll={loadPayroll}
            />
          )}

          {activeTab === "substitutes" && (
            <SubstitutesTab
              substitutesData={substitutesData}
              loading={loadingTab.substitutes}
              onLoadSubstitutes={loadSubstitutes}
            />
          )}

          {activeTab === "documents" && <DocumentsTab teacher={teacher} />}

          {activeTab === "activity" && (
            <ActivityTab
              activityData={activityData}
              loading={loadingTab.activity}
              onLoadActivity={loadActivity}
            />
          )}
        </div>

        {/* Right Side Column: Widgets */}
        <div className="teacher-side-col">
          <TeacherQuickSidebar
            teacher={teacher}
            stats={stats}
            onMarkAttendance={() => handleTabChange("attendance")}
            onAssignSubstitute={() => handleTabChange("substitutes")}
          />
        </div>
      </div>

      {/* Global In-Page Dialogs */}
      <AssignClassDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onAssign={assignClass}
        teacherName={teacher?.userId?.name || "Teacher"}
      />

      {editProfileOpen && (
        <FacultyForm
          initialValues={{
            id: teacher?.userId?._id || teacher?._id,
            name: teacher?.userId?.name,
            email: teacher?.userId?.email,
            phone: teacher?.userId?.phone,
            department: teacher?.department,
            designation: teacher?.designation,
            qualification: teacher?.qualification,
            subjects: teacher?.subjects,
            status: teacher?.isActive ? "Active" : "Inactive",
          }}
          onClose={() => setEditProfileOpen(false)}
          onSave={async (values) => {
            try {
              await dispatch(
                updateFaculty({
                  id: teacher?.userId?._id || teacher?._id,
                  data: values,
                })
              ).unwrap();
              toast.success("Teacher profile updated successfully!");
              setEditProfileOpen(false);
              refetchProfile();
              dispatch(fetchFaculty());
            } catch (err) {
              toast.error(typeof err === "string" ? err : "Failed to update profile");
            }
          }}
        />
      )}
    </div>
  );
}
