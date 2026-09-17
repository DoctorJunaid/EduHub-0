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

export default function CampusActivitySidebar({ onSelectStudent, students = [] }) {
  const [filter, setFilter] = useState('all');
  const [activities] = useState(INITIAL_ACTIVITIES);

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
