import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CampusOverview from './components/campus-overview/CampusOverview';
import FacultyDirectory from './components/faculty/FacultyDirectory';
import StudentsDirectory from './components/students/StudentsDirectory';
import ClassTimetable from './components/timetable/ClassTimetable';

const DashboardContent = () => (
  <>
    <h1 className="text-2xl font-bold">Campus Admin Dashboard</h1>
    <p className="mt-4 text-secondary">
      Select an item from the sidebar to navigate.
    </p>
  </>
);

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<CampusOverview />} />
        <Route path="dashboard" element={<CampusOverview />} />
        <Route path="faculty" element={<FacultyDirectory />} />
        <Route path="students" element={<StudentsDirectory />} />
        <Route path="timetable" element={<ClassTimetable />} />
        <Route path="*" element={<DashboardContent />} />
      </Route>
    </Routes>
  );
};

export default App;
