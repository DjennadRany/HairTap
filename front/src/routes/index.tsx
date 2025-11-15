import type { ReactElement } from 'react';
import { Routes, Route } from 'react-router-dom';

import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ClientDashboardLayout } from '../layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from '../layouts/CoiffeurDashboardLayout';
import { AdminDashboardLayout } from '../layouts/AdminDashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

import HomePage from '../pages/HomePage';
import HubPage from '../pages/HubPage';
import LoginPage from '../pages/LoginPage';
import SignInClientPage from '../pages/SignInClientPage';
import SignInCoiffeurPage from '../pages/SignInCoiffeurPage';
import OnboardingClientPage from '../pages/OnboardingClientPage';
import OnboardingProPage from '../pages/OnboardingProPage';
import PhotoSetupPage from '../pages/PhotoSetupPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import { SearchPage } from '../features/search/presentation/SearchPage';
import CoiffeurProfilePage from '../pages/CoiffeurProfilePage';
import ClientServicesPage from '../pages/ClientServicesPage';
import BookingPage from '../pages/BookingPage';
import ClientBookingsPage from '../pages/ClientBookingsPage';
import ClientDashboardPage from '../pages/ClientDashboardPage';
import ClientFavoritesPage from '../pages/ClientFavoritesPage';
import ClientProfilePage from '../pages/ClientProfilePage';
import ProfileEditPage from '../pages/ProfileEditPage';
import ClientChatPage from '../pages/ClientChatPage';
import CoiffeurDashboardPage from '../pages/CoiffeurDashboardPage';
import CoiffeurProfileEditPage from '../pages/CoiffeurProfileEditPage';
import CoiffeurReservationsPage from '../pages/CoiffeurReservationsPage';
import CoiffeurRevenuePage from '../pages/CoiffeurRevenuePage';
import CoiffeurChatPage from '../pages/CoiffeurChatPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';
import CookiesPage from '../pages/CookiesPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminServicesPage from '../pages/AdminServicesPage';
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage';
import AdminSettingsPage from '../pages/AdminSettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

interface NestedRoute {
  path?: string;
  index?: boolean;
  element: ReactElement;
}

const renderNestedRoutes = (routes: NestedRoute[]) =>
  routes.map((route) =>
    route.index ? (
      <Route index element={route.element} key="index" />
    ) : (
      <Route path={route.path} element={route.element} key={route.path} />
    )
  );

const adminRoutes: NestedRoute[] = [
  { index: true, element: <AdminDashboardPage /> },
  { path: 'users', element: <AdminUsersPage /> },
  { path: 'services', element: <AdminServicesPage /> },
  { path: 'analytics', element: <AdminAnalyticsPage /> },
  { path: 'settings', element: <AdminSettingsPage /> }
];

const coiffeurRoutes: NestedRoute[] = [
  { index: true, element: <CoiffeurDashboardPage /> },
  { path: 'profile', element: <CoiffeurProfileEditPage /> },
  { path: 'profile/edit', element: <CoiffeurProfileEditPage /> },
  { path: 'reservations', element: <CoiffeurReservationsPage /> },
  { path: 'revenue', element: <CoiffeurRevenuePage /> },
  { path: 'chat', element: <CoiffeurChatPage /> }
];

const clientRoutes: NestedRoute[] = [
  { path: '/client/dashboard', element: <ClientDashboardPage /> },
  { path: '/client/bookings', element: <ClientBookingsPage /> },
  { path: '/client/favorites', element: <ClientFavoritesPage /> },
  { path: '/client/profile', element: <ClientProfilePage /> },
  { path: '/client/profile/edit', element: <ProfileEditPage /> },
  { path: '/client/services', element: <ClientServicesPage /> },
  { path: '/client/chat', element: <ClientChatPage /> },
  { path: '/client/hub', element: <HubPage /> },
  { path: '/booking/:id', element: <BookingPage /> }
];

const authRoutes: NestedRoute[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/signin/client', element: <SignInClientPage /> },
  { path: '/signin/coiffeur', element: <SignInCoiffeurPage /> },
  { path: '/onboarding/client', element: <OnboardingClientPage /> },
  { path: '/onboarding/pro', element: <OnboardingProPage /> },
  { path: '/photo-setup', element: <PhotoSetupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> }
];

const publicRoutes: NestedRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/hub', element: <HubPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/coiffeur/:id', element: <CoiffeurProfilePage /> },
  { path: '/coiffeur/:coiffeurId/services', element: <ClientServicesPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/cookies', element: <CookiesPage /> }
];

const AppRoutes = () => (
  <Routes>
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboardLayout />
        </ProtectedRoute>
      }
    >
      {renderNestedRoutes(adminRoutes)}
    </Route>

    <Route
      path="/coiffeur/*"
      element={
        <ProtectedRoute requiredRole="coiffeur">
          <CoiffeurDashboardLayout />
        </ProtectedRoute>
      }
    >
      {renderNestedRoutes(coiffeurRoutes)}
    </Route>

    <Route element={<PublicLayout />}>
      {renderNestedRoutes(publicRoutes)}
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    <Route element={<AuthLayout />}>
      {renderNestedRoutes(authRoutes)}
    </Route>

    <Route
      element={
        <ProtectedRoute requiredRole="client">
          <ClientDashboardLayout />
        </ProtectedRoute>
      }
    >
      {renderNestedRoutes(clientRoutes)}
    </Route>
  </Routes>
);

export default AppRoutes;
