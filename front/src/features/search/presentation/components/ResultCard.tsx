import React from 'react';
import { SearchResult } from '../../domain/types';
import { formatDistance, formatPrice } from '@/utils/format';

interface ResultCardProps {
  result: SearchResult;
  onClick: () => void;
  variant?: 'compact' | 'full';
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onClick,
  variant = 'full'
}) => {
  const {
    name,
    type,
    rating,
    reviews,
    price,
    services,
    location,
    image
  } = result;

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          {image && (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>★</span>
            <span>{rating.toFixed(1)}</span>
            <span>•</span>
            <span>{reviews} avis</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4"
      onClick={onClick}
    >
      <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100 mb-4">
        {image && (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-lg text-gray-900">{name}</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
            {type === 'salon' ? 'Salon' : 'À domicile'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
          <span>•</span>
          <span>{reviews} avis</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {services.slice(0, 3).map((service: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
            >
              {service}
            </span>
          ))}
          {services.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
              +{services.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-600">À partir de </span>
            <span className="font-medium text-gray-900">
              {formatPrice(price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 