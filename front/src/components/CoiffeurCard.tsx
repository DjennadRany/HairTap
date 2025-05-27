import { Coiffeur } from '../services/api/coiffeurs';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import FavoriteStar from './FavoriteStar';

interface CoiffeurCardProps {
  coiffeur: Coiffeur;
  onClick: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const CoiffeurCard = ({ coiffeur, onClick, userLocation }: CoiffeurCardProps) => {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = userLocation && coiffeur.address.coordinates
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        coiffeur.address.coordinates.lat,
        coiffeur.address.coordinates.lng
      )
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="relative h-48">
        <img
          src={coiffeur.photo || '/default-coiffeur.jpg'}
          alt={coiffeur.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center">
          <StarIcon className="h-4 w-4 text-yellow-400" />
          <span className="ml-1 text-sm font-medium">{coiffeur.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{coiffeur.name}</h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span>{coiffeur.address.city}</span>
          {distance && (
            <span className="ml-2">
              • {distance.toFixed(1)} km
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {coiffeur.speciality.map((spec, index) => (
            <span
              key={index}
              className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full"
            >
              {spec}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium">{coiffeur.priceRange}</span>
          </div>
          <div className="flex items-center space-x-1">
            {coiffeur.mode.includes('salon') && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Salon</span>
            )}
            {coiffeur.mode.includes('domicile') && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Domicile</span>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 right-3 z-10">
        <div className="rounded-full bg-white shadow-lg p-1 flex items-center justify-center">
          <FavoriteStar coiffeurId={coiffeur._id} size={28} />
        </div>
      </div>
    </div>
  );
};

export type { CoiffeurCardProps }; 