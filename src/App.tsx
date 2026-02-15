import { Navigate, Route, Routes } from "react-router-dom";
import MemberspassVICHome from "@/pages/memberspass/MemberspassVICHome";
import ActivitiesHome from "@/pages/ActivitiesHome";
import ActivityDetail from "@/pages/ActivityDetail";
import ActivitiesInvite from "@/pages/ActivitiesInvite";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BottomNavigation } from "@/components/layout/BottomNavigation";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="mx-auto max-w-xl pb-20">{children}</main>
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
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <MemberspassVICHome />
            </ProtectedLayout>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedLayout>
              <ActivitiesHome />
            </ProtectedLayout>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <ProtectedLayout>
              <ActivityDetail />
            </ProtectedLayout>
          }
        />
        <Route
          path="/activities/invite"
          element={
            <ProtectedLayout>
              <ActivitiesInvite />
            </ProtectedLayout>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
