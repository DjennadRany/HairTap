import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaClock, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { userService } from '../../../services/api/users';
import { geocodingService } from '../../../services/geocodingService';

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
  layout?: 'vertical' | 'horizontal'; // Layout du formulaire
  showMap?: boolean; // Afficher la carte
  enableGeocoding?: boolean; // Activer le géocodage automatique
}

const SalonAddressForm: React.FC<SalonAddressFormProps> = ({ 
  coiffeurId, 
  isOwner = false, 
  onUpdate,
  layout = 'vertical',
  showMap = false,
  enableGeocoding = false
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
      
      let updatedAddress = { ...address };
      
      // ✅ Géocodage automatique si activé
      if (enableGeocoding) {
        const fullAddress = `${address.streetNumber || ''} ${address.street}, ${address.postalCode} ${address.city}`.trim();
        const geocodingResult = await geocodingService.geocodeAddress(fullAddress);
        
        if (geocodingResult) {
          updatedAddress.coordinates = geocodingResult.coordinates;
          console.log('Coordonnées trouvées:', geocodingResult.coordinates);
        } else {
          console.warn('Impossible de géocoder l\'adresse');
        }
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

  const getMapUrl = (coordinates?: { lat: number; lng: number }) => {
    if (!coordinates?.lat || !coordinates?.lng) {
      return null;
    }
    // Utiliser OpenStreetMap pour une carte gratuite et fiable
    return `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng-0.01},${coordinates.lat-0.01},${coordinates.lng+0.01},${coordinates.lat+0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`;
  };

  if (loading && !address.street) {
    return (
      <div className={layout === 'horizontal' ? "flex items-center justify-center py-4" : "text-center py-8"}>
        <div className={`animate-spin rounded-full ${layout === 'horizontal' ? 'h-6 w-6' : 'h-8 w-8'} border-b-2 border-accent ${layout === 'horizontal' ? 'mx-0' : 'mx-auto'}`}></div>
        {layout === 'horizontal' ? (
          <span className="ml-2 text-gray-600">Chargement...</span>
        ) : (
          <p className="text-gray-600 mt-2">Chargement...</p>
        )}
      </div>
    );
  }

  // Styles selon le layout
  const containerClass = layout === 'horizontal' 
    ? "bg-white rounded-lg shadow-sm border border-gray-200 p-3"
    : "";
  
  const formClass = layout === 'horizontal' ? "space-y-3" : "space-y-4";
  const inputClass = layout === 'horizontal' 
    ? "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-accent focus:border-transparent"
    : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent";
  const labelClass = layout === 'horizontal' 
    ? "block text-xs font-medium text-gray-700 mb-1"
    : "block text-sm font-medium text-gray-700 mb-1";
  const gridClass = layout === 'horizontal' 
    ? "grid grid-cols-1 md:grid-cols-2 gap-3"
    : "grid grid-cols-1 md:grid-cols-2 gap-4";
  const buttonClass = layout === 'horizontal'
    ? "px-3 py-1 text-sm bg-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white transition-colors"
    : "px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors";
  const submitButtonClass = layout === 'horizontal'
    ? "px-4 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
    : "px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2";
  const errorClass = layout === 'horizontal'
    ? "bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm"
    : "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4";

  return (
    <div className={containerClass}>
      <div className={`flex items-center justify-between ${layout === 'horizontal' ? 'mb-2' : 'mb-3'}`}>
        {layout === 'vertical' && (
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaMapMarkerAlt className="text-accent" />
            Adresse du salon
          </h3>
        )}
        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={layout === 'horizontal'
              ? "flex items-center gap-2 px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
              : "flex items-center gap-2 px-2 py-1 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            }
          >
            {isEditing ? <FaTimes /> : <FaEdit />}
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        )}
      </div>

      {error && (
        <div className={errorClass}>
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className={formClass}>
          <div className={gridClass}>
            <div>
              <label className={labelClass}>
                Numéro de rue *
              </label>
              <input
                type="text"
                value={address.streetNumber || ''}
                onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                className={inputClass}
                placeholder="123"
              />
            </div>
            
            <div>
              <label className={labelClass}>
                Rue *
              </label>
              <input
                type="text"
                value={address.street || ''}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={inputClass}
                placeholder="Rue de la Paix"
                required
              />
            </div>
          </div>

          <div className={gridClass}>
            <div>
              <label className={labelClass}>
                Code postal *
              </label>
              <input
                type="text"
                value={address.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className={inputClass}
                placeholder="75001"
                required
              />
            </div>
            
            <div>
              <label className={labelClass}>
                Ville *
              </label>
              <input
                type="text"
                value={address.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={inputClass}
                placeholder="Paris"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Téléphone
            </label>
            <input
              type="tel"
              value={address.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={inputClass}
              placeholder="01 23 45 67 89"
            />
          </div>

          <div>
            <label className={labelClass}>
              Informations complémentaires
            </label>
            <textarea
              value={address.additionalInfo || ''}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              rows={layout === 'horizontal' ? 2 : 2}
              className={inputClass}
              placeholder="Étage, appartement, code d'accès..."
            />
          </div>

          <div className={`flex justify-end gap-${layout === 'horizontal' ? '2' : '3'} ${layout === 'horizontal' ? 'pt-2' : 'pt-4'}`}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={buttonClass}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={submitButtonClass}
            >
              <FaSave className={layout === 'horizontal' ? "text-xs" : ""} />
              {loading ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        layout === 'horizontal' ? (
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

            {/* Carte compacte - seulement si showMap est activé */}
            {showMap && (
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
            )}
          </div>
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

                {/* Carte - seulement si showMap est activé */}
                {showMap && address.coordinates?.lat && address.coordinates?.lng && (
                  <div className="mt-4 h-48 rounded-lg overflow-hidden border border-gray-200">
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
        )
      )}
    </div>
  );
};

export default SalonAddressForm;
