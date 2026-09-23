import MainLayout from "@/layouts/MainLayout";
import { TEACHER_NAV } from "@/constants/navigation";
import "./TeacherUI.css";

export default function TeacherLayout() {
  return (
    <MainLayout
      navigation={TEACHER_NAV}
      className="teacher-shell"
      headerProps={{ homePath: "/teacher", homeLabel: "Home" }}
    />
  );
}
