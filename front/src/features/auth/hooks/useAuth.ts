import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CredentialResponse } from '@react-oauth/google';
import type { User, AuthState } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const loginWithGoogle = useCallback(async (response: CredentialResponse) => {
    try {
      // Implémentation à venir avec l'API
    } catch (error) {
      console.error('Google login error:', error);
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    // Implémentation à venir
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    loginWithGoogle,
    logout
  };
}; 