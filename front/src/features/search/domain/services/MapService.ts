import L from 'leaflet';
import 'leaflet.markercluster';
import { Location } from '../types';
import { SearchResult } from '../types';

export class MapService {
  private static instance: MapService;
  private map: L.Map | null = null;
  private markers: Map<number, L.Marker> = new Map();
  private markerClusterGroup: L.MarkerClusterGroup | null = null;
  private routeLayer: L.Polyline | null = null;
  private userMarker: L.Marker | null = null;
  private waypoints: L.Marker[] = [];

  private constructor() {}

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  public initMap(containerId: string, center: Location, zoom: number = 13): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(containerId).setView(
      [center.latitude, center.longitude],
      zoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true
    });

    this.map.addLayer(this.markerClusterGroup);
  }

  public addMarker(marker: SearchResult): L.Marker {
    if (!this.map || !this.markerClusterGroup) {
      throw new Error('Map not initialized');
    }

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-content ${marker.type}">
          ${marker.image ? `<img src="${marker.image}" alt="${marker.name}" />` : ''}
          <span>${marker.name}</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    const leafletMarker = L.marker(
      [marker.location.latitude, marker.location.longitude],
      { icon }
    ).bindPopup(`
      <div class="p-2">
        <h3 class="font-bold">${marker.name}</h3>
        <p class="text-sm">${marker.address}</p>
        <p class="text-sm">Prix à partir de ${marker.price}€</p>
        <div class="flex items-center mt-1">
          <span class="text-yellow-500">★</span>
          <span class="ml-1">${marker.rating} (${marker.reviews} avis)</span>
        </div>
      </div>
    `);

    this.markers.set(marker.id, leafletMarker);
    this.markerClusterGroup.addLayer(leafletMarker);
    
    return leafletMarker;
  }

  public updateUserLocation(location: Location): void {
    if (!this.map) return;

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `
        <div class="user-marker-inner">
          <div class="user-marker-pulse"></div>
          <div class="user-marker-dot"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    this.userMarker = L.marker(
      [location.latitude, location.longitude],
      {
        icon: userIcon,
        zIndexOffset: 1000
      }
    ).addTo(this.map);
  }

  public showRoute(origin: Location, destination: Location): void {
    if (!this.map) return;

    this.clearRoute();

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
    }).addTo(this.map);

    this.routeLayer = L.polyline([
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude]
    ], {
      color: '#6366F1',
      weight: 6
    }).addTo(this.map);
  }

  public clearRoute(): void {
    if (!this.map) return;

    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }

    this.waypoints.forEach(waypoint => {
      if (this.map) {
        this.map.removeLayer(waypoint);
      }
    });
    this.waypoints = [];
  }

  public removeMarker(markerId: number): void {
    const marker = this.markers.get(markerId);
    if (marker && this.markerClusterGroup) {
      this.markerClusterGroup.removeLayer(marker);
      this.markers.delete(markerId);
    }
  }

  public clearMarkers(): void {
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }
    this.markers.clear();
  }

  public setView(location: Location, zoom?: number): void {
    if (!this.map) return;
    this.map.setView(
      [location.latitude, location.longitude],
      zoom || this.map.getZoom()
    );
  }

  public onMapClick(callback: (location: Location) => void): void {
    if (!this.map) return;
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      callback({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    });
  }

  public destroy(): void {
    if (!this.map) return;

    this.clearRoute();
    this.clearMarkers();

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    this.map.remove();
    this.map = null;
    this.markerClusterGroup = null;
    this.userMarker = null;
  }
} 