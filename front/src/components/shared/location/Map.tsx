import { useEffect, useRef } from 'react';
import { Coiffeur } from '../../../services/api/coiffeurs';

interface MapProps {
  coiffeurs: Coiffeur[];
  userLocation?: { latitude: number; longitude: number };
  onCoiffeurClick: (coiffeur: Coiffeur) => void;
}

export const Map = ({ coiffeurs, userLocation, onCoiffeurClick }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      const center = userLocation
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : { lat: 48.8566, lng: 2.3522 }; // Paris par défaut

      mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Ajouter le marqueur de l'utilisateur
      if (userLocation) {
        new google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4F46E5',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Nettoyer les marqueurs existants
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    coiffeurs.forEach(coiffeur => {
      if (!coiffeur.address.coordinates) return;

      const marker = new google.maps.Marker({
        position: {
          lat: coiffeur.address.coordinates.lat,
          lng: coiffeur.address.coordinates.lng
        },
        map: mapInstanceRef.current,
        title: coiffeur.name,
        icon: {
          url: '/marker.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      marker.addListener('click', () => onCoiffeurClick(coiffeur));
      markersRef.current.push(marker);
    });
  }, [coiffeurs, onCoiffeurClick]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg"
    />
  );
}; 