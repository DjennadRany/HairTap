import httpClient from '../../api/httpClient';

export interface CGV {
  version: string;
  content: string;
  effectiveDate: string;
}

export interface CGVResponse {
  success: boolean;
  data?: CGV;
  message?: string;
}

export interface CGVAcceptanceResponse {
  success: boolean;
  message?: string;
  data?: {
    version: string;
    acceptedAt: string;
    userId: string;
  };
}

const cgvService = {
  // Récupérer les CGV actives
  async getActiveCGV(): Promise<CGVResponse> {
    try {
      const response = await httpClient.get<CGVResponse>('/cgv/active');
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des CGV:', error);
      throw error;
    }
  },

  // Récupérer une version spécifique des CGV
  async getCGVByVersion(version: string): Promise<CGVResponse> {
    try {
      const response = await httpClient.get<CGVResponse>(`/cgv/version/${version}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des CGV:', error);
      throw error;
    }
  },

  // Accepter les CGV
  async acceptCGV(version: string): Promise<CGVAcceptanceResponse> {
    try {
      const response = await httpClient.post<CGVAcceptanceResponse>('/cgv/accept', { version });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'acceptation des CGV:', error);
      throw error;
    }
  }
};

export default cgvService;

