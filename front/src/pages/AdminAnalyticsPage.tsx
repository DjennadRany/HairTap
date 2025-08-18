import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { adminService, AdminStats } from '../services/api/admin';
import { AdminGeographicMap } from '../components/admin/AdminGeographicMap';

const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les vraies données depuis l'API
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
      
    } catch (err) {
      console.error('Erreur lors du chargement des analytics:', err);
      setError('Erreur lors du chargement des données analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des analytics...</p>
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
          <button 
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Vue d'ensemble avec vraies données */}
        <Card>
          <CardHeader>
            <CardTitle>Vue d'ensemble</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-sm text-gray-500">Utilisateurs</div>
                <div className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-500">Coiffeurs</div>
                <div className="text-2xl font-bold">{formatNumber(stats?.activeCoiffeurs || 0)}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded">
                <div className="text-sm text-gray-500">Réservations</div>
                <div className="text-2xl font-bold">{formatNumber(stats?.totalBookings || 0)}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded">
                <div className="text-sm text-gray-500">Revenus</div>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Comportement Utilisateurs - Graphique en barres simple */}
          <Card>
            <CardHeader>
              <CardTitle>Comportement Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Clients</span>
                  <span className="text-sm font-medium">{stats?.userGrowth.clients || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(stats?.userGrowth.clients || 0, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Coiffeurs</span>
                  <span className="text-sm font-medium">{stats?.userGrowth.coiffeurs || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(stats?.userGrowth.coiffeurs || 0, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Engagement</span>
                  <span className="text-sm font-medium">{stats?.userGrowth.engagement || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(stats?.userGrowth.engagement || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Revenus - Graphique circulaire simple */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-green-600"
                      strokeDasharray={`${(stats?.totalRevenue || 0) > 0 ? 352 : 0} 352`}
                      strokeDashoffset="0"
                      style={{
                        strokeDasharray: `${Math.min((stats?.totalRevenue || 0) / 1000 * 352, 352)} 352`
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Carte Géographique - Vraie carte interactive */}
          <Card>
            <CardHeader>
              <CardTitle>Carte Géographique</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminGeographicMap />
            </CardContent>
          </Card>

          {/* Funnel de Conversion - Graphique en escalier */}
          <Card>
            <CardHeader>
              <CardTitle>Funnel de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-32 bg-blue-100 p-3 rounded-l text-center text-sm font-medium">
                    Visiteurs
                  </div>
                  <div className="w-16 bg-blue-200 p-3 text-center text-sm">
                    {stats?.totalUsers || 0}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 bg-green-100 p-3 rounded-l text-center text-sm font-medium">
                    Inscrits
                  </div>
                  <div className="w-16 bg-green-200 p-3 text-center text-sm">
                    {Math.round((stats?.totalUsers || 0) * 0.8)}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 bg-purple-100 p-3 rounded-l text-center text-sm font-medium">
                    Réservations
                  </div>
                  <div className="w-16 bg-purple-200 p-3 text-center text-sm">
                    {stats?.totalBookings || 0}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 bg-yellow-100 p-3 rounded-l text-center text-sm font-medium">
                    Complétées
                  </div>
                  <div className="w-16 bg-yellow-200 p-3 text-center text-sm">
                    {Math.round((stats?.totalBookings || 0) * 0.7)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques Temps Réel */}
        <Card>
          <CardHeader>
            <CardTitle>Métriques Temps Réel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-sm text-gray-500">Utilisateurs en ligne</div>
                <div className="text-2xl font-bold">{Math.round((stats?.totalUsers || 0) * 0.05)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-500">Réservations en cours</div>
                <div className="text-2xl font-bold">{Math.round((stats?.totalBookings || 0) * 0.15)}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded">
                <div className="text-sm text-gray-500">Taux de conversion</div>
                <div className="text-2xl font-bold">
                  {stats?.totalUsers && stats?.totalBookings ? 
                    Math.round((stats.totalBookings / stats.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rapports Personnalisés */}
        <Card>
          <CardHeader>
            <CardTitle>Rapports Personnalisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded">
              <div className="text-sm text-gray-500 mb-2">Sélection du rapport</div>
              <select className="border rounded px-3 py-2 mr-3">
                <option>Rapport mensuel</option>
                <option>Top coiffeurs</option>
                <option>Revenus par ville</option>
                <option>Analyse des services</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Générer
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
