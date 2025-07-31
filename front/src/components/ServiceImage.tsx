import React, { useState, useRef } from 'react';
import { FaCamera, FaTrash, FaSpinner, FaPlus } from 'react-icons/fa';
import { serviceService } from '../services/api/services';
import ImageOptimized from './ui/ImageOptimized';

interface ServiceImageProps {
  serviceId: string;
  photos: string[];
  onPhotosUpdate: (photos: string[]) => void;
  className?: string;
}

const ServiceImage: React.FC<ServiceImageProps> = ({
  serviceId,
  photos = [],
  onPhotosUpdate,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Fichier trop volumineux. Taille maximum : 5MB.');
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    try {
      setIsUploading(true);
      setError('');
      setSuccess('');

      const result = await serviceService.uploadServicePhoto(serviceId, file);
      
      if (result.success) {
        const photoUrl = typeof result.photo === 'string' ? result.photo : result.photo?.url;
        
        if (photoUrl) {
          const newPhotos = [...photos, photoUrl];
          onPhotosUpdate(newPhotos);
          setSuccess('Photo ajoutée avec succès !');
        } else {
          setError('URL de photo invalide reçue du serveur');
        }
      } else {
        setError('Erreur lors de l\'upload de la photo');
      }
    } catch (error: any) {
      console.error('Erreur upload photo service:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      setIsDeleting(true);
      setError('');
      setSuccess('');

      const result = await serviceService.deleteServicePhoto(serviceId, photoUrl);
      
      if (result.success) {
        const newPhotos = photos.filter(photo => photo !== photoUrl);
        onPhotosUpdate(newPhotos);
        setSuccess('Photo supprimée avec succès !');
      } else {
        setError('Erreur lors de la suppression de la photo');
      }
    } catch (error: any) {
      console.error('Erreur suppression photo service:', error);
      setError(error.response?.data?.message || 'Erreur lors de la suppression de la photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${className}`}>
      {/* Photos existantes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <ImageOptimized
              src={photo}
              alt={`Photo de service ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              fallbackSrc="/default-service-image.png"
            />
            
            {/* Overlay avec bouton supprimer */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <button
                onClick={() => deletePhoto(photo)}
                disabled={isDeleting}
                className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors duration-200 disabled:opacity-50"
                title="Supprimer la photo"
              >
                {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              </button>
            </div>
          </div>
        ))}
        
        {/* Bouton ajouter */}
        <button
          onClick={handleAddClick}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
          title="Ajouter une photo"
        >
          {isUploading ? (
            <FaSpinner className="animate-spin text-2xl mb-2" />
          ) : (
            <FaPlus className="text-2xl mb-2" />
          )}
          <span className="text-sm">Ajouter</span>
        </button>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Messages d'état */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {success}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        Formats acceptés : JPEG, PNG, WebP (max 5MB)
      </div>
    </div>
  );
};

export default ServiceImage; 