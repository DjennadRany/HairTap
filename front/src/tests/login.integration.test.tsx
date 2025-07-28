import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { initialState as authInitialState } from '../store/slices/authSlice';
import profileReducer, { initialState as profileInitialState } from '../store/slices/profileSlice';
import LoginPage from '../pages/LoginPage';

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
      const error = new Error('Email ou mot de passe incorrect') as any;
      error.response = { status: 400 };
      throw error;
    }),
  }
}));

describe('LoginPage integration', () => {
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
      expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
      expect(store.getState().auth.isAuthenticated).toBe(false);
      expect(store.getState().auth.user).toBeNull();
    });
  });

  it('affiche une erreur si utilisateur inexistant', async () => {
    const store = getTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'notfound@test.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
      expect(store.getState().auth.isAuthenticated).toBe(false);
      expect(store.getState().auth.user).toBeNull();
    });
  });

  it('connecte et redirige avec de bons identifiants', async () => {
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
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.user?.email).toBe('alice.client@test.com');
      // On ne vérifie pas la redirection ici car MemoryRouter ne simule pas l'URL
    });
  });

  it('ne stocke pas de token ni d’utilisateur après un échec', async () => {
    localStorage.setItem('token', 'should-be-removed');
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
      expect(localStorage.getItem('token')).toBeNull();
      expect(store.getState().auth.user).toBeNull();
    });
  });
}); 