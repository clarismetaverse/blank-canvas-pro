import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p className="p-8 text-center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
