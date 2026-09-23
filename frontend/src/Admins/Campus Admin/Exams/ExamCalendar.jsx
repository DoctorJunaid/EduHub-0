import ExamGrid from "./ExamGrid";

export default function ExamCalendar({
  records = [],
  week,
  onView,
  onAction,
  onQuickAdd,
  onMoveExam,
}) {
  return (
    <ExamGrid
      records={records}
      week={week}
      onView={onView}
      onAction={onAction}
      onQuickAdd={onQuickAdd}
      onMoveExam={onMoveExam}
    />
  );
}

