import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminService, AdminUserLocation } from '../../services/api/admin';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const AdminGeographicMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [users, setUsers] = useState<AdminUserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les coordonnées des utilisateurs
  useEffect(() => {
    const loadUsersGeographic = async () => {
      try {
        setLoading(true);
        setError(null);
        const usersData = await adminService.getUsersGeographic();
        console.log('🗺️ [MAP] Utilisateurs chargés:', usersData);
        setUsers(usersData);
      } catch (error) {
        console.error('❌ [MAP] Erreur lors du chargement des coordonnées:', error);
        setError('Erreur lors du chargement des coordonnées');
      } finally {
        setLoading(false);
      }
    };

    loadUsersGeographic();
  }, []);

  // Initialiser la carte Leaflet
  useEffect(() => {
    if (!mapRef.current) return;

    try {
      console.log('🗺️ [MAP] Initialisation de la carte Leaflet');
      
      // Créer la carte
      const map = L.map(mapRef.current).setView([48.8566, 2.3522], 5); // France par défaut
      
      // Ajouter la couche de tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
      console.log('✅ [MAP] Carte Leaflet initialisée avec succès');

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (mapError) {
      console.error('❌ [MAP] Erreur lors de l\'initialisation de la carte:', mapError);
      setError('Erreur lors de l\'initialisation de la carte');
    }
  }, []);

  // Ajouter les marqueurs des utilisateurs
  useEffect(() => {
    if (!mapInstanceRef.current || !users.length) return;

    try {
      console.log('🗺️ [MAP] Ajout des marqueurs pour', users.length, 'utilisateurs');
      console.log('🗺️ [MAP] Détail des utilisateurs:', users);
      
      // Nettoyer les marqueurs existants
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Ajouter des marqueurs pour les utilisateurs avec des coordonnées
      users.forEach((user, index) => {
        console.log(`🗺️ [MAP] Utilisateur ${index + 1}:`, {
          name: user.name,
          role: user.role,
          coordinates: user.coordinates,
          city: user.city
        });
        
        if (user.coordinates && user.coordinates.lat && user.coordinates.lng) {
          console.log(`✅ [MAP] Coordonnées valides pour ${user.name}:`, user.coordinates);
          
          const markerColor = user.role === 'coiffeur' ? '#10B981' : 
                             user.role === 'admin' ? '#EF4444' : '#3B82F6';
          
          const marker = L.marker([user.coordinates.lat, user.coordinates.lng])
            .addTo(mapInstanceRef.current!)
            .bindPopup(`
              <div class="text-center">
                <strong>${user.name}</strong><br>
                <span class="text-sm text-gray-600">${user.role}</span><br>
                ${user.city ? `<span class="text-xs text-gray-500">${user.city}</span>` : ''}
              </div>
            `);

          // Personnaliser l'apparence du marqueur
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              width: 20px; 
              height: 20px; 
              background-color: ${markerColor}; 
              border: 2px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          marker.setIcon(customIcon);
          markersRef.current.push(marker);
        } else {
          console.log(`⚠️ [MAP] Coordonnées invalides pour ${user.name}:`, user.coordinates);
        }
      });

      // Ajuster la vue si des marqueurs sont présents
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        console.log('✅ [MAP] Marqueurs ajoutés et vue ajustée');
      } else {
        console.log('⚠️ [MAP] Aucun marqueur valide à afficher');
      }

    } catch (markerError) {
      console.error('❌ [MAP] Erreur lors de l\'ajout des marqueurs:', markerError);
    }
  }, [users]);

  // Données de démonstration si aucun utilisateur n'est fourni
  const demoUsers: AdminUserLocation[] = [
    { _id: '1', name: 'Salon Paris', role: 'coiffeur', coordinates: { lat: 48.8566, lng: 2.3522 }, city: 'Paris' },
    { _id: '2', name: 'Salon Lyon', role: 'coiffeur', coordinates: { lat: 45.7578, lng: 4.8320 }, city: 'Lyon' },
    { _id: '3', name: 'Salon Marseille', role: 'coiffeur', coordinates: { lat: 43.2965, lng: 5.3698 }, city: 'Marseille' },
    { _id: '4', name: 'Client Bordeaux', role: 'client', coordinates: { lat: 44.8378, lng: -0.5792 }, city: 'Bordeaux' },
    { _id: '5', name: 'Client Nantes', role: 'client', coordinates: { lat: 47.2184, lng: -1.5536 }, city: 'Nantes' }
  ];

  const displayUsers = users.length > 0 ? users : demoUsers;

  if (loading) {
    return (
      <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <span className="text-gray-500">Chargement de la carte...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 bg-red-50 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <span className="text-red-600">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 bg-white rounded overflow-hidden relative">
      {/* VRAIE CARTE LEAFLET */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Légende */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 p-2 rounded text-xs shadow z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Clients</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Coiffeurs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Admins</span>
          </div>
        </div>
      </div>

      {/* Compteur d'utilisateurs */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded text-xs shadow z-10">
        <span className="font-medium">{displayUsers.length} utilisateurs</span>
      </div>

      {/* Debug info */}
      <div className="absolute top-2 left-2 bg-blue-50 bg-opacity-90 p-2 rounded text-xs shadow z-10">
        <span className="text-blue-600">Carte Leaflet active</span>
      </div>
    </div>
  );
};
