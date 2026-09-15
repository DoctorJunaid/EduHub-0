import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const MONTHLY_ATTENDANCE = [
  { month: 'Jul', present: 91, absent: 9, inClass: '1,135' },
  { month: 'Aug', present: 95, absent: 5, inClass: '1,185' },
  { month: 'Sep', present: 98, absent: 2, inClass: '1,198' },
  { month: 'Oct', present: 94, absent: 6, inClass: '1,173' },
  { month: 'Nov', present: 93, absent: 7, inClass: '1,160' },
  { month: 'Dec', present: 95, absent: 5, inClass: '1,185' },
];

export default function CampusAnalyticsCharts() {
  const [attendanceTimeframe, setAttendanceTimeframe] = useState('Monthly');
  const [activeMonthHover, setActiveMonthHover] = useState(null);

  return (
    <div className="campus-analytics-grid h-full">
      {/* Student Attendance & Campus Presence Overview */}
      <Card className="campus-analytics-card h-full">
        <div className="analytics-card-header">
          <div className="analytics-header-left">
            <h3 className="analytics-title">Attendance</h3>
          </div>

          <div className="analytics-header-right">
            <div className="timeframe-dropdown-wrapper">
              <button
                type="button"
                className="timeframe-select-trigger"
                onClick={() =>
                  setAttendanceTimeframe((prev) =>
                    prev === 'Monthly' ? 'Weekly' : 'Monthly'
                  )
                }
              >
                <span>{attendanceTimeframe}</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="analytics-compact-stats">
          <div className="stat-block">
            <div className="stat-value ">94.2%</div>
            <div className="stat-label ">Present</div>
          </div>
          <div className="stat-block">
            <div className="stat-value opacity-50">5.8%</div>
            <div className="stat-label opacity-50">Absent</div>
          </div>
        </div>

        {/* Attendance Bar Chart Container */}
        <div className="analytics-chart-body compact-chart">
          {/* Background Grid Lines */}
          <div className="compact-grid-line bottom-line" />
          <div className="compact-grid-line mid-line" />

          {/* Bar Columns Container */}
          <div className="attendance-bars-container">
            {MONTHLY_ATTENDANCE.map((item) => {
              const isHovered = activeMonthHover?.month === item.month;
              return (
                <div
                  key={item.month}
                  className={`attendance-bar-col ${isHovered ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveMonthHover(item)}
                  onMouseLeave={() => setActiveMonthHover(null)}
                >
                  <div className="bar-track-wrapper">
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="bar-floating-tooltip">
                        <div className="tooltip-month">{item.month} Attendance</div>
                        <div className="tooltip-stat">
                          <span className="dot income" />
                          <span>Present: {item.present}%</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot expense" />
                          <span>Absent: {item.absent}%</span>
                        </div>
                      </div>
                    )}

                    {/* Present bar segment only for super compact view */}
                    <div
                      className="bar-segment income-bar"
                      style={{ height: `${item.present}%` }}
                    />
                  </div>

                  <span className={`bar-x-label ${isHovered || item.month === 'Sep' ? 'active-label' : ''}`}>{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
