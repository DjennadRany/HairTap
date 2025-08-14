import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface WorkingSlot {
  _id: string;
  coiffeurId: string;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  serviceTypes: string[];
  availableAt: 'salon' | 'domicile' | 'both';
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  maxBookings: number;
  currentBookings: number;
  isRecurring: boolean;
  exceptions: Array<{
    date: string;
    reason: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface WorkingSlotFormData {
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  serviceTypes: string[];
  availableAt: 'salon' | 'domicile' | 'both';
  maxBookings: number;
  isRecurring: boolean;
}

const WorkingSlotManager: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [slots, setSlots] = useState<WorkingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<WorkingSlot | null>(null);
  const [formData, setFormData] = useState<WorkingSlotFormData>({
    dayOfWeek: 1,
    startTime: 9,
    endTime: 18,
    serviceTypes: ['coupe'],
    availableAt: 'salon',
    maxBookings: 1,
    isRecurring: true
  });

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`
  }));

  const serviceTypes = [
    'coupe', 'coloration', 'brushing', 'lissage', 
    'permanente', 'barbe', 'soin', 'extension', 'autre'
  ];

  const availableAtOptions = [
    { value: 'salon', label: 'Salon uniquement' },
    { value: 'domicile', label: 'Domicile uniquement' },
    { value: 'both', label: 'Salon et domicile' }
  ];

  // Charger les créneaux
  useEffect(() => {
    if (user?._id) {
      loadSlots();
    }
  }, [user?._id]);

  const loadSlots = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
             const response = await fetch(`/api/working-slots/coiffeur/${user._id}`);
      const data = await response.json();
      
      if (data.success) {
        setSlots(data.data);
      } else {
        setError(data.message || 'Erreur lors du chargement des créneaux');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setLoading(true);
    setError(null);

    try {
      const url = editingSlot 
        ? `/api/working-slots/${editingSlot._id}`
        : '/api/working-slots';
      
      const method = editingSlot ? 'PUT' : 'POST';
      
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
        await loadSlots();
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

  const handleEdit = (slot: WorkingSlot) => {
    setEditingSlot(slot);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      serviceTypes: slot.serviceTypes,
      availableAt: slot.availableAt,
      maxBookings: slot.maxBookings,
      isRecurring: slot.isRecurring
    });
    setShowForm(true);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/working-slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadSlots();
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenance = async (slot: WorkingSlot) => {
    const reason = prompt('Raison de la maintenance :');
    if (!reason) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/working-slots/${slot._id}/maintenance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (data.success) {
        await loadSlots();
      } else {
        setError(data.message || 'Erreur lors de la mise en maintenance');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dayOfWeek: 1,
      startTime: 9,
      endTime: 18,
      serviceTypes: ['coupe'],
      availableAt: 'salon',
      maxBookings: 1,
      isRecurring: true
    });
    setEditingSlot(null);
  };

  const toggleServiceType = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(type => type !== serviceType)
        : [...prev.serviceTypes, serviceType]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      case 'unavailable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'booked':
        return 'Réservé';
      case 'maintenance':
        return 'Maintenance';
      case 'unavailable':
        return 'Indisponible';
      default:
        return status;
    }
  };

  if (loading && slots.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Créneaux de Travail</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Nouveau Créneau
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
            {editingSlot ? 'Modifier le Créneau' : 'Nouveau Créneau'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jour de la semaine *
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de début *
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {timeSlots.map(time => (
                    <option key={time.value} value={time.value}>
                      {time.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de fin *
                </label>
                <select
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {timeSlots.map(time => (
                    <option key={time.value} value={time.value}>
                      {time.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponibilité *
                </label>
                <select
                  value={formData.availableAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableAt: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {availableAtOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réservations max *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxBookings}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBookings: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types de services *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {serviceTypes.map(serviceType => (
                  <label key={serviceType} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.serviceTypes.includes(serviceType)}
                      onChange={() => toggleServiceType(serviceType)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{serviceType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Créneau récurrent (chaque semaine)</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md transition-colors"
              >
                {loading ? 'Sauvegarde...' : (editingSlot ? 'Mettre à jour' : 'Créer')}
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

      {/* Liste des créneaux */}
      <div className="space-y-4">
        {slots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun créneau configuré. Créez votre premier créneau de travail !
          </div>
        ) : (
          slots.map(slot => (
            <div
              key={slot._id}
              className={`border rounded-lg p-4 ${
                slot.status === 'available' ? 'border-green-200 bg-green-50' :
                slot.status === 'booked' ? 'border-yellow-200 bg-yellow-50' :
                slot.status === 'maintenance' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {daysOfWeek.find(d => d.value === slot.dayOfWeek)?.label}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>
                      {getStatusLabel(slot.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Horaires:</span> {slot.startTime}:00 - {slot.endTime}:00
                    </div>
                    <div>
                      <span className="font-medium">Disponibilité:</span> {availableAtOptions.find(o => o.value === slot.availableAt)?.label}
                    </div>
                    <div>
                      <span className="font-medium">Réservations:</span> {slot.currentBookings}/{slot.maxBookings}
                    </div>
                    <div>
                      <span className="font-medium">Services:</span> {slot.serviceTypes.length}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Types de services:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {slot.serviceTypes.map(serviceType => (
                        <span
                          key={serviceType}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
                        >
                          {serviceType}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {slot.exceptions.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Exceptions:</span>
                      <div className="space-y-1 mt-1">
                        {slot.exceptions.map((exception, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            <span className="font-medium">{new Date(exception.date).toLocaleDateString()}</span>
                            : {exception.reason}
                            {exception.description && ` - ${exception.description}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(slot)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Modifier
                  </button>
                  {slot.status !== 'maintenance' && (
                    <button
                      onClick={() => handleMaintenance(slot)}
                      disabled={loading}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
                    >
                      Maintenance
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(slot._id)}
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

export default WorkingSlotManager;
