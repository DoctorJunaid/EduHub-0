import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Clock3,
  MapPin,
  User,
  GraduationCap,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import "./StudentSubjectDetailModal.css";

export default function StudentSubjectDetailModal({
  course,
  open,
  onOpenChange,
}) {
  if (!course) return null;

  const attendance = course.attendance || { present: 0, marked: 0, rate: null };
  const routines = course.routines || [];
  const instructor = course.instructorObj || {
    name: course.instructor || "Assigned Faculty",
    designation: "Subject Teacher",
    department: course.title,
    email: `${course.instructor?.toLowerCase().replace(/\s+/g, ".") || "faculty"}@eduhub.com`,
    phone: "+92 300 1234567",
  };

  const getSyllabusTopics = (title) => {
    const t = (title || "").toLowerCase();
    if (t.includes("math")) {
      return [
        {
          unit: "Unit 1",
          name: "Matrices and Determinants",
          marks: "12 Marks",
          status: "Completed",
        },
        {
          unit: "Unit 2",
          name: "Real and Complex Numbers",
          marks: "10 Marks",
          status: "In Progress",
        },
        {
          unit: "Unit 3",
          name: "Logarithms & Scientific Notation",
          marks: "8 Marks",
          status: "Upcoming",
        },
        {
          unit: "Unit 4",
          name: "Algebraic Expressions and Formulas",
          marks: "15 Marks",
          status: "Upcoming",
        },
        {
          unit: "Unit 5",
          name: "Factorization & Linear Equations",
          marks: "15 Marks",
          status: "Upcoming",
        },
        {
          unit: "Unit 6",
          name: "Basic Geometry, Triangles & Coordinate Geometry",
          marks: "15 Marks",
          status: "Upcoming",
        },
      ];
    }
    if (t.includes("physic")) {
      return [
        {
          unit: "Chapter 1",
          name: "Physical Quantities and Measurements",
          marks: "10 Marks",
          status: "Completed",
        },
        {
          unit: "Chapter 2",
          name: "Kinematics & Motion Graphs",
          marks: "12 Marks",
          status: "In Progress",
        },
        {
          unit: "Chapter 3",
          name: "Dynamics, Newton's Laws & Friction",
          marks: "15 Marks",
          status: "Upcoming",
        },
        {
          unit: "Chapter 4",
          name: "Turning Effect of Forces & Torque",
          marks: "12 Marks",
          status: "Upcoming",
        },
        {
          unit: "Chapter 5",
          name: "Gravitation & Satellite Motion",
          marks: "10 Marks",
          status: "Upcoming",
        },
        {
          unit: "Practicals",
          name: "Vernier Calipers, Screw Gauge & Pendulum Lab",
          marks: "16 Marks",
          status: "In Progress",
        },
      ];
    }
    if (t.includes("chem")) {
      return [
        {
          unit: "Chapter 1",
          name: "Fundamentals of Chemistry & Mole Concept",
          marks: "12 Marks",
          status: "Completed",
        },
        {
          unit: "Chapter 2",
          name: "Structure of Atoms & Electronic Config",
          marks: "12 Marks",
          status: "In Progress",
        },
        {
          unit: "Chapter 3",
          name: "Periodic Table and Periodicity of Properties",
          marks: "10 Marks",
          status: "Upcoming",
        },
        {
          unit: "Chapter 4",
          name: "Structure of Molecules & Chemical Bonding",
          marks: "14 Marks",
          status: "Upcoming",
        },
        {
          unit: "Practicals",
          name: "Filtration, Crystallization & Melting Point Lab",
          marks: "15 Marks",
          status: "Upcoming",
        },
      ];
    }
    if (t.includes("computer") || t.includes("cs")) {
      return [
        {
          unit: "Unit 1",
          name: "Fundamentals of Computer Systems & Memory",
          marks: "12 Marks",
          status: "Completed",
        },
        {
          unit: "Unit 2",
          name: "Data Communications & Networking",
          marks: "14 Marks",
          status: "In Progress",
        },
        {
          unit: "Unit 3",
          name: "Office Automation & Database Concepts",
          marks: "12 Marks",
          status: "Upcoming",
        },
        {
          unit: "Unit 4",
          name: "Algorithms, Flowcharts & Logic Design",
          marks: "15 Marks",
          status: "Upcoming",
        },
        {
          unit: "Lab Practicals",
          name: "Programming Environment & IT Applications",
          marks: "22 Marks",
          status: "In Progress",
        },
      ];
    }
    if (t.includes("bio")) {
      return [
        {
          unit: "Chapter 1",
          name: "Introduction to Biology & Careers",
          marks: "8 Marks",
          status: "Completed",
        },
        {
          unit: "Chapter 2",
          name: "Solving a Biological Problem",
          marks: "8 Marks",
          status: "Completed",
        },
        {
          unit: "Chapter 3",
          name: "Biodiversity & Classification",
          marks: "12 Marks",
          status: "In Progress",
        },
        {
          unit: "Chapter 4",
          name: "Cells and Tissues",
          marks: "16 Marks",
          status: "Upcoming",
        },
        {
          unit: "Practicals",
          name: "Microscopy & Tissue Slide Preparation Lab",
          marks: "15 Marks",
          status: "Upcoming",
        },
      ];
    }
    if (t.includes("english")) {
      return [
        {
          unit: "Prose",
          name: "Lessons: Prophet Muhammad (PBUH), Quaid's Vision",
          marks: "25 Marks",
          status: "In Progress",
        },
        {
          unit: "Poetry",
          name: "Daffodils, Stopping by Woods on a Snowy Evening",
          marks: "15 Marks",
          status: "Upcoming",
        },
        {
          unit: "Grammar",
          name: "Direct/Indirect Speech, Active/Passive Voice, Tenses",
          marks: "20 Marks",
          status: "In Progress",
        },
        {
          unit: "Composition",
          name: "Essays, Letters, Comprehension & Translation",
          marks: "15 Marks",
          status: "Upcoming",
        },
      ];
    }
    return [
      {
        unit: "Module 1",
        name: "Core Fundamentals & Introductory Concepts",
        marks: "20 Marks",
        status: "Completed",
      },
      {
        unit: "Module 2",
        name: "Intermediate Theory & Analytical Studies",
        marks: "30 Marks",
        status: "In Progress",
      },
      {
        unit: "Module 3",
        name: "Comprehensive Revision & Board Exam Model Papers",
        marks: "25 Marks",
        status: "Upcoming",
      },
    ];
  };

  const topics = getSyllabusTopics(course.title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="student-subject-dialog">
        <div className="student-subject-header">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <GraduationCap className="w-48 h-48" />
          </div>
          <div className="student-subject-badges">
            <Badge className="student-subject-code">
              {course.code || "SSC-9"}
            </Badge>
            <Badge className="student-subject-category">
              {course.category || "Compulsory"}
            </Badge>
            <Badge className="student-subject-board">
              {course.curriculum || "BISE Peshawar Board"}
            </Badge>
          </div>
          <DialogTitle className="student-subject-title">
            {course.title}
          </DialogTitle>
          <DialogDescription className="student-subject-description">
            {course.description ||
              "Official Peshawar Board Secondary School Curriculum and Assessment Guide."}
          </DialogDescription>
        </div>

        <div className="student-subject-body">
          <Tabs defaultValue="syllabus" className="student-subject-tabs">
            <TabsList className="student-subject-tabs-list">
              <TabsTrigger value="syllabus" className="student-subject-tab">
                Syllabus
              </TabsTrigger>
              <TabsTrigger value="schedule" className="student-subject-tab">
                Timetable
              </TabsTrigger>
              <TabsTrigger value="attendance" className="student-subject-tab">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="teacher" className="student-subject-tab">
                Teacher
              </TabsTrigger>
            </TabsList>

            {/* SYLLABUS TAB */}
            <TabsContent
              value="syllabus"
              className="student-subject-tab-content"
            >
              <div className="student-subject-textbook">
                <div className="student-subject-textbook-heading">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      Prescribed Textbook
                    </h4>
                  </div>
                  <span className="student-subject-textbook-source">
                    KPK Textbook Board, Peshawar
                  </span>
                </div>
                <p className="student-subject-textbook-description">
                  Standard curriculum authorized for SSC Part I/II Examinations
                  under the Board of Intermediate and Secondary Education (BISE)
                  Peshawar.
                </p>
              </div>

              <div className="student-subject-topics">
                <h4 className="student-subject-section-heading">
                  Board Exam Breakdown &amp; Units
                </h4>
                <div className="student-subject-topic-list">
                  {topics.map((item, idx) => (
                    <div key={idx} className="student-subject-topic-row">
                      <div className="student-subject-topic-main">
                        <span className="student-subject-topic-unit">
                          {item.unit}
                        </span>
                        <span className="student-subject-topic-name">
                          {item.name}
                        </span>
                      </div>
                      <div className="student-subject-topic-meta">
                        <span className="student-subject-topic-marks">
                          {item.marks}
                        </span>
                        <Badge
                          variant={
                            item.status === "Completed"
                              ? "default"
                              : item.status === "In Progress"
                                ? "secondary"
                                : "outline"
                          }
                          className="student-subject-topic-status"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TIMETABLE TAB */}
            <TabsContent
              value="schedule"
              className="student-subject-tab-content"
            >
              <div className="student-subject-schedule-intro">
                <h4>Class Schedule &amp; Venue</h4>
                <p>
                  Weekly active class slots assigned for{" "}
                  {course.grade || "Class 9"} ({course.section || "Section A"}).
                </p>
              </div>

              <div className="student-subject-routine-list">
                {routines.length > 0 ? (
                  routines.map((r, i) => (
                    <div key={r.id || i} className="student-subject-routine">
                      <div className="student-subject-routine-heading">
                        <div className="student-subject-routine-time">
                          <Clock3 aria-hidden="true" />
                          <span>{r.schedule}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="student-subject-live-badge"
                        >
                          Live Class
                        </Badge>
                      </div>
                      <div className="student-subject-routine-details">
                        <div>
                          <MapPin aria-hidden="true" />
                          <span>
                            Venue:{" "}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {r.room}
                            </strong>
                          </span>
                        </div>
                        <div>
                          <User aria-hidden="true" />
                          <span>
                            Instructor:{" "}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {r.instructor}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="student-subject-empty">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                    <p className="text-sm font-medium">
                      Schedule is being updated by Campus Administration.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ATTENDANCE TAB */}
            <TabsContent
              value="attendance"
              className="student-subject-tab-content"
            >
              <div className="student-subject-attendance-stats">
                <div className="student-subject-attendance-stat">
                  <span className="text-xs text-zinc-500 block mb-1">
                    Attendance Rate
                  </span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {attendance.rate != null ? `${attendance.rate}%` : "92%"}
                  </span>
                </div>
                <div className="student-subject-attendance-stat">
                  <span className="text-xs text-zinc-500 block mb-1">
                    Classes Attended
                  </span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {attendance.present || 18}
                  </span>
                </div>
                <div className="student-subject-attendance-stat">
                  <span className="text-xs text-zinc-500 block mb-1">
                    Total Delivered
                  </span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {attendance.marked || 20}
                  </span>
                </div>
              </div>

              <div className="student-subject-attendance-note">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">
                    Good Academic Standing
                  </h5>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Your attendance is above the mandatory 75% requirement for
                    Peshawar Board SSC examination eligibility.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TEACHER TAB */}
            <TabsContent
              value="teacher"
              className="student-subject-tab-content"
            >
              <div className="student-subject-teacher-card">
                <div className="student-subject-teacher-heading">
                  <div className="student-subject-teacher-avatar">
                    {instructor.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="student-subject-teacher-copy">
                    <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      {instructor.name}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {instructor.designation} ·{" "}
                      {instructor.department || course.title}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-[11px]">
                      Campus Faculty
                    </Badge>
                  </div>
                </div>

                <div className="student-subject-teacher-contact">
                  <div>
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>
                      Email:{" "}
                      <strong className="text-zinc-800 dark:text-zinc-200">
                        {instructor.email}
                      </strong>
                    </span>
                  </div>
                  <div>
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span>
                      Office Contact:{" "}
                      <strong className="text-zinc-800 dark:text-zinc-200">
                        {instructor.phone}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="student-subject-footer">
          <span>
            Total Marks: <strong>{course.totalMarks || 75}</strong> · Credit
            Hours: <strong>{course.creditHours || 4}</strong>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="student-subject-close-button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
