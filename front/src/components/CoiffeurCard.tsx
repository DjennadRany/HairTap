import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

interface CoiffeurCardProps {
  id: number;
  name: string;
  rating: number;
  services: string[];
  priceRange: string;
  city: string;
  mode: ('salon' | 'domicile')[];
  photo?: string;
  distance?: number;
  onSelect?: () => void;
}

export const CoiffeurCard = ({
  id,
  name,
  rating,
  services,
  priceRange,
  city,
  mode,
  photo,
  distance,
  onSelect
}: CoiffeurCardProps) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
              {photo ? (
                <img src={photo} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-accent text-white text-xl font-bold">
                  {name[0]}
                </div>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-yellow-400">★</span>
                <span className="ml-1 text-sm text-gray-600">{rating}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{priceRange}</div>
            <div className="text-sm text-gray-500">{city}</div>
            {distance !== undefined && (
              <div className="text-sm text-gray-500 mt-1">
                {distance.toFixed(1)} km
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {services.map((service, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent bg-opacity-10 text-accent"
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2">
          {mode.includes('salon') && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Salon
            </span>
          )}
          {mode.includes('domicile') && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              À domicile
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export type { CoiffeurCardProps }; 