import { useSelector } from "react-redux";
import MainLayout from "@/layouts/MainLayout";
import { selectStudentProfile } from "@/store/selectors/studentDashboard";
import { studentNavigation } from "./navigation";
import "./Student.css";

export default function StudentLayout() {
  const profile = useSelector(selectStudentProfile);
  return (
    <MainLayout
      navigation={studentNavigation}
      className="student-shell"
      profile={profile}
      headerProps={{
        homePath: "/student/dashboard",
        breadcrumbItems: ["Dashboard"],
        onViewProfile: () => {
          const summary = document.getElementById("student-profile-summary");
          summary?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          summary?.focus({ preventScroll: true });
        },
      }}
    />
  );
}
