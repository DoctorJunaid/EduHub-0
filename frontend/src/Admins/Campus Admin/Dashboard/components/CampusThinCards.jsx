import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Layers,
  Clock,
} from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';

export default function CampusThinCards({
  students = [],
  faculty = [],
  timetable = [],
  onSelectCard,
  activeCardId = 'students-card',
}) {
  const { isSchool } = useInstitution();

  const distinctGrades = [
    ...new Set(
      students
        .map((s) => s.gradeOrClass || s.program)
        .filter(Boolean)
    ),
  ].length;

  const schoolCards = [
    {
      id: 'students-card',
      icon: Users,
      label: 'Enrolled Pupils',
      primaryMetric: `${students.length} ${students.length === 1 ? 'Pupil' : 'Pupils'}`,
    },
    {
      id: 'faculty-card',
      icon: GraduationCap,
      label: 'Teaching Staff',
      primaryMetric: `${faculty.length} ${faculty.length === 1 ? 'Teacher' : 'Teachers'}`,
    },
    {
      id: 'classes-card',
      icon: Layers,
      label: 'Classes & Sections',
      primaryMetric: `${distinctGrades || 5} Grades Active`,
    },
    {
      id: 'timetable-card',
      icon: Clock,
      label: 'Daily Routine',
      primaryMetric: '7 Daily Periods',
    },
  ];

  const universityCards = [
    {
      id: 'students-card',
      icon: Users,
      label: 'Enrolled Students',
      primaryMetric: `${students.length} Students`,
    },
    {
      id: 'faculty-card',
      icon: GraduationCap,
      label: 'Appointed Faculty',
      primaryMetric: `${faculty.length} Faculty`,
    },
    {
      id: 'programs-card',
      icon: BookOpen,
      label: 'Degree Programs',
      primaryMetric: `${distinctGrades || 4} Programs`,
    },
    {
      id: 'timetable-card',
      icon: CalendarDays,
      label: 'Class & Lab Sessions',
      primaryMetric: `${timetable.length || 18} Sessions`,
    },
  ];

  const cardData = isSchool ? schoolCards : universityCards;

  return (
    <div className="campus-thin-cards-container" aria-label="Campus Performance Indicators">
      <div className="campus-thin-cards-track">
        {cardData.map((card) => {
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
