import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDate, formatTime } from '../../utils/dateUtils';

type ConfirmationType = 'service_start' | 'service_end';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingInfo: {
    serviceName: string;
    date: string;
    coiffeurName?: string | null;
    clientName?: string | null;
  };
  type: ConfirmationType;
  onConfirm: (data: { notes?: string; confirmedAt: string }) => Promise<void> | void;
}

const getTitle = (type: ConfirmationType) =>
  type === 'service_start' ? 'Confirmer le début de la prestation' : 'Confirmer la fin de la prestation';

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  bookingInfo,
  type,
  onConfirm
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm({
        notes: notes.trim() || undefined,
        confirmedAt: new Date().toISOString()
      });
      setNotes('');
    } catch (err: any) {
      console.error('Erreur lors de la confirmation de prestation:', err);
      setError(err?.message ?? 'Impossible d\'enregistrer la confirmation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle(type)}>
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Prestation :</span> {bookingInfo.serviceName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Date :</span> {formatDate(bookingInfo.date)} à{' '}
            {formatTime(bookingInfo.date)}
          </p>
          {bookingInfo.coiffeurName && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Coiffeur :</span> {bookingInfo.coiffeurName}
            </p>
          )}
          {bookingInfo.clientName && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Client :</span> {bookingInfo.clientName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmation-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optionnel)
          </label>
          <textarea
            id="confirmation-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 focus:border-accent focus:ring-accent text-sm p-3"
            placeholder="Ajoutez une note pour contextualiser la confirmation"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Confirmation...' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;

