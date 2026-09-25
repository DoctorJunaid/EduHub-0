import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Trash2,
  Pencil,
  DollarSign,
  BookOpen,
  Users,
} from 'lucide-react';
import { SpinnerCustom } from '@/components/ui/spinner';
import { useInstitution } from '@/context/InstitutionContext';
import {
  fetchActivityLogs,
  selectActivityLogsHasMore,
  selectActivityLogsIsFetchingMore,
  selectActivityLogsPage,
} from '@/store/Slices/activityLogSlice.js';

// Map backend action types to icon + tone
const ACTION_CONFIG = {
  student_created:     { icon: UserPlus,       tone: 'green',  category: 'students' },
  student_assigned:    { icon: UserCheck,      tone: 'green',  category: 'students' },
  student_updated:     { icon: Pencil,         tone: 'blue',   category: 'students' },
  student_removed:     { icon: Trash2,         tone: 'red',    category: 'students' },
  faculty_created:     { icon: GraduationCap,  tone: 'purple', category: 'staff' },
  faculty_updated:     { icon: Pencil,         tone: 'blue',   category: 'staff' },
  faculty_removed:     { icon: Trash2,         tone: 'red',    category: 'staff' },
  schedule_created:    { icon: CalendarDays,   tone: 'blue',   category: 'academic' },
  schedule_updated:    { icon: Pencil,         tone: 'blue',   category: 'academic' },
  schedule_deleted:    { icon: Trash2,         tone: 'red',    category: 'academic' },
  exam_created:        { icon: BookOpen,       tone: 'blue',   category: 'academic' },
  exam_updated:        { icon: Pencil,         tone: 'blue',   category: 'academic' },
  exam_deleted:        { icon: Trash2,         tone: 'red',    category: 'academic' },
  teacher_attendance_marked: { icon: ClipboardCheck, tone: 'green',  category: 'attendance' },
  student_attendance_marked: { icon: ClipboardCheck, tone: 'green',  category: 'attendance' },
  student_attendance_bulk:   { icon: Users,          tone: 'green',  category: 'attendance' },
  fee_created:         { icon: DollarSign,     tone: 'amber',  category: 'fees' },
  fee_updated:         { icon: Pencil,         tone: 'amber',  category: 'fees' },
  fee_deleted:         { icon: Trash2,         tone: 'red',    category: 'fees' },
  performance_created: { icon: BookOpen,       tone: 'purple', category: 'academic' },
  system_event:        { icon: Bell,           tone: 'blue',   category: 'alerts' },
};

/**
 * Format a date string into a human-readable relative time.
 */
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CampusActivitySidebar({ onSelectStudent, students = [], faculty = [], activityLogs = [] }) {
  const dispatch = useDispatch();
  const { isSchool } = useInstitution();
  const [filter, setFilter] = useState('all');

  const hasMore = useSelector(selectActivityLogsHasMore);
  const isFetchingMore = useSelector(selectActivityLogsIsFetchingMore);
  const currentPage = useSelector(selectActivityLogsPage);

  const activities = useMemo(() => {
    let list = [];

    // 1. If we have real logs from the API, map and sort them
    if (activityLogs.length > 0) {
      list = activityLogs.map((log, idx) => {
        const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.system_event;
        const rawDate = log.createdAt ? new Date(log.createdAt) : new Date();
        const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;
        return {
          id: log._id || log.id || `log-${idx}`,
          category: log.category || config.category,
          title: log.title,
          description: log.description,
          rawDate: validDate,
          time: timeAgo(validDate),
          icon: config.icon,
          tone: config.tone,
          studentName: log.metadata?.name || null,
          action: log.action,
        };
      });
    } else if (students.length === 0 && faculty.length === 0) {
      // 2. Initial empty state fallback
      const now = Date.now();
      list = [
        {
          id: 'act-init-1',
          category: 'alerts',
          title: 'Campus Manager Active',
          description: isSchool
            ? 'School database connected and ready for student enrollment'
            : 'Campus management portal active and ready',
          rawDate: new Date(now),
          time: 'Just now',
          icon: CheckCircle2,
          tone: 'green',
        },
        {
          id: 'act-init-2',
          category: 'students',
          title: 'Student Directory Ready',
          description: isSchool
            ? 'Click "+ Add Student" to register students into classes'
            : 'Add students using the quick action button',
          rawDate: new Date(now - 1000 * 60 * 5),
          time: '5m ago',
          icon: UserPlus,
          tone: 'blue',
        },
        {
          id: 'act-init-3',
          category: 'staff',
          title: isSchool ? 'Teaching Staff Directory' : 'Faculty Directory',
          description: isSchool
            ? 'Click "+ Add Teacher" to appoint school teachers'
            : 'Appoint faculty members to campus departments',
          rawDate: new Date(now - 1000 * 60 * 15),
          time: '15m ago',
          icon: GraduationCap,
          tone: 'purple',
        },
      ];
    } else {
      // 3. Live directory data fallback (ensuring proper timestamps)
      const now = Date.now();

      // Faculty items (recent)
      faculty.forEach((t, idx) => {
        const fallbackMs = now - (idx === 0 ? 0 : idx === 1 ? 2 * 60 * 1000 : (idx + 1) * 10 * 60 * 1000);
        const dateObj = t.createdAt ? new Date(t.createdAt) : new Date(fallbackMs);
        const validDate = isNaN(dateObj.getTime()) ? new Date(fallbackMs) : dateObj;
        list.push({
          id: `act-t-${t._id || t.id || idx}`,
          category: 'staff',
          title: 'Teacher On Duty',
          description: `${t.name} (${t.designation || 'Teacher'}) active on duty`,
          rawDate: validDate,
          time: timeAgo(validDate),
          icon: GraduationCap,
          tone: 'purple',
        });
      });

      // System routine item
      const routineDate = new Date(now - 2 * 3600 * 1000);
      list.push({
        id: 'act-sys-routine',
        category: 'academic',
        title: 'Academic Routine Active',
        description: 'Daily timetable and attendance registers active',
        rawDate: routineDate,
        time: 'Today',
        icon: Clock,
        tone: 'blue',
      });

      // Students items (older - 2d ago)
      students.forEach((s, idx) => {
        const fallbackMs = now - (2 * 24 * 3600 * 1000 + idx * 3600 * 1000);
        const dateObj = s.createdAt ? new Date(s.createdAt) : new Date(fallbackMs);
        const validDate = isNaN(dateObj.getTime()) ? new Date(fallbackMs) : dateObj;
        list.push({
          id: `act-s-${s._id || s.id || idx}`,
          category: 'students',
          title: idx === 0 ? 'Student Enrolled' : 'Student Record Active',
          description: isSchool
            ? `${s.name} enrolled in ${s.gradeOrClass || 'Grade 10'} — Section ${s.section || 'A'}`
            : `${s.name} (${s.roll || 'ID'}) enrolled in ${s.program || 'Program'}`,
          rawDate: validDate,
          time: timeAgo(validDate),
          icon: idx === 0 ? UserPlus : UserCheck,
          tone: s.status === 'Active' ? 'green' : 'amber',
          studentName: s.name,
        });
      });
    }

    // STRICTLY SORT BY rawDate DESCENDING (Latest first on top!)
    return list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [activityLogs, isSchool, students, faculty]);

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

  const handleFilterClick = (key) => {
    setFilter(key);
    dispatch(fetchActivityLogs({ category: key, page: 1, limit: 8, append: false }));
  };

  const handleFeedScroll = (e) => {
    if (!hasMore || isFetchingMore || activityLogs.length === 0) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      dispatch(
        fetchActivityLogs({
          category: filter,
          page: currentPage + 1,
          limit: 8,
          append: true,
        })
      );
    }
  };

  return (
    <aside className="campus-activity-sidebar" aria-label="Campus Activity and Audit Logs">
      {/* Sidebar Header */}
      <div className="activity-sidebar-header">
        <div className="activity-title-group">
          <h2 className="activity-heading">Campus Activity & Logs</h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="activity-filter-bar">
        {[
          { key: 'all', label: 'All' },
          { key: 'students', label: 'Students' },
          { key: 'staff', label: 'Staff' },
          { key: 'academic', label: 'Academic' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'fees', label: 'Fees' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`activity-filter-chip ${filter === key ? 'is-active' : ''}`}
            onClick={() => handleFilterClick(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List (Streaming Scroll) */}
      <div className="activity-feed-list" onScroll={handleFeedScroll}>
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

        {isFetchingMore && (
          <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SpinnerCustom text="Streaming older logs..." size="sm" />
          </div>
        )}

        {!hasMore && filteredActivities.length > 0 && !isFetchingMore && (
          <div style={{ padding: '14px 12px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: '500' }}>
            • End of activity logs •
          </div>
        )}

        {filteredActivities.length === 0 && !isFetchingMore && (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: '#a1a1aa', fontSize: '12px' }}>
            No activity logs found for this filter.
          </div>
        )}
      </div>
    </aside>
  );
}
