/**
 * Global Search Controller
 * Provides lightning-fast, multi-collection search across the EduHub ecosystem.
 */
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";
import { Grade, Subject } from "../models/academic.model.js";
import Inquiry from "../models/inqueries.model.js";
import Plan from "../models/plan.model.js";
import SupportTicket from "../models/supportTicket.model.js";
import Alert from "../models/alert.model.js";

// Static quick navigation links based on user role
const getNavigationLinks = (role) => {
  const commonLinks = [
    { title: "Help & Support", subtitle: "Support tickets, documentation & help desk", url: "/support", role: "all", icon: "life-buoy", categoryLabel: "Pages & Navigation" },
    { title: "Settings", subtitle: "Account preferences and platform settings", url: "/settings", role: "all", icon: "settings", categoryLabel: "Pages & Navigation" },
  ];

  const roleLinks = {
    super_admin: [
      { title: "Super Admin Dashboard", subtitle: "Master overview & system metrics", url: "/super-admin", icon: "layout-dashboard", categoryLabel: "Pages & Navigation" },
      { title: "Institutes Directory", subtitle: "View, filter and manage registered institutes", url: "/institutes", icon: "building", categoryLabel: "Pages & Navigation" },
      { title: "+ Add New Institute", subtitle: "Onboard and register a new educational network", url: "/institutes/new", icon: "plus-circle", categoryLabel: "Quick Actions" },
      { title: "SaaS Plans & Pricing", subtitle: "Configure subscription tiers and quotas", url: "/super-admin/plans", icon: "credit-card", categoryLabel: "Pages & Navigation" },
      { title: "Active Subscriptions", subtitle: "Track institution billing and renewals", url: "/super-admin/subscriptions", icon: "file-text", categoryLabel: "Pages & Navigation" },
      { title: "Global Users Directory", subtitle: "Cross-network user management and roles", url: "/super-admin/users", icon: "users", categoryLabel: "Pages & Navigation" },
      { title: "Inquiries & Leads", subtitle: "Review prospective institution signups", url: "/super-admin/inquiries", icon: "inbox", categoryLabel: "Pages & Navigation" },
      { title: "Broadcast Alerts", subtitle: "Publish platform-wide announcements", url: "/super-admin/broadcasts", icon: "bell", categoryLabel: "Pages & Navigation" },
    ],
    institute_admin: [
      { title: "Institute Dashboard", subtitle: "Network overview and campus metrics", url: "/institute-admin", icon: "layout-dashboard", categoryLabel: "Pages & Navigation" },
      { title: "Campus Branches", subtitle: "Manage all branches and physical locations", url: "/institute-admin/campuses", icon: "map-pin", categoryLabel: "Pages & Navigation" },
      { title: "+ Add Campus Branch", subtitle: "Create a new branch for your network", url: "/institute-admin/campuses/new", icon: "plus-circle", categoryLabel: "Quick Actions" },
      { title: "Students Registry", subtitle: "Network-wide student records", url: "/institute-admin/students", icon: "graduation-cap", categoryLabel: "Pages & Navigation" },
      { title: "Staff & Faculty Directory", subtitle: "Manage teachers and staff across campuses", url: "/institute-admin/staff", icon: "users", categoryLabel: "Pages & Navigation" },
      { title: "Subscription & Invoices", subtitle: "Plan details, usage quotas and billing", url: "/institute-admin/subscription", icon: "credit-card", categoryLabel: "Pages & Navigation" },
      { title: "Salary Policies", subtitle: "Institution-wide compensation policies", url: "/institute-admin/salary-policies", icon: "dollar-sign", categoryLabel: "Pages & Navigation" },
      { title: "Broadcast Alerts", subtitle: "Send notices to students and staff", url: "/institute-admin/alerts", icon: "bell", categoryLabel: "Pages & Navigation" },
    ],
    campus_admin: [
      { title: "Campus Overview", subtitle: "Daily operations and student metrics", url: "/dashboard", icon: "layout-dashboard", categoryLabel: "Pages & Navigation" },
      { title: "Faculty Directory", subtitle: "Teachers, departments and workload", url: "/faculty", icon: "users", categoryLabel: "Pages & Navigation" },
      { title: "Students Directory", subtitle: "Enrolled students, admissions and classes", url: "/students", icon: "graduation-cap", categoryLabel: "Pages & Navigation" },
      { title: "Class Timetable", subtitle: "Periods, scheduling and room allocations", url: "/timetable", icon: "calendar", categoryLabel: "Pages & Navigation" },
      { title: "Academic Settings", subtitle: "Classes, sections and subjects setup", url: "/academics", icon: "book-open", categoryLabel: "Pages & Navigation" },
      { title: "Teacher Assignments", subtitle: "Map teachers to classes and subjects", url: "/teacher-assignments", icon: "user-check", categoryLabel: "Pages & Navigation" },
      { title: "Faculty Attendance", subtitle: "Teacher check-in/out and daily attendance", url: "/faculty-attendance", icon: "check-circle", categoryLabel: "Pages & Navigation" },
      { title: "Student Attendance", subtitle: "Daily student roll call and reports", url: "/student-attendance", icon: "check-circle", categoryLabel: "Pages & Navigation" },
      { title: "Fee Management", subtitle: "Challans, collections and fee vouchers", url: "/fees", icon: "credit-card", categoryLabel: "Pages & Navigation" },
      { title: "Examinations & Schedules", subtitle: "Exams, date sheets and invigilation", url: "/exams", icon: "file-text", categoryLabel: "Pages & Navigation" },
      { title: "Exam Results", subtitle: "Marks entry and report card generation", url: "/results", icon: "award", categoryLabel: "Pages & Navigation" },
      { title: "Substitute Assignments", subtitle: "Manage cover teachers and leave replacements", url: "/substitutes", icon: "users", categoryLabel: "Pages & Navigation" },
    ],
    teacher: [
      { title: "Teacher Portal Dashboard", subtitle: "My schedule, today's classes and tasks", url: "/teacher", icon: "layout-dashboard", categoryLabel: "Pages & Navigation" },
      { title: "My Classes", subtitle: "View assigned classes and students", url: "/teacher/classes", icon: "book-open", categoryLabel: "Pages & Navigation" },
      { title: "Daily Diary & Homework", subtitle: "Post daily diary notes and homework", url: "/teacher/diary", icon: "edit-3", categoryLabel: "Pages & Navigation" },
      { title: "Assignments", subtitle: "Create assignments and review submissions", url: "/teacher/assignments", icon: "file-text", categoryLabel: "Pages & Navigation" },
      { title: "Mark Attendance", subtitle: "Take student roll call for today's classes", url: "/teacher/attendance", icon: "check-circle", categoryLabel: "Pages & Navigation" },
      { title: "Gradebook", subtitle: "Enter test scores and term marks", url: "/teacher/gradebook", icon: "award", categoryLabel: "Pages & Navigation" },
      { title: "Teaching Credits & Hours", subtitle: "Track class sessions and credit logs", url: "/teacher/credits", icon: "clock", categoryLabel: "Pages & Navigation" },
      { title: "My Payslips", subtitle: "View salary slips and compensation", url: "/my-payslips", icon: "dollar-sign", categoryLabel: "Pages & Navigation" },
    ],
    student: [
      { title: "Student Dashboard", subtitle: "Overview of your courses, tasks and grades", url: "/student/dashboard", icon: "layout-dashboard", categoryLabel: "Pages & Navigation" },
      { title: "My Courses / Subjects", subtitle: "Course materials and syllabus", url: "/student/courses", icon: "book-open", categoryLabel: "Pages & Navigation" },
      { title: "Assignments & Homework", subtitle: "View pending homework and submit work", url: "/student/assignments", icon: "file-text", categoryLabel: "Pages & Navigation" },
      { title: "My Attendance", subtitle: "Check your monthly attendance percentage", url: "/student/attendance", icon: "check-circle", categoryLabel: "Pages & Navigation" },
      { title: "Report Card & Grades", subtitle: "Exam results and grade history", url: "/student/grades", icon: "award", categoryLabel: "Pages & Navigation" },
      { title: "Fee Challans", subtitle: "View fee vouchers and payment status", url: "/student/fees", icon: "credit-card", categoryLabel: "Pages & Navigation" },
    ],
  };

  const cleanRole = String(role || "super_admin").toLowerCase().replace(/ /g, "_");
  const specific = roleLinks[cleanRole] || roleLinks.campus_admin;
  return [...specific, ...commonLinks];
};

/**
 * Main Global Search Controller
 */
export const globalSearch = async (req, res) => {
  try {
    const rawQuery = req.query.q || req.query.query || req.query.search || "";
    const q = rawQuery.trim();
    const role = String(req.user?.role || "super_admin").toLowerCase().replace(/ /g, "_");
    const instituteId = req.user?.instituteId;
    const campusId = req.user?.campusId;

    if (!q || q.length < 1) {
      // Return suggested quick actions and navigation when query is empty
      const navLinks = getNavigationLinks(role).slice(0, 8);
      return res.status(200).json({
        success: true,
        query: "",
        totalMatches: navLinks.length,
        categories: {
          navigation: navLinks,
        },
      });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const results = {};
    let totalMatches = 0;

    // 1. Matched Navigation / Quick Actions
    const allNav = getNavigationLinks(role);
    const matchedNav = allNav.filter(
      (item) => regex.test(item.title) || regex.test(item.subtitle)
    );
    if (matchedNav.length > 0) {
      results.navigation = matchedNav.slice(0, 5);
      totalMatches += results.navigation.length;
    }

    // 2. Search Institutes (All users can find relevant institutes)
    try {
      const institutes = await Institute.find({
        $or: [
          { name: regex },
          { board: regex },
          { type: regex },
          { email: regex },
          { phone: regex },
          { "address.city": regex },
        ],
      })
        .select("_id name type board email phone status address")
        .limit(8)
        .lean();

      if (institutes && institutes.length > 0) {
        results.institutes = institutes.map((inst) => ({
          id: inst._id,
          title: inst.name,
          subtitle: `${inst.type || "Institute"} • ${inst.board || "Board"} ${inst.address?.city ? "• " + inst.address.city : ""}`,
          url: role === "super_admin" ? `/institutes/${inst._id}` : `/institutes`,
          badge: inst.status || "Active",
          badgeType: inst.status === "Active" ? "success" : "default",
          category: "institutes",
          categoryLabel: "Institutes",
          icon: "building",
        }));
        totalMatches += results.institutes.length;
      }
    } catch (e) {
      console.warn("Institute search error:", e.message);
    }

    // 3. Search Campuses
    try {
      const campusQuery = {
        $or: [
          { name: regex },
          { location: regex },
          { email: regex },
          { phone: regex },
          { "address.city": regex },
        ],
      };
      if (role === "institute_admin" && instituteId) {
        campusQuery.instituteId = instituteId;
      }

      const campuses = await Campus.find(campusQuery)
        .populate("instituteId", "name type")
        .select("_id name location email phone status address instituteId")
        .limit(6)
        .lean();

      if (campuses && campuses.length > 0) {
        results.campuses = campuses.map((c) => ({
          id: c._id,
          title: c.name,
          subtitle: `${c.instituteId?.name || "Campus"} ${c.location ? "• " + c.location : ""} ${c.address?.city ? "• " + c.address.city : ""}`,
          url: role === "institute_admin" ? `/institute-admin/campuses/${c._id}` : `/dashboard`,
          badge: c.status || "Active",
          badgeType: c.status === "Active" ? "success" : "default",
          category: "campuses",
          categoryLabel: "Campuses",
          icon: "map-pin",
        }));
        totalMatches += results.campuses.length;
      }
    } catch (e) {
      console.warn("Campus search error:", e.message);
    }

    // 4. Search Users (Students, Teachers/Faculty, Admins)
    try {
      const userFilter = {
        $or: [
          { name: regex },
          { email: regex },
          { roll: regex },
          { admissionNo: regex },
          { department: regex },
          { designation: regex },
          { gradeOrClass: regex },
          { program: regex },
          { phone: regex },
        ],
      };

      if (role === "institute_admin" && instituteId) {
        userFilter.instituteId = instituteId;
      } else if (campusId && role !== "super_admin") {
        userFilter.campusId = campusId;
      }

      const users = await User.find(userFilter)
        .populate("instituteId", "name")
        .populate("campusId", "name")
        .select("_id name email role department designation roll admissionNo gradeOrClass program status avatar instituteId campusId")
        .limit(8)
        .lean();

      if (users && users.length > 0) {
        results.users = users.map((u) => {
          const isFaculty = u.role === "teacher" || u.role === "faculty";
          const isStudent = u.role === "student";
          let sub = "";
          let targetUrl = "";

          if (isFaculty) {
            sub = `${u.designation || "Teacher"} ${u.department ? "• " + u.department : ""} ${u.campusId?.name ? "• " + u.campusId.name : ""}`;
            targetUrl = role === "super_admin"
              ? `/super-admin/users?search=${encodeURIComponent(u.name)}`
              : `/faculty/${u._id}`;
          } else if (isStudent) {
            sub = `Student ${u.roll ? "• Roll: " + u.roll : ""} ${u.gradeOrClass ? "• Class " + u.gradeOrClass : ""} ${u.campusId?.name ? "• " + u.campusId.name : ""}`;
            targetUrl = role === "super_admin"
              ? `/super-admin/users?search=${encodeURIComponent(u.name)}`
              : role === "institute_admin"
              ? `/institute-admin/students`
              : `/students`;
          } else {
            sub = `${(u.role || "User").replace(/_/g, " ").toUpperCase()} ${u.instituteId?.name ? "• " + u.instituteId.name : ""}`;
            targetUrl = role === "super_admin" ? `/super-admin/users?search=${encodeURIComponent(u.name)}` : `/settings`;
          }

          return {
            id: u._id,
            title: u.name,
            subtitle: sub.trim(),
            email: u.email,
            url: targetUrl,
            badge: (u.role || "User").replace(/_/g, " "),
            badgeType: isStudent ? "info" : isFaculty ? "primary" : "warning",
            category: "users",
            categoryLabel: isStudent ? "Students" : isFaculty ? "Faculty & Teachers" : "Platform Users",
            icon: isStudent ? "graduation-cap" : isFaculty ? "user-check" : "user",
          };
        });
        totalMatches += results.users.length;
      }
    } catch (e) {
      console.warn("User search error:", e.message);
    }

    // 5. Search Classes / Grades & Subjects (Academic)
    try {
      const academicFilter = { name: regex };
      if (campusId) academicFilter.campusId = campusId;
      else if (instituteId) academicFilter.instituteId = instituteId;

      const [grades, subjects] = await Promise.all([
        Grade.find(academicFilter).select("_id name description campusId").limit(4).lean().catch(() => []),
        Subject.find({
          ...academicFilter,
          $or: [{ name: regex }, { code: regex }],
        }).select("_id name code description campusId").limit(4).lean().catch(() => []),
      ]);

      const academicItems = [
        ...(grades || []).map((g) => ({
          id: g._id,
          title: `Class: ${g.name}`,
          subtitle: g.description || "Academic Class / Grade",
          url: `/academics`,
          badge: "Class",
          badgeType: "primary",
          category: "academics",
          categoryLabel: "Academic Classes & Subjects",
          icon: "book-open",
        })),
        ...(subjects || []).map((s) => ({
          id: s._id,
          title: `Subject: ${s.name} ${s.code ? `(${s.code})` : ""}`,
          subtitle: s.description || "Course Subject",
          url: role === "student" ? `/student/courses` : `/academics`,
          badge: "Subject",
          badgeType: "info",
          category: "academics",
          categoryLabel: "Academic Classes & Subjects",
          icon: "book",
        })),
      ];

      if (academicItems.length > 0) {
        results.academics = academicItems;
        totalMatches += results.academics.length;
      }
    } catch (e) {
      console.warn("Academic search error:", e.message);
    }

    // 6. Search Inquiries & Leads
    try {
      const inquiries = await Inquiry.find({
        $or: [
          { fullName: regex },
          { instituteName: regex },
          { email: regex },
          { phone: regex },
          { status: regex },
        ],
      })
        .select("_id fullName instituteName email phone status instituteType createdAt")
        .limit(5)
        .lean();

      if (inquiries && inquiries.length > 0) {
        results.inquiries = inquiries.map((inq) => ({
          id: inq._id,
          title: `${inq.fullName} (${inq.instituteName})`,
          subtitle: `Inquiry • ${inq.email} • ${inq.phone} • Status: ${inq.status}`,
          url: role === "super_admin" ? `/super-admin/inquiries` : `/support`,
          badge: inq.status || "New",
          badgeType: inq.status === "Converted" ? "success" : inq.status === "Contacted" ? "info" : "warning",
          category: "inquiries",
          categoryLabel: "Inquiries & Leads",
          icon: "inbox",
        }));
        totalMatches += results.inquiries.length;
      }
    } catch (e) {
      console.warn("Inquiry search error:", e.message);
    }

    // 7. Search Plans
    try {
      const plans = await Plan.find({
        $or: [{ name: regex }, { tier: regex }, { description: regex }],
      })
        .select("_id name tier priceMonthly priceYearly currency maxCampuses maxStudents")
        .limit(4)
        .lean();

      if (plans && plans.length > 0) {
        results.plans = plans.map((p) => ({
          id: p._id,
          title: `Plan: ${p.name}`,
          subtitle: `${p.currency} ${p.priceYearly ? p.priceYearly.toLocaleString() + "/yr" : "Free"} • Quotas: ${p.maxCampuses} campuses, ${p.maxStudents} students`,
          url: role === "super_admin" ? `/super-admin/plans` : `/institute-admin/subscription`,
          badge: p.tier?.toUpperCase(),
          badgeType: "primary",
          category: "plans",
          categoryLabel: "Plans & Pricing",
          icon: "credit-card",
        }));
        totalMatches += results.plans.length;
      }
    } catch (e) {
      console.warn("Plan search error:", e.message);
    }

    // 8. Search Support Tickets & Messages
    try {
      const ticketFilter = {
        $or: [
          { ticketNumber: regex },
          { subject: regex },
          { description: regex },
          { status: regex },
        ],
      };
      if (role === "student" || role === "teacher") {
        ticketFilter.creator = req.user?._id;
      } else if (role === "institute_admin" && instituteId) {
        ticketFilter.instituteId = instituteId;
      }

      const tickets = await SupportTicket.find(ticketFilter)
        .select("_id ticketNumber subject status priority role createdAt")
        .limit(4)
        .lean();

      if (tickets && tickets.length > 0) {
        results.tickets = tickets.map((t) => ({
          id: t._id,
          title: `${t.ticketNumber || "Ticket"}: ${t.subject}`,
          subtitle: `Priority: ${t.priority || "Medium"} • Status: ${t.status || "Open"}`,
          url: role === "super_admin"
            ? `/super-admin/support/${t._id}`
            : role === "institute_admin"
            ? `/institute-admin/support/${t._id}`
            : `/support/${t._id}`,
          badge: t.status || "Open",
          badgeType: t.status === "Resolved" ? "success" : "warning",
          category: "tickets",
          categoryLabel: "Support Tickets",
          icon: "life-buoy",
        }));
        totalMatches += results.tickets.length;
      }
    } catch (e) {
      console.warn("Ticket search error:", e.message);
    }

    // 9. Search Broadcast Alerts
    try {
      const alertFilter = {
        $or: [{ title: regex }, { message: regex }],
      };
      if (role === "institute_admin" && instituteId) {
        alertFilter.instituteId = instituteId;
      }

      const alerts = await Alert.find(alertFilter)
        .select("_id title message severity createdAt")
        .limit(3)
        .lean();

      if (alerts && alerts.length > 0) {
        results.alerts = alerts.map((a) => ({
          id: a._id,
          title: a.title || "Announcement",
          subtitle: a.message?.slice(0, 80) + (a.message?.length > 80 ? "..." : ""),
          url: role === "super_admin" ? `/super-admin/broadcasts` : `/institute-admin/alerts`,
          badge: a.severity || "General",
          badgeType: a.severity?.toLowerCase() === "critical" ? "destructive" : "info",
          category: "alerts",
          categoryLabel: "Broadcast Alerts",
          icon: "bell",
        }));
        totalMatches += results.alerts.length;
      }
    } catch (e) {
      console.warn("Alert search error:", e.message);
    }

    return res.status(200).json({
      success: true,
      query: q,
      totalMatches,
      categories: results,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(200).json({
      success: true,
      query: req.query.q || "",
      totalMatches: 0,
      categories: {},
    });
  }
};
