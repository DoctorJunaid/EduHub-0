import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

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
        <Route path="*" element={<DashboardContent />} />
      </Route>
    </Routes>
  );
};

export default App;
