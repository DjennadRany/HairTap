import React, { useEffect, useRef } from 'react';
import { MapService } from '../../domain/services/MapService';
import { MapViewProps } from '../../domain/types';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Définition des icônes personnalisées
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const salonIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const domicileIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const Map: React.FC<MapViewProps & { onMapClick?: () => void }> = ({
  center,
  markers,
  showRoute = false,
  origin,
  destination,
  className = '',
  onMarkerClick,
  onMapClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (window.L) {
      const mapElem = window.L.DomUtil.get(mapId);
      if (mapElem) {
        mapElem.innerHTML = '';
      }
    }
    const map = L.map(mapId, {
      center: [center.latitude, center.longitude],
      zoom: 13,
      attributionControl: false,
      zoomControl: false,
      layers: [
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        })
      ]
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true
    });
    markers.forEach(marker => {
      const icon = marker.type === 'salon' ? salonIcon : domicileIcon;
      const leafletMarker = L.marker([marker.location.latitude, marker.location.longitude], { icon });
      markerClusterGroup.addLayer(leafletMarker);
      leafletMarker.on('click', () => {
        if (onMarkerClick) onMarkerClick(marker.id);
      });
    });
    map.addLayer(markerClusterGroup);
    map.on('click', () => {
      if (onMapClick) onMapClick();
    });
    if (showRoute && origin && destination) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(origin.latitude, origin.longitude),
          L.latLng(destination.latitude, destination.longitude)
        ],
        routeWhileDragging: true,
        showAlternatives: true,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: '#6366F1', weight: 6 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        }
      }).addTo(map);
      return () => {
        map.removeControl(routingControl);
        map.remove();
      };
    }
    return () => {
      map.remove();
    };
  }, [mapId, center, markers, showRoute, origin, destination, onMarkerClick, onMapClick]);

  return (
    <div className={`relative w-full h-full ${className.replace('w-1', '').replace('sticky', '').replace('top-0', '')}`}>
      <div 
        id={mapId} 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
      />
      
      {/* Contrôles de la carte */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Mode plein écran"
          onClick={() => {
            const mapElement = document.getElementById(mapId);
            if (mapElement?.requestFullscreen) {
              mapElement.requestFullscreen();
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}; 