import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { mockUsers } from '../mocks/users';

const LoginPage: FC = () => {
  const { loginAsMock, isLoading, error } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#FAF1E0]">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#000000]">Connexion</h2>
          <p className="mt-2 text-gray-600">
            Choisissez un compte de démonstration
          </p>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>

        <div className="space-y-4">
          {mockUsers.map(user => (
            <button
              key={user.id}
              onClick={() => loginAsMock(user)}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                className="h-8 w-8 rounded-full mr-3"
                src={user.picture}
                alt={user.name}
              />
              <div className="text-left">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">Pas encore de compte ?</span>{' '}
          <Link to="/" className="text-[#DE6C5C] hover:text-[#DE6C5C]/90">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 