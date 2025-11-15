import api from '../../api/httpClient';

export interface TimeChangeRequest {
  _id: string;
  booking: {
    _id: string;
    service: string;
    date: string;
    price: number;
  };
  client: {
    _id: string;
    name: string;
    photo?: string;
  };
  requestedDate: string;
  requestedTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CreateTimeChangeRequestData {
  bookingId: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
}

export interface TimeChangeRequestResponse {
  message: string;
  request: TimeChangeRequest;
}

class TimeChangeRequestService {
  // Créer une nouvelle demande de modification
  async createRequest(data: CreateTimeChangeRequestData): Promise<TimeChangeRequestResponse> {
    const response = await api.post('/time-change-requests', data);
    return response.data;
  }

  // Obtenir les demandes d'un coiffeur
  async getCoiffeurRequests(coiffeurId: string): Promise<TimeChangeRequest[]> {
    const response = await api.get(`/time-change-requests/coiffeur/${coiffeurId}`);
    return response.data;
  }

  // Obtenir les demandes d'un client
  async getClientRequests(clientId: string): Promise<TimeChangeRequest[]> {
    const response = await api.get(`/time-change-requests/client/${clientId}`);
    return response.data;
  }

  // Approuver une demande
  async approveRequest(requestId: string, response?: string): Promise<TimeChangeRequestResponse> {
    const responseData = await api.put(`/time-change-requests/${requestId}/approve`, { response });
    return responseData.data;
  }

  // Rejeter une demande
  async rejectRequest(requestId: string, response?: string): Promise<TimeChangeRequestResponse> {
    const responseData = await api.put(`/time-change-requests/${requestId}/reject`, { response });
    return responseData.data;
  }

  // Obtenir une demande par ID
  async getRequestById(requestId: string): Promise<TimeChangeRequest> {
    const response = await api.get(`/time-change-requests/${requestId}`);
    return response.data;
  }
}

export const timeChangeRequestService = new TimeChangeRequestService();
