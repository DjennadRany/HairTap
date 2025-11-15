import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ClientDashboardLayout } from '../layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from '../layouts/CoiffeurDashboardLayout';
import { AdminDashboardLayout } from '../layouts/AdminDashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Pages
import HomePage from '../pages/HomePage';
import { SearchPage } from '../features/search/presentation/SearchPage';
import CoiffeurProfilePage from '../pages/CoiffeurProfilePage';
import LoginPage from '../pages/LoginPage';
import OnboardingClientPage from '../pages/OnboardingClientPage';
import OnboardingProPage from '../pages/OnboardingProPage';
import SignInClientPage from '../pages/SignInClientPage';
import SignInCoiffeurPage from '../pages/SignInCoiffeurPage';
import ClientDashboardPage from '../pages/ClientDashboardPage';
import BookingPage from '../pages/BookingPage';
import ClientBookingsPage from '../pages/ClientBookingsPage';
import CoiffeurDashboardPage from '../pages/CoiffeurDashboardPage';
import CoiffeurProfileEditPage from '../pages/CoiffeurProfileEditPage';
import CoiffeurReservationsPage from '../pages/CoiffeurReservationsPage';
import CoiffeurRevenuePage from '../pages/CoiffeurRevenuePage';
import HubPage from '../pages/HubPage';
import ClientFavoritesPage from '../pages/ClientFavoritesPage';
import ClientProfilePage from '../pages/ClientProfilePage';
import ProfileEditPage from '../pages/ProfileEditPage';
import ClientServicesPage from '../pages/ClientServicesPage';
import ClientChatPage from '../pages/ClientChatPage';
import CoiffeurChatPage from '../pages/CoiffeurChatPage';
import PhotoSetupPage from '../pages/PhotoSetupPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';
import CookiesPage from '../pages/CookiesPage';

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

			{/* ✅ ROUTES COIFFEUR AVEC LAYOUT (Outlet) */}
                        <Route
                                path="/coiffeur"
                                element={
                                        <ProtectedRoute requiredRole="coiffeur">
                                                <CoiffeurDashboardLayout />
					</ProtectedRoute>
				}
			>
                                <Route path="dashboard" element={<CoiffeurDashboardPage />} />
                                <Route path="profile/edit" element={<CoiffeurProfileEditPage />} />
                                <Route path="profile" element={<CoiffeurProfileEditPage />} />
                                <Route path="reservations" element={<CoiffeurReservationsPage />} />
                                <Route path="revenue" element={<CoiffeurRevenuePage />} />
                                <Route path="chat" element={<CoiffeurChatPage />} />
                        </Route>

                        {/* Public Routes */}
                        <Route element={<PublicLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/coiffeur/:id" element={<CoiffeurProfilePage />} />
                                <Route path="/hub" element={<HubPage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/cookies" element={<CookiesPage />} />
                                <Route path="*" element={<NotFoundPage />} />
                        </Route>

                        {/* Auth Routes */}
                        <Route element={<AuthLayout />}>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signin/client" element={<SignInClientPage />} />
                                <Route path="/signin/coiffeur" element={<SignInCoiffeurPage />} />
                                <Route path="/onboarding/client" element={<OnboardingClientPage />} />
                                <Route path="/onboarding/pro" element={<OnboardingProPage />} />
                                <Route path="/onboarding/photo" element={<PhotoSetupPage />} />
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
                                <Route path="/client/favorites" element={<ClientFavoritesPage />} />
                                <Route path="/client/profile" element={<ClientProfilePage />} />
                                <Route path="/client/profile/edit" element={<ProfileEditPage />} />
                                <Route path="/client/services" element={<ClientServicesPage />} />
                                <Route path="/client/chat" element={<ClientChatPage />} />
                                <Route path="/client/hub" element={<HubPage />} />
                                <Route path="/booking/:id" element={<BookingPage />} />
                        </Route>
		</Routes>
	);
};

export default AppRoutes;
