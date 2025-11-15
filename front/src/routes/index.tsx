import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ClientDashboardLayout } from '../layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from '../layouts/CoiffeurDashboardLayout';
import { AdminDashboardLayout } from '../layouts/AdminDashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const HubPage = lazy(() => import('../pages/HubPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const SignInClientPage = lazy(() => import('../pages/SignInClientPage'));
const SignInCoiffeurPage = lazy(() => import('../pages/SignInCoiffeurPage'));
const OnboardingClientPage = lazy(() => import('../pages/OnboardingClientPage'));
const OnboardingProPage = lazy(() => import('../pages/OnboardingProPage'));
const PhotoSetupPage = lazy(() => import('../pages/PhotoSetupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const SearchPage = lazy(() =>
  import('../features/search/presentation/SearchPage').then((module) => ({
    default: module.SearchPage
  }))
);
const CoiffeurProfilePage = lazy(() => import('../pages/CoiffeurProfilePage'));
const ClientServicesPage = lazy(() => import('../pages/ClientServicesPage'));
const BookingPage = lazy(() => import('../pages/BookingPage'));
const ClientBookingsPage = lazy(() => import('../pages/ClientBookingsPage'));
const ClientDashboardPage = lazy(() => import('../pages/ClientDashboardPage'));
const ClientFavoritesPage = lazy(() => import('../pages/ClientFavoritesPage'));
const ClientProfilePage = lazy(() => import('../pages/ClientProfilePage'));
const ProfileEditPage = lazy(() => import('../pages/ProfileEditPage'));
const ClientChatPage = lazy(() => import('../pages/ClientChatPage'));
const CoiffeurDashboardPage = lazy(() => import('../pages/CoiffeurDashboardPage'));
const CoiffeurProfileEditPage = lazy(() => import('../pages/CoiffeurProfileEditPage'));
const CoiffeurReservationsPage = lazy(() => import('../pages/CoiffeurReservationsPage'));
const CoiffeurRevenuePage = lazy(() => import('../pages/CoiffeurRevenuePage'));
const CoiffeurChatPage = lazy(() => import('../pages/CoiffeurChatPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const CookiesPage = lazy(() => import('../pages/CookiesPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage'));
const AdminServicesPage = lazy(() => import('../pages/AdminServicesPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('../pages/AdminSettingsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

interface NestedRoute {
  path?: string;
  index?: boolean;
  element: JSX.Element;
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
