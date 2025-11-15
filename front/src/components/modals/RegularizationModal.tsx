import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDate, formatTime } from '../../utils/dateUtils';

type RegularizationAction = 'completed' | 'no_show_client' | 'no_show_coiffeur' | 'cancelled' | 'problem';

interface RegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    _id?: string;
    id?: string;
    date: string;
    status?: string;
    mode?: 'salon' | 'domicile';
    price?: number;
    duration?: number;
    service?: { name?: string };
    coiffeur?: { name?: string };
    client?: { name?: string };
  };
  isClient?: boolean;
  onDelayDetected?: (info: {
    delayMinutes: number;
    penaltyPercentage: number;
    penaltyAmount: number;
    requiresGeolocation: boolean;
  }) => void;
  onRegularize: (
    action: RegularizationAction,
    delayInfo?: {
      delayMinutes: number;
      penaltyPercentage: number;
      penaltyAmount: number;
      requiresGeolocation: boolean;
    }
  ) => Promise<void> | void;
}

const REGULARIZATION_ACTIONS: { value: RegularizationAction; label: string; description: string }[] = [
  {
    value: 'completed',
    label: 'Marquer comme terminée',
    description: 'La prestation a bien eu lieu. Permet d\'enclencher la facturation et les avis.'
  },
  {
    value: 'no_show_client',
    label: 'Absence du client',
    description: 'Le client ne s\'est pas présenté à l\'heure prévue.'
  },
  {
    value: 'no_show_coiffeur',
    label: 'Absence du coiffeur',
    description: 'Le professionnel n\'a pas pu honorer la prestation.'
  },
  {
    value: 'cancelled',
    label: 'Annuler la réservation',
    description: 'Met fin à la réservation et informe l\'autre partie.'
  },
  {
    value: 'problem',
    label: 'Signaler un incident',
    description: 'Déclenche le formulaire d\'incident pour un suivi dédié.'
  }
];

const getBookingId = (booking: RegularizationModalProps['booking']) => booking._id ?? booking.id ?? '';

const calculateDefaultDelay = (bookingDate: string): number => {
  const now = Date.now();
  const scheduled = new Date(bookingDate).getTime();
  if (Number.isNaN(scheduled)) {
    return 0;
  }
  return Math.max(0, Math.round((now - scheduled) / 60000));
};

const calculateDelayImpact = (delayMinutes: number, price = 0) => {
  let penaltyPercentage = 0;
  if (delayMinutes >= 30 && delayMinutes < 45) {
    penaltyPercentage = 20;
  } else if (delayMinutes >= 10 && delayMinutes < 30) {
    penaltyPercentage = 10;
  }

  const penaltyAmount = Math.max(0, (price * penaltyPercentage) / 100);
  const requiresGeolocation = delayMinutes >= 10 && delayMinutes < 30;

  return {
    delayMinutes,
    penaltyPercentage,
    penaltyAmount,
    requiresGeolocation
  };
};

const RegularizationModal: React.FC<RegularizationModalProps> = ({
  isOpen,
  onClose,
  booking,
  isClient = false,
  onDelayDetected,
  onRegularize
}) => {
  const [selectedAction, setSelectedAction] = useState<RegularizationAction>('completed');
  const [delayMinutes, setDelayMinutes] = useState<number>(() => calculateDefaultDelay(booking.date));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAction('completed');
      setDelayMinutes(calculateDefaultDelay(booking.date));
      setNotes('');
      setError(null);
    }
  }, [isOpen, booking.date]);

  const delayImpact = useMemo(() => calculateDelayImpact(delayMinutes, booking.price ?? 0), [delayMinutes, booking.price]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedAction === 'completed') {
        onDelayDetected?.(delayImpact);
        await onRegularize('completed', delayImpact);
      } else {
        await onRegularize(selectedAction);
      }
      setNotes('');
    } catch (err: any) {
      console.error('Erreur lors de la régularisation:', err);
      setError(err?.message ?? 'Impossible d\'appliquer cette action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      title={isClient ? 'Régulariser ma réservation' : 'Régulariser la réservation'}
      showCloseButton={!isSubmitting}
    >
      <div className="space-y-5">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium text-gray-900">Réservation :</span> {booking.service?.name ?? 'Prestation'}
          </p>
          <p>
            <span className="font-medium text-gray-900">Date :</span> {formatDate(booking.date)} à {formatTime(booking.date)}
          </p>
          {booking.coiffeur?.name && (
            <p>
              <span className="font-medium text-gray-900">Coiffeur :</span> {booking.coiffeur.name}
            </p>
          )}
          {booking.client?.name && (
            <p>
              <span className="font-medium text-gray-900">Client :</span> {booking.client.name}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor={`regularization-delay-${getBookingId(booking)}`}>
            Retard observé (en minutes)
          </label>
          <input
            id={`regularization-delay-${getBookingId(booking)}`}
            type="number"
            min={0}
            value={delayMinutes}
            onChange={(event) => setDelayMinutes(Math.max(0, Number(event.target.value) || 0))}
            className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-accent focus:ring-accent"
          />
          <p className="text-xs text-gray-500">
            Ce champ permet de déclencher automatiquement les scénarios pénalités, géolocalisation ou annulation si nécessaire.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Action à effectuer</p>
          <div className="space-y-2">
            {REGULARIZATION_ACTIONS.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => setSelectedAction(action.value)}
                className={`w-full text-left rounded-lg border p-3 transition ${
                  selectedAction === action.value
                    ? 'border-accent bg-accent/10 text-gray-900'
                    : 'border-gray-200 hover:border-accent/60 hover:bg-accent/5'
                }`}
              >
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-gray-600 mt-1">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedAction === 'completed' && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
            <p className="font-semibold">Analyse du retard</p>
            {delayMinutes === 0 && <p>Aucun retard détecté. Vous pouvez valider la prestation immédiatement.</p>}
            {delayMinutes > 0 && (
              <>
                <p>Retard estimé : {delayMinutes} minute(s).</p>
                {delayMinutes >= 45 && (
                  <p>
                    ⚠️ Retard critique. Une annulation automatique est recommandée pour protéger les deux parties.
                  </p>
                )}
                {delayMinutes >= 30 && delayMinutes < 45 && (
                  <p>
                    ⚠️ Une pénalité de {delayImpact.penaltyPercentage}% ({delayImpact.penaltyAmount.toFixed(2)} €) peut être
                    appliquée.
                  </p>
                )}
                {delayMinutes >= 10 && delayMinutes < 30 && (
                  <p>
                    ℹ️ Une vérification de la géolocalisation sera demandée pour confirmer la présence sur le lieu de rendez-vous.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div>
          <label htmlFor="regularization-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optionnel)
          </label>
          <textarea
            id="regularization-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-accent focus:ring-accent"
            placeholder="Ajoutez un commentaire qui sera joint au dossier de réservation"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Fermer
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Traitement...' : 'Confirmer l\'action'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RegularizationModal;

