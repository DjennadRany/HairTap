import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  FaTimes,
  FaCreditCard,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { stripeBookingService } from '../../services/api/stripeBooking';
import { bookingService } from '../../services/api/bookings';

// Initialiser Stripe avec la clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onStatusChange: (status: PaymentStatusType) => void | Promise<void>;
  paymentStatus: PaymentStatusType;
  bookingId: string;
  amount: number;
  serviceName: string;
}

type PaymentStatusType = 'initiated' | 'pending' | 'confirmed' | 'cancelled' | 'refunded';

const PaymentForm: React.FC<{
  amount: number;
  paymentIntentId: string;
  clientSecret: string;
  paymentStatus: PaymentStatusType;
  onSuccess: () => void;
  onError: (error: string | null) => void;
  onStatusChange: (status: PaymentStatusType) => Promise<void>;
  onCancel: () => void;
  statusSyncError?: string | null;
}> = ({
  amount,
  paymentIntentId,
  clientSecret,
  paymentStatus,
  onSuccess,
  onError,
  onStatusChange,
  onCancel,
  statusSyncError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusConfig: Record<PaymentStatusType, { label: string; description?: string; tone: string; border: string; icon: React.ReactNode }> = {
    initiated: {
      label: 'Paiement initié',
      description: 'Vous pouvez finaliser votre paiement dès maintenant.',
      tone: 'text-blue-700',
      border: 'bg-blue-50 border-blue-200',
      icon: <FaCreditCard className="text-blue-500" />
    },
    pending: {
      label: 'Paiement en attente',
      description: 'Nous attendons la confirmation de votre banque. Merci de patienter quelques instants.',
      tone: 'text-amber-700',
      border: 'bg-amber-50 border-amber-200',
      icon: <FaSpinner className="animate-spin text-amber-500" />
    },
    confirmed: {
      label: 'Paiement confirmé',
      description: 'Votre paiement a été validé avec succès.',
      tone: 'text-emerald-700',
      border: 'bg-emerald-50 border-emerald-200',
      icon: <FaCheckCircle className="text-emerald-500" />
    },
    cancelled: {
      label: 'Paiement interrompu',
      description: 'Vous pourrez reprendre ce paiement plus tard depuis votre espace client.',
      tone: 'text-rose-700',
      border: 'bg-rose-50 border-rose-200',
      icon: <FaTimesCircle className="text-rose-500" />
    },
    refunded: {
      label: 'Paiement remboursé',
      description: 'Le montant de cette réservation a été remboursé.',
      tone: 'text-purple-700',
      border: 'bg-purple-50 border-purple-200',
      icon: <FaExclamationTriangle className="text-purple-500" />
    }
  };

  const handleStatusChange = useCallback(
    async (status: PaymentStatusType) => {
      await onStatusChange(status);
    },
    [onStatusChange]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();

      if (submitError) {
        const message = submitError.message || 'Erreur lors de la validation du formulaire';
        setError(message);
        onError(message);
        await handleStatusChange('initiated');
        return;
      }

      await handleStatusChange('pending');

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/client/bookings`
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        const message = stripeError.message || 'Erreur lors du paiement';
        setError(message);
        onError(message);
        await handleStatusChange('cancelled');
        return;
      }

      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          if (paymentIntentId) {
            const confirmResponse = await stripeBookingService.confirmPayment(paymentIntentId);

            if (confirmResponse.success) {
              await handleStatusChange('confirmed');
              onError(null);
              onSuccess();
            } else {
              const message = confirmResponse.message || 'Erreur lors de la confirmation du paiement';
              setError(message);
              onError(message);
              await handleStatusChange(
                confirmResponse.status === 'processing' ? 'pending' : 'cancelled'
              );
            }
          } else {
            await handleStatusChange('confirmed');
            onError(null);
            onSuccess();
          }
        } else if (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_action') {
          const message = 'Le paiement est en cours de traitement. Il sera confirmé automatiquement dès réception.';
          setError(message);
          onError(message);
          await handleStatusChange('pending');
        } else {
          const message = 'Le paiement n\'a pas été confirmé. Vous pouvez réessayer.';
          setError(message);
          onError(message);
          await handleStatusChange('cancelled');
        }
      } else {
        const message = 'Le paiement n\'a pas été confirmé.';
        setError(message);
        onError(message);
        await handleStatusChange('cancelled');
      }
    } catch (err: any) {
      const message = err?.message || 'Erreur lors du paiement';
      setError(message);
      onError(message);
      await handleStatusChange('cancelled');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (isProcessing) {
      return;
    }
    await handleStatusChange('cancelled');
    setError(null);
    onError(null);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`border rounded-lg p-4 ${statusConfig[paymentStatus].border}`}>
        <div className="flex items-start gap-3">
          <div className="mt-1">{statusConfig[paymentStatus].icon}</div>
          <div>
            <p className={`font-semibold ${statusConfig[paymentStatus].tone}`}>
              {statusConfig[paymentStatus].label}
            </p>
            {statusConfig[paymentStatus].description && (
              <p className="text-sm text-gray-600 mt-1">
                {statusConfig[paymentStatus].description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800 font-medium">Montant à payer</p>
            <p className="text-2xl font-bold text-blue-900">{amount}€</p>
          </div>
          <FaCreditCard className="text-3xl text-blue-500" />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement />
      </div>

      {statusSyncError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">{statusSyncError}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={handleCancel}
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
  onStatusChange,
  paymentStatus,
  bookingId,
  amount,
  serviceName
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSyncError, setStatusSyncError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<PaymentStatusType>(paymentStatus);
  const lastSyncedStatusRef = useRef<PaymentStatusType | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalStatus(paymentStatus);
      lastSyncedStatusRef.current = paymentStatus;
      setStatusSyncError(null);
    }
  }, [isOpen, paymentStatus]);

  const syncStatus = useCallback(
    async (status: PaymentStatusType) => {
      setLocalStatus(status);
      try {
        await onStatusChange(status);
      } catch (err) {
        console.error('[StripePaymentModal] Erreur mise à jour statut côté client:', err);
      }

      if (!bookingId) {
        return;
      }

      if (lastSyncedStatusRef.current === status) {
        return;
      }

      try {
        const response = await bookingService.updatePaymentStatus(bookingId, status);
        if (!response.success) {
          throw new Error(response.message || "Impossible de synchroniser le statut de paiement");
        }
        lastSyncedStatusRef.current = status;
        setStatusSyncError(null);
      } catch (err: any) {
        console.error('[StripePaymentModal] Erreur synchronisation statut paiement:', err);
        setStatusSyncError(
          err?.response?.data?.message ||
            err?.message ||
            "Nous n'avons pas pu synchroniser le statut du paiement."
        );
      }
    },
    [bookingId, onStatusChange]
  );

  const handleClose = useCallback(async () => {
    if (localStatus !== 'confirmed') {
      await syncStatus('cancelled');
    }
    onClose();
  }, [localStatus, onClose, syncStatus]);

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
            await syncStatus('initiated');
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
  }, [isOpen, bookingId, amount, syncStatus]);

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
            onClick={handleClose}
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
                onClick={handleClose}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Fermer
              </button>
            </div>
          ) : clientSecret && paymentIntentId ? (
            <Elements stripe={stripePromise} options={options}>
              <PaymentForm
                amount={amount}
                paymentIntentId={paymentIntentId}
                clientSecret={clientSecret}
                paymentStatus={localStatus}
                onSuccess={() => {
                  onSuccess();
                }}
                onError={(err) => setError(err)}
                onStatusChange={syncStatus}
                onCancel={onClose}
                statusSyncError={statusSyncError}
              />
            </Elements>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Erreur lors du chargement du paiement</p>
              <button
                onClick={handleClose}
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

