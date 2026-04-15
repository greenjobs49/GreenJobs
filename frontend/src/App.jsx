import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Role-based login pages
import JobSeekerLogin from "./pages/Jobseekerlogin";
import RecruiterLogin from "./pages/Recruiterlogin";
import BusinessLogin from "./pages/Businesslogin";
import AdminLogin from "./pages/Adminlogin";

// Role-based signup pages
import JobSeekerSignup from "./pages/JobSeekerSignup";
import RecruiterSignup from "./pages/RecruiterSignup";
import BusinessSignup from "./pages/BusinessSignup";

// Other pages
import Dashboard from "./pages/Dashboard";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import BusinessOwnerDashboard from "./pages/BusinessOwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import Myprofile from "./pages/Myprofile";
import PostJob from "./pages/PostJob";
import PendingJobs from "./pages/PendingJobs";
import PendingBusinesses from "./pages/PendingBusinesses";
import Businesses from "./pages/Businesses";
import ApprovedBusinesses from "./pages/ApprovedBusinesses";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Home from "./pages/Home";
import BusinessDetail from "./pages/BusinessDetail";

import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Toaster
  position="top-center"
  containerStyle={{
    top: 90,
    zIndex: 999999,
  }}
  toastOptions={{
    duration: 4000,
    style: {
      fontSize: "14px",
      fontWeight: "500",
      maxWidth: "420px",
    },
    success: {
      style: {
        background: "#f0fdf4",
        color: "#15803d",
        border: "1px solid #bbf7d0",
      },
    },
    error: {
      style: {
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
      },
    },
  }}
/>

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />

          {/* Role-based login pages */}
          <Route path="/login"            element={<JobSeekerLogin />} />
          <Route path="/recruiter/login"  element={<RecruiterLogin />} />
          <Route path="/business/login"   element={<BusinessLogin />} />
          <Route path="/admin/login"      element={<AdminLogin />} />

          {/* Role-based signup pages */}
          <Route path="/signup"            element={<JobSeekerSignup />} />
          <Route path="/recruiter/signup"  element={<RecruiterSignup />} />
          <Route path="/business/signup"   element={<BusinessSignup />} />
          <Route path="/profile"          element={<Myprofile />} />
          <Route path="/jobs"             element={<Jobs />} />
          <Route path="/jobs/:jobId"      element={<JobDetail />} />
          <Route path="/businesses"       element={<Businesses />} />
          <Route path="/businesses/:id" element={<BusinessDetail />} />
          {/* General dashboard (redirects internally based on role) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Job Seeker */}
          <Route
            path="/jobseeker/*"
            element={
              <ProtectedRoute allowedRoles={["jobseeker"]}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Recruiter */}
          <Route
            path="/recruiter/*"
            element={
              <ProtectedRoute allowedRoles={["recruiter"]}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
  path="/post-job/:jobId"
  element={
    <ProtectedRoute allowedRoles={["recruiter", "business"]}>
      <PostJob />
    </ProtectedRoute>
  }
/>
          <Route
            path="/post-job"
            element={
              <ProtectedRoute allowedRoles={["recruiter", "business"]}>
                <PostJob />
              </ProtectedRoute>
            }
          />

          {/* Business */}
          <Route
            path="/business/*"
            element={
              <ProtectedRoute allowedRoles={["business"]}>
                <BusinessOwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending-jobs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PendingJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending-businesses"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PendingBusinesses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approved-businesses"
            element={<ApprovedBusinesses />}
          />

          {/* Complete profile */}
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
