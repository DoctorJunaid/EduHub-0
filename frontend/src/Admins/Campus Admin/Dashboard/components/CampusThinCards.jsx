import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Building2,
} from 'lucide-react';

const CARD_DATA = [
  {
    id: 'students-card',
    icon: Users,
    label: 'Enrolled Students',
    primaryMetric: '1,248',
  },
  {
    id: 'faculty-card',
    icon: GraduationCap,
    label: 'Appointed Teachers',
    primaryMetric: '86',
  },
  {
    id: 'programs-card',
    icon: BookOpen,
    label: 'Degree Programs',
    primaryMetric: '4 Programs',
  },
  {
    id: 'timetable-card',
    icon: CalendarDays,
    label: 'Class & Lab Sessions',
    primaryMetric: '42 Sessions',
  },
  {
    id: 'campus-card',
    icon: Building2,
    label: 'Campus Operations',
    primaryMetric: 'Operational',
  },
];

export default function CampusThinCards({ onSelectCard, activeCardId = 'students-card' }) {
  return (
    <div className="campus-thin-cards-container" aria-label="Campus Performance Indicators">
      <div className="campus-thin-cards-track">
        {CARD_DATA.map((card) => {
          const Icon = card.icon;
          const isActive = activeCardId === card.id;

          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectCard?.(card.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectCard?.(card.id);
                }
              }}
              className={`campus-thin-card ${isActive ? 'is-active' : ''}`}
            >
              {/* Minimal Top Row: Category Label & Minimal Icon Pill */}
              <div className="card-top-row">
                <span className="card-stat-label">{card.label}</span>
                <div className="card-icon-pill">
                  <Icon size={14} aria-hidden="true" />
                </div>
              </div>

              {/* Main Metric */}
              <div className="card-body-block">
                <div className="card-primary-metric">{card.primaryMetric}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

