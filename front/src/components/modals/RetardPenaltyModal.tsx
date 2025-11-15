import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface RetardPenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (acceptPenalty: boolean) => Promise<void> | void;
  bookingInfo: {
    serviceName: string;
    date: string;
    coiffeurName?: string | null;
    clientName?: string | null;
    price?: number;
  };
  retardInfo: {
    delayMinutes: number;
    penaltyPercentage: number;
    penaltyAmount: number;
    canCancel?: boolean;
  };
}

const RetardPenaltyModal: React.FC<RetardPenaltyModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  bookingInfo,
  retardInfo
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (accept: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onAccept(accept);
    } catch (err: any) {
      console.error('Erreur lors du traitement de la pénalité:', err);
      setError(err?.message ?? 'Impossible d\'appliquer cette décision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Retard important détecté">
      <div className="space-y-4 text-sm text-gray-700">
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 space-y-1 text-amber-900">
          <p className="font-semibold">Retard constaté : {retardInfo.delayMinutes} minutes</p>
          <p>
            Selon notre politique de ponctualité, une pénalité de {retardInfo.penaltyPercentage}% peut être appliquée sur le
            montant de la prestation.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-1">
          <p>
            <span className="font-medium text-gray-900">Prestation :</span> {bookingInfo.serviceName}
          </p>
          <p>
            <span className="font-medium text-gray-900">Date :</span> {formatDate(bookingInfo.date)} à {formatTime(bookingInfo.date)}
          </p>
          {bookingInfo.coiffeurName && (
            <p>
              <span className="font-medium text-gray-900">Coiffeur :</span> {bookingInfo.coiffeurName}
            </p>
          )}
          {bookingInfo.clientName && (
            <p>
              <span className="font-medium text-gray-900">Client :</span> {bookingInfo.clientName}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-xs text-gray-700 space-y-1">
          <p className="font-semibold text-accent">Montant estimé</p>
          <p>Pénalité : {retardInfo.penaltyAmount.toFixed(2)} €</p>
          {typeof bookingInfo.price === 'number' && <p>Montant initial : {bookingInfo.price.toFixed(2)} €</p>}
        </div>

        <div className="space-y-2 text-xs text-gray-500">
          <p>
            • Accepter la pénalité : la prestation est validée et la pénalité est appliquée au client.
          </p>
          {retardInfo.canCancel && <p>• Annuler : la réservation est annulée, aucune pénalité n'est perçue.</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Fermer
          </Button>
          {retardInfo.canCancel && (
            <Button
              variant="ghost"
              onClick={() => handleDecision(false)}
              disabled={isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isSubmitting ? 'Traitement...' : 'Annuler la réservation'}
            </Button>
          )}
          <Button onClick={() => handleDecision(true)} disabled={isSubmitting}>
            {isSubmitting ? 'Traitement...' : 'Accepter la pénalité'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RetardPenaltyModal;

