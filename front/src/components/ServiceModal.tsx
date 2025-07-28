import React, { useState, useEffect } from 'react';
import { FaTimes, FaImage, FaTags, FaPlus, FaTrash } from 'react-icons/fa';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceData: ServiceFormData) => Promise<void>;
  service?: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    keywords?: string[];
    examplePhotos?: string[];
  };
  isLoading?: boolean;
}

interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  keywords: string[];
  examplePhotos: string[];
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  service,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: 'coupe',
    keywords: [],
    examplePhotos: []
  });
  const [error, setError] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        keywords: service.keywords || [],
        examplePhotos: service.examplePhotos || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        category: 'coupe',
        keywords: [],
        examplePhotos: []
      });
    }
    setError(null);
    setNewKeyword('');
  }, [service, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.duration) {
      setError('Tous les champs sont requis');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData({
        ...formData,
        examplePhotos: [...formData.examplePhotos, ...newPhotos]
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      examplePhotos: formData.examplePhotos.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {service ? 'Modifier le service' : 'Ajouter un service'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du service *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Ex: Coupe femme moderne"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isLoading}
              >
                <option value="coupe">Coupe</option>
                <option value="coloration">Coloration</option>
                <option value="brushing">Brushing</option>
                <option value="lissage">Lissage</option>
                <option value="permanente">Permanente</option>
                <option value="barbe">Barbe</option>
                <option value="soin">Soin</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={4}
              placeholder="Décrivez votre service en détail..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                min="15"
                max="300"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (€) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                min="0"
                step="0.50"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Mots-clés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mots-clés (pour la recherche)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Ajouter un mot-clé..."
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                disabled={isLoading || !newKeyword.trim()}
              >
                <FaPlus />
              </button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-2"
                  >
                    <FaTags className="text-xs" />
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-accent hover:text-accent/70 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Photos d'exemple */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos d'exemple
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={isLoading}
            />
            {formData.examplePhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {formData.examplePhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Exemple ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Sauvegarde...' : (service ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal; 