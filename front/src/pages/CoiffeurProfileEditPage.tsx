import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';
import { userService } from '../services/api/users';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import RichTextEditor from '../components/RichTextEditor';
import ServiceManager from '../components/ServiceManager';
import PhotoUpload from '../components/PhotoUpload';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import type { User } from '../types/models';

const CoiffeurProfileEditPage = () => {
  const user = useSelector(selectCurrentUser) as User | null;
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string>('');
  const [photoSuccess, setPhotoSuccess] = useState<string>('');
  const [currentPhoto, setCurrentPhoto] = useState<string>(user?.photo || '');

  // États du formulaire
  const [bio, setBio] = useState(user?.bio || '');
  const [specialities, setSpecialities] = useState<string[]>(user?.specialities || []);
  const [workingMode, setWorkingMode] = useState<('salon' | 'domicile' | 'both')[]>(
    Array.isArray(user?.workingMode) ? user.workingMode as ('salon' | 'domicile' | 'both')[] : []
  );
  const [travelRadius, setTravelRadius] = useState(user?.travelRadius || 10);
  const [phone, setPhone] = useState(user?.phone || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');

  // Charger les données utilisateur depuis la base
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setSpecialities(user.specialities || []);
      setWorkingMode(Array.isArray(user.workingMode) ? user.workingMode as ('salon' | 'domicile' | 'both')[] : []);
      setTravelRadius(user.travelRadius || 10);
      setPhone(user.phone || '');
      setCurrentPhoto(user.photo || '');
    }
  }, [user]);

  if (!user || user.role !== 'coiffeur') {
    return <Navigate to="/login" replace />;
  }

  const handlePhotoUpdate = (newPhotoUrl: string) => {
    // Mettre à jour l'état local
    setCurrentPhoto(newPhotoUrl);
    setPhotoSuccess('Photo de profil mise à jour avec succès !');
    setTimeout(() => setPhotoSuccess(''), 3000);
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
        photo: currentPhoto // Inclure la photo mise à jour
      };

      await userService.updateUser(user._id, updatedProfile);
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
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
          <h1 className="text-3xl font-bold mb-2">Mon Profil & Services</h1>
          <p className="text-gray-600">
            Gérez votre profil et vos services pour attirer plus de clients
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-fashion-dark-gray text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mon Profil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'services'
                ? 'bg-fashion-dark-gray text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mes Services
          </button>
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

        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo de profil */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Photo de profil</h2>
              <div className="flex items-center gap-6">
                <PhotoUpload
                  userId={user._id}
                  currentPhoto={currentPhoto}
                  onPhotoUpdate={handlePhotoUpdate}
                  className="flex-shrink-0"
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

            {/* Contact */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations de contact</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
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
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-300 hover:bg-gray-400"
              >
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gestion des services</h2>
              <ServiceManager coiffeurId={user._id} isOwner={true} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoiffeurProfileEditPage; 