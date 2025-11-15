import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

interface Specialty {
  _id: string;
  name: string;
  expertiseLevel: number;
  yearsExperience: number;
  category: string;
  description?: string;
  certifications: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SpecialtyFormData {
  name: string;
  expertiseLevel: number;
  yearsExperience: number;
  category: string;
  description: string;
  certifications: string[];
}

const SpecialtyManager: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>({
    name: '',
    expertiseLevel: 3,
    yearsExperience: 0,
    category: 'coupe',
    description: '',
    certifications: []
  });

  const categories = [
    'coupe', 'coloration', 'brushing', 'lissage', 
    'permanente', 'barbe', 'soin', 'extension', 'autre'
  ];

  const expertiseLevels = [
    { value: 1, label: 'Débutant' },
    { value: 2, label: 'Intermédiaire' },
    { value: 3, label: 'Confirmé' },
    { value: 4, label: 'Expert' },
    { value: 5, label: 'Maître' }
  ];

  // Charger les spécialités
  useEffect(() => {
    console.log('🔍 SpecialtyManager useEffect:', { userId: user?._id, user });
    if (user?._id) {
      loadSpecialties();
    } else {
      console.log('❌ SpecialtyManager: user?._id est undefined');
    }
  }, [user?._id]);

  const loadSpecialties = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
             const response = await fetch(`/api/specialties/coiffeur/${user._id}`);
      const data = await response.json();
      
      if (data.success) {
        setSpecialties(data.data);
      } else {
        setError(data.message || 'Erreur lors du chargement des spécialités');
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
      const url = editingSpecialty 
        ? `/api/specialties/${editingSpecialty._id}`
        : '/api/specialties';
      
      const method = editingSpecialty ? 'PUT' : 'POST';
      
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
        await loadSpecialties();
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

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      expertiseLevel: specialty.expertiseLevel,
      yearsExperience: specialty.yearsExperience,
      category: specialty.category,
      description: specialty.description || '',
      certifications: specialty.certifications
    });
    setShowForm(true);
  };

  const handleDelete = async (specialtyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/specialties/${specialtyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadSpecialties();
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (specialty: Specialty) => {
    setLoading(true);
    setError(null);

    try {
      const action = specialty.isActive ? 'deactivate' : 'activate';
      const response = await fetch(`/api/specialties/${specialty._id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadSpecialties();
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
      name: '',
      expertiseLevel: 3,
      yearsExperience: 0,
      category: 'coupe',
      description: '',
      certifications: []
    });
    setEditingSpecialty(null);
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const updateCertification = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? value : cert
      )
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  if (loading && specialties.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Spécialités</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Nouvelle Spécialité
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
            {editingSpecialty ? 'Modifier la Spécialité' : 'Nouvelle Spécialité'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la spécialité *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'expertise *
                </label>
                <select
                  value={formData.expertiseLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, expertiseLevel: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {expertiseLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.value} - {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Années d'expérience *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez votre expertise dans cette spécialité..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              <div className="space-y-2">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => updateCertification(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom de la certification"
                    />
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCertification}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  + Ajouter une certification
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md transition-colors"
              >
                {loading ? 'Sauvegarde...' : (editingSpecialty ? 'Mettre à jour' : 'Créer')}
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

      {/* Liste des spécialités */}
      <div className="space-y-4">
        {specialties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune spécialité configurée. Créez votre première spécialité !
          </div>
        ) : (
          specialties.map(specialty => (
            <div
              key={specialty._id}
              className={`border rounded-lg p-4 ${
                specialty.isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {specialty.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      specialty.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {specialty.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Catégorie:</span> {specialty.category}
                    </div>
                    <div>
                      <span className="font-medium">Niveau:</span> {specialty.expertiseLevel}/5
                    </div>
                    <div>
                      <span className="font-medium">Expérience:</span> {specialty.yearsExperience} ans
                    </div>
                    <div>
                      <span className="font-medium">Certifications:</span> {specialty.certifications.length}
                    </div>
                  </div>
                  
                  {specialty.description && (
                    <p className="text-gray-600 mt-2">{specialty.description}</p>
                  )}
                  
                  {specialty.certifications.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Certifications:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialty.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(specialty)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleToggleStatus(specialty)}
                    disabled={loading}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      specialty.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {specialty.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleDelete(specialty._id)}
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

export default SpecialtyManager;
