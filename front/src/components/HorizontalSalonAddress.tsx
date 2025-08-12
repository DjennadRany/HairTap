import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaClock, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { userService } from '../services/api/users';
import { geocodingService } from '../services/geocodingService';

interface SalonAddress {
  street?: string;
  streetNumber?: string;
  city?: string;
  postalCode?: string;
  floor?: string;
  apartment?: string;
  buildingCode?: string;
  additionalInfo?: string;
  phone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  openingHours?: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

interface HorizontalSalonAddressProps {
  coiffeurId: string;
  isOwner?: boolean;
  onUpdate?: (address: SalonAddress) => void;
}

const HorizontalSalonAddress: React.FC<HorizontalSalonAddressProps> = ({ 
  coiffeurId, 
  isOwner = false, 
  onUpdate 
}) => {
  const [address, setAddress] = useState<SalonAddress>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalonAddress();
  }, [coiffeurId]);

  const fetchSalonAddress = async () => {
    try {
      setLoading(true);
      const response = await userService.getSalonAddress(coiffeurId);
      setAddress(response.salonAddress || {});
    } catch (error) {
      console.error('Erreur récupération adresse salon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.street || !address.city || !address.postalCode) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Géocodage automatique de l'adresse
      const fullAddress = `${address.streetNumber || ''} ${address.street}, ${address.postalCode} ${address.city}`.trim();
      const geocodingResult = await geocodingService.geocodeAddress(fullAddress);
      
      let updatedAddress = { ...address };
      
      if (geocodingResult) {
        updatedAddress.coordinates = geocodingResult.coordinates;
        console.log('Coordonnées trouvées:', geocodingResult.coordinates);
      } else {
        console.warn('Impossible de géocoder l\'adresse');
      }
      
      const response = await userService.updateSalonAddress(updatedAddress);
      setAddress(response.salonAddress);
      setIsEditing(false);
      
      if (onUpdate) {
        onUpdate(response.salonAddress);
      }
      
    } catch (error) {
      console.error('Erreur mise à jour adresse salon:', error);
      setError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatAddress = (address: SalonAddress) => {
    const parts = [];
    if (address.streetNumber && address.street) {
      parts.push(`${address.streetNumber} ${address.street}`);
    } else if (address.street) {
      parts.push(address.street);
    }
    if (address.postalCode && address.city) {
      parts.push(`${address.postalCode} ${address.city}`);
    }
    return parts.join(', ');
  };

  const getMapUrl = (coordinates?: { lat: number; lng: number }) => {
    if (!coordinates?.lat || !coordinates?.lng) {
      return null;
    }
    // Utiliser OpenStreetMap pour une carte gratuite et fiable
    return `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng-0.01},${coordinates.lat-0.01},${coordinates.lng+0.01},${coordinates.lat+0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`;
  };

  if (loading && !address.street) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            {isEditing ? <FaTimes /> : <FaEdit />}
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Numéro de rue *
              </label>
              <input
                type="text"
                value={address.streetNumber || ''}
                onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-accent focus:border-transparent"
                placeholder="123"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rue *
              </label>
              <input
                type="text"
                value={address.street || ''}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-accent focus:border-transparent"
                placeholder="Rue de la Paix"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Code postal *
              </label>
              <input
                type="text"
                value={address.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-accent focus:border-transparent"
                placeholder="75001"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                value={address.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-accent focus:border-transparent"
                placeholder="Paris"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={address.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-accent focus:border-transparent"
              placeholder="01 23 45 67 89"
            />
          </div>

                     <div className="flex justify-end gap-2 pt-2">
             <button
               type="button"
               onClick={() => setIsEditing(false)}
               className="px-3 py-1 text-sm bg-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white transition-colors"
               disabled={loading}
             >
               Annuler
             </button>
             <button
               type="submit"
               disabled={loading}
               className="px-4 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
             >
               <FaSave className="text-xs" />
               {loading ? 'Sauvegarde...' : 'Enregistrer'}
             </button>
           </div>
        </form>
      ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
           {/* Informations d'adresse */}
           <div className="lg:col-span-2 space-y-2">
             {address.street ? (
               <>
                 <div className="flex items-start gap-2">
                   <FaMapMarkerAlt className="text-accent mt-1 flex-shrink-0" />
                   <div>
                     <p className="font-medium text-gray-800 text-sm">
                       {formatAddress(address)}
                     </p>
                     {address.additionalInfo && (
                       <p className="text-xs text-gray-600 mt-1">
                         {address.additionalInfo}
                       </p>
                     )}
                   </div>
                 </div>

                 {address.phone && (
                   <div className="flex items-center gap-2">
                     <FaPhone className="text-accent flex-shrink-0 text-xs" />
                     <a 
                       href={`tel:${address.phone}`}
                       className="text-accent hover:underline text-sm"
                     >
                       {address.phone}
                     </a>
                   </div>
                 )}
               </>
             ) : (
               <div className="text-center py-2 text-gray-500">
                 <FaMapMarkerAlt className="text-lg mx-auto mb-1 text-gray-300" />
                 <p className="text-xs">Aucune adresse renseignée</p>
                 {isOwner && (
                   <p className="text-xs mt-1 text-gray-400">Cliquez sur "Modifier" pour ajouter</p>
                 )}
               </div>
             )}
           </div>

           {/* Carte compacte */}
           <div className="h-24 rounded-lg overflow-hidden border border-gray-200">
             {address.coordinates?.lat && address.coordinates?.lng ? (
               <iframe
                 src={getMapUrl(address.coordinates)}
                 width="100%"
                 height="100%"
                 style={{ border: 0 }}
                 allowFullScreen
                 loading="lazy"
                 referrerPolicy="no-referrer-when-downgrade"
                 title="Carte du salon"
               />
             ) : (
               <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                 <div className="text-center text-gray-500">
                   <FaMapMarkerAlt className="text-lg mx-auto mb-1 text-gray-300" />
                   <p className="text-xs">
                     {address.street ? 'Génération...' : 'Carte non disponible'}
                   </p>
                 </div>
               </div>
             )}
           </div>
         </div>
      )}
    </div>
  );
};

export default HorizontalSalonAddress; 