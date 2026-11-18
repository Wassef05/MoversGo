import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    // Redirect to the appropriate dashboard based on their real role
    if (currentUser?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (currentUser?.role === "company") {
      const isApproved = currentUser.company?.verificationStatus === "approved" || currentUser.isApproved;
      return <Navigate to={isApproved ? "/company/dashboard" : "/company/pending-approval"} replace />;
    }
    return <Navigate to="/client/dashboard" replace />;
  }

  // Restrict unapproved company from accessing any dashboard/operational pages
  if (currentUser?.role === "company") {
    const isApproved = currentUser.company?.verificationStatus === "approved" || currentUser.isApproved;
    if (!isApproved && location.pathname !== "/company/pending-approval") {
      return <Navigate to="/company/pending-approval" replace />;
    }
    if (isApproved && location.pathname === "/company/pending-approval") {
      return <Navigate to="/company/dashboard" replace />;
    }
  }

  return children;
}

