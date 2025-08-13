import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaClock, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { userService } from '../services/api/users';

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

interface SalonAddressFormProps {
  coiffeurId: string;
  isOwner?: boolean;
  onUpdate?: (address: SalonAddress) => void;
}

const SalonAddressForm: React.FC<SalonAddressFormProps> = ({ 
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
      
      const response = await userService.updateSalonAddress(address);
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

  const formatOpeningHours = (hours: any) => {
    if (!hours) return 'Non renseigné';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return days.map((day, index) => {
      const dayHours = hours[day];
      if (dayHours?.closed) {
        return `${dayNames[index]}: Fermé`;
      } else if (dayHours?.open && dayHours?.close) {
        return `${dayNames[index]}: ${dayHours.open}-${dayHours.close}`;
      }
      return `${dayNames[index]}: Non renseigné`;
    }).join(' | ');
  };

  if (loading && !address.street) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-2">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaMapMarkerAlt className="text-accent" />
          Adresse du salon
        </h3>
        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
                            className="flex items-center gap-2 px-2 py-1 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isEditing ? <FaTimes /> : <FaEdit />}
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de rue *
              </label>
              <input
                type="text"
                value={address.streetNumber || ''}
                onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rue *
              </label>
              <input
                type="text"
                value={address.street || ''}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Rue de la Paix"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal *
              </label>
              <input
                type="text"
                value={address.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="75001"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                value={address.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Paris"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={address.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="01 23 45 67 89"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Informations complémentaires
            </label>
            <textarea
              value={address.additionalInfo || ''}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Étage, appartement, code d'accès..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
                              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {loading ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {address.street ? (
            <>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-accent mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">
                    {formatAddress(address)}
                  </p>
                  {address.additionalInfo && (
                    <p className="text-sm text-gray-600 mt-1">
                      {address.additionalInfo}
                    </p>
                  )}
                </div>
              </div>

              {address.phone && (
                <div className="flex items-center gap-3">
                  <FaPhone className="text-accent flex-shrink-0" />
                  <a 
                    href={`tel:${address.phone}`}
                    className="text-accent hover:underline"
                  >
                    {address.phone}
                  </a>
                </div>
              )}

              {address.openingHours && (
                <div className="flex items-start gap-3">
                  <FaClock className="text-accent mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-800 mb-1">Horaires d'ouverture :</p>
                    <p>{formatOpeningHours(address.openingHours)}</p>
                  </div>
                </div>
              )}
            </>
                     ) : (
             <div className="text-center py-4 text-gray-500">
               <FaMapMarkerAlt className="text-2xl mx-auto mb-2 text-gray-300" />
               <p className="text-sm">Aucune adresse renseignée</p>
               {isOwner && (
                 <p className="text-xs mt-1 text-gray-400">Cliquez sur "Modifier" pour ajouter</p>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SalonAddressForm; 