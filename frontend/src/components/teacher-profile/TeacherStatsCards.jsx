import React from "react";
import { BookOpen, Clock, CalendarCheck, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function TeacherStatsCards({ stats = {} }) {
  const {
    totalClasses = 0,
    weeklyPeriods = 0,
    attendanceRate30d = 100,
    attendanceTrend = 0,
    substituteDuties30d = 0,
  } = stats;

  const isPositiveTrend = attendanceTrend >= 0;

  return (
    <div className="campus-kpi-track">
      {/* 1. Classes Assigned */}
      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <BookOpen size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Classes Assigned</span>
            <span className="kpi-value">{totalClasses}</span>
          </div>
        </div>
      </div>

      {/* 2. Weekly Teaching Load */}
      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <Clock size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Weekly Load</span>
            <span className="kpi-value">{weeklyPeriods} Periods</span>
          </div>
        </div>
      </div>

      {/* 3. 30-Day Attendance */}
      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <CalendarCheck size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Attendance (30D)</span>
            <span className="kpi-value">{attendanceRate30d}%</span>
          </div>
        </div>
      </div>

      {/* 4. Substitute Duties Covered */}
      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <Users size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Substitute Duties</span>
            <span className="kpi-value">{substituteDuties30d} Covered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
