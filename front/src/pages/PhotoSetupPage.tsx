import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaCamera, FaTimes, FaCheck, FaArrowRight } from 'react-icons/fa';
import { RootState } from '../store';
import { setUser } from '../store/slices/authSlice';

const PhotoSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [photo, setPhoto] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      setError('L\'image doit faire moins de 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Créer un aperçu local
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setPhoto(result);
          console.log('✅ Photo sélectionnée avec succès');
        }
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
      setError('Erreur lors de la lecture de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError('Veuillez sélectionner une photo');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // TODO: Ici on enverrait la photo au serveur
      // Pour l'instant, on simule juste la mise à jour
      
      // Mettre à jour l'utilisateur localement
      if (user) {
        const updatedUser = { ...user, photo };
        dispatch(setUser(updatedUser));
      }

      // Redirection vers le dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    // Redirection vers le dashboard sans photo
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-700">
          
          {/* En-tête */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenue sur TapHair !
            </h1>
            <p className="text-gray-300">
              Ajoutez votre photo de profil pour personnaliser votre expérience
            </p>
          </div>

          {/* Zone de photo */}
          <div className="mb-8">
            <div className="text-center">
              {photo ? (
                <div className="relative inline-block">
                  <img
                    src={photo}
                    alt="Photo de profil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <button
                    onClick={() => setPhoto('')}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                  >
                    <FaTimes className="text-white text-sm" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto rounded-full bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center">
                  <FaCamera className="text-4xl text-gray-400" />
                </div>
              )}
            </div>

            {/* Bouton d'upload */}
            <div className="mt-4 text-center">
              <label className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 border border-gray-600 hover:border-gray-500 cursor-pointer">
                <FaCamera className="mr-2" />
                {photo ? 'Changer la photo' : 'Sélectionner une photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Indicateur de chargement */}
            {isUploading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Traitement en cours...
                </div>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="space-y-4">
            {photo && (
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    Continuer avec cette photo
                    <FaCheck className="ml-2" />
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleSkip}
              className="w-full flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 border border-gray-600 hover:border-gray-500"
            >
              Continuer sans photo
              <FaArrowRight className="ml-2" />
            </button>
          </div>

          {/* Informations */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Vous pourrez toujours ajouter ou modifier votre photo depuis votre profil
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoSetupPage;
