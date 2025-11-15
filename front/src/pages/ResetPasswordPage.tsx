import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api/auth';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromQuery = searchParams.get('token');
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
      setError(null);
    } else {
      setToken(null);
      setError('Le lien de réinitialisation est invalide ou expiré.');
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError('Le lien de réinitialisation est invalide ou incomplet.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Veuillez renseigner et confirmer votre nouveau mot de passe.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await authService.resetPassword({ token, password });
      setMessage(response.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Impossible de réinitialiser le mot de passe pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Réinitialiser votre mot de passe</h1>
        <p className="text-sm text-gray-600">
          Choisissez un nouveau mot de passe pour sécuriser votre compte TapHair.
        </p>
      </div>

      {message && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#DE6C5C] focus:ring-[#DE6C5C]"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#DE6C5C] focus:ring-[#DE6C5C]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !token}
          className="w-full rounded-md bg-[#DE6C5C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#c75f51] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DE6C5C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Réinitialisation en cours…' : 'Mettre à jour le mot de passe'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-600">
        <Link to="/login" className="font-medium text-[#DE6C5C] hover:text-[#c75f51]">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
