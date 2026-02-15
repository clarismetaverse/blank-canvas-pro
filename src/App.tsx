import { Navigate, Route, Routes } from 'react-router-dom';
import MemberspassVICHome from '@/pages/memberspass/MemberspassVICHome';
import ActivitiesHome from '@/pages/ActivitiesHome';
import ActivityDetail from '@/pages/ActivityDetail';
import ActivitiesInvite from '@/pages/ActivitiesInvite';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900">VIC</span>
          <button onClick={logout} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900">Logout</button>
        </div>
      </header>
      <main className="mx-auto max-w-xl">{children}</main>
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ProtectedLayout><MemberspassVICHome /></ProtectedLayout>} />
        <Route path="/activities" element={<ProtectedLayout><ActivitiesHome /></ProtectedLayout>} />
        <Route path="/activities/:id" element={<ProtectedLayout><ActivityDetail /></ProtectedLayout>} />
        <Route path="/activities/invite" element={<ProtectedLayout><ActivitiesInvite /></ProtectedLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
