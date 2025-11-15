/**
 * Modal de validation de prestation - Style Uber
 * Checklist avant/pendant/après prestation
 */

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import bookingValidationService, { BookingValidation } from '../../services/api/bookingValidations';
import { Booking } from '../../services/api/bookings';
import { bookingService } from '../../services/api/bookings';
import { toast } from 'react-toastify';
import BookingAlert, { BookingAlertsList } from './BookingAlert';
import { BookingAlert as BookingAlertType } from '../../services/api/bookingValidations';

interface ServiceValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onComplete?: () => void;
  onIssueReported?: (issue: { type: string; description: string; severity: string }) => void;
}

const ServiceValidationModal: React.FC<ServiceValidationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onComplete,
  onIssueReported
}) => {
  const [validation, setValidation] = useState<BookingValidation | null>(null);
  const [alerts, setAlerts] = useState<BookingAlertType[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'pre' | 'during' | 'post'>('pre');
  const [showClientAlert, setShowClientAlert] = useState(false);
  const [clientIssue, setClientIssue] = useState({
    type: 'other',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  // Charger la validation et les alertes
  useEffect(() => {
    if (isOpen && booking) {
      loadValidation();
      loadAlerts();
    }
  }, [isOpen, booking]);

  const loadValidation = async () => {
    if (!booking) return;
    
    try {
      setLoading(true);
      const response = await bookingValidationService.getValidation(booking._id);
      if (response.success && response.data) {
        setValidation(response.data);
        
        // Déterminer l'étape actuelle
        if (response.data.validationStatus === 'not_started' || response.data.validationStatus === 'pre_service') {
          setCurrentStep('pre');
        } else if (response.data.validationStatus === 'during_service') {
          setCurrentStep('during');
        } else if (response.data.validationStatus === 'post_service' || response.data.validationStatus === 'completed') {
          setCurrentStep('post');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    if (!booking) return;
    
    try {
      // Pour le coiffeur, on récupère les alertes du coiffeur
      // Pour le client, on récupère les alertes du client
      const coiffeurId = typeof booking.coiffeur === 'object' ? booking.coiffeur._id : booking.coiffeur;
      const response = await bookingValidationService.getCoiffeurAlerts(coiffeurId);
      if (response.success && response.data) {
        // Filtrer les alertes pour cette réservation
        const bookingAlerts = response.data.filter(alert => alert.bookingId === booking._id);
        setAlerts(bookingAlerts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  const handlePreServiceUpdate = async (field: keyof BookingValidation['preService'], value: boolean) => {
    if (!booking || !validation) return;

    try {
      setLoading(true);
      const checklist = {
        [field]: value
      };
      const response = await bookingValidationService.validatePreService(booking._id, checklist);
      if (response.success && response.data) {
        setValidation(response.data);
        toast.success('Validation mise à jour');
        await loadValidation();
      } else {
        toast.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async (clientPresent: boolean) => {
    if (!booking) return;

    try {
      setLoading(true);
      const response = await bookingValidationService.startService(booking._id, clientPresent);
      if (response.success && response.data) {
        setValidation(response.data);
        setCurrentStep('during');
        toast.success('Service démarré');
        await loadValidation();
      } else {
        toast.error(response.message || 'Erreur lors du démarrage');
      }
    } catch (error) {
      toast.error('Erreur lors du démarrage');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteService = async (postServiceData: {
    clientSatisfied: boolean;
    paymentConfirmed: boolean;
    invoiceIssued: boolean;
    notes?: string;
  }) => {
    if (!booking) return;

    try {
      setLoading(true);
      // Utiliser l'API de complétion de réservation qui gère aussi la validation
      const response = await bookingService.completeBooking(booking._id, postServiceData);
      
      if (response.success) {
        toast.success('Service terminé avec succès');
        if (onComplete) {
          onComplete();
        }
        onClose();
      } else {
        toast.error(response.message || 'Erreur lors de la finalisation');
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setLoading(false);
    }
  };

  const handleReportClientIssue = async () => {
    if (!booking || !clientIssue.description.trim()) return;

    try {
      setLoading(true);
      const response = await bookingValidationService.addIssue(
        booking._id,
        clientIssue.type,
        clientIssue.description,
        clientIssue.severity
      );
      if (response.success) {
        toast.success('Problème signalé au client');
        setShowClientAlert(false);
        setClientIssue({ type: 'other', description: '', severity: 'medium' });
        if (onIssueReported) {
          onIssueReported(clientIssue);
        }
        await loadValidation();
      } else {
        toast.error(response.message || 'Erreur lors du signalement');
      }
    } catch (error) {
      toast.error('Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Validation de prestation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Alertes */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <BookingAlertsList alerts={alerts} />
            </div>
          )}

          {/* Étape 1: Pré-service */}
          {currentStep === 'pre' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <ClockIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Avant la prestation</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validation?.preService.materialPrepared || false}
                    onChange={(e) => handlePreServiceUpdate('materialPrepared', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Matériel préparé</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validation?.preService.clientContacted || false}
                    onChange={(e) => handlePreServiceUpdate('clientContacted', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Client contacté</span>
                </label>

                {booking.mode === 'domicile' && (
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={validation?.preService.addressVerified || false}
                      onChange={(e) => handlePreServiceUpdate('addressVerified', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Adresse vérifiée</span>
                  </label>
                )}

                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validation?.preService.timeConfirmed || false}
                    onChange={(e) => handlePreServiceUpdate('timeConfirmed', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Horaire confirmé</span>
                </label>
              </div>

              {validation?.preService.materialPrepared &&
               validation?.preService.clientContacted &&
               (booking.mode === 'salon' || validation?.preService.addressVerified) &&
               validation?.preService.timeConfirmed && (
                <button
                  onClick={() => handleStartService(true)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Démarrer le service
                </button>
              )}
            </div>
          )}

          {/* Étape 2: Pendant le service */}
          {currentStep === 'during' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pendant la prestation</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <span className="text-gray-700">
                    Service démarré le {validation?.duringService.serviceStartedAt 
                      ? new Date(validation.duringService.serviceStartedAt).toLocaleString('fr-FR')
                      : 'Non démarré'}
                  </span>
                </div>

                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validation?.duringService.qualityChecked || false}
                    onChange={(e) => {
                      bookingValidationService.validateQuality(booking._id, e.target.checked)
                        .then(response => {
                          if (response.success && response.data) {
                            setValidation(response.data);
                            toast.success('Qualité validée');
                          }
                        });
                    }}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Qualité vérifiée</span>
                </label>
              </div>

              <button
                onClick={() => {
                  handleCompleteService({
                    clientSatisfied: true,
                    paymentConfirmed: booking.paymentStatus === 'paid',
                    invoiceIssued: false
                  });
                }}
                className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Terminer le service
              </button>
            </div>
          )}

          {/* Étape 3: Après le service */}
          {currentStep === 'post' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Après la prestation</h3>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-2">Service terminé avec succès</p>
                <p className="text-sm text-green-700">
                  Terminé le {validation?.postService.serviceCompletedAt 
                    ? new Date(validation.postService.serviceCompletedAt).toLocaleString('fr-FR')
                    : 'Non terminé'}
                </p>
              </div>

              {/* Option d'alerte pour le client en cas de problème */}
              {booking.status === 'completed' && (
                <div className="mt-4 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900 mb-2">
                        Signaler un problème au client
                      </h4>
                      {!showClientAlert ? (
                        <button
                          onClick={() => setShowClientAlert(true)}
                          className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                        >
                          Signaler un problème
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <select
                            value={clientIssue.type}
                            onChange={(e) => setClientIssue({ ...clientIssue, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="quality_issue">Problème de qualité</option>
                            <option value="client_absent">Client absent</option>
                            <option value="payment_issue">Problème de paiement</option>
                            <option value="other">Autre</option>
                          </select>
                          <textarea
                            value={clientIssue.description}
                            onChange={(e) => setClientIssue({ ...clientIssue, description: e.target.value })}
                            placeholder="Décrivez le problème..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={3}
                          />
                          <select
                            value={clientIssue.severity}
                            onChange={(e) => setClientIssue({ ...clientIssue, severity: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="low">Faible</option>
                            <option value="medium">Moyen</option>
                            <option value="high">Élevé</option>
                            <option value="critical">Critique</option>
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleReportClientIssue}
                              disabled={loading || !clientIssue.description.trim()}
                              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                            >
                              Signaler
                            </button>
                            <button
                              onClick={() => {
                                setShowClientAlert(false);
                                setClientIssue({ type: 'other', description: '', severity: 'medium' });
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Problèmes détectés */}
          {validation?.issues && validation.issues.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Problèmes détectés</h4>
              {validation.issues
                .filter(issue => !issue.resolved)
                .map(issue => (
                  <div key={issue._id} className="text-sm text-red-800 mb-1">
                    • {issue.description} ({issue.severity})
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceValidationModal;

