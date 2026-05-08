import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router";
import "@user/react-app/index.css";

const BookingsPage = lazy(() => import("@user/react-app/pages/Bookings"));
const CoupleDashboard = lazy(() => import("@user/react-app/pages/CoupleDashboard"));
const FavoriteServicesPage = lazy(() => import("@user/react-app/pages/FavoriteServices"));
const CoupleProfile = lazy(() => import("@user/react-app/pages/CoupleProfile"));
const BrideSettings = lazy(() => import("@user/react-app/pages/BrideSettings"));
const GroomSettings = lazy(() => import("@user/react-app/pages/GroomSettings"));

function UserProtectedRoute() {
  const hasSession = typeof window !== "undefined" && !!sessionStorage.getItem("elegance_user_session");

  if (!hasSession) {
    window.location.assign("/auth");
    return null;
  }

  return <Outlet />;
}

type UserAppProps = {
  basename?: string;
};

export default function App({ basename = "/user" }: UserAppProps) {
  return (
    <Router basename={basename}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-cream text-sm text-muted-foreground">Loading...</div>}>
        <Routes>
          <Route element={<UserProtectedRoute />}>
            <Route path="/" element={<Navigate to="/couple" replace />} />
            <Route path="/couple" element={<CoupleDashboard />} />
            <Route path="/couple/bookings" element={<BookingsPage />} />
            <Route path="/couple/favorites" element={<FavoriteServicesPage />} />
            <Route path="/couple/profile" element={<CoupleProfile />} />
            <Route path="/bride" element={<CoupleDashboard />} />
            <Route path="/bride/profile" element={<CoupleProfile />} />
            <Route path="/bride/settings" element={<BrideSettings />} />
            <Route path="/groom" element={<CoupleDashboard />} />
            <Route path="/groom/profile" element={<CoupleProfile />} />
            <Route path="/groom/settings" element={<GroomSettings />} />
            <Route path="*" element={<Navigate to="/couple" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
