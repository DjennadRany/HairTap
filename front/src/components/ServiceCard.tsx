import React from 'react';
import { FaHeart, FaCalendarAlt } from 'react-icons/fa';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';

interface ServiceCardProps {
  service: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    keywords?: string[];
    examplePhotos?: string[];
    likes?: number;
    isLiked?: boolean;
  };
  isOwner?: boolean;
  showBookButton?: boolean;
  onEdit?: (serviceId: string) => void;
  onDelete?: (serviceId: string) => void;
  onBook?: (serviceId: string) => void;
  onLike?: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  isOwner = false, 
  showBookButton = false,
  onEdit, 
  onDelete, 
  onBook,
  onLike
}) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      coupe: 'bg-blue-100 text-blue-800',
      coloration: 'bg-purple-100 text-purple-800',
      brushing: 'bg-pink-100 text-pink-800',
      lissage: 'bg-green-100 text-green-800',
      permanente: 'bg-orange-100 text-orange-800',
      barbe: 'bg-gray-100 text-gray-800',
      soin: 'bg-teal-100 text-teal-800',
      degradé: 'bg-indigo-100 text-indigo-800',
      autre: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.autre;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-fashion-light-gray">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{service.name}</h3>
        <div className="flex items-center gap-2">
          {onLike && !isOwner && (
            <button
              onClick={() => onLike(service._id)}
              className={`transition-colors ${
                service.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <FaHeart className="text-sm" />
            </button>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
            {service.category}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-accent font-bold text-lg">{service.price}€</span>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <FaCalendarAlt />
          <span>{service.duration} min</span>
        </div>
      </div>

      {/* Mots-clés */}
      {service.keywords && service.keywords.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {service.keywords.slice(0, 3).map((keyword, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Photos d'exemple */}
      {service.examplePhotos && service.examplePhotos.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2">
            {service.examplePhotos.slice(0, 2).map((photo, index) => (
              <img
                key={index}
                src={getImageUrl(photo, DEFAULT_SERVICE_IMAGE)}
                alt={`Exemple ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {isOwner ? (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(service._id)}
                className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-black transition-colors"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(service._id)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
              )}
          </>
        ) : (
          <>
            {/* Bouton Réserver pour les clients */}
            {onBook && showBookButton && (
              <button
                onClick={() => onBook(service._id)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <FaCalendarAlt />
                Réserver
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceCard; 