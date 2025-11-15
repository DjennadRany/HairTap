/**
 * Hook centralisé pour la gestion des rôles utilisateur
 * Remplace toutes les vérifications dispersées dans les composants
 */

import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAdmin, selectIsCoiffeur, selectIsClient } from '../store/slices/authSlice';
import type { User } from '../types/models';

export interface RoleHook {
  user: User | null;
  role: 'client' | 'coiffeur' | 'admin' | null;
  isClient: boolean;
  isCoiffeur: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasRole: (role: 'client' | 'coiffeur' | 'admin') => boolean;
  hasAnyRole: (roles: ('client' | 'coiffeur' | 'admin')[]) => boolean;
}

/**
 * Hook principal pour la gestion des rôles
 * Utilise les sélecteurs Redux optimisés
 */
export function useRole(): RoleHook {
  const user = useSelector(selectCurrentUser);
  const isClient = useSelector(selectIsClient);
  const isCoiffeur = useSelector(selectIsCoiffeur);
  const isAdmin = useSelector(selectIsAdmin);

  const role = user?.role || null;
  const isAuthenticated = !!user && !!user._id && !!user.email;

  const hasRole = (requiredRole: 'client' | 'coiffeur' | 'admin'): boolean => {
    return role === requiredRole;
  };

  const hasAnyRole = (roles: ('client' | 'coiffeur' | 'admin')[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  return {
    user,
    role,
    isClient,
    isCoiffeur,
    isAdmin,
    isAuthenticated,
    hasRole,
    hasAnyRole
  };
}

/**
 * Hook spécifique pour vérifier si l'utilisateur est un client
 */
export function useIsClient(): boolean {
  return useSelector(selectIsClient);
}

/**
 * Hook spécifique pour vérifier si l'utilisateur est un coiffeur
 */
export function useIsCoiffeur(): boolean {
  return useSelector(selectIsCoiffeur);
}

/**
 * Hook spécifique pour vérifier si l'utilisateur est un admin
 */
export function useIsAdmin(): boolean {
  return useSelector(selectIsAdmin);
}

/**
 * Hook pour obtenir uniquement l'utilisateur actuel
 */
export function useCurrentUser(): User | null {
  return useSelector(selectCurrentUser);
}

