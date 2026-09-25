import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectAuth } from '@/store/Slices/authSlice';
import { Spinner } from '@/components/ui/spinner';
import { roleHome } from './roles';

export default function ProtectedRoute({ allowedRoles }) {
  const auth = useSelector(selectAuth);
  if (auth.status === 'loading' && !auth.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }
  if (!auth.isAuthenticated && !auth.user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.selectedRole)) return <Navigate to={roleHome(auth.selectedRole) || '/login'} replace />;
  return <Outlet />;
}
export function AuthEntry({ children }) {
  const auth = useSelector(selectAuth);
  if (auth.status === 'loading' && !auth.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }
  const home = auth.isAuthenticated && roleHome(auth.selectedRole);
  if (home) return <Navigate to={home} replace />;
  return children || <Navigate to="/login" replace />;
}
