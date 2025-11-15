import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { incidentService, IncidentType } from '../../services/api/incidents';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface IncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess?: () => void;
  bookingInfo?: {
    serviceName?: string;
    date?: string;
    coiffeurName?: string | null;
    clientName?: string | null;
  };
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'retard_client', label: 'Retard du client' },
  { value: 'retard_coiffeur', label: 'Retard du coiffeur' },
  { value: 'client_no_show', label: 'Client absent' },
  { value: 'coiffeur_no_show', label: 'Coiffeur absent' },
  { value: 'quality_issue', label: 'Problème de qualité' },
  { value: 'payment_issue', label: 'Problème de paiement' },
  { value: 'other', label: 'Autre incident' }
];

const IncidentReportForm: React.FC<IncidentReportFormProps> = ({
  isOpen,
  onClose,
  bookingId,
  onSuccess,
  bookingInfo
}) => {
  const [type, setType] = useState<IncidentType>('other');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetState = () => {
    setType('other');
    setDescription('');
    setIsSubmitting(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetState();
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!description.trim()) {
      setError('Veuillez décrire brièvement l\'incident.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await incidentService.reportIncident({
        bookingId,
        type,
        description: description.trim()
      });

      if (response.success) {
        setSuccessMessage('Incident signalé avec succès.');
        onSuccess?.();
        resetState();
        onClose();
      } else {
        setError(response.message ?? 'Impossible de signaler l\'incident.');
      }
    } catch (err: any) {
      console.error('Erreur lors du signalement d\'un incident:', err);
      setError(err?.message ?? 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Signaler un incident" showCloseButton={!isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {bookingInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-1">
            {bookingInfo.serviceName && (
              <p>
                <span className="font-medium text-gray-900">Prestation :</span> {bookingInfo.serviceName}
              </p>
            )}
            {bookingInfo.date && (
              <p>
                <span className="font-medium text-gray-900">Date :</span> {formatDate(bookingInfo.date)} à{' '}
                {formatTime(bookingInfo.date)}
              </p>
            )}
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
        )}

        <div>
          <label htmlFor="incident-type" className="block text-sm font-medium text-gray-700 mb-1">
            Type d'incident
          </label>
          <select
            id="incident-type"
            value={type}
            onChange={(event) => setType(event.target.value as IncidentType)}
            className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-accent focus:ring-accent"
          >
            {INCIDENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="incident-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="incident-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Décrivez brièvement l'incident rencontré..."
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-accent focus:ring-accent"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default IncidentReportForm;

