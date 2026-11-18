import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

// Layouts
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ClientLayout } from "../layouts/ClientLayout";
import { CompanyLayout } from "../layouts/CompanyLayout";
import { AdminLayout } from "../layouts/AdminLayout";

// Public Pages
import { HomePage } from "../pages/public/HomePage";
import { PublicRequestsPage } from "../pages/public/PublicRequestsPage";
import { HowItWorksPage } from "../pages/public/HowItWorksPage";
import { CompaniesPage } from "../pages/public/CompaniesPage";
import { CompanyDetailPage } from "../pages/public/CompanyDetailPage";
import { PricingPage } from "../pages/public/PricingPage";
import { FaqPage } from "../pages/public/FaqPage";
import { ContactPage } from "../pages/public/ContactPage";
import { TermsPage } from "../pages/public/TermsPage";
import { PrivacyPage } from "../pages/public/PrivacyPage";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterSelectPage } from "../pages/auth/RegisterSelectPage";
import { RegisterClientPage } from "../pages/auth/RegisterClientPage";
import { RegisterCompanyPage } from "../pages/auth/RegisterCompanyPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { AdminLoginPage } from "../pages/auth/AdminLoginPage";

// Client Pages
import { ClientDashboardPage } from "../pages/client/ClientDashboardPage";
import { ClientRequestsPage } from "../pages/client/ClientRequestsPage";
import { ClientNewRequestPage } from "../pages/client/ClientNewRequestPage";
import { ClientRequestDetailPage } from "../pages/client/ClientRequestDetailPage";
import { ClientRequestEditPage } from "../pages/client/ClientRequestEditPage";
import { ClientQuotesPage } from "../pages/client/ClientQuotesPage";
import { ClientQuoteDetailPage } from "../pages/client/ClientQuoteDetailPage";
import { ClientComparePage } from "../pages/client/ClientComparePage";
import { ClientBookingsPage } from "../pages/client/ClientBookingsPage";
import { ClientBookingDetailPage } from "../pages/client/ClientBookingDetailPage";
import { ClientMessagesPage } from "../pages/client/ClientMessagesPage";
import { ClientPaymentsPage } from "../pages/client/ClientPaymentsPage";
import { ClientReviewsPage } from "../pages/client/ClientReviewsPage";
import { ClientNewReviewPage } from "../pages/client/ClientNewReviewPage";
import { ClientNotificationsPage } from "../pages/client/ClientNotificationsPage";
import { ClientProfilePage } from "../pages/client/ClientProfilePage";

// Company Pages
import { CompanyDashboardPage } from "../pages/company/CompanyDashboardPage";
import { CompanyRecommendationsPage } from "../pages/company/CompanyRecommendationsPage";
import { CompanyRequestsPage } from "../pages/company/CompanyRequestsPage";
import { CompanyRequestDetailPage } from "../pages/company/CompanyRequestDetailPage";
import { CompanyQuotesPage } from "../pages/company/CompanyQuotesPage";
import { CompanyNewQuotePage } from "../pages/company/CompanyNewQuotePage";
import { CompanyQuoteDetailPage } from "../pages/company/CompanyQuoteDetailPage";
import { CompanyQuoteEditPage } from "../pages/company/CompanyQuoteEditPage";
import { CompanyBookingsPage } from "../pages/company/CompanyBookingsPage";
import { CompanyBookingDetailPage } from "../pages/company/CompanyBookingDetailPage";
import { CompanyCalendarPage } from "../pages/company/CompanyCalendarPage";
import { CompanyMessagesPage } from "../pages/company/CompanyMessagesPage";
import { CompanyReviewsPage } from "../pages/company/CompanyReviewsPage";
import { CompanyDocumentsPage } from "../pages/company/CompanyDocumentsPage";
import { CompanyStatisticsPage } from "../pages/company/CompanyStatisticsPage";
import { CompanyProfilePage } from "../pages/company/CompanyProfilePage";
import { CompanyPendingApprovalPage } from "../pages/company/CompanyPendingApprovalPage";
import { CompanyNotificationsPage } from "../pages/company/CompanyNotificationsPage";

// Admin Pages
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "../pages/admin/AdminUserDetailPage";
import { AdminCompaniesPage } from "../pages/admin/AdminCompaniesPage";
import { AdminPendingCompaniesPage } from "../pages/admin/AdminPendingCompaniesPage";
import { AdminRequestsPage } from "../pages/admin/AdminRequestsPage";
import { AdminQuotesPage } from "../pages/admin/AdminQuotesPage";
import { AdminBookingsPage } from "../pages/admin/AdminBookingsPage";
import { AdminTransactionsPage } from "../pages/admin/AdminTransactionsPage";
import { AdminReviewsModerationPage } from "../pages/admin/AdminReviewsModerationPage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";
import { AdminSupportPage } from "../pages/admin/AdminSupportPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { AdminProfilePage } from "../pages/admin/AdminProfilePage";

// Error Pages
import { NotFoundPage } from "../pages/errors/NotFoundPage";
import { ForbiddenPage } from "../pages/errors/ForbiddenPage";

function SmartRoleRedirect({ prefix }) {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const role = currentUser?.role || "client";
  const target = id ? `/${role}/${prefix}/${id}` : `/${role}/${prefix}`;
  return <Navigate to={target} replace />;
}

export function AppRouter() {
  return (
    <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/demenagements" element={<PublicRequestsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Route>

        {/* AUTH ROUTES */}
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterSelectPage />} />
          <Route path="/register/client" element={<RegisterClientPage />} />
          <Route path="/register/company" element={<RegisterCompanyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* CLIENT PROTECTED ROUTES */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboardPage />} />
          <Route path="requests" element={<ClientRequestsPage />} />
          <Route path="requests/new" element={<ClientNewRequestPage />} />
          <Route path="requests/:id" element={<ClientRequestDetailPage />} />
          <Route path="requests/:id/edit" element={<ClientRequestEditPage />} />
          <Route path="quotes" element={<ClientQuotesPage />} />
          <Route path="quotes/:id" element={<ClientQuoteDetailPage />} />
          <Route path="compare" element={<ClientComparePage />} />
          <Route path="bookings" element={<ClientBookingsPage />} />
          <Route path="bookings/:id" element={<ClientBookingDetailPage />} />
          <Route path="messages" element={<ClientMessagesPage />} />
          <Route path="messages/:id" element={<ClientMessagesPage />} />
          <Route path="payments" element={<ClientPaymentsPage />} />
          <Route path="payments/:id" element={<ClientPaymentsPage />} />
          <Route path="reviews" element={<ClientReviewsPage />} />
          <Route path="reviews/new" element={<ClientNewReviewPage />} />
          <Route path="notifications" element={<ClientNotificationsPage />} />
          <Route path="profile" element={<ClientProfilePage />} />
          <Route path="settings" element={<ClientProfilePage />} />
        </Route>

        {/* COMPANY PROTECTED ROUTES */}
        <Route
          path="/company/pending-approval"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyPendingApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/company/dashboard" replace />} />
          <Route path="dashboard" element={<CompanyDashboardPage />} />
          <Route path="recommendations" element={<CompanyRecommendationsPage />} />
          <Route path="requests" element={<CompanyRequestsPage />} />
          <Route path="requests/:id" element={<CompanyRequestDetailPage />} />
          <Route path="quotes" element={<CompanyQuotesPage />} />
          <Route path="quotes/new/:requestId" element={<CompanyNewQuotePage />} />
          <Route path="quotes/:id" element={<CompanyQuoteDetailPage />} />
          <Route path="quotes/:id/edit" element={<CompanyQuoteEditPage />} />
          <Route path="bookings" element={<CompanyBookingsPage />} />
          <Route path="bookings/:id" element={<CompanyBookingDetailPage />} />
          <Route path="calendar" element={<CompanyCalendarPage />} />
          <Route path="messages" element={<CompanyMessagesPage />} />
          <Route path="messages/:id" element={<CompanyMessagesPage />} />
          <Route path="reviews" element={<CompanyReviewsPage />} />
          <Route path="documents" element={<CompanyDocumentsPage />} />
          <Route path="statistics" element={<CompanyStatisticsPage />} />
          <Route path="notifications" element={<CompanyNotificationsPage />} />
          <Route path="profile" element={<CompanyProfilePage />} />
          <Route path="settings" element={<CompanyProfilePage />} />
        </Route>

        {/* ADMIN PROTECTED ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="companies/:id" element={<CompaniesPage />} />
          <Route path="companies/pending" element={<AdminPendingCompaniesPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="requests/:id" element={<AdminRequestsPage />} />
          <Route path="quotes" element={<AdminQuotesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="payments" element={<AdminTransactionsPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
          <Route path="reviews" element={<AdminReviewsModerationPage />} />
          <Route path="reviews/moderation" element={<AdminReviewsModerationPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="reports" element={<AdminAnalyticsPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="support/:id" element={<AdminSupportPage />} />
          <Route path="notifications" element={<AdminDashboardPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        {/* COMPATIBILITY & SHORTCUT REDIRECTS (Handles notification & legacy links) */}
        <Route path="/quotes" element={<SmartRoleRedirect prefix="quotes" />} />
        <Route path="/quotes/:id" element={<SmartRoleRedirect prefix="quotes" />} />
        <Route path="/messages" element={<SmartRoleRedirect prefix="messages" />} />
        <Route path="/messages/:id" element={<SmartRoleRedirect prefix="messages" />} />
        <Route path="/bookings" element={<SmartRoleRedirect prefix="bookings" />} />
        <Route path="/bookings/:id" element={<SmartRoleRedirect prefix="bookings" />} />
        <Route path="/requests" element={<SmartRoleRedirect prefix="requests" />} />
        <Route path="/requests/:id" element={<SmartRoleRedirect prefix="requests" />} />

        {/* ERROR / FALLBACK ROUTES */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  );
}



