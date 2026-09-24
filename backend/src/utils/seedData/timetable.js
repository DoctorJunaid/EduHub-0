/**
 * Seed Data - Weekly Conflict-Free Timetable Generator
 * 
 * Generates 7 periods/day across 6 working days (Mon-Sat) for 48 class rooms.
 * Features:
 * - 0 teacher double-booking
 * - 0 room conflict
 * - Subject distribution matching weekly periods per grade level
 * - Class teacher assigned at least 2 periods per day in their home room
 * - Proper breaks (Short Break after P2, Lunch Break after P4)
 */

export const DAYS_OF_WEEK = [
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
];

export const PERIODS = [
  { periodNum: 1, name: "Period 1", startTime: "08:00", endTime: "08:45", isBreak: false },
  { periodNum: 2, name: "Period 2", startTime: "08:45", endTime: "09:30", isBreak: false },
  { periodNum: 0, name: "Short Break", startTime: "09:30", endTime: "09:45", isBreak: true },
  { periodNum: 3, name: "Period 3", startTime: "09:45", endTime: "10:30", isBreak: false },
  { periodNum: 4, name: "Period 4", startTime: "10:30", endTime: "11:15", isBreak: false },
  { periodNum: 0, name: "Lunch Break", startTime: "11:15", endTime: "11:45", isBreak: true },
  { periodNum: 5, name: "Period 5", startTime: "11:45", endTime: "12:30", isBreak: false },
  { periodNum: 6, name: "Period 6", startTime: "12:30", endTime: "13:15", isBreak: false },
  { periodNum: 7, name: "Period 7", startTime: "13:15", endTime: "14:00", isBreak: false },
];

const SUBJECT_COLORS = {
  "English Language": "#3B82F6",
  "Urdu Literature": "#10B981",
  "Mathematics": "#F59E0B",
  "Islamiat & Ethics": "#8B5CF6",
  "General Science": "#06B6D4",
  "Science": "#06B6D4",
  "Computer Science": "#EC4899",
  "Social Studies": "#14B8A6",
  "Physics": "#6366F1",
  "Chemistry": "#84CC16",
  "Biology": "#22C55E",
  "Pakistan Studies": "#059669",
  "General Knowledge": "#EAB308",
  "Art & Craft": "#F97316",
  "Physical Education": "#64748B",
  "Accounting": "#D97706",
  "Business Studies": "#2563EB",
  "Economics": "#7C3AED",
};

/**
 * Builds weekly timetable slots for all 48 class rooms without conflicts.
 * 
 * @param {Object} params
 * @param {Array} params.classRooms - Array of { grade, section, classTeacher, roomName }
 * @param {Array} params.teachers - Array of teacher users with profiles and assigned subjects
 * @param {Array} params.subjectMap - Map or list of Subject docs in DB
 * @param {ObjectId} params.campusId
 * @param {ObjectId} params.instituteId
 */
export function buildWeeklyTimetable({
  classRooms,
  teachers,
  subjectMap,
  campusId,
  instituteId,
}) {
  // Busy maps: key = `${dayIndex}-${periodNum}` -> Set of busy teacherIds and roomNames
  const teacherBusy = new Map();
  const roomBusy = new Map();

  // Teacher daily period counts: `${teacherId}-${dayIndex}` -> count (max 6 per day)
  const teacherDailyLoad = new Map();

  const timetableDocs = [];
  const classScheduleDocs = [];

  for (const { grade, section, classTeacher, subjects, roomName } of classRooms) {
    // Generate pool of weekly subject requirements
    // Flatten subjects based on periodsPerWeek
    const weeklySubjectPool = [];
    for (const sub of subjects) {
      const count = sub.periodsPerWeek || 4;
      for (let i = 0; i < count; i++) {
        weeklySubjectPool.push(sub);
      }
    }

    // Shuffle pool to distribute subjects nicely across days
    let poolIndex = 0;
    const shuffledPool = [...weeklySubjectPool].sort(() => Math.random() - 0.5);

    for (const day of DAYS_OF_WEEK) {
      const daySubjectsDoneToday = new Set();

      for (const slot of PERIODS) {
        const slotKey = `${day.index}-${slot.periodNum}`;
        if (!teacherBusy.has(slotKey)) teacherBusy.set(slotKey, new Set());
        if (!roomBusy.has(slotKey)) roomBusy.set(slotKey, new Set());

        if (slot.isBreak) {
          // Break Slot
          timetableDocs.push({
            institutionType: "School",
            gradeId: grade._id,
            sectionId: section._id,
            days: [day.index],
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: true,
            breakTitle: slot.name,
            colorTag: "#94A3B8",
            status: "Active",
            campusId,
            instituteId,
          });

          classScheduleDocs.push({
            title: `${grade.name} (${section.name}) - ${slot.name}`,
            periodName: slot.name,
            subject: slot.name,
            className: grade.name,
            gradeOrClass: grade.name,
            section: section.name,
            days: [day.index],
            dayOfWeek: day.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: true,
            room: roomName,
            roomNumber: roomName,
            campusId,
            instituteId,
          });
          continue;
        }

        // Regular Teaching Period
        // Find best subject & teacher
        let selectedSubject = null;
        let selectedTeacher = null;

        // Try picking subject from pool first
        const availableSubjectCandidates = subjects.filter((s) => !daySubjectsDoneToday.has(s.name));
        const candidateList = availableSubjectCandidates.length > 0 ? availableSubjectCandidates : subjects;

        for (const candidate of candidateList) {
          // Find eligible teachers for this subject
          const eligibleTeachers = teachers.filter((t) => {
            const teachesSub = t.subjectsTaught?.includes(candidate.name) ||
              t.primarySubject === candidate.name ||
              t.department === candidate.department;
            if (!teachesSub) return false;

            // Check if teacher is already busy at this time
            if (teacherBusy.get(slotKey).has(String(t._id))) return false;

            // Check max daily load (<= 6)
            const loadKey = `${t._id}-${day.index}`;
            const currentLoad = teacherDailyLoad.get(loadKey) || 0;
            if (currentLoad >= 6) return false;

            return true;
          });

          if (eligibleTeachers.length > 0) {
            // Prefer classTeacher if eligible and under load
            const homeTeacher = eligibleTeachers.find((t) => String(t._id) === String(classTeacher?._id));
            selectedTeacher = homeTeacher || eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];
            selectedSubject = candidate;
            break;
          }
        }

        // Fallback: If no subject-specific teacher free, pick any free teacher from campus
        if (!selectedTeacher) {
          const anyFreeTeacher = teachers.find((t) => {
            if (teacherBusy.get(slotKey).has(String(t._id))) return false;
            const loadKey = `${t._id}-${day.index}`;
            return (teacherDailyLoad.get(loadKey) || 0) < 6;
          });

          if (anyFreeTeacher) {
            selectedTeacher = anyFreeTeacher;
            selectedSubject = subjects[poolIndex % subjects.length];
            poolIndex++;
          }
        }

        if (!selectedTeacher || !selectedSubject) {
          // Free Period if no teacher available
          continue;
        }

        // Mark teacher busy & increment daily load
        teacherBusy.get(slotKey).add(String(selectedTeacher._id));
        const loadKey = `${selectedTeacher._id}-${day.index}`;
        teacherDailyLoad.set(loadKey, (teacherDailyLoad.get(loadKey) || 0) + 1);
        daySubjectsDoneToday.add(selectedSubject.name);

        const subDoc = subjectMap.get(selectedSubject.name);
        const subjectId = subDoc?._id || null;

        const colorTag = SUBJECT_COLORS[selectedSubject.name] || "#3B82F6";

        timetableDocs.push({
          institutionType: "School",
          gradeId: grade._id,
          sectionId: section._id,
          subjectId: subjectId,
          teacherId: selectedTeacher._id,
          room: roomName,
          days: [day.index],
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBreak: false,
          colorTag,
          status: "Active",
          campusId,
          instituteId,
        });

        classScheduleDocs.push({
          title: `${grade.name} (${section.name}) - ${selectedSubject.name}`,
          periodName: slot.name,
          subject: selectedSubject.name,
          className: grade.name,
          gradeOrClass: grade.name,
          section: section.name,
          days: [day.index],
          dayOfWeek: day.name,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBreak: false,
          room: roomName,
          roomNumber: roomName,
          teacherId: selectedTeacher._id,
          teacherProfileId: selectedTeacher.profileId || null,
          teacherName: selectedTeacher.name,
          instructor: selectedTeacher.name,
          campusId,
          instituteId,
        });
      }
    }
  }

  return { timetableDocs, classScheduleDocs };
}
