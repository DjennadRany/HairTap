import React, { useState, useEffect } from 'react';
import { ClockIcon, CheckIcon, XMarkIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { chatService } from '../../services/api/chat';
import { timeChangeRequestService, type TimeChangeRequest } from '../../services/api/timeChangeRequests';



interface TimeChangeRequestsManagerProps {
  coiffeurId: string;
}

const TimeChangeRequestsManager: React.FC<TimeChangeRequestsManagerProps> = ({ coiffeurId }) => {
  const [requests, setRequests] = useState<TimeChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TimeChangeRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);

  // Charger les demandes de modification d'horaire
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const requestsData = await timeChangeRequestService.getCoiffeurRequests(coiffeurId);
        setRequests(requestsData);
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        // En cas d'erreur, on garde un tableau vide
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [coiffeurId]);

  const handleApprove = async (request: TimeChangeRequest) => {
    setSelectedRequest(request);
    setResponse('Demande approuvée. Nouvel horaire confirmé.');
    setShowResponseModal(true);
  };

  const handleReject = async (request: TimeChangeRequest) => {
    setSelectedRequest(request);
    setResponse('');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest || !response.trim()) return;

    setResponding(true);
    try {
      // Approuver ou rejeter la demande via l'API
      const isApproved = response.includes('approuvée');
      const apiResponse = isApproved 
        ? await timeChangeRequestService.approveRequest(selectedRequest._id, response)
        : await timeChangeRequestService.rejectRequest(selectedRequest._id, response);

      // Envoyer la réponse via le chat
      await chatService.sendMessage(selectedRequest.client._id, 
        `🕐 Réponse à votre demande de modification d'horaire\n` +
        `Réservation #${selectedRequest.booking._id.slice(-6)}\n` +
        `Statut: ${isApproved ? 'APPROUVÉE' : 'REJETÉE'}\n` +
        `Message: ${response}`
      );

      // Mettre à jour le statut localement
      setRequests(prev => prev.map(req => 
        req._id === selectedRequest._id 
          ? { ...req, status: isApproved ? 'approved' : 'rejected' }
          : req
      ));

      setShowResponseModal(false);
      setSelectedRequest(null);
      setResponse('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande de modification</h3>
        <p className="text-gray-600">Vous n'avez pas de demandes de modification d'horaire en attente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Demandes de modification d'horaire ({requests.filter(r => r.status === 'pending').length} en attente)
      </h3>
      
      {requests.map(request => (
        <div key={request._id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {request.client.photo ? (
                    <img src={request.client.photo} alt={request.client.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{request.client.name}</h4>
                  <p className="text-sm text-gray-600">{request.booking.service}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Horaire actuel</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(request.booking.date)} à {formatTime(request.booking.date)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Nouvel horaire souhaité</div>
                  <div className="text-sm text-gray-600">
                    {request.requestedDate} à {request.requestedTime}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700">Raison</div>
                <p className="text-sm text-gray-600">{request.reason}</p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Demande reçue le {formatDate(request.createdAt)}</span>
              </div>
            </div>

            {request.status === 'pending' && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleApprove(request)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {request.status !== 'pending' && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Modal de réponse */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowResponseModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Répondre à la demande de {selectedRequest.client.name}
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre réponse
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Expliquez votre décision..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={responding || !response.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {responding ? 'Envoi...' : 'Envoyer la réponse'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeChangeRequestsManager;

