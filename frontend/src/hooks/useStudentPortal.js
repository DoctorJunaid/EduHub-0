import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getStudentPortalApi } from "@/api/student.api";
import { qk } from "@/lib/queryKeys";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { studentsLoaded } from "@/store/Slices/studentsSlice";
import { schedulesLoaded } from "@/store/Slices/timetableSlice";
import { studentAttendanceLoaded } from "@/store/Slices/studentAttendanceSlice";
import { feesLoaded } from "@/store/Slices/feesSlice";
import { resultsLoaded } from "@/store/Slices/resultsSlice";
import { examsLoaded } from "@/store/Slices/examsSlice";
import { facultyLoaded } from "@/store/Slices/facultySlice";
import {
  assignmentsLoaded,
  submissionsLoaded,
} from "@/store/Slices/assignmentsSlice";
import { diaryLoaded } from "@/store/Slices/diarySlice";
import { conversationsLoaded } from "@/store/Slices/messagesSlice";

/**
 * React Query hook for Student Portal data
 * Multi-tenant self-scoped query with clean caching and Redux state synchronization.
 */
export function useStudentPortal() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const studentId = user?.id || user?._id;

  const query = useQuery({
    queryKey: qk.studentPortal(studentId),
    queryFn: async () => {
      const res = await getStudentPortalApi();
      return res.data || {};
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(studentId && !String(studentId).startsWith("demo:")),
  });

  const portal = query.data;

  // Synchronize Redux store when fresh data arrives
  useEffect(() => {
    if (!portal) return;

    if (portal.student) dispatch(studentsLoaded(portal.student));
    if (portal.schedules) dispatch(schedulesLoaded(portal.schedules));
    if (portal.attendance) dispatch(studentAttendanceLoaded(portal.attendance));
    if (portal.fees) dispatch(feesLoaded(portal.fees));
    if (portal.results) dispatch(resultsLoaded(portal.results));
    if (portal.exams) dispatch(examsLoaded(portal.exams));
    if (portal.faculty) dispatch(facultyLoaded(portal.faculty));
    if (portal.assignments) dispatch(assignmentsLoaded(portal.assignments));
    if (portal.submissions) dispatch(submissionsLoaded(portal.submissions));
    if (portal.diary) dispatch(diaryLoaded(portal.diary));
    if (portal.conversations) dispatch(conversationsLoaded(portal.conversations));
  }, [dispatch, portal]);

  return {
    ...query,
    portal,
    student: portal?.student || null,
    classTeacher: portal?.classTeacher || portal?.student?.classTeacher || null,
    subjects: portal?.subjects || [],
    schedules: portal?.schedules || [],
    attendance: portal?.attendance || null,
    fees: portal?.fees || [],
    results: portal?.results || [],
    assignments: portal?.assignments || [],
    submissions: portal?.submissions || [],
    diary: portal?.diary || [],
    conversations: portal?.conversations || [],
    transport: portal?.transport || null,
  };
}

export default useStudentPortal;
