import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "@admin/react-app/index.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import "./styles/admin.css";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const ManageVendors = lazy(() => import("./pages/ManageVendors"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const ManageBookings = lazy(() => import("./pages/ManageBookings"));
const ManageReviews = lazy(() => import("./pages/ManageReviews"));
const ManageInquiries = lazy(() => import("./pages/ManageInquiries"));

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-500">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="vendors" element={<ManageVendors />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="bookings" element={<ManageBookings />} />
              <Route path="reviews" element={<ManageReviews />} />
              <Route path="inquiries" element={<ManageInquiries />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
