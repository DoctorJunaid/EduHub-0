import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

// Redux State Selectors & Actions
import { selectStudents, addStudent, fetchStudents } from '@/store/Slices/studentsSlice.js';
import { selectFaculty, addFaculty, fetchFaculty } from '@/store/Slices/facultySlice.js';
import { selectTimetable } from '@/store/Slices/timetableSlice.js';

// Demonstration Seed Data Fallbacks
import { campusStudents as demoStudents, campusClasses as demoClasses } from './campusOverviewData.js';
import { facultyRecords as demoFaculty } from '@/Admins/Campus Admin/Faculty/facultyData.js';

// Forms & Modal Dialogs
import FacultyForm from '@/Admins/Campus Admin/Faculty/FacultyForm';
import StudentForm from '@/Admins/Campus Admin/Students/StudentForm';
import StudentProfileDialog from '@/Admins/Campus Admin/Students/StudentProfileDialog';

// Redesigned Components
import CampusThinCards from './components/CampusThinCards';
import CampusOperationsHub from './components/CampusOperationsHub';
import CampusActivitySidebar from './components/CampusActivitySidebar';

import './CampusOverview.css';

export default function CampusOverview() {
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchFaculty());
  }, [dispatch]);

  // Redux Selectors with graceful fallbacks
  const rawStudents = useSelector(selectStudents);
  const rawFaculty = useSelector(selectFaculty);
  const rawTimetable = useSelector(selectTimetable);

  // Merged data
  const students = rawStudents?.length ? rawStudents : demoStudents;
  const faculty = rawFaculty?.length ? rawFaculty : demoFaculty;
  const timetable = rawTimetable?.length ? rawTimetable : demoClasses;

  // Modal Dialog states
  const [addingStudent, setAddingStudent] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [inspectingStudent, setInspectingStudent] = useState(null);
  const [activeCardId, setActiveCardId] = useState('students-card');

  // Dynamic select options for faculty modal
  const facultyOptions = useMemo(() => {
    return Object.fromEntries(
      ['designation', 'department', 'campus'].map((key) => [
        key,
        [...new Set([...demoFaculty, ...faculty].map((teacher) => teacher[key]))],
      ])
    );
  }, [faculty]);

  // Programs and campuses for Student form
  const studentPrograms = [
    'BS Computer Science',
    'BS Software Engineering',
    'BS Artificial Intelligence',
    'BS Data Science',
  ];

  const studentCampuses = [
    'NUST Main Campus (H-12)',
    'FAST-NUCES Islamabad',
    'LUMS Lahore',
  ];

  // Export summary
  const handleExportSummary = () => {
    const csvContent = [
      'Category,Metric,Details',
      'Campus,"NUST Main Campus (H-12)","Sector H-12, Islamabad"',
      `Enrolled Students,"${students.length}","94.2% Attendance"`,
      `Faculty Members,"${faculty.length}","98% On Duty"`,
      `Active Classes,"${timetable.length}","18 Labs Active"`,
      'Programs,"4 Programs","BS CS, SE, AI, DS"',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('link');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nust_campus_summary_2025.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardToTabMap = {
    'students-card': 'students',
    'faculty-card': 'faculty',
    'programs-card': 'programs',
    'timetable-card': 'timetable',
  };

  return (
    <div className="campus-overview" aria-label="Campus Executive Command Center">
      {/* 1. 4 Clean KPI Cards Touching Border-to-Border */}
      <CampusThinCards
        activeCardId={activeCardId}
        onSelectCard={(id) => setActiveCardId(id)}
      />

      {/* 2. Operations Hub & Right Activity Sidebar (Nil Gap) */}
      <div className="campus-split-container">
        <div className="campus-table-panel">
          <CampusOperationsHub
            activeTab={cardToTabMap[activeCardId] || 'students'}
            students={students}
            faculty={faculty}
            timetable={timetable}
            onAddStudent={() => setAddingStudent(true)}
            onAddTeacher={() => setAddingTeacher(true)}
            onViewStudentProfile={(student) => setInspectingStudent(student)}
          />
        </div>

        <CampusActivitySidebar
          students={students}
          onSelectStudent={(student) => setInspectingStudent(student)}
        />
      </div>

      {/* In-Page Modals */}
      {addingStudent && (
        <StudentForm
          programs={studentPrograms}
          campuses={studentCampuses}
          onClose={() => setAddingStudent(false)}
          onSave={async (values) => {
            try {
              await dispatch(addStudent(values)).unwrap();
              toast.success("Student added successfully!");
              setAddingStudent(false);
              dispatch(fetchStudents());
            } catch (err) {
              toast.error(typeof err === "string" ? err : "Failed to add student");
              throw err;
            }
          }}
        />
      )}

      {addingTeacher && (
        <FacultyForm
          options={facultyOptions}
          onClose={() => setAddingTeacher(false)}
          onSave={async (values) => {
            try {
              await dispatch(addFaculty(values)).unwrap();
              toast.success("Teacher added successfully!");
              setAddingTeacher(false);
              dispatch(fetchFaculty());
            } catch (err) {
              toast.error(typeof err === "string" ? err : "Failed to add teacher");
              throw err;
            }
          }}
        />
      )}

      {inspectingStudent && (
        <StudentProfileDialog
          student={inspectingStudent}
          onClose={() => setInspectingStudent(null)}
        />
      )}
    </div>
  );
}
