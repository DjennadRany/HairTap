import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaTrash, FaPlus, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { stripeBookingService } from '../services/api/stripeBooking';

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: any;
  created: number;
}

interface PaymentMethodsListProps {
  onAddPaymentMethod?: () => void;
  onSelectPaymentMethod?: (paymentMethodId: string) => void;
  showAddButton?: boolean;
}

const PaymentMethodsList: React.FC<PaymentMethodsListProps> = ({
  onAddPaymentMethod,
  onSelectPaymentMethod,
  showAddButton = true
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Charger les méthodes de paiement
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stripeBookingService.getPaymentMethods();
      
      if (response.success) {
        setPaymentMethods(response.paymentMethods || []);
      } else {
        setError('Erreur lors du chargement des méthodes de paiement');
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement méthodes de paiement:', err);
      setError('Erreur lors du chargement des méthodes de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      return;
    }

    try {
      setDeletingId(paymentMethodId);
      const response = await stripeBookingService.deletePaymentMethod(paymentMethodId);
      
      if (response.success) {
        // Recharger la liste
        await loadPaymentMethods();
      } else {
        alert(response.message || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      console.error('❌ Erreur suppression méthode de paiement:', err);
      alert('Erreur lors de la suppression de la méthode de paiement');
    } finally {
      setDeletingId(null);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return '💳';
    if (brandLower.includes('mastercard')) return '💳';
    if (brandLower.includes('amex') || brandLower.includes('american')) return '💳';
    return '💳';
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FaSpinner className="animate-spin text-2xl text-gray-400 mr-3" />
        <span className="text-gray-600">Chargement des méthodes de paiement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
        <button
          onClick={loadPaymentMethods}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec bouton ajouter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">💳 Mes méthodes de paiement</h3>
        {showAddButton && onAddPaymentMethod && (
          <button
            onClick={onAddPaymentMethod}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FaPlus />
            Ajouter une carte
          </button>
        )}
      </div>

      {/* Liste des méthodes de paiement */}
      {paymentMethods.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <FaCreditCard className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Aucune méthode de paiement sauvegardée</p>
          {showAddButton && onAddPaymentMethod && (
            <button
              onClick={onAddPaymentMethod}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter une première carte
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`border rounded-lg p-4 transition-all ${
                onSelectPaymentMethod
                  ? 'cursor-pointer hover:border-blue-500 hover:shadow-md'
                  : 'border-gray-200'
              } ${deletingId === pm.id ? 'opacity-50' : ''}`}
              onClick={() => onSelectPaymentMethod && onSelectPaymentMethod(pm.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getCardBrandIcon(pm.card.brand)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Expire le {formatExpiryDate(pm.card.expMonth, pm.card.expYear)}
                    </p>
                    {pm.billingDetails?.name && (
                      <p className="text-xs text-gray-500 mt-1">{pm.billingDetails.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onSelectPaymentMethod && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPaymentMethod(pm.id);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Utiliser
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pm.id);
                    }}
                    disabled={deletingId === pm.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deletingId === pm.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note RGPD */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          🔒 Vos informations bancaires sont stockées de manière sécurisée par Stripe (PCI-DSS). 
          TapHair ne stocke jamais vos données bancaires sensibles.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodsList;

