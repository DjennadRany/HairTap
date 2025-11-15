import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { ClientDashboardLayout } from './layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from './layouts/CoiffeurDashboardLayout';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout'; // ✅ AJOUT LAYOUT ADMIN
import NotificationManager from './components/ui/NotificationManager';
import LoadingScreen from './components/LoadingScreen';
import { GalleryProvider } from './contexts/GalleryContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HubPage = lazy(() => import('./pages/HubPage'));
const SignInClientPage = lazy(() => import('./pages/SignInClientPage'));
const SignInCoiffeurPage = lazy(() => import('./pages/SignInCoiffeurPage'));
const PhotoSetupPage = lazy(() => import('./pages/PhotoSetupPage'));
const SearchPage = lazy(() =>
  import('./features/search/presentation/SearchPage').then((module) => ({
    default: module.SearchPage
  }))
);
const CoiffeurProfilePage = lazy(() => import('./pages/CoiffeurProfilePage'));
const ClientServicesPage = lazy(() => import('./pages/ClientServicesPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ClientBookingsPage = lazy(() => import('./pages/ClientBookingsPage'));
const ClientDashboardPage = lazy(() => import('./pages/ClientDashboardPage'));
const ClientFavoritesPage = lazy(() => import('./pages/ClientFavoritesPage'));
const ClientProfilePage = lazy(() => import('./pages/ClientProfilePage'));
const ClientChatPage = lazy(() =>
  import('./pages/ClientChatPage').then((module) => ({ default: module.ClientChatPage }))
);
const CoiffeurDashboardPage = lazy(() => import('./pages/CoiffeurDashboardPage'));
const CoiffeurReservationsPage = lazy(() => import('./pages/CoiffeurReservationsPage'));
const CoiffeurRevenuePage = lazy(() => import('./pages/CoiffeurRevenuePage'));
const CoiffeurProfileEditPage = lazy(() => import('./pages/CoiffeurProfileEditPage'));
const CoiffeurChatPage = lazy(() =>
  import('./pages/CoiffeurChatPage').then((module) => ({ default: module.CoiffeurChatPage }))
);
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ✅ PAGES ADMIN
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminServicesPage = lazy(() => import('./pages/AdminServicesPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));

function App() {
  return (
    <NotificationManager>
      <GalleryProvider>
        <Suspense fallback={<LoadingScreen message="Chargement de la page..." />}>
          <Routes>
            {/* ✅ ROUTES ADMIN - DOIT ÊTRE EN PREMIER ET AVANT TOUT */}
            <Route
              path="/admin/*"
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

            {/* Routes publiques */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/hub" element={<HubPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signin/client" element={<SignInClientPage />} />
              <Route path="/signin/coiffeur" element={<SignInCoiffeurPage />} />
              <Route path="/photo-setup" element={<PhotoSetupPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/coiffeur/:id" element={<CoiffeurProfilePage />} />
              <Route path="/coiffeur/:coiffeurId/services" element={<ClientServicesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
            </Route>

            {/* Routes client */}
            <Route
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/client/dashboard" element={<ClientDashboardPage />} />
              <Route path="/client/favorites" element={<ClientFavoritesPage />} />
              <Route path="/client/profile" element={<ClientProfilePage />} />
              <Route path="/client/bookings" element={<ClientBookingsPage />} />
              <Route path="/booking/:id" element={<BookingPage />} />
              <Route path="/client/chat" element={<ClientChatPage />} />
            </Route>

            {/* Routes coiffeur - DÉPLACÉES APRÈS ADMIN */}
            <Route
              element={
                <ProtectedRoute requiredRole="coiffeur">
                  <CoiffeurDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/coiffeur/dashboard" element={<CoiffeurDashboardPage />} />
              <Route path="/coiffeur/profile" element={<CoiffeurProfileEditPage />} />
              <Route path="/coiffeur/reservations" element={<CoiffeurReservationsPage />} />
              <Route path="/coiffeur/revenue" element={<CoiffeurRevenuePage />} />
              <Route path="/coiffeur/chat" element={<CoiffeurChatPage />} />
            </Route>

            {/* Route 404 - DOIT ÊTRE EN DERNIER */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </GalleryProvider>
    </NotificationManager>
  );
}

export default App;
