import React, { useState, useEffect } from 'react';
import { FaTimes, FaImage, FaTags, FaPlus, FaTrash } from 'react-icons/fa';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../../../utils/imageUtils';
import { coiffeurService } from '../../../services/api/coiffeurs';
import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileMediaUpload from '../media/MobileMediaUpload';

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
  examplePhotos: (string | File)[];
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  service,
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: 'autre',
    keywords: [],
    examplePhotos: []
  });
  const [error, setError] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        duration: service.duration || 30,
        price: service.price || 0,
        category: service.category || 'coupe',
        keywords: service.keywords || [],
        examplePhotos: []
      });
      setExistingPhotos(service.examplePhotos || []);
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
      setExistingPhotos([]);
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
      // Préparer les données de base
      const submitData = {
        ...formData,
        examplePhotos: [...existingPhotos]
      };
      
      // Si c'est une modification
      if (service) {
        // Mettre à jour le service
        await onSubmit(submitData);
        
        // Uploader les nouvelles images
        const newPhotos = formData.examplePhotos.filter(photo => photo instanceof File) as File[];
        for (const photo of newPhotos) {
          try {
            await coiffeurService.uploadServicePhoto(service._id, photo);
            console.log('Uploading new photo:', photo.name);
          } catch (error) {
            console.error('Erreur upload image:', error);
          }
        }
      } else {
        // Pour un nouveau service, créer le service sans images
        const serviceWithoutPhotos = {
          ...submitData,
          examplePhotos: []
        };
        
        await onSubmit(serviceWithoutPhotos);
        console.log('Service créé avec succès');
      }
      
    } catch (error) {
      console.error('Erreur soumission service:', error);
      setError('Erreur lors de la création du service');
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

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newMedia: File[] = Array.from(files);
      setFormData({
        ...formData,
        examplePhotos: [...formData.examplePhotos, ...newMedia]
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      examplePhotos: formData.examplePhotos.filter((_, i) => i !== index)
    });
  };

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos(existingPhotos.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-fashion-light-gray rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
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
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, duration: isNaN(value) ? 30 : value });
                }}
                min="15"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (€) *
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setFormData({ ...formData, price: isNaN(value) ? 0 : value });
                }}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Mots-clés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mots-clés (pour la recherche)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Ajouter un mot-clé..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-black transition-colors"
              >
                <FaPlus />
              </button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-accent hover:text-accent/70"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Photos d'exemple */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Médias d'exemple (Photos et Vidéos)
            </label>
            
            {isMobile ? (
              <MobileMediaUpload
                onMediaSelect={(files) => {
                  setFormData({
                    ...formData,
                    examplePhotos: [...formData.examplePhotos, ...files]
                  });
                }}
                existingMedia={existingPhotos}
                onRemoveExisting={handleRemoveExistingPhoto}
                maxFiles={10}
              />
            ) : (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés : JPEG, PNG, WebP, MP4, WebM, OGG, AVI, MOV (Max: 5MB pour images, 50MB pour vidéos)
                </p>
              </>
            )}
            
            {/* Médias existants - Desktop uniquement */}
            {!isMobile && existingPhotos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Médias existants :</h4>
                <div className="grid grid-cols-4 gap-2">
                  {existingPhotos.map((media, index) => {
                    const isVideo = media.includes('.mp4') || media.includes('.webm') || media.includes('.ogg') || media.includes('.avi') || media.includes('.mov');
                    return (
                      <div key={index} className="relative">
                        {isVideo ? (
                          <video
                            src={getImageUrl(media, DEFAULT_SERVICE_IMAGE)}
                            className="w-full h-20 object-cover rounded-lg"
                            controls={false}
                            muted
                          />
                        ) : (
                          <img
                            src={getImageUrl(media, DEFAULT_SERVICE_IMAGE)}
                            alt={`Exemple ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                            onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                          />
                        )}
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {isVideo ? '🎥' : '📷'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nouveaux médias */}
            {formData.examplePhotos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Nouveaux médias :</h4>
                <div className="grid grid-cols-4 gap-2">
                  {formData.examplePhotos
                    .filter(media => media instanceof File)
                    .map((media, index) => {
                      const file = media as File;
                      const isVideo = file.type.startsWith('video/');
                      return (
                        <div key={index} className="relative">
                          {isVideo ? (
                            <video
                              src={URL.createObjectURL(file)}
                              className="w-full h-20 object-cover rounded-lg"
                              controls={false}
                              muted
                            />
                          ) : (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Nouveau média ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {isVideo ? '🎥' : '📷'}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      );
                    })}
                </div>
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
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-black transition-colors disabled:opacity-50 font-medium shadow-lg"
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