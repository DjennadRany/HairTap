import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setUser } from '../store/slices/authSlice';
import { initialState as authInitialState } from '../store/slices/authSlice';
import profileReducer, { initialState as profileInitialState } from '../store/slices/profileSlice';
import LoginPage from '../pages/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ClientDashboardPage from '../pages/ClientDashboardPage';

// Mock userService and API
jest.mock('../services/api/auth', () => ({
  authService: {
    login: jest.fn(async ({ email, password }) => {
      if (email === 'alice.client@test.com' && password === 'Test1234') {
        return {
          token: 'fake-jwt-token',
          user: {
            _id: 'clientid',
            name: 'Alice Client',
            email: 'alice.client@test.com',
            role: 'user',
            photo: ''
          }
        };
      }
      throw new Error('Email ou mot de passe incorrect');
    }),
    getCurrentUser: jest.fn(async () => ({
      _id: 'clientid',
      name: 'Alice Client',
      email: 'alice.client@test.com',
      role: 'user',
      photo: ''
    })),
  }
}));

describe('Authentication flow', () => {
  const getTestStore = (authState = {}, profileState = {}) =>
    configureStore({
      reducer: { auth: authReducer, profile: profileReducer },
      preloadedState: {
        auth: { ...authInitialState, ...authState },
        profile: { ...profileInitialState, ...profileState }
      },
    });

  it('affiche une erreur si mauvais identifiants', async () => {
    const store = getTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument();
    });
  });

  it('login et mapping du rôle user -> client', async () => {
    const store = getTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice.client@test.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(store.getState().auth.user?.role).toBe('client');
    });
  });

  it('ProtectedRoute bloque l\'accès si non connecté', () => {
    const store = getTestStore({ isAuthenticated: false, user: null, loading: false });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
    expect(screen.queryByText(/tableau de bord/i)).not.toBeInTheDocument();
  });

  it('ProtectedRoute autorise l\'accès si connecté et bon rôle', () => {
    const store = getTestStore({ isAuthenticated: true, user: { id: 'clientid', name: 'Alice', email: 'alice@test.com', role: 'client' }, loading: false });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/tableau de bord/i)).toBeInTheDocument();
  });
}); 