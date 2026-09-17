import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
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
              <div className="card-centered-wrap">
                <div className="card-icon-pill">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div className="card-info-stack">
                  <span className="card-stat-label">{card.label}</span>
                  <div className="card-primary-metric">{card.primaryMetric}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

