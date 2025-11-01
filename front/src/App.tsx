import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { ClientDashboardLayout } from './layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from './layouts/CoiffeurDashboardLayout';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout'; // ✅ AJOUT LAYOUT ADMIN
import NotificationManager from './components/ui/NotificationManager';
import { GalleryProvider } from './contexts/GalleryContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import HubPage from './pages/HubPage';
import SignInClientPage from './pages/SignInClientPage';
import SignInCoiffeurPage from './pages/SignInCoiffeurPage';
import PhotoSetupPage from './pages/PhotoSetupPage';
import { SearchPage } from './features/search/presentation/SearchPage';
import CoiffeurProfilePage from './pages/CoiffeurProfilePage';
import ClientServicesPage from './pages/ClientServicesPage';
import BookingPage from './pages/BookingPage';
import ClientBookingsPage from './pages/ClientBookingsPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ClientFavoritesPage from './pages/ClientFavoritesPage';
import ClientProfilePage from './pages/ClientProfilePage';
import CoiffeurDashboardPage from './pages/CoiffeurDashboardPage';
import CoiffeurReservationsPage from './pages/CoiffeurReservationsPage';
import CoiffeurRevenuePage from './pages/CoiffeurRevenuePage';
import CoiffeurProfileEditPage from './pages/CoiffeurProfileEditPage';
import NotFoundPage from './pages/NotFoundPage';
import { ClientChatPage } from './pages/ClientChatPage';
import { CoiffeurChatPage } from './pages/CoiffeurChatPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';

// ✅ PAGES ADMIN
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function App() {
  return (
    <NotificationManager>
      <GalleryProvider>
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
      </GalleryProvider>
    </NotificationManager>
  );
}

export default App;
