import React, { useState } from 'react';
import {
  Activity,
  UserPlus,
  UserCheck,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  Bell,
  Clock,
  FileText,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';

const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    category: 'students',
    title: 'Status Updated to Pending',
    description: 'Zainab Bilal (NUST-CS-2023-088) verification pending',
    time: '2m ago',
    icon: UserCheck,
    badge: 'Pending',
    tone: 'amber',
    studentName: 'Zainab Bilal',
  },
  {
    id: 'act-2',
    category: 'students',
    title: 'Course Registration Submitted',
    description: 'Ali Raza enrolled in Spring 2025 semester',
    time: '8m ago',
    icon: UserPlus,
    badge: 'Active',
    tone: 'green',
    studentName: 'Ali Raza',
  },
  {
    id: 'act-3',
    category: 'academic',
    title: 'Midterm Schedules Published',
    description: 'BS Computer Science & Software Engineering exam dates set',
    time: '24m ago',
    icon: CalendarDays,
    badge: 'Academic',
    tone: 'blue',
  },
  {
    id: 'act-4',
    category: 'staff',
    title: 'Faculty Checked In',
    description: 'Dr. Usman Khan marked On Duty for Data Structures lecture',
    time: '45m ago',
    icon: GraduationCap,
    badge: 'On Duty',
    tone: 'purple',
  },
  {
    id: 'act-5',
    category: 'attendance',
    title: 'Attendance Register Synced',
    description: 'Section CS-4A recorded 94.2% live attendance (38/40)',
    time: '1h ago',
    icon: ClipboardCheck,
    badge: 'Present',
    tone: 'green',
  },
  {
    id: 'act-6',
    category: 'alerts',
    title: 'Campus Notice Dispatched',
    description: 'Orientation hall reassigned to Auditorium B (H-12)',
    time: '2h ago',
    icon: Bell,
    badge: 'Broadcast',
    tone: 'red',
  },
  {
    id: 'act-7',
    category: 'academic',
    title: 'Lab Session Scheduled',
    description: 'Lab 302 booked for Advanced Web Design (CS-4A)',
    time: '3h ago',
    icon: Clock,
    badge: 'Timetable',
    tone: 'blue',
  },
  {
    id: 'act-8',
    category: 'students',
    title: 'Profile Updated',
    description: 'Maryam Ahmed updated semester registration details',
    time: 'Today, 09:15 AM',
    icon: FileText,
    badge: 'Active',
    tone: 'green',
    studentName: 'Maryam Ahmed',
  },
];

const SCHOOL_ACTIVITIES = [
  {
    id: 'act-s1',
    category: 'students',
    title: 'Admission Verified',
    description: 'Zainab Bilal enrolled in Grade 10 - Section A',
    time: '2m ago',
    icon: UserCheck,
    badge: 'Enrolled',
    tone: 'green',
    studentName: 'Zainab Bilal',
  },
  {
    id: 'act-s2',
    category: 'academic',
    title: 'Daily Diary Published',
    description: 'Grade 8-A Mathematics Ex 4.2 homework assigned',
    time: '12m ago',
    icon: FileText,
    badge: 'Homework',
    tone: 'purple',
  },
  {
    id: 'act-s3',
    category: 'academic',
    title: 'First Term Datesheet Released',
    description: 'Exam schedule published for Grade 9 & 10',
    time: '30m ago',
    icon: CalendarDays,
    badge: 'Examinations',
    tone: 'blue',
  },
  {
    id: 'act-s4',
    category: 'staff',
    title: 'Teacher Marked On Duty',
    description: 'Mr. Bilal Raza marked On Duty for Grade 9-B Homeroom',
    time: '45m ago',
    icon: GraduationCap,
    badge: 'On Duty',
    tone: 'purple',
  },
  {
    id: 'act-s5',
    category: 'attendance',
    title: 'Morning Assembly Register Synced',
    description: 'Grade 10-A recorded 96.2% live attendance (38/40)',
    time: '1h ago',
    icon: ClipboardCheck,
    badge: 'Present',
    tone: 'green',
  },
  {
    id: 'act-s6',
    category: 'alerts',
    title: 'PTM Notice Dispatched',
    description: 'Parent-Teacher Meeting circular sent to all guardians',
    time: '2h ago',
    icon: Bell,
    badge: 'Circular',
    tone: 'amber',
  },
  {
    id: 'act-s7',
    category: 'academic',
    title: 'Period Schedule Updated',
    description: 'Science Lab assigned for Grade 8 Practical session',
    time: '3h ago',
    icon: Clock,
    badge: 'Timetable',
    tone: 'blue',
  },
  {
    id: 'act-s8',
    category: 'students',
    title: 'Guardian Contact Updated',
    description: 'Maryam Ahmed guardian emergency phone updated',
    time: 'Today, 09:15 AM',
    icon: FileText,
    badge: 'Active',
    tone: 'green',
    studentName: 'Maryam Ahmed',
  },
];

export default function CampusActivitySidebar({ onSelectStudent, students = [], faculty = [] }) {
  const { isSchool } = useInstitution();
  const [filter, setFilter] = useState('all');

  const activities = React.useMemo(() => {
    if (!isSchool) return INITIAL_ACTIVITIES;

    const s0 = students[0]?.name || 'Muhammad Abdullah';
    const s0Class = students[0]?.gradeOrClass || 'Grade 10';
    const s0Sec = students[0]?.section || 'A';
    const s1 = students[1]?.name || 'Fatima Zahra';
    const t0 = faculty[0]?.name || 'Ms. Saima Khan';

    return [
      {
        id: 'act-s1',
        category: 'students',
        title: 'Admission Verified',
        description: `${s0} enrolled in ${s0Class} - Section ${s0Sec}`,
        time: '2m ago',
        icon: UserCheck,
        badge: 'Enrolled',
        tone: 'green',
        studentName: s0,
      },
      {
        id: 'act-s2',
        category: 'academic',
        title: 'Daily Diary Published',
        description: 'Grade 10-A Mathematics Ex 4.2 homework assigned',
        time: '12m ago',
        icon: FileText,
        badge: 'Homework',
        tone: 'purple',
      },
      {
        id: 'act-s3',
        category: 'academic',
        title: 'First Term Datesheet Released',
        description: 'Exam schedule published for Secondary Wing (Grade 9 & 10)',
        time: '30m ago',
        icon: CalendarDays,
        badge: 'Examinations',
        tone: 'blue',
      },
      {
        id: 'act-s4',
        category: 'staff',
        title: 'Teacher Marked On Duty',
        description: `${t0} marked On Duty for Morning Assembly & Homeroom`,
        time: '45m ago',
        icon: GraduationCap,
        badge: 'On Duty',
        tone: 'purple',
      },
      {
        id: 'act-s5',
        category: 'attendance',
        title: 'Morning Assembly Register Synced',
        description: `${s0Class}-${s0Sec} recorded 96.2% live attendance`,
        time: '1h ago',
        icon: ClipboardCheck,
        badge: 'Present',
        tone: 'green',
      },
      {
        id: 'act-s6',
        category: 'alerts',
        title: 'PTM Notice Dispatched',
        description: 'Parent-Teacher Meeting circular sent to all guardians',
        time: '2h ago',
        icon: Bell,
        badge: 'Circular',
        tone: 'amber',
      },
      {
        id: 'act-s7',
        category: 'academic',
        title: 'Period Schedule Updated',
        description: 'Science Lab assigned for Grade 10-A Practical session',
        time: '3h ago',
        icon: Clock,
        badge: 'Timetable',
        tone: 'blue',
      },
      {
        id: 'act-s8',
        category: 'students',
        title: 'Guardian Contact Updated',
        description: `${s1} guardian contact record verified and synced`,
        time: 'Today, 09:15 AM',
        icon: FileText,
        badge: 'Active',
        tone: 'green',
        studentName: s1,
      },
    ];
  }, [isSchool, students, faculty]);

  const filteredActivities = activities.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const handleItemClick = (item) => {
    if (item.studentName && onSelectStudent) {
      const matched = students.find((s) => s.name === item.studentName);
      if (matched) onSelectStudent(matched);
    }
  };

  return (
    <aside className="campus-activity-sidebar" aria-label="Campus Activity and Audit Logs">
      {/* Sidebar Header */}
      <div className="activity-sidebar-header">
        <div className="activity-title-group">
          <div className="activity-live-indicator">
            <span className="pulse-ring" />
            <span className="pulse-dot" />
          </div>
          <h2 className="activity-heading">Campus Activity & Logs</h2>
        </div>
        <span className="activity-count-badge">{filteredActivities.length} Logs</span>
      </div>

      {/* Filter Tabs */}
      <div className="activity-filter-bar">
        <button
          type="button"
          className={`activity-filter-chip ${filter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`activity-filter-chip ${filter === 'students' ? 'is-active' : ''}`}
          onClick={() => setFilter('students')}
        >
          Students
        </button>
        <button
          type="button"
          className={`activity-filter-chip ${filter === 'academic' ? 'is-active' : ''}`}
          onClick={() => setFilter('academic')}
        >
          Academic
        </button>
        <button
          type="button"
          className={`activity-filter-chip ${filter === 'attendance' ? 'is-active' : ''}`}
          onClick={() => setFilter('attendance')}
        >
          Attendance
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="activity-feed-list">
        {filteredActivities.map((item) => {
          const Icon = item.icon;
          const isClickable = Boolean(item.studentName);

          return (
            <div
              key={item.id}
              className={`activity-item tone-${item.tone} ${isClickable ? 'is-clickable' : ''}`}
              onClick={() => handleItemClick(item)}
              title={isClickable ? `Click to view profile of ${item.studentName}` : undefined}
            >
              <div className="activity-item-icon-box">
                <Icon size={14} />
              </div>

              <div className="activity-item-content">
                <div className="activity-item-top">
                  <span className="activity-item-title">{item.title}</span>
                  <span className="activity-item-time">{item.time}</span>
                </div>
                <p className="activity-item-desc">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
