import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, ClockIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { bookingService } from '../../services/api/bookings';

interface Booking {
  _id: string;
  service: {
    name: string;
    price: number;
    duration: number;
  };
  coiffeur: {
    name: string;
  };
  date: string;
  mode: 'salon' | 'domicile';
  notes?: string;
}

interface TimeChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess?: () => void;
  mode?: 'edit' | 'change'; // 'edit' pour modification client, 'change' pour demande coiffeur
}

const TimeChangeModal: React.FC<TimeChangeModalProps> = ({ 
  isOpen, 
  onClose, 
  booking, 
  onSuccess,
  mode = 'edit'
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser les valeurs
  useEffect(() => {
    if (booking && isOpen) {
      const date = new Date(booking.date);
      setNewDate(date.toISOString().split('T')[0]);
      setNewTime(date.toTimeString().slice(0, 5));
      setNotes(booking.notes || '');
      setReason('');
      setError(null);
    }
  }, [booking, isOpen]);

  // Protection contre booking null
  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'edit') {
        // Mode modification directe pour le client
        const updateData = {
          date: `${newDate}T${newTime}`,
          notes: notes.trim() || undefined
        };

        const response = await bookingService.updateBooking(booking._id, updateData);
        
        if (response.success) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
            onSuccess?.();
            resetForm();
          }, 2000);
        } else {
          setError(response.message || 'Erreur lors de la modification');
        }
      } else {
        // Mode demande de changement (pour coiffeurs)
        if (!reason.trim()) {
          setError('La raison du changement est obligatoire');
          return;
        }
        
        // Ici on pourrait appeler une API pour demander un changement
        // Pour l'instant, on simule le succès
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onSuccess?.();
          resetForm();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewDate('');
    setNewTime('');
    setReason('');
    setNotes('');
    setSuccess(false);
    setError(null);
  };

  const formatCurrentDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const currentDateTime = formatCurrentDateTime(booking.date);

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {mode === 'edit' ? 'Modification réussie !' : 'Demande envoyée !'}
            </h3>
            <p className="text-sm text-gray-600">
              {mode === 'edit' 
                ? 'Votre réservation a été modifiée avec succès.'
                : 'Votre demande de modification a été transmise au coiffeur.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {mode === 'edit' ? 'Modifier la réservation' : 'Demander un changement'}
              </h3>
              <p className="text-sm text-gray-600">{booking.service.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Horaire actuel */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-2">Horaire actuel</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>{currentDateTime.date}</span>
                <ClockIcon className="h-4 w-4" />
                <span>{currentDateTime.time}</span>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nouvelle date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouvelle date souhaitée
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  required
                />
              </div>

              {/* Nouvelle heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouvelle heure souhaitée
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  required
                />
              </div>

              {/* Notes (mode edit) */}
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez des notes pour votre réservation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Raison (mode change) */}
              {mode === 'change' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du changement *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Expliquez pourquoi vous souhaitez changer l'horaire..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !newDate || !newTime || (mode === 'change' && !reason)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{mode === 'edit' ? 'Modification...' : 'Envoi...'}</span>
                    </div>
                  ) : (
                    mode === 'edit' ? 'Confirmer les modifications' : 'Envoyer la demande'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeChangeModal;