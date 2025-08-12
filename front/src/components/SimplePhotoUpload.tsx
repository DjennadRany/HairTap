import React, { useState, useRef } from 'react';
import { FaCamera, FaTrash, FaSpinner } from 'react-icons/fa';
import { PHOTO_URLS } from '../config/api';
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../utils/imageUtils';
import userService from '../services/api/users';

interface SimplePhotoUploadProps {
  userId: string;
  currentPhoto: string;
  onPhotoUpdate: (photoUrl: string) => void;
  className?: string;
}

const SimplePhotoUpload: React.FC<SimplePhotoUploadProps> = ({
  userId,
  currentPhoto,
  onPhotoUpdate,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log pour déboguer - DÉSACTIVÉ pour éviter la boucle infinie
  // console.log('🎨 [SimplePhotoUpload] Rendu avec currentPhoto:', currentPhoto);

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

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`http://localhost:5000/api/users/${userId}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ [SimplePhotoUpload] Photo uploadée:', result.photo);
        onPhotoUpdate(result.photo);
        setSuccess('Photo mise à jour avec succès !');
      } else {
        setError(result.message || 'Erreur lors de l\'upload de la photo');
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      setError('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async () => {
    try {
      setIsDeleting(true);
      setError('');
      setSuccess('');

      const response = await fetch(`http://localhost:5000/api/users/${userId}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onPhotoUpdate(result.photo);
        setSuccess('Photo supprimée avec succès !');
      } else {
        setError(result.message || 'Erreur lors de la suppression de la photo');
      }
    } catch (error: any) {
      console.error('Erreur suppression photo:', error);
      setError('Erreur lors de la suppression de la photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  console.log('🎨 [SimplePhotoUpload] Rendu avec currentPhoto:', currentPhoto);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Photo actuelle */}
      <div className="relative group">
        <img
          src={getImageUrl(currentPhoto, DEFAULT_USER_IMAGE)}
          alt="Photo de profil"
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
          onLoad={() => {
            // console.log('✅ [SimplePhotoUpload] Image chargée avec succès:', currentPhoto);
          }}
        />
        
        {/* Overlay avec boutons */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="flex gap-2">
            <button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors duration-200 disabled:opacity-50"
              title="Changer la photo"
            >
              {isUploading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
            </button>
            
            {currentPhoto && currentPhoto !== PHOTO_URLS.DEFAULT_AVATAR && (
              <button
                onClick={deletePhoto}
                disabled={isDeleting}
                className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors duration-200 disabled:opacity-50"
                title="Supprimer la photo"
              >
                {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              </button>
            )}
          </div>
        </div>
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
    </div>
  );
};

export default SimplePhotoUpload; 