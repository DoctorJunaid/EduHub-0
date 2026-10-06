import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  Award,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function StudentSubjectDetailModal({ course, open, onOpenChange }) {
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
        { unit: "Unit 1", name: "Matrices and Determinants", marks: "12 Marks", status: "Completed" },
        { unit: "Unit 2", name: "Real and Complex Numbers", marks: "10 Marks", status: "In Progress" },
        { unit: "Unit 3", name: "Logarithms & Scientific Notation", marks: "8 Marks", status: "Upcoming" },
        { unit: "Unit 4", name: "Algebraic Expressions and Formulas", marks: "15 Marks", status: "Upcoming" },
        { unit: "Unit 5", name: "Factorization & Linear Equations", marks: "15 Marks", status: "Upcoming" },
        { unit: "Unit 6", name: "Basic Geometry, Triangles & Coordinate Geometry", marks: "15 Marks", status: "Upcoming" },
      ];
    }
    if (t.includes("physic")) {
      return [
        { unit: "Chapter 1", name: "Physical Quantities and Measurements", marks: "10 Marks", status: "Completed" },
        { unit: "Chapter 2", name: "Kinematics & Motion Graphs", marks: "12 Marks", status: "In Progress" },
        { unit: "Chapter 3", name: "Dynamics, Newton's Laws & Friction", marks: "15 Marks", status: "Upcoming" },
        { unit: "Chapter 4", name: "Turning Effect of Forces & Torque", marks: "12 Marks", status: "Upcoming" },
        { unit: "Chapter 5", name: "Gravitation & Satellite Motion", marks: "10 Marks", status: "Upcoming" },
        { unit: "Practicals", name: "Vernier Calipers, Screw Gauge & Pendulum Lab", marks: "16 Marks", status: "In Progress" },
      ];
    }
    if (t.includes("chem")) {
      return [
        { unit: "Chapter 1", name: "Fundamentals of Chemistry & Mole Concept", marks: "12 Marks", status: "Completed" },
        { unit: "Chapter 2", name: "Structure of Atoms & Electronic Config", marks: "12 Marks", status: "In Progress" },
        { unit: "Chapter 3", name: "Periodic Table and Periodicity of Properties", marks: "10 Marks", status: "Upcoming" },
        { unit: "Chapter 4", name: "Structure of Molecules & Chemical Bonding", marks: "14 Marks", status: "Upcoming" },
        { unit: "Practicals", name: "Filtration, Crystallization & Melting Point Lab", marks: "15 Marks", status: "Upcoming" },
      ];
    }
    if (t.includes("computer") || t.includes("cs")) {
      return [
        { unit: "Unit 1", name: "Fundamentals of Computer Systems & Memory", marks: "12 Marks", status: "Completed" },
        { unit: "Unit 2", name: "Data Communications & Networking", marks: "14 Marks", status: "In Progress" },
        { unit: "Unit 3", name: "Office Automation & Database Concepts", marks: "12 Marks", status: "Upcoming" },
        { unit: "Unit 4", name: "Algorithms, Flowcharts & Logic Design", marks: "15 Marks", status: "Upcoming" },
        { unit: "Lab Practicals", name: "Programming Environment & IT Applications", marks: "22 Marks", status: "In Progress" },
      ];
    }
    if (t.includes("bio")) {
      return [
        { unit: "Chapter 1", name: "Introduction to Biology & Careers", marks: "8 Marks", status: "Completed" },
        { unit: "Chapter 2", name: "Solving a Biological Problem", marks: "8 Marks", status: "Completed" },
        { unit: "Chapter 3", name: "Biodiversity & Classification", marks: "12 Marks", status: "In Progress" },
        { unit: "Chapter 4", name: "Cells and Tissues", marks: "16 Marks", status: "Upcoming" },
        { unit: "Practicals", name: "Microscopy & Tissue Slide Preparation Lab", marks: "15 Marks", status: "Upcoming" },
      ];
    }
    if (t.includes("english")) {
      return [
        { unit: "Prose", name: "Lessons: Prophet Muhammad (PBUH), Quaid's Vision", marks: "25 Marks", status: "In Progress" },
        { unit: "Poetry", name: "Daffodils, Stopping by Woods on a Snowy Evening", marks: "15 Marks", status: "Upcoming" },
        { unit: "Grammar", name: "Direct/Indirect Speech, Active/Passive Voice, Tenses", marks: "20 Marks", status: "In Progress" },
        { unit: "Composition", name: "Essays, Letters, Comprehension & Translation", marks: "15 Marks", status: "Upcoming" },
      ];
    }
    return [
      { unit: "Module 1", name: "Core Fundamentals & Introductory Concepts", marks: "20 Marks", status: "Completed" },
      { unit: "Module 2", name: "Intermediate Theory & Analytical Studies", marks: "30 Marks", status: "In Progress" },
      { unit: "Module 3", name: "Comprehensive Revision & Board Exam Model Papers", marks: "25 Marks", status: "Upcoming" },
    ];
  };

  const topics = getSyllabusTopics(course.title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <GraduationCap className="w-48 h-48" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold">
              {course.code || "SSC-9"}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 text-xs">
              {course.category || "Compulsory"}
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 text-xs">
              {course.curriculum || "BISE Peshawar Board"}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white mb-1">
            {course.title}
          </DialogTitle>
          <DialogDescription className="text-zinc-300 text-sm max-w-lg">
            {course.description || "Official Peshawar Board Secondary School Curriculum and Assessment Guide."}
          </DialogDescription>
        </div>

        {/* Modal Body Tabs */}
        <div className="p-6">
          <Tabs defaultValue="syllabus" className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl mb-4">
              <TabsTrigger value="syllabus" className="text-xs sm:text-sm font-medium rounded-lg">
                Syllabus
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs sm:text-sm font-medium rounded-lg">
                Timetable
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs sm:text-sm font-medium rounded-lg">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="teacher" className="text-xs sm:text-sm font-medium rounded-lg">
                Teacher
              </TabsTrigger>
            </TabsList>

            {/* SYLLABUS TAB */}
            <TabsContent value="syllabus" className="space-y-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Prescribed Textbook</h4>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">KPK Textbook Board, Peshawar</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Standard curriculum authorized for SSC Part I/II Examinations under the Board of Intermediate and Secondary Education (BISE) Peshawar.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Board Exam Breakdown & Units</h4>
                <div className="space-y-2">
                  {topics.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-500 w-16">{item.unit}</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                          {item.marks}
                        </span>
                        <Badge
                          variant={item.status === "Completed" ? "default" : item.status === "In Progress" ? "secondary" : "outline"}
                          className="text-[11px] font-medium"
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
            <TabsContent value="schedule" className="space-y-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/40">
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Class Schedule & Venue</h4>
                <p className="text-xs text-zinc-500">
                  Weekly active class slots assigned for {course.grade || "Class 9"} ({course.section || "Section A"}).
                </p>
              </div>

              <div className="space-y-3">
                {routines.length > 0 ? (
                  routines.map((r, i) => (
                    <div
                      key={r.id || i}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                          <Clock3 className="w-4 h-4 text-indigo-600" />
                          <span>{r.schedule}</span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-indigo-50/50 text-indigo-700 dark:text-indigo-300 border-indigo-200">
                          Live Class
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Venue: <strong className="text-zinc-800 dark:text-zinc-200">{r.room}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Instructor: <strong className="text-zinc-800 dark:text-zinc-200">{r.instructor}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-500 border rounded-xl">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                    <p className="text-sm font-medium">Schedule is being updated by Campus Administration.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ATTENDANCE TAB */}
            <TabsContent value="attendance" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                  <span className="text-xs text-zinc-500 block mb-1">Attendance Rate</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {attendance.rate != null ? `${attendance.rate}%` : "92%"}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                  <span className="text-xs text-zinc-500 block mb-1">Classes Attended</span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {attendance.present || 18}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                  <span className="text-xs text-zinc-500 block mb-1">Total Delivered</span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {attendance.marked || 20}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Good Academic Standing</h5>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Your attendance is above the mandatory 75% requirement for Peshawar Board SSC examination eligibility.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TEACHER TAB */}
            <TabsContent value="teacher" className="space-y-4">
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {instructor.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{instructor.name}</h4>
                    <p className="text-xs text-zinc-500">{instructor.designation} · {instructor.department || course.title}</p>
                    <Badge variant="secondary" className="mt-1 text-[11px]">
                      Campus Faculty
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>Email: <strong className="text-zinc-800 dark:text-zinc-200">{instructor.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span>Office Contact: <strong className="text-zinc-800 dark:text-zinc-200">{instructor.phone}</strong></span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-b-2xl flex justify-between items-center">
          <span className="text-xs text-zinc-500">
            Total Marks: <strong>{course.totalMarks || 75}</strong> · Credit Hours: <strong>{course.creditHours || 4}</strong>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
