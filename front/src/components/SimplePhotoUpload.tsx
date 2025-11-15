import React, { useState } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';
import { userService } from '../services/api/users';
import { APP_BASE_URL } from '../config/api';

interface SimplePhotoUploadProps {
  userId: string;
  currentPhoto: string;
  onPhotoUpdate: (photoUrl: string) => void;
}

const SimplePhotoUpload: React.FC<SimplePhotoUploadProps> = ({
  userId,
  currentPhoto,
  onPhotoUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGER : Construire l'URL complète pour l'initialisation
  const getFullPhotoUrl = (photoUrl: string) => {
    if (!photoUrl) return '';
    return photoUrl.startsWith('http')
      ? photoUrl
      : `${APP_BASE_URL}${photoUrl}`;
  };
  
  const [previewUrl, setPreviewUrl] = useState<string>(getFullPhotoUrl(currentPhoto));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('L\'image doit faire moins de 5MB');
      return;
    }

    setIsUploading(true);

    try {
      console.log('🔄 Début de l\'upload de la photo...');
      
      // FAIRE UN VRAI UPLOAD VERS LE SERVEUR
      const response = await userService.uploadProfilePhoto(userId, file);
      
      if (response.success) {
        console.log('✅ Photo uploadée avec succès:', response.photo);
        
        // CORRIGER : Construire l'URL complète
        const fullPhotoUrl = response.photo.startsWith('http')
          ? response.photo
          : `${APP_BASE_URL}${response.photo}`;
        
        console.log('🌐 URL complète de la photo:', fullPhotoUrl);
        
        // Mettre à jour l'aperçu avec l'URL complète du serveur
        setPreviewUrl(fullPhotoUrl);
        onPhotoUpdate(fullPhotoUrl);
        
        // Afficher un message de succès
        alert('Photo de profil mise à jour avec succès !');
      } else {
        throw new Error(response.message || 'Erreur lors de l\'upload');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      console.log('🗑️ Suppression de la photo...');
      
      // Supprimer la photo du serveur
      const response = await userService.deleteProfilePhoto(userId);
      
      if (response.success) {
        console.log('✅ Photo supprimée avec succès');
        setPreviewUrl('');
        onPhotoUpdate('');
        alert('Photo de profil supprimée avec succès !');
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la photo. Veuillez réessayer.');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Photo de profil */}
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <FaCamera className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Bouton d'upload */}
        <label className="absolute bottom-0 right-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors duration-200 shadow-lg">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <FaCamera className="w-4 h-4 text-white" />
        </label>

        {/* Bouton de suppression */}
        {previewUrl && (
          <button
            onClick={handleRemovePhoto}
            className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors duration-200 shadow-lg"
          >
            <FaTimes className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      {/* Indicateur de chargement */}
      {isUploading && (
        <div className="mt-2 text-sm text-gray-600 animate-pulse">
          Upload en cours...
        </div>
      )}
    </div>
  );
};

export default SimplePhotoUpload; 