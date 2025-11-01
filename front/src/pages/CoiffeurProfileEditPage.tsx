import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setUser } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';
import { userService } from '../services/api/users';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import RichTextEditor from '../components/RichTextEditor';
import SimplePhotoUpload from '../components/SimplePhotoUpload';
import CoiffeurInfoDisplay from '../components/CoiffeurInfoDisplay';
import { FaCamera, FaSpinner, FaBriefcase, FaGraduationCap, FaMapMarkerAlt } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import type { User } from '../types/models';

const CoiffeurProfileEditPage = () => {
  const user = useSelector(selectCurrentUser) as User | null;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string>('');
  const [photoSuccess, setPhotoSuccess] = useState<string>('');
  const [currentPhoto, setCurrentPhoto] = useState<string>(user?.photo || '');
  
  // NOUVEAU : État pour les données complètes du profil
  const [profileData, setProfileData] = useState<User | null>(null);

  // États du formulaire
  const [bio, setBio] = useState('');
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [workingMode, setWorkingMode] = useState<('salon' | 'domicile' | 'both')[]>([]);
  const [travelRadius, setTravelRadius] = useState(10);
  const [phone, setPhone] = useState('');
  const [siren, setSiren] = useState('');
  const [experience, setExperience] = useState(0);
  const [formation, setFormation] = useState('');
  const [rib, setRib] = useState('');
  const [salonAddress, setSalonAddress] = useState({
    street: '',
    streetNumber: '',
    city: '',
    postalCode: '',
    phone: '',
    coordinates: null as { lat: number; lng: number } | null
  });
  const [isSalonAddressSaved, setIsSalonAddressSaved] = useState(false);
  const [savedSalonAddress, setSavedSalonAddress] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'profile'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // NOUVEAU : Charger les données complètes depuis la base de données
  useEffect(() => {
    const loadProfileData = async () => {
      if (user?._id) {
        try {
          console.log('🔄 Chargement des données complètes du profil...');
          const fullProfileData = await userService.getUser(user._id);
          console.log('✅ Données complètes reçues:', fullProfileData);
          
          setProfileData(fullProfileData);
          
          // Initialiser tous les états avec les données complètes
          setBio(fullProfileData.bio || '');
          setSpecialities(fullProfileData.specialities || []);
          setWorkingMode(Array.isArray(fullProfileData.workingMode) ? fullProfileData.workingMode : []);
          setTravelRadius(fullProfileData.travelRadius || 10);
          setPhone(fullProfileData.phone || '');
          setSiren(fullProfileData.siren || '');
          setExperience(fullProfileData.experience || 0);
          setFormation(fullProfileData.formation || '');
          setRib(fullProfileData.rib || '');
          setSalonAddress({
            street: fullProfileData.salonAddress?.street || '',
            streetNumber: fullProfileData.salonAddress?.streetNumber || '',
            city: fullProfileData.salonAddress?.city || '',
            postalCode: fullProfileData.salonAddress?.postalCode || '',
            phone: fullProfileData.salonAddress?.phone || '',
            coordinates: fullProfileData.salonAddress?.coordinates || null
          });
          
          // Initialiser l'état de sauvegarde de l'adresse
          if (fullProfileData.salonAddress?.street) {
            setSavedSalonAddress(fullProfileData.salonAddress);
            setIsSalonAddressSaved(true);
          }
          
          setCurrentPhoto(fullProfileData.photo || '');
          
        } catch (error) {
          console.error('❌ Erreur lors du chargement du profil:', error);
          setErrorMessage('Erreur lors du chargement du profil');
        }
      }
    };

    loadProfileData();
  }, [user?._id]);

  // NOUVEAU : Fonction pour construire l'URL complète de la photo
  const getFullPhotoUrl = (photoUrl: string) => {
    if (!photoUrl) return '';
    return photoUrl.startsWith('http') 
      ? photoUrl 
      : `http://localhost:5000${photoUrl}`;
  };

  if (!user || user.role !== 'coiffeur') {
    return <Navigate to="/login" replace />;
  }

  // Afficher un indicateur de chargement pendant le chargement des données
  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const handlePhotoUpdate = (newPhotoUrl: string) => {
    console.log('🖼️ [CoiffeurProfileEditPage] handlePhotoUpdate appelé avec:', newPhotoUrl);
    
    // Mettre à jour l'état local
    setCurrentPhoto(newPhotoUrl);
    setPhotoSuccess('Photo de profil mise à jour avec succès !');
    setTimeout(() => setPhotoSuccess(''), 3000);
    
    // NOUVEAU : Mettre à jour le state global comme dans ClientProfilePage
    if (user) {
      let mappedRole: 'client' | 'coiffeur' = 'client';
      if (user.role === 'coiffeur') mappedRole = 'coiffeur';
      
      console.log('🔄 [CoiffeurProfileEditPage] Mise à jour du state global avec photo:', newPhotoUrl);
      dispatch(setUser({
        ...user,
        role: mappedRole,
        photo: newPhotoUrl
      }));
    }
    
    // NOUVEAU : Rafraîchir les données du profil comme dans ClientProfilePage
    if (user?._id) {
      console.log('🔄 [CoiffeurProfileEditPage] Rafraîchissement du profil pour ID:', user._id);
      userService.getUser(user._id).then((fullProfileData) => {
        setProfileData(fullProfileData);
        setCurrentPhoto(fullProfileData.photo || '');
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const updatedProfile = {
        bio,
        specialities,
        workingMode,
        travelRadius,
        phone,
        siren,
        experience,
        formation,
        rib,
        salonAddress: {
          ...salonAddress,
          coordinates: salonAddress.coordinates || undefined
        },
        photo: currentPhoto // Inclure la photo mise à jour
      };

      await userService.updateUser(user._id, updatedProfile);
      
      // Marquer l'adresse comme sauvegardée si elle existe
      if (salonAddress.street) {
        setSavedSalonAddress(salonAddress);
        setIsSalonAddressSaved(true);
      }
      
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const addSpeciality = () => {
    const newSpeciality = prompt('Ajouter une spécialité :');
    if (newSpeciality && newSpeciality.trim()) {
      setSpecialities(prev => [...prev, newSpeciality.trim()]);
    }
  };

  const removeSpeciality = (index: number) => {
    setSpecialities(prev => prev.filter((_, i) => i !== index));
  };

  const toggleWorkingMode = (mode: 'salon' | 'domicile' | 'both') => {
    setWorkingMode(prev => {
      if (prev.includes(mode)) {
        return prev.filter(m => m !== mode);
      } else {
        return [...prev, mode];
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
          <p className="text-gray-600">
            Gérez votre profil pour attirer plus de clients
          </p>
        </div>



        {/* Messages */}
        {successMessage && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <p className="text-green-800">{successMessage}</p>
          </Card>
        )}

        {errorMessage && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-800">{errorMessage}</p>
          </Card>
        )}

        {/* Photo de profil */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Photo de profil</h2>
          <div className="flex items-center gap-6">
            <SimplePhotoUpload
              userId={user._id}
              currentPhoto={getFullPhotoUrl(currentPhoto)}
              onPhotoUpdate={handlePhotoUpdate}
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Photo de profil</h3>
              <p className="text-sm text-gray-600">
                Cette photo apparaîtra dans votre profil et dans les cartes de recherche.
                Utilisez une photo claire et professionnelle.
              </p>
              {photoError && (
                <p className="text-red-600 text-sm mt-2">{photoError}</p>
              )}
              {photoSuccess && (
                <p className="text-green-600 text-sm mt-2">{photoSuccess}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Informations du profil - Mode lecture ou édition */}
        {!isEditingProfile ? (
          <CoiffeurInfoDisplay
            name={profileData?.name || user?.name || ''}
            email={profileData?.email || user?.email || ''}
            phone={profileData?.phone}
            bio={profileData?.bio}
            siren={profileData?.siren}
            sirenStatus={profileData?.sirenStatus}
            experience={profileData?.experience}
            formation={profileData?.formation}
            rib={profileData?.rib}
            workingMode={profileData?.workingMode}
            travelRadius={profileData?.travelRadius}
            specialities={profileData?.specialities}
            salonAddress={profileData?.salonAddress}
            onEdit={() => setIsEditingProfile(true)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Bio avec Rich Text Editor */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">À propos de vous</h2>
              <RichTextEditor
                value={bio}
                onChange={setBio}
                placeholder="Décrivez votre expérience, vos spécialités, votre approche..."
                maxLength={500}
              />
            </Card>

            {/* Spécialités */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Spécialités</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {specialities.map((speciality, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full flex items-center gap-2"
                    >
                      {speciality}
                      <button
                        type="button"
                        onClick={() => removeSpeciality(index)}
                        className="text-accent hover:text-accent/80"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={addSpeciality}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  + Ajouter une spécialité
                </Button>
              </div>
            </Card>

            {/* Mode de travail */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Mode de travail</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={workingMode.includes('salon')}
                      onChange={() => toggleWorkingMode('salon')}
                      className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <span>Salon</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={workingMode.includes('domicile')}
                      onChange={() => toggleWorkingMode('domicile')}
                      className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <span>Domicile</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={workingMode.includes('both')}
                      onChange={() => toggleWorkingMode('both')}
                      className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <span>Les deux</span>
                  </label>
                </div>
              </div>
            </Card>

            {/* Rayon de déplacement */}
            {workingMode.includes('domicile') && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Rayon de déplacement</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance maximale (km)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={travelRadius}
                      onChange={(e) => setTravelRadius(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>1 km</span>
                      <span>{travelRadius} km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Informations professionnelles */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaBriefcase className="text-accent" />
                Informations professionnelles
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIREN
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={siren}
                      onChange={(e) => setSiren(e.target.value)}
                      placeholder="123456789"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    {user.sirenStatus === 'verified' && (
                      <MdVerified className="text-blue-500 text-xl" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experience}
                    onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formation
                  </label>
                  <input
                    type="text"
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    placeholder="CAP Coiffure, Brevet Professionnel..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RIB (Relevé d'Identité Bancaire)
                  </label>
                  <input
                    type="text"
                    value={rib}
                    onChange={(e) => setRib(e.target.value)}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Format: FR76 + 23 caractères (lettres et chiffres)
                  </p>
                </div>
              </div>
            </Card>

            {/* Adresse de salon - Système utilisateur adapté */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-accent" />
                Adresse du salon
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Configurez l'adresse de votre salon pour les clients
              </p>
              
              {isSalonAddressSaved && salonAddress.street ? (
                // Affichage en dur de l'adresse sauvegardée
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Adresse du salon sauvegardée</h4>
                    <button
                      type="button"
                      onClick={() => setIsSalonAddressSaved(false)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Modifier l'adresse
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Numéro de rue:</span>
                      <p className="font-medium">{salonAddress.streetNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rue:</span>
                      <p className="font-medium">{salonAddress.street || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Code postal:</span>
                      <p className="font-medium">{salonAddress.postalCode || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ville:</span>
                      <p className="font-medium">{salonAddress.city || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Téléphone:</span>
                      <p className="font-medium">{salonAddress.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Coordonnées:</span>
                      <p className="font-medium">
                        {salonAddress.coordinates?.lat && salonAddress.coordinates?.lng 
                          ? `${salonAddress.coordinates.lat.toFixed(6)}, ${salonAddress.coordinates.lng.toFixed(6)}`
                          : 'Non géolocalisé'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulaire d'édition de l'adresse
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de rue</label>
                    <input
                      type="text"
                      value={salonAddress.streetNumber}
                      onChange={(e) => setSalonAddress(prev => ({ ...prev, streetNumber: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rue *</label>
                    <input
                      type="text"
                      value={salonAddress.street}
                      onChange={(e) => setSalonAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rue de la Paix"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code postal *</label>
                    <input
                      type="text"
                      value={salonAddress.postalCode}
                      onChange={(e) => setSalonAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="75001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                    <input
                      type="text"
                      value={salonAddress.city}
                      onChange={(e) => setSalonAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paris"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone du salon</label>
                    <input
                      type="tel"
                      value={salonAddress.phone}
                      onChange={(e) => setSalonAddress(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  
                  {/* Géolocalisation automatique */}
                  <div className="md:col-span-2">
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
                              setSalonAddress(prev => ({
                                ...prev,
                                streetNumber: address.house_number || '',
                                street: address.road || '',
                                postalCode: address.postcode || '',
                                city: address.city || address.town || address.village || '',
                                coordinates: { lat: latitude, lng: longitude }
                              }));
                            }
                          } catch (error) {
                            console.error('Erreur géolocalisation:', error);
                          }
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      📍 Géolocaliser automatiquement
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Contact */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations de contact</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone personnel
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Votre numéro de téléphone"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                {loading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  // Réinitialiser les valeurs
                  setBio(user.bio || '');
                  setSpecialities(user.specialities || []);
                  setWorkingMode(Array.isArray(user.workingMode) ? user.workingMode as ('salon' | 'domicile' | 'both')[] : []);
                  setTravelRadius(user.travelRadius || 10);
                  setPhone(user.phone || '');
                  setSiren(user.siren || '');
                  setExperience(user.experience || 0);
                  setFormation(user.formation || '');
                  setRib(user.rib || '');
                  setSalonAddress({
                    street: user.salonAddress?.street || '',
                    streetNumber: user.salonAddress?.streetNumber || '',
                    city: user.salonAddress?.city || '',
                    postalCode: user.salonAddress?.postalCode || '',
                    phone: user.salonAddress?.phone || '',
                    coordinates: user.salonAddress?.coordinates || null
                  });
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400"
              >
                Annuler
              </Button>
            </div>

            {/* Section Suppression de compte */}
            <div className="pt-6 border-t border-red-200">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Zone dangereuse</h3>
                <p className="text-red-700 text-sm mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données, services, réservations et informations seront définitivement supprimés.
                </p>
                <Button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('⚠️ ATTENTION : Cette action est irréversible !\n\nÊtes-vous absolument sûr de vouloir supprimer votre compte ?\n\nToutes vos données seront définitivement perdues.')) {
                      try {
                        console.log('🔍 DEBUG: Début de la suppression de compte');
                        console.log('👤 User object:', user);
                        console.log('🆔 User ID:', user?._id);
                        
                        if (!user?._id) {
                          console.error('❌ DEBUG: Pas d\'ID utilisateur');
                          setErrorMessage("Impossible de retrouver l'utilisateur.");
                          return;
                        }
                        
                        console.log('✅ DEBUG: ID utilisateur trouvé, début de la suppression...');
                        setErrorMessage('');
                        setSuccessMessage('Suppression du compte en cours...');
                        
                        // Supprimer le compte
                        console.log('📡 DEBUG: Appel de userService.deleteUser avec ID:', user._id);
                        const result = await userService.deleteUser(user._id);
                        console.log('✅ DEBUG: Résultat de la suppression:', result);
                        
                        setSuccessMessage('Compte supprimé avec succès. Redirection...');
                        
                        // Rediriger vers logout après 2 secondes
                        setTimeout(() => {
                          console.log('🔄 DEBUG: Redirection vers logout...');
                          // Déconnexion et redirection
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          window.location.href = '/';
                        }, 2000);
                        
                      } catch (error: any) {
                        console.error('❌ DEBUG: Erreur lors de la suppression:', error);
                        console.error('❌ DEBUG: Détails de l\'erreur:', {
                          message: error.message,
                          response: error.response?.data,
                          status: error.response?.status
                        });
                        setErrorMessage(error.response?.data?.message || 'Erreur lors de la suppression du compte');
                        setSuccessMessage('');
                      }
                    }
                  }}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  🗑️ Supprimer mon compte
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CoiffeurProfileEditPage; 