import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ClientDashboardLayout } from '../layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from '../layouts/CoiffeurDashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Pages
import HomePage from '../pages/HomePage';
import { SearchPage } from '../features/search/presentation/SearchPage';
import CoiffeurProfilePage from '../pages/CoiffeurProfilePage';
import LoginPage from '../pages/LoginPage';
import OnboardingClientPage from '../pages/OnboardingClientPage';
import OnboardingProPage from '../pages/OnboardingProPage';
import ClientDashboardPage from '../pages/ClientDashboardPage';
import BookingPage from '../pages/BookingPage';
import ClientBookingsPage from '../pages/ClientBookingsPage';
import CoiffeurDashboardPage from '../pages/CoiffeurDashboardPage';
import CoiffeurProfileEditPage from '../pages/CoiffeurProfileEditPage';
import CoiffeurReservationsPage from '../pages/CoiffeurReservationsPage';
import CoiffeurRevenuePage from '../pages/CoiffeurRevenuePage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/coiffeur/:id" element={<CoiffeurProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding/client" element={<OnboardingClientPage />} />
        <Route path="/onboarding/pro" element={<OnboardingProPage />} />
      </Route>

      {/* Client Routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="client">
            <ClientDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/client/dashboard" element={<ClientDashboardPage />} />
        <Route path="/client/bookings" element={<ClientBookingsPage />} />
        <Route path="/booking/:id" element={<BookingPage />} />
      </Route>

      {/* Coiffeur Routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="coiffeur">
            <CoiffeurDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/coiffeur/dashboard" element={<CoiffeurDashboardPage />} />
        <Route path="/coiffeur/profile/edit" element={<CoiffeurProfileEditPage />} />
        <Route path="/coiffeur/reservations" element={<CoiffeurReservationsPage />} />
        <Route path="/coiffeur/revenue" element={<CoiffeurRevenuePage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 