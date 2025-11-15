import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

interface Service {
  _id: string;
  name: string;
  category: string;
  duration: number;
}

interface Pricing {
  _id: string;
  coiffeurId: string;
  serviceId: Service;
  basePrice: number;
  timeSlotMultiplier: {
    morning: number;
    afternoon: number;
    evening: number;
    weekend: number;
  };
  locationMultiplier: {
    salon: number;
    domicile: number;
  };
  specialOffers: Array<{
    name: string;
    discount: number;
    validFrom: string;
    validTo: string;
    conditions: string[];
    isActive: boolean;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PricingFormData {
  serviceId: string;
  basePrice: number;
  timeSlotMultiplier: {
    morning: number;
    afternoon: number;
    evening: number;
    weekend: number;
  };
  locationMultiplier: {
    salon: number;
    domicile: number;
  };
}

const PricingManager: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [formData, setFormData] = useState<PricingFormData>({
    serviceId: '',
    basePrice: 0,
    timeSlotMultiplier: {
      morning: 1.0,
      afternoon: 1.0,
      evening: 1.2,
      weekend: 1.3
    },
    locationMultiplier: {
      salon: 1.0,
      domicile: 1.5
    }
  });

  // Charger les données
  useEffect(() => {
    if (user?._id) {
      loadPricing();
      loadServices();
    }
  }, [user?._id]);

  const loadPricing = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
             const response = await fetch(`/api/pricing/coiffeur/${user._id}`);
      const data = await response.json();
      
      if (data.success) {
        setPricing(data.data);
      } else {
        setError(data.message || 'Erreur lors du chargement des prix');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(`/api/services/coiffeur/${user._id}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des services');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setLoading(true);
    setError(null);

    try {
      const url = editingPricing 
        ? `/api/pricing/${editingPricing._id}`
        : '/api/pricing';
      
      const method = editingPricing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        await loadPricing();
        resetForm();
        setShowForm(false);
      } else {
        setError(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pricingItem: Pricing) => {
    setEditingPricing(pricingItem);
    setFormData({
      serviceId: pricingItem.serviceId._id,
      basePrice: pricingItem.basePrice,
      timeSlotMultiplier: pricingItem.timeSlotMultiplier,
      locationMultiplier: pricingItem.locationMultiplier
    });
    setShowForm(true);
  };

  const handleDelete = async (pricingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix ?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pricing/${pricingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadPricing();
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (pricingItem: Pricing) => {
    setLoading(true);
    setError(null);

    try {
      const action = pricingItem.isActive ? 'deactivate' : 'activate';
      const response = await fetch(`/api/pricing/${pricingItem._id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadPricing();
      } else {
        setError(data.message || 'Erreur lors du changement de statut');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceId: '',
      basePrice: 0,
      timeSlotMultiplier: {
        morning: 1.0,
        afternoon: 1.0,
        evening: 1.2,
        weekend: 1.3
      },
      locationMultiplier: {
        salon: 1.0,
        domicile: 1.5
      }
    });
    setEditingPricing(null);
  };

  const updateMultiplier = (type: 'timeSlot' | 'location', key: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  const calculateFinalPrice = (pricingItem: Pricing, timeSlot: string = 'afternoon', location: string = 'salon') => {
    let finalPrice = pricingItem.basePrice;
    
    // Appliquer le multiplicateur de créneau
    if (timeSlot === 'morning') finalPrice *= pricingItem.timeSlotMultiplier.morning;
    else if (timeSlot === 'afternoon') finalPrice *= pricingItem.timeSlotMultiplier.afternoon;
    else if (timeSlot === 'evening') finalPrice *= pricingItem.timeSlotMultiplier.evening;
    else if (timeSlot === 'weekend') finalPrice *= pricingItem.timeSlotMultiplier.weekend;
    
    // Appliquer le multiplicateur de lieu
    if (location === 'domicile') finalPrice *= pricingItem.locationMultiplier.domicile;
    else finalPrice *= pricingItem.locationMultiplier.salon;
    
    return Math.round(finalPrice * 100) / 100;
  };

  if (loading && pricing.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Prix Dynamiques</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Nouveau Prix
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPricing ? 'Modifier le Prix' : 'Nouveau Prix'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un service</option>
                  {services.map(service => (
                    <option key={service._id} value={service._id}>
                      {service.name} ({service.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de base (€) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multiplicateurs par créneau
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Matin (6h-12h)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.timeSlotMultiplier.morning}
                    onChange={(e) => updateMultiplier('timeSlot', 'morning', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Après-midi (12h-18h)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.timeSlotMultiplier.afternoon}
                    onChange={(e) => updateMultiplier('timeSlot', 'afternoon', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Soir (18h-22h)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.timeSlotMultiplier.evening}
                    onChange={(e) => updateMultiplier('timeSlot', 'evening', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Weekend</label>
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.timeSlotMultiplier.weekend}
                    onChange={(e) => updateMultiplier('timeSlot', 'weekend', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multiplicateurs par lieu
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Salon</label>
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.locationMultiplier.salon}
                    onChange={(e) => updateMultiplier('location', 'salon', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Domicile</label>
                  <input
                    type="number"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={formData.locationMultiplier.domicile}
                    onChange={(e) => updateMultiplier('location', 'domicile', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md transition-colors"
              >
                {loading ? 'Sauvegarde...' : (editingPricing ? 'Mettre à jour' : 'Créer')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des prix */}
      <div className="space-y-4">
        {pricing.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun prix configuré. Créez votre premier prix !
          </div>
        ) : (
          pricing.map(pricingItem => (
            <div
              key={pricingItem._id}
              className={`border rounded-lg p-4 ${
                pricingItem.isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pricingItem.serviceId.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pricingItem.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pricingItem.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Service:</span> {pricingItem.serviceId.category}
                    </div>
                    <div>
                      <span className="font-medium">Prix de base:</span> {pricingItem.basePrice}€
                    </div>
                    <div>
                      <span className="font-medium">Durée:</span> {pricingItem.serviceId.duration} min
                    </div>
                    <div>
                      <span className="font-medium">Offres:</span> {pricingItem.specialOffers.filter(o => o.isActive).length}
                    </div>
                  </div>

                  {/* Exemples de prix finaux */}
                  <div className="bg-white rounded p-3 mb-3">
                    <span className="text-sm font-medium text-gray-700">Exemples de prix finaux:</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                      <div>Matin salon: {calculateFinalPrice(pricingItem, 'morning', 'salon')}€</div>
                      <div>Après-midi salon: {calculateFinalPrice(pricingItem, 'afternoon', 'salon')}€</div>
                      <div>Soir domicile: {calculateFinalPrice(pricingItem, 'evening', 'domicile')}€</div>
                      <div>Weekend domicile: {calculateFinalPrice(pricingItem, 'weekend', 'domicile')}€</div>
                    </div>
                  </div>

                  {/* Multiplicateurs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Multiplicateurs créneau:</span>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <div>Matin: {pricingItem.timeSlotMultiplier.morning}x</div>
                        <div>Après-midi: {pricingItem.timeSlotMultiplier.afternoon}x</div>
                        <div>Soir: {pricingItem.timeSlotMultiplier.evening}x</div>
                        <div>Weekend: {pricingItem.timeSlotMultiplier.weekend}x</div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Multiplicateurs lieu:</span>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <div>Salon: {pricingItem.locationMultiplier.salon}x</div>
                        <div>Domicile: {pricingItem.locationMultiplier.domicile}x</div>
                      </div>
                    </div>
                  </div>

                  {/* Offres spéciales */}
                  {pricingItem.specialOffers.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Offres spéciales:</span>
                      <div className="space-y-1 mt-1">
                        {pricingItem.specialOffers.map((offer, index) => (
                          <div key={index} className={`text-xs p-2 rounded ${
                            offer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className="font-medium">{offer.name}</span>
                            : -{offer.discount}% 
                            ({new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validTo).toLocaleDateString()})
                            {!offer.isActive && ' (Expirée)'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(pricingItem)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleToggleStatus(pricingItem)}
                    disabled={loading}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      pricingItem.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {pricingItem.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleDelete(pricingItem._id)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PricingManager;
