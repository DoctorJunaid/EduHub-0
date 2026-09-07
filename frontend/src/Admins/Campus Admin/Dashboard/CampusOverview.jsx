import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FacultyForm from '@/Admins/Campus Admin/Faculty/FacultyForm';
import { facultyRecords as demoRecords } from '@/Admins/Campus Admin/Faculty/facultyData.js';
import { selectFaculty, facultyAdded } from '@/store/Slices/facultySlice.js';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  MapPin,
  Megaphone,
  Plus,
  ReceiptText,
  UserRound,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import OverviewStatCard from "../../../components/campus-overview/components/OverviewStatCard";
import CampusTimetable from "./components/CampusTimetable";
import CampusStudentTable from "./components/CampusStudentTable";
import "./CampusOverview.css";

const stats = [
  {
    icon: Users,
    value: "1,248",
    label: "Total Enrolled Students",
    change: "14.2%",
    period: "month",
    trend:
      "2,35 10,22 18,27 25,29 33,22 41,15 49,16 58,20 66,15 74,10 83,10 94,4",
  },
  {
    icon: UserRound,
    value: "86",
    label: "Faculty Members",
    change: "8.6%",
    period: "month",
    trend:
      "2,35 12,25 22,30 30,24 38,10 46,18 55,23 63,18 72,12 81,7 88,10 97,4",
  },
  {
    icon: CreditCard,
    value: "PKR 4.82M",
    label: "Tuition Collected",
    change: "12.4%",
    period: "term",
    trend:
      "2,35 10,23 18,25 26,30 34,25 43,17 51,21 59,16 67,13 75,18 83,15 89,3",
  },
  {
    icon: CalendarDays,
    value: "42",
    label: "Active Class Schedules",
    change: "5.1%",
    period: "week",
    trend:
      "2,35 10,27 17,28 24,22 31,27 39,13 47,23 55,18 63,13 71,12 79,6 87,10 94,15",
  },
];
const shortcuts = [
  { label: "Students Directory", icon: Users },
  { label: "Faculty Directory", icon: UserRoundCheck, path: '/faculty' },
  { label: "Class Timetable", icon: CalendarDays },
  { label: "Fee Management", icon: Wallet },
];

export default function CampusOverview() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const faculty = useSelector(selectFaculty);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const options = Object.fromEntries(['designation', 'department', 'campus'].map((key) => [key, [...new Set([...demoRecords, ...faculty].map((teacher) => teacher[key]))]]));
  return (
    <section
      className="campus-overview"
      aria-label="Campus overview demonstration"
    >
      <Card className="overview-card overview-hero">
        <div>
          <div className="overview-campus-meta">
            <span className="overview-operational">
              <i />
              Operational Campus
            </span>
            <span className="overview-institute">
              <Building2 size={12} />
              NUST (National University of Sciences and Technology)
            </span>
          </div>
          <h1>NUST Main Campus (H-12)</h1>
          <p className="overview-location">
            <MapPin size={15} />
            Sector H-12, Islamabad
          </p>
        </div>
        <div className="overview-hero-actions">
          <Button variant="outline" className="overview-button" disabled>
            <Download size={16} />
            Export
            <ChevronDown size={13} />
          </Button>
          <Button className="overview-button overview-primary" disabled>
            <Plus size={17} />
            Add Student
          </Button>
          <Button
            className="overview-button overview-primary overview-teacher"
            onClick={() => setAddingTeacher(true)}
          >
            <Plus size={17} />
            Add Teacher
          </Button>
        </div>
      </Card>
      <div className="overview-stats">
        {stats.map((stat) => (
          <OverviewStatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="overview-shortcuts">
        {shortcuts.map(({ label, icon: Icon, path }) => (
          <Button
            key={label}
            variant="outline"
            className="overview-shortcut"
            disabled={!path}
            onClick={path ? () => navigate(path) : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
            <ArrowRight size={17} />
          </Button>
        ))}
      </div>
      <div className="overview-tables">
        <CampusTimetable />
        <CampusStudentTable />
      </div>
      <div className="overview-bottom">
        <Card className="overview-card overview-announcement">
          <Megaphone size={27} />
          <div>
            <h2>Campus Announcement</h2>
            <p>Mid-term examinations will start from 15th June 2025.</p>
          </div>
          <Button variant="ghost" className="overview-text-button" disabled>
            View All
            <ArrowRight size={13} />
          </Button>
        </Card>
        <Card className="overview-card overview-fees">
          <h2>
            <ReceiptText size={19} />
            Fee Collection
          </h2>
          <p>78% of term fee collected</p>
          <div className="overview-progress-row">
            <progress value={78} max={100} aria-label="Term fee collected">
              78%
            </progress>
            <span>78%</span>
          </div>
        </Card>
        <Card className="overview-card overview-system">
          <span className="overview-check">
            <Check size={12} />
          </span>
          <div>
            <h2>System Status</h2>
            <p>All systems operational</p>
          </div>
        </Card>
      </div>
      {addingTeacher && <FacultyForm options={options} onClose={() => setAddingTeacher(false)} onSave={(values) => { dispatch(facultyAdded(values)); setAddingTeacher(false); }} />}
    </section>
  );
}
