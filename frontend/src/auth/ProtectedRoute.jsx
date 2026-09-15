import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectAuth } from '@/store/Slices/authSlice';
import { roleHome } from './roles';

export default function ProtectedRoute({ allowedRoles }) {
  const auth = useSelector(selectAuth);
  if (auth.status === 'loading' && !auth.user) {
    return null;
  }
  if (!auth.isAuthenticated && !auth.user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.selectedRole)) return <Navigate to={roleHome(auth.selectedRole) || '/login'} replace />;
  return <Outlet />;
}
export function AuthEntry({ children }) {
  const auth = useSelector(selectAuth);
  if (auth.status === 'loading' && !auth.user) {
    return null;
  }
  const home = auth.isAuthenticated && roleHome(auth.selectedRole);
  if (home) return <Navigate to={home} replace />;
  return children || <Navigate to="/login" replace />;
}
