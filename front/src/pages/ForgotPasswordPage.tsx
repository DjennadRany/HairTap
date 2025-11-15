import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api/auth';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sanitizedEmail = email.trim();
    if (!sanitizedEmail) {
      setMessage(null);
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await authService.requestPasswordReset(sanitizedEmail);
      setMessage(response.message);
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Impossible d\'envoyer le lien de réinitialisation pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Mot de passe oublié</h1>
        <p className="text-sm text-gray-600">
          Entrez l'adresse email associée à votre compte TapHair pour recevoir un lien de réinitialisation.
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#DE6C5C] focus:ring-[#DE6C5C]"
            placeholder="vous@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full rounded-md bg-[#DE6C5C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#c75f51] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DE6C5C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
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

export default ForgotPasswordPage;
