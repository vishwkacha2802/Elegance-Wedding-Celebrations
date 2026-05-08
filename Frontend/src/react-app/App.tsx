import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";

const HomePage = lazy(() => import("@/react-app/pages/Home"));
const AboutPage = lazy(() => import("@/react-app/pages/About"));
const VenuesPage = lazy(() => import("@/react-app/pages/Venues"));
const ServicesPage = lazy(() => import("@/react-app/pages/Services"));
const ContactPage = lazy(() => import("@/react-app/pages/Contact"));
const AuthPage = lazy(() => import("@/react-app/pages/Auth"));
const Dashboard = lazy(() => import("@/react-app/pages/Dashboard"));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-cream" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
