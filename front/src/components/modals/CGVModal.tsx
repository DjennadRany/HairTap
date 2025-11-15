import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import cgvService, { CGV } from '../../services/api/cgv';

interface CGVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (version: string) => void;
}

const CGVModal: React.FC<CGVModalProps> = ({ isOpen, onClose, onAccept }) => {
  const [cgv, setCgv] = useState<CGV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les CGV actives au montage du composant
  useEffect(() => {
    if (isOpen) {
      loadCGV();
    }
  }, [isOpen]);

  const loadCGV = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await cgvService.getActiveCGV();
      
      if (response.success && response.data) {
        setCgv(response.data);
      } else {
        // Si pas de CGV disponibles, permettre quand même de continuer
        console.warn('⚠️ Aucune CGV active trouvée');
        setError('Aucune CGV disponible. Vous pouvez continuer sans accepter les CGV.');
        setAccepted(true); // Permettre de continuer même sans CGV
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des CGV:', err);
      // Si erreur, permettre quand même de continuer
      setError('Impossible de charger les CGV. Vous pouvez continuer sans accepter les CGV.');
      setAccepted(true); // Permettre de continuer même en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!accepted) return;

    try {
      setIsSubmitting(true);
      
      // Si CGV disponibles, enregistrer l'acceptation
      if (cgv) {
        const response = await cgvService.acceptCGV(cgv.version);
        
        if (response.success) {
          onAccept(cgv.version);
        } else {
          // Même en cas d'erreur d'enregistrement, permettre de continuer
          console.warn('⚠️ Erreur lors de l\'enregistrement de l\'acceptation, mais on continue');
          onAccept(cgv.version || 'unknown');
        }
      } else {
        // Si pas de CGV, permettre quand même de continuer
        onAccept('no-cgv');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'acceptation des CGV:', err);
      // Même en cas d'erreur, permettre de continuer
      onAccept(cgv?.version || 'no-cgv');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Conditions Générales de Vente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">Chargement des CGV...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadCGV}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          ) : cgv ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Version:</strong> {cgv.version}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Date d'entrée en vigueur:</strong>{' '}
                  {new Date(cgv.effectiveDate).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="prose max-w-none">
                <div
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: cgv.content }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Aucune CGV disponible</p>
            </div>
          )}
        </div>

        {/* Pied de page avec checkbox et bouton */}
        <div className="border-t p-6 bg-gray-50">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="accept-cgv"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={isLoading || isSubmitting || !cgv}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="accept-cgv"
              className="text-sm text-gray-700 cursor-pointer"
            >
              <strong>J'accepte les Conditions Générales de Vente</strong>
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted || isLoading || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Accepter et continuer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGVModal;

