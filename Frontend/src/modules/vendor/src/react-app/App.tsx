import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "@vendor/react-app/index.css";
import DashboardLayout from "@vendor/react-app/components/layout/DashboardLayout";

const DashboardPage = lazy(() => import("@vendor/react-app/pages/Dashboard"));
const ProfilePage = lazy(() => import("@vendor/react-app/pages/Profile"));
const ServicesPage = lazy(() => import("@vendor/react-app/pages/Services"));
const Bookings = lazy(() => import("@vendor/react-app/pages/Bookings"));
const EarningsPage = lazy(() => import("@vendor/react-app/pages/Earnings"));
const ReviewsPage = lazy(() => import("@vendor/react-app/pages/Reviews"));

type VendorAppProps = {
  basename?: string;
};

export default function App({ basename = "/vendor" }: VendorAppProps) {
  return (
    <Router basename={basename}>
      <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
