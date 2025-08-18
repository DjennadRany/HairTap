import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Scissors, Filter, CheckCircle2, XCircle, BarChart3, Eye, Edit, Trash2 } from 'lucide-react';
import { adminService, AdminService } from '../services/api/admin';

const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeServices: 0,
    approvedThisMonth: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les vrais services depuis l'API
      const servicesData = await adminService.getServices();
      setServices(servicesData);
      
      // Calculer les vraies statistiques
      const activeServices = servicesData.filter(s => s.status === 'active').length;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const approvedThisMonth = servicesData.filter(s => 
        s.status === 'active' && new Date(s.createdAt) >= startOfMonth
      ).length;
      
      const totalRevenue = servicesData.reduce((sum, service) => sum + (service.price || 0), 0);
      
      setStats({
        activeServices,
        approvedThisMonth,
        totalRevenue
      });
      
    } catch (err) {
      console.error('Erreur lors du chargement des services:', err);
      setError('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (serviceId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      const success = await adminService.updateServiceStatus(serviceId, newStatus);
      
      if (success) {
        // Recharger les services après modification
        await loadServices();
      }
    } catch (err) {
      console.error(`Erreur lors de la ${action === 'approve' ? 'approbation' : 'rejet'} du service:`, err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        const success = await adminService.deleteService(serviceId);
        if (success) {
          await loadServices();
        }
      } catch (err) {
        console.error('Erreur lors de la suppression du service:', err);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadServices} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Services</h1>
              <p className="text-gray-600 mt-2">Modération et gestion des services</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button size="sm">
                <Scissors className="h-4 w-4 mr-2" />
                Nouveau Service
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select className="border rounded px-3 py-2">
                <option>Toutes les catégories</option>
                <option>Coupe</option>
                <option>Coloration</option>
                <option>Mèches</option>
                <option>Lissage</option>
              </select>
              <select className="border rounded px-3 py-2">
                <option>Tous les statuts</option>
                <option>Actif</option>
                <option>En attente</option>
                <option>Rejeté</option>
              </select>
              <input className="border rounded px-3 py-2" placeholder="Rechercher un service..." />
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service._id} className="p-4">
                    <div className="h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Scissors className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-500 mb-2">
                      {service.coiffeurName} • {service.category}
                    </div>
                    <div className="text-sm font-semibold text-green-600 mb-2">
                      {formatCurrency(service.price)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.status === 'active' ? 'bg-green-100 text-green-800' :
                        service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {service.status === 'active' ? 'Actif' :
                         service.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </span>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteService(service._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Scissors className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun service trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modération */}
          <Card>
            <CardHeader>
              <CardTitle>Modération</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.filter(s => s.status === 'pending').slice(0, 3).map((service) => (
                  <div key={service._id} className="flex items-center justify-between p-3 bg-orange-50 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-500">En attente de validation</div>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleServiceAction(service._id, 'approve')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleServiceAction(service._id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
                {services.filter(s => s.status === 'pending').length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Aucun service en attente de modération
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <div className="text-sm text-gray-500">Services actifs</div>
                  <div className="text-2xl font-bold">{stats.activeServices}</div>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <div className="text-sm text-gray-500">Approuvés ce mois</div>
                  <div className="text-2xl font-bold">{stats.approvedThisMonth}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <div className="text-sm text-gray-500">Revenus (EUR)</div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signalements */}
        <Card>
          <CardHeader>
            <CardTitle>Signalements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded">
                <div className="font-medium">Signalement #124</div>
                <div className="text-sm text-gray-500">Conflit sur un service non livré</div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Signalement #125</div>
                <div className="text-sm text-gray-500">Photo inappropriée</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminServicesPage;
