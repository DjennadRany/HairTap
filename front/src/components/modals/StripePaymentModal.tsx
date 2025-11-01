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

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId: string;
  amount: number;
  serviceName: string;
}

const PaymentForm: React.FC<{
  bookingId: string;
  amount: number;
  paymentIntentId: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ bookingId, amount, paymentIntentId, clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // IMPORTANT : Appeler elements.submit() AVANT stripe.confirmPayment()
      // Cela valide les données du formulaire et prépare le paiement
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'Erreur lors de la validation du formulaire');
        setIsProcessing(false);
        return;
      }

      // Maintenant, confirmer le paiement avec Stripe
      // Le PaymentElement affichera automatiquement les méthodes de paiement sauvegardées
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/client/bookings`,
          // Le PaymentElement gère automatiquement la sauvegarde si l'utilisateur coche l'option
          // Les méthodes sauvegardées seront affichées automatiquement dans le PaymentElement
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Erreur lors du paiement');
        setIsProcessing(false);
        return;
      }

      // Si le paiement a réussi
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirmer le paiement côté backend
        if (paymentIntentId) {
          const confirmResponse = await stripeBookingService.confirmPayment(paymentIntentId);
          
          if (confirmResponse.success) {
            // Paiement réussi
            onSuccess();
          } else {
            setError('Erreur lors de la confirmation du paiement');
            setIsProcessing(false);
          }
        } else {
          onSuccess();
        }
      } else {
        setError('Le paiement n\'a pas été confirmé');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du paiement');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations paiement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800 font-medium">Montant à payer</p>
            <p className="text-2xl font-bold text-blue-900">{amount}€</p>
          </div>
          <FaCreditCard className="text-3xl text-blue-500" />
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
          className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <FaSpinner className="animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <FaCreditCard />
              Payer {amount}€
            </>
          )}
        </button>
      </div>

      {/* Informations sécurisées */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Paiement sécurisé par Stripe. Vos informations bancaires ne sont jamais stockées sur nos serveurs.
        </p>
      </div>
    </form>
  );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookingId,
  amount,
  serviceName
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Créer le Payment Intent au chargement du modal
  useEffect(() => {
    if (isOpen && bookingId && amount > 0) {
      const createPaymentIntent = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setClientSecret(null);
          setPaymentIntentId(null);
          
          const response = await stripeBookingService.createPaymentIntent(bookingId, amount);
          
          if (response.success && response.clientSecret) {
            setClientSecret(response.clientSecret);
            setPaymentIntentId(response.paymentIntentId);
          } else {
            setError(response.message || 'Erreur lors de la création du paiement');
          }
        } catch (err: any) {
          console.error('❌ Erreur création Payment Intent:', err);
          setError(err.message || 'Erreur lors de la création du paiement');
        } finally {
          setIsLoading(false);
        }
      };

      createPaymentIntent();
    } else if (!isOpen) {
      // Reset quand le modal se ferme
      setClientSecret(null);
      setPaymentIntentId(null);
      setError(null);
      setIsLoading(true);
    }
  }, [isOpen, bookingId, amount]);

  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
    },
    locale: 'fr' as any,
    // Le PaymentElement affichera automatiquement les méthodes de paiement sauvegardées
    // car le PaymentIntent est créé avec un customer ID
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Paiement sécurisé</h3>
            <p className="text-sm text-gray-600 mt-1">{serviceName}</p>
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
              <p className="text-gray-600">Préparation du paiement...</p>
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
          ) : clientSecret && paymentIntentId ? (
            <Elements stripe={stripePromise} options={options}>
              <PaymentForm
                bookingId={bookingId}
                amount={amount}
                paymentIntentId={paymentIntentId}
                clientSecret={clientSecret}
                onSuccess={() => {
                  onSuccess();
                  onClose();
                }}
                onError={(err) => setError(err)}
              />
            </Elements>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Erreur lors du chargement du paiement</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;

