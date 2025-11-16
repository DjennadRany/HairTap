import React, { useCallback, useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface GeolocationCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number; accuracy?: number }) => Promise<void> | void;
  bookingInfo: {
    serviceName: string;
    date: string;
    coiffeurName?: string | null;
  };
  delayMinutes: number;
}

const GeolocationCheckModal: React.FC<GeolocationCheckModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingInfo,
  delayMinutes
}) => {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('La géolocalisation n\'est pas disponible sur cet appareil.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
        setIsLoading(false);
      },
      (geoError) => {
        console.error('Erreur de géolocalisation:', geoError);
        setError('Impossible de récupérer la géolocalisation. Veuillez autoriser l\'accès ou réessayer.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 * 60
      }
    );
  }, []);

  const handleManualChange = (field: 'latitude' | 'longitude') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (Number.isNaN(value)) {
      setCoords((prev) => ({
        latitude: field === 'latitude' ? 0 : prev?.latitude ?? 0,
        longitude: field === 'longitude' ? 0 : prev?.longitude ?? 0
      }));
      return;
    }

    setCoords((prev) => ({
      latitude: field === 'latitude' ? value : prev?.latitude ?? 0,
      longitude: field === 'longitude' ? value : prev?.longitude ?? 0,
      accuracy: prev?.accuracy
    }));
  };

  const handleConfirm = async () => {
    if (!coords) {
      setError('Veuillez renseigner votre position avant de valider.');
      return;
    }

    setError(null);
    await onConfirm(coords);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vérification de la géolocalisation">
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">Retard détecté</p>
          <p>
            Cette réservation présente un retard de <span className="font-semibold">{delayMinutes} minutes</span>. Afin de
            sécuriser la prestation, veuillez confirmer votre position actuelle.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm text-gray-600">
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
        </div>

        <div className="space-y-3">
          <Button onClick={handleUseGeolocation} disabled={isLoading} className="w-full">
            {isLoading ? 'Récupération de la position...' : 'Utiliser ma position actuelle'}
          </Button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manual-latitude">
                Latitude (optionnel)
              </label>
              <input
                id="manual-latitude"
                type="number"
                step="0.000001"
                value={coords?.latitude ?? ''}
                onChange={handleManualChange('latitude')}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-accent focus:ring-accent"
                placeholder="48.8566"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="manual-longitude">
                Longitude (optionnel)
              </label>
              <input
                id="manual-longitude"
                type="number"
                step="0.000001"
                value={coords?.longitude ?? ''}
                onChange={handleManualChange('longitude')}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-accent focus:ring-accent"
                placeholder="2.3522"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {coords && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
            <p className="font-semibold">Position détectée</p>
            <p>
              Latitude : {coords.latitude.toFixed(6)} / Longitude : {coords.longitude.toFixed(6)}
            </p>
            {typeof coords.accuracy === 'number' && <p>Précision ~ {Math.round(coords.accuracy)} m</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            Confirmer la position
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GeolocationCheckModal;

