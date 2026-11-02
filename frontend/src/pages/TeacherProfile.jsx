import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import { PageLoader } from "@/components/ui/spinner";
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

  useEffect(() => {
    const teacherName = teacher?.userId?.name || teacher?.user?.name || teacher?.name;
    if (teacherName) {
      document.title = `${teacherName} | Faculty Profile | EduHub`;
      if (typeof sessionStorage !== "undefined" && teacherId) {
        sessionStorage.setItem(`teacherName_${teacherId}`, teacherName);
      }
    }
  }, [teacher, teacherId]);

  const handleTabChange = (val) => {
    setSearchParams({ tab: val });
  };

  const handleViewTimetableForClass = (classItem) => {
    setTimetableClassFilter(classItem.className || "");
    handleTabChange("timetable");
  };

  // Loading Spinner State
  if (loading && !teacher) {
    return (
      <div className="campus-tab-page">
        <PageLoader text="Loading teacher profile..." />
      </div>
    );
  }

  // 404 / 403 Error States & Graceful fallback
  if (error || (!loading && !teacher)) {
    const isForbidden = error?.status === 403;
    const rawMsg = error?.message;
    const isTechnicalOrUndefined =
      !rawMsg ||
      rawMsg.includes("data is undefined") ||
      rawMsg.includes('["teacher"') ||
      rawMsg.includes("profile");

    const messageText = isForbidden
      ? "This teacher profile belongs to another campus or you do not have permission to view it."
      : isTechnicalOrUndefined
      ? "The requested teacher profile could not be loaded or does not exist."
      : rawMsg;

    return (
      <div
        className="w-full flex flex-col items-center justify-center text-center bg-white rounded-xl border border-neutral-200"
        style={{ minHeight: "50vh", padding: "32px", boxSizing: "border-box" }}
      >
        <div
          className={`rounded-full flex items-center justify-center ${
            isForbidden
              ? "bg-rose-50 border border-rose-200 text-rose-600"
              : "bg-amber-50 border border-amber-200 text-amber-600"
          }`}
          style={{ width: "48px", height: "48px", marginBottom: "16px" }}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900" style={{ marginBottom: "8px" }}>
          {isForbidden ? "Access Denied (403)" : "Teacher Profile Not Found (404)"}
        </h2>
        <p className="text-sm text-neutral-500" style={{ marginBottom: "24px", maxWidth: "400px" }}>
          {messageText}
        </p>
        <Link
          to="/campus-manager/teachers"
          className="bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors inline-flex items-center justify-center shadow-xs font-medium text-sm"
          style={{ height: "40px", padding: "0 20px", boxSizing: "border-box" }}
        >
          Back to Faculty Directory
        </Link>
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
        teacherName={teacher?.userId?.name || teacher?.name || "Teacher"}
      />

      {editProfileOpen && (
        <FacultyForm
          initialValues={{
            id: teacher?.userId?._id || teacher?._id,
            name: teacher?.userId?.name || teacher?.name,
            email: teacher?.userId?.email || teacher?.email,
            phone: teacher?.userId?.phone || teacher?.phone,
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
