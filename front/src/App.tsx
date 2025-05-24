import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { ClientDashboardLayout } from './layouts/ClientDashboardLayout';
import { CoiffeurDashboardLayout } from './layouts/CoiffeurDashboardLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { SearchPage } from './features/search/presentation/SearchPage';
import CoiffeurProfilePage from './pages/CoiffeurProfilePage';
import BookingPage from './pages/BookingPage';
import ClientBookingsPage from './pages/ClientBookingsPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ClientFavoritesPage from './pages/ClientFavoritesPage';
import ClientProfilePage from './pages/ClientProfilePage';
import CoiffeurDashboardPage from './pages/CoiffeurDashboardPage';
import CoiffeurReservationsPage from './pages/CoiffeurReservationsPage';
import CoiffeurRevenuePage from './pages/CoiffeurRevenuePage';
import NotFoundPage from './pages/NotFoundPage';
import { ClientChatPage } from './pages/ClientChatPage';
import { CoiffeurChatPage } from './pages/CoiffeurChatPage';

function App() {
  return (
    <Routes>
      {/* Routes publiques avec PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/coiffeur/:id" element={<CoiffeurProfilePage />} />
      </Route>

      {/* Routes client avec ClientDashboardLayout */}
      <Route element={<ClientDashboardLayout />}>
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/favorites"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientFavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/profile"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/bookings"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute requiredRole="client">
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/chat"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientChatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Routes coiffeur avec CoiffeurDashboardLayout */}
      <Route element={<CoiffeurDashboardLayout />}>
        <Route
          path="/coiffeur/dashboard"
          element={
            <ProtectedRoute requiredRole="coiffeur">
              <CoiffeurDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coiffeur/reservations"
          element={
            <ProtectedRoute requiredRole="coiffeur">
              <CoiffeurReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coiffeur/revenue"
          element={
            <ProtectedRoute requiredRole="coiffeur">
              <CoiffeurRevenuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coiffeur/chat"
          element={
            <ProtectedRoute requiredRole="coiffeur">
              <CoiffeurChatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
