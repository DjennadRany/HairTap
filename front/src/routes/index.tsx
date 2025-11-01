import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ClientDashboardLayout } from '../layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from '../layouts/CoiffeurDashboardLayout';
import { AdminDashboardLayout } from '../layouts/AdminDashboardLayout'; // ✅ AJOUT LAYOUT ADMIN
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

// ✅ PAGES ADMIN
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminServicesPage from '../pages/AdminServicesPage';
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage';
import AdminSettingsPage from '../pages/AdminSettingsPage';

import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
	return (
		<Routes>
			{/* ✅ ROUTES ADMIN AVEC LAYOUT - DOIT ÊTRE EN PREMIER */}
			<Route
				path="/admin"
				element={
					<ProtectedRoute requiredRole="admin">
						<AdminDashboardLayout />
					</ProtectedRoute>
				}
			>
				<Route index element={<AdminDashboardPage />} />
				<Route path="users" element={<AdminUsersPage />} />
				<Route path="services" element={<AdminServicesPage />} />
				<Route path="analytics" element={<AdminAnalyticsPage />} />
				<Route path="settings" element={<AdminSettingsPage />} />
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
			</Route>

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
				<Route path="/signin/client" element={<SignInClientPage />} />
				<Route path="/signin/coiffeur" element={<SignInCoiffeurPage />} />
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
		</Routes>
	);
};

export default AppRoutes; 