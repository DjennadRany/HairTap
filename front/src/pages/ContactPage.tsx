import type { FC, FormEvent } from 'react';
import { useState } from 'react';

const ContactPage: FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Implement contact form submission
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Contactez-nous</h1>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Informations de contact</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Adresse</h3>
              <p className="text-gray-600">
                123 Rue de la Coiffure<br />
                75001 Paris<br />
                France
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:contact@taphair.com" className="text-accent hover:text-accent-dark">
                  contact@taphair.com
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Téléphone</h3>
              <p className="text-gray-600">
                <a href="tel:+33123456789" className="text-accent hover:text-accent-dark">
                  +33 1 23 45 67 89
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Horaires</h3>
              <p className="text-gray-600">
                Lundi - Vendredi : 9h - 18h<br />
                Samedi : 10h - 16h<br />
                Dimanche : Fermé
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Envoyez-nous un message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent focus:border-accent"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent focus:border-accent"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Sujet
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent focus:border-accent"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent focus:border-accent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>

            {submitStatus === 'success' && (
              <p className="text-green-600 text-center">
                Votre message a été envoyé avec succès !
              </p>
            )}

            {submitStatus === 'error' && (
              <p className="text-red-600 text-center">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 