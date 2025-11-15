import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Booking } from '../../services/api/bookings';
import { Notification } from '../../services/api/notifications';

interface RegularizationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmed: boolean, reason?: string) => Promise<void>;
  booking: Booking | null;
  notification: Notification | null;
}

const RegularizationConfirmationModal: React.FC<RegularizationConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  booking,
  notification
}) => {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking || !notification) return null;

  const handleSubmit = async () => {
    if (confirmed === null) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(confirmed, reason);
      setConfirmed(null);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConfirmed(null);
    setReason('');
    onClose();
  };

  const clientName = typeof booking.client === 'object' && booking.client !== null && 'name' in booking.client
    ? (booking.client as any).name
    : 'Client';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCancel} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmer la régularisation
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{clientName}</strong> a marqué la réservation suivante comme terminée :
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Date :</strong> {new Date(booking.date).toLocaleDateString('fr-FR')} à {new Date(booking.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Service :</strong> {typeof booking.service === 'object' && booking.service !== null && 'name' in booking.service ? (booking.service as any).name : booking.service}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Prix :</strong> {booking.price}€
                </p>
                {notification.metadata?.reason && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Note du client :</strong> {notification.metadata.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Confirmez-vous cette régularisation ?
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setConfirmed(true)}
                  className={`w-full flex items-center justify-center px-4 py-2 border rounded-md ${
                    confirmed === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Oui, je confirme
                </button>
                <button
                  onClick={() => setConfirmed(false)}
                  className={`w-full flex items-center justify-center px-4 py-2 border rounded-md ${
                    confirmed === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Non, je conteste
                </button>
              </div>
            </div>

            {confirmed === false && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la contestation (optionnel)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous contestez cette régularisation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={confirmed === null || isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  confirmed === null || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : confirmed === true
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'En cours...' : confirmed === true ? 'Confirmer' : 'Contester'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegularizationConfirmationModal;

