import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import type { RootState } from '../store/store';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Si déjà connecté, ne pas afficher la page de login
  if (isAuthenticated && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login({ email, password });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#FAF1E0]">
      <div className="w-full max-w-md space-y-6 p-8 bg-fashion-light-gray rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#000000]">Connexion</h2>
          <p className="mt-2 text-gray-600">
            Connectez-vous à votre compte
          </p>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#DE6C5C] focus:ring-[#DE6C5C]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#DE6C5C] focus:ring-[#DE6C5C]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#DE6C5C] hover:bg-[#DE6C5C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DE6C5C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">Pas encore de compte ?</span>{' '}
          <Link to="/signin/client" className="text-[#DE6C5C] hover:text-[#DE6C5C]/90">
            Créer un compte client
          </Link>
          {' ou '}
          <Link to="/signin/coiffeur" className="text-[#DE6C5C] hover:text-[#DE6C5C]/90">
            Créer un compte coiffeur
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 