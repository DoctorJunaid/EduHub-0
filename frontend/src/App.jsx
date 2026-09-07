import DashboardContent from './Admins/Campus Admin/Dashboard/DashboardContent';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CampusOverview from './Admins/Campus Admin/Dashboard/CampusOverview';
import FacultyDirectory from './Admins/Campus Admin/Faculty/FacultyDirectory';
import StudentsDirectory from './Admins/Campus Admin/Students/StudentsDirectory';
import ClassTimetable from './Admins/Campus Admin/Timetable/ClassTimetable';
import ExamSchedules from './Admins/Campus Admin/Exams/ExamSchedules';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<CampusOverview />} />
        <Route path="dashboard" element={<CampusOverview />} />
        <Route path="faculty" element={<FacultyDirectory />} />
        <Route path="students" element={<StudentsDirectory />} />
        <Route path="timetable" element={<ClassTimetable />} />
        <Route path="exams" element={<ExamSchedules />} />
        <Route path="*" element={<DashboardContent />} />
      </Route>
    </Routes>
  );
};

export default App;
