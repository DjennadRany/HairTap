import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaTimes, FaCreditCard, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { stripeBookingService } from '../../services/api/stripeBooking';

// Initialiser Stripe avec la clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SetupForm: React.FC<{
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // IMPORTANT : Appeler elements.submit() AVANT stripe.confirmSetup()
      // Cela valide les données du formulaire et prépare l'enregistrement
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'Erreur lors de la validation du formulaire');
        setIsProcessing(false);
        return;
      }

      // Maintenant, confirmer le Setup Intent
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client/profile`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Erreur lors de l\'enregistrement de la carte');
        setIsProcessing(false);
        return;
      }

      // Si le setup a réussi
      if (setupIntent && setupIntent.status === 'succeeded') {
        // Carte enregistrée avec succès
        onSuccess();
      } else {
        setError('La carte n\'a pas été enregistrée');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de la carte');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message informatif */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <FaCreditCard className="text-blue-500" />
          <p className="text-sm text-blue-800">
            Ajoutez une méthode de paiement pour faciliter vos prochains paiements
          </p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Boutons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <FaSpinner className="animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <FaCheckCircle />
              Enregistrer la carte
            </>
          )}
        </button>
      </div>

      {/* Informations sécurisées */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Carte enregistrée de manière sécurisée par Stripe (PCI-DSS)
        </p>
      </div>
    </form>
  );
};

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Créer le Setup Intent au chargement du modal
  useEffect(() => {
    if (isOpen) {
      const createSetupIntent = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await stripeBookingService.createSetupIntent();
          
          if (response.success && response.clientSecret) {
            setClientSecret(response.clientSecret);
          } else {
            setError('Erreur lors de la création du formulaire');
          }
        } catch (err: any) {
          setError(err.message || 'Erreur lors de la création du formulaire');
        } finally {
          setIsLoading(false);
        }
      };

      createSetupIntent();
    } else {
      // Reset quand le modal se ferme
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
    locale: 'fr' as any,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ajouter une carte</h3>
            <p className="text-sm text-gray-600 mt-1">Enregistrez une méthode de paiement</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">Préparation du formulaire...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Fermer
              </button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={options}>
              <SetupForm
                onSuccess={() => {
                  onSuccess();
                  onClose();
                }}
                onError={(err) => setError(err)}
              />
            </Elements>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Erreur lors du chargement du formulaire</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;

