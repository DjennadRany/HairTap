import React, { useState } from 'react';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  ChatBubbleLeftIcon,
  StarIcon,
  CurrencyEuroIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description: string;
  image?: string;
}

interface Coiffeur {
  id: string;
  name: string;
  rating: number;
  totalReviews: number;
  photo?: string;
  specialties: string[];
  location: string;
}

interface AdvancedBookingCardProps {
  service: Service;
  coiffeur: Coiffeur;
  selectedSlot: {
    date: Date;
    time: string;
    price: number;
    surge: boolean;
  };
  onConfirm: (bookingData: any) => void;
  onCancel: () => void;
  isClient?: boolean;
}

export const AdvancedBookingCard: React.FC<AdvancedBookingCardProps> = ({
  service,
  coiffeur,
  selectedSlot,
  onConfirm,
  onCancel,
  isClient = true
}) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      const bookingData = {
        serviceId: service.id,
        coiffeurId: coiffeur.id,
        date: selectedSlot.date,
        time: selectedSlot.time,
        price: selectedSlot.price,
        notes,
        surge: selectedSlot.surge
      };
      
      await onConfirm(bookingData);
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric',
        month: 'long'
      });
    }
  };

  const formatTime = (time: string): string => {
    return time;
  };

  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)}€`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header avec image de service */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {service.image ? (
          <img 
            src={service.image} 
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">✂️</div>
          </div>
        )}
        
        {/* Badge Surge Pricing */}
        {selectedSlot.surge && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            ⚡ Surge Pricing
          </div>
        )}
        
        {/* Badge de catégorie */}
        <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium">
          {service.category}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {/* Titre et description */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h2>
          <p className="text-gray-600 leading-relaxed">{service.description}</p>
        </div>

        {/* Informations coiffeur */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            {coiffeur.photo ? (
              <img 
                src={coiffeur.photo} 
                alt={coiffeur.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-gray-600" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{coiffeur.name}</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600">{coiffeur.rating}</span>
                </div>
                <span className="text-sm text-gray-500">({coiffeur.totalReviews} avis)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPinIcon className="h-4 w-4" />
              <span>{coiffeur.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDuration(service.duration)}</span>
            </div>
          </div>
        </div>

        {/* Détails de la réservation */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">{formatDate(selectedSlot.date)}</div>
                <div className="text-sm text-gray-600">{formatTime(selectedSlot.time)}</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CurrencyEuroIcon className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Prix</div>
                <div className="text-sm text-gray-600">
                  {selectedSlot.surge ? (
                    <span className="text-orange-600 font-medium">
                      {formatPrice(selectedSlot.price)} (Surge)
                    </span>
                  ) : (
                    formatPrice(selectedSlot.price)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes pour le coiffeur
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Précisez vos souhaits, allergies, ou demandes spéciales..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Confirmation...</span>
              </div>
            ) : (
              `Confirmer - ${formatPrice(selectedSlot.price)}`
            )}
          </button>
          
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
          >
            Annuler
          </button>
        </div>

        {/* Chat intégré */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span className="font-medium">
              {showChat ? 'Masquer le chat' : 'Discuter avec le coiffeur'}
            </span>
          </button>
          
          {showChat && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Chat intégré pour discuter de cette réservation
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-center text-gray-500 text-sm">
                  💬 Chat en cours de développement
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedBookingCard;
