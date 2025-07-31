import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setUser, User as AuthUser } from '../store/slices/authSlice';
import { useParams } from 'react-router-dom';
import { userService } from '../services/api/users';
import { FaUser, FaEnvelope, FaLock, FaSave, FaMapMarkerAlt, FaMapPin } from 'react-icons/fa';
import PhotoUpload from '../components/PhotoUpload';
import type { User as UserModel } from '../types/models';

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  addresses?: {
    home?: {
      streetNumber: string;
      street: string;
      postalCode: string;
      city: string;
      floor: string;
      apartment: string;
      buildingCode: string;
      additionalInfo: string;
    };
    office?: {
      streetNumber: string;
      street: string;
      postalCode: string;
      city: string;
      floor: string;
      apartment: string;
      buildingCode: string;
      additionalInfo: string;
    };
  };
}

const ClientProfilePage = () => {
  const dispatch = useDispatch();
  const { id: paramId } = useParams();
  const user = useSelector(selectCurrentUser) as UserModel | null;
  const id = paramId || user?._id;
  const [success, setSuccess] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [profile, setProfile] = useState<UserModel | null>(null);
  const [activeAddress, setActiveAddress] = useState<'home' | 'office'>('home');
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any>({});


  const defaultName = profile?.name || user?.name || '';
  const defaultEmail = profile?.email || user?.email || '';
  const defaultPhoto = profile?.photo || user?.photo || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSuccess('');
      setErrorMsg('');
      if (!id) {
        setErrorMsg("Impossible de retrouver l'utilisateur.");
        return;
      }
      
      console.log('📝 Données du formulaire:', data);
      
      const payload: any = {
        name: data.name,
        email: data.email,
      };
      if (data.password) {
        if (data.password === data.confirmPassword) {
          payload.password = data.password;
        } else {
          setErrorMsg('Les mots de passe ne correspondent pas');
          return;
        }
      }
      
      // Sauvegarder les adresses - UX-Pro
      if (data.addresses) {
        payload.addresses = data.addresses;
        console.log('🔧 [ClientProfilePage] Adresses à sauvegarder:', JSON.stringify(data.addresses, null, 2));
        
        // Vérifier que les adresses ne sont pas vides
        const hasHomeAddress = data.addresses.home && (
          data.addresses.home.street || 
          data.addresses.home.city || 
          data.addresses.home.postalCode
        );
        const hasOfficeAddress = data.addresses.office && (
          data.addresses.office.street || 
          data.addresses.office.city || 
          data.addresses.office.postalCode
        );
        
        console.log('🏠 Adresse home valide:', hasHomeAddress);
        console.log('🏢 Adresse office valide:', hasOfficeAddress);
      } else {
        console.log('❌ [ClientProfilePage] Pas d\'adresses dans data.addresses');
      }
      
      console.log('🔧 Payload complet:', payload);
      const updatedUser = await userService.updateUser(id, payload);
      console.log('✅ Utilisateur mis à jour:', updatedUser);
      
      // Ne jamais mapper admin côté front
      let mappedRole: 'client' | 'coiffeur' = 'client';
      if (updatedUser.role === 'coiffeur') mappedRole = 'coiffeur';
      // Si jamais admin, fallback sur client
      dispatch(setUser({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: mappedRole,
        photo: updatedUser.photo
      }));
      setSuccess('Profil mis à jour avec succès !');
      
      // Marquer les adresses comme sauvegardées
      if (data.addresses) {
        setSavedAddresses(data.addresses);
        setIsAddressSaved(true);
        console.log('✅ Adresses marquées comme sauvegardées');
      }
      
      // Recharger les données du profil pour confirmer la sauvegarde
      if (id) {
        userService.getUser(id).then(setProfile);
      }
    } catch (error) {
      setErrorMsg('Erreur lors de la mise à jour du profil');
      console.error('❌ Erreur:', error);
    }
  };

  const handlePhotoUpdate = (photoUrl: string) => {
    // Mettre à jour le state global pour que la photo apparaisse dans les cartes hub
    if (user) {
      let mappedRole: 'client' | 'coiffeur' = 'client';
      if (user.role === 'coiffeur') mappedRole = 'coiffeur';
      
      dispatch(setUser({
        ...user,
        role: mappedRole,
        photo: photoUrl
      }));
    }
    
    // Rafraîchir les données du profil
    if (id) {
      userService.getUser(id).then(setProfile);
    }
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    userService.getUser(id)
      .then((data) => {
        setProfile(data);
        console.log('📥 Données utilisateur chargées:', data);
        reset({
          name: data.name,
          email: data.email,
          password: '',
          confirmPassword: '',
          addresses: data.addresses || {}
        });
      })
      .catch(() => setProfile(null));
  }, [id, reset]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Mon profil</h1>
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Section Photo de Profil */}
          <div className="flex flex-col items-center mb-8">
            <PhotoUpload
              userId={id || ''}
              currentPhoto={defaultPhoto}
              onPhotoUpdate={handlePhotoUpdate}
            />

            <p className="text-sm text-gray-600 mt-2 text-center">
              Cliquez sur l'appareil photo pour changer votre photo de profil
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-gray-500" />
                Nom complet
              </label>
              <input
                type="text"
                {...register('name', { required: 'Le nom est requis' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom complet"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaEnvelope className="text-gray-500" />
                Email
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide'
                  }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaLock className="text-gray-500" />
                Nouveau mot de passe (optionnel)
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Laissez vide pour ne pas changer"
              />
            </div>

            {password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FaLock className="text-gray-500" />
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    validate: value => !password || value === password || 'Les mots de passe ne correspondent pas'
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirmez votre mot de passe"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}

            {/* Section Adresses - UX-Pro Simple */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-gray-500" />
                Mes adresses
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Configurez vos adresses principales pour les réservations
              </p>
              
              {/* Onglets d'adresses */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveAddress('home')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeAddress === 'home' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏠 Domicile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAddress('office')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeAddress === 'office' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏢 Bureau
                </button>
              </div>
              

              
              {isAddressSaved && savedAddresses[activeAddress] ? (
                // Affichage en dur des adresses sauvegardées
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Adresse sauvegardée</h4>
                    <button
                      type="button"
                      onClick={() => setIsAddressSaved(false)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Modifier l'adresse
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Numéro de rue:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].streetNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rue:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].street || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Code postal:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].postalCode || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ville:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].city || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Étage:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].floor || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Appartement:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].apartment || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Code d'entrée:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].buildingCode || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Informations complémentaires:</span>
                      <p className="font-medium">{savedAddresses[activeAddress].additionalInfo || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulaire d'édition des adresses
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de rue</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.streetNumber`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rue</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.street`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rue de la Paix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.postalCode`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="75001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.city`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Étage</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.floor`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2ème étage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appartement</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.apartment`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code d'entrée</label>
                    <input
                      type="text"
                      {...register(`addresses.${activeAddress}.buildingCode`)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Informations complémentaires</label>
                    <textarea
                      {...register(`addresses.${activeAddress}.additionalInfo`)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Instructions d'accès, interphone, etc."
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (navigator.geolocation) {
                      try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                          });
                        });
                        
                        // Reverse geocoding avec OpenStreetMap (gratuit)
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
                        );
                        const data = await response.json();
                        
                        if (data.address) {
                          // Auto-complétion directe des champs
                          const address = data.address;
                          setValue(`addresses.${activeAddress}.streetNumber`, address.house_number || '');
                          setValue(`addresses.${activeAddress}.street`, address.road || '');
                          setValue(`addresses.${activeAddress}.postalCode`, address.postcode || '');
                          setValue(`addresses.${activeAddress}.city`, address.city || address.town || address.village || '');
                          setValue(`addresses.${activeAddress}.additionalInfo`, `Géolocalisé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        }
                      } catch (error) {
                        console.error('Erreur géolocalisation:', error);
                        alert('Impossible de récupérer votre position. Vérifiez les permissions de localisation.');
                      }
                    } else {
                      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaMapPin />
                  Utiliser ma position actuelle
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaSave />
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage; 