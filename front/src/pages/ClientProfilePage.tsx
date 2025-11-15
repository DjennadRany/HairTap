import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaMapMarkerAlt, FaMapPin, FaPhone, FaSave, FaStickyNote, FaUser } from 'react-icons/fa';

import SimplePhotoUpload from '../components/SimplePhotoUpload';
import AddressDisplay from '../components/AddressDisplay';
import AddressForm from '../components/AddressForm';
import ProfileInfoDisplay from '../components/ProfileInfoDisplay';
import PreferencesDisplay from '../components/PreferencesDisplay';
import PaymentMethodsList from '../components/PaymentMethodsList';
import AddPaymentMethodModal from '../components/modals/AddPaymentMethodModal';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser, setUser } from '../store/slices/authSlice';
import { userService } from '../services/api/users';
import { authService } from '../services/api/auth';

import type { User as UserModel } from '../types/models';
import { PHOTO_URLS } from '../config/api';

interface StatusMessage {
  type: 'success' | 'error';
  message: string;
}

interface AddressField {
  streetNumber?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  floor?: string;
  apartment?: string;
  buildingCode?: string;
  additionalInfo?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  addresses: {
    home: AddressField;
    office: AddressField;
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_ADDRESS: AddressField = {
  streetNumber: '',
  street: '',
  postalCode: '',
  city: '',
  floor: '',
  apartment: '',
  buildingCode: '',
  additionalInfo: ''
};

const buildAddress = (address?: AddressField): AddressField => ({
  streetNumber: address?.streetNumber ?? '',
  street: address?.street ?? '',
  postalCode: address?.postalCode ?? '',
  city: address?.city ?? '',
  floor: address?.floor ?? '',
  apartment: address?.apartment ?? '',
  buildingCode: address?.buildingCode ?? '',
  additionalInfo: address?.additionalInfo ?? '',
  coordinates: address?.coordinates
});

const mergeAddresses = (addresses?: UserModel['addresses']): ProfileFormData['addresses'] => ({
  home: buildAddress(addresses?.home),
  office: buildAddress(addresses?.office)
});

const hasAddressContent = (address: AddressField) => {
  const keys: (keyof AddressField)[] = [
    'streetNumber',
    'street',
    'postalCode',
    'city',
    'floor',
    'apartment',
    'buildingCode',
    'additionalInfo'
  ];

  return keys.some((key) => {
    const value = address[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
};

const sanitizeAddress = (address: AddressField): AddressField => {
  const sanitized: AddressField = {};
  const keys: (keyof AddressField)[] = [
    'streetNumber',
    'street',
    'postalCode',
    'city',
    'floor',
    'apartment',
    'buildingCode',
    'additionalInfo'
  ];

  keys.forEach((key) => {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) {
      sanitized[key] = value.trim();
    }
  });

  if (address.coordinates) {
    sanitized.coordinates = address.coordinates;
  }

  return sanitized;
};

const ClientProfilePage = () => {
  const dispatch = useAppDispatch();
  const { id: paramId } = useParams();
  const authUser = useAppSelector(selectCurrentUser);
  const userId = paramId || authUser?._id || '';

  const [profile, setProfile] = useState<UserModel | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [activeAddress, setActiveAddress] = useState<'home' | 'office'>('home');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting: isSavingProfile }
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      addresses: {
        home: { ...EMPTY_ADDRESS },
        office: { ...EMPTY_ADDRESS }
      }
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSavingPassword }
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (!userId) {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;
    setIsLoadingProfile(true);

    userService
      .getUser(userId)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        reset({
          name: data.name,
          email: data.email,
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          addresses: mergeAddresses(data.addresses)
        });
      })
      .catch((error) => {
        console.error('Erreur lors du chargement du profil:', error);
        if (isMounted) {
          setStatus({ type: 'error', message: 'Impossible de charger le profil utilisateur.' });
          setProfile(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId, reset]);

  const addressesFromProfile = useMemo(
    () => mergeAddresses(profile?.addresses),
    [profile?.addresses]
  );

  const handlePhotoUpdate = (photoUrl: string) => {
    setProfile((prev) => (prev ? { ...prev, photo: photoUrl } : prev));

    if (authUser) {
      dispatch(
        setUser({
          ...authUser,
          photo: photoUrl
        })
      );
    }

    setStatus({ type: 'success', message: 'Photo de profil mise à jour.' });
  };

  const handleProfileSubmit = async (values: ProfileFormData) => {
    if (!userId) {
      setStatus({ type: 'error', message: "Impossible de retrouver l'utilisateur." });
      return;
    }

    setStatus(null);

    try {
      const payload: Partial<UserModel> = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() ?? '',
        bio: values.bio?.trim() ?? ''
      };

      const home = sanitizeAddress(values.addresses.home);
      const office = sanitizeAddress(values.addresses.office);
      const addressesPayload: UserModel['addresses'] = {};

      if (Object.keys(home).length > 0) {
        addressesPayload.home = home;
      }
      if (Object.keys(office).length > 0) {
        addressesPayload.office = office;
      }

      payload.addresses = addressesPayload;

      const updatedUser = await userService.updateUser(userId, payload);

      setProfile(updatedUser);
      reset({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone ?? '',
        bio: updatedUser.bio ?? '',
        addresses: mergeAddresses(updatedUser.addresses)
      });

      const mappedRole: 'client' | 'coiffeur' | 'admin' =
        updatedUser.role === 'coiffeur' ? 'coiffeur' : updatedUser.role === 'admin' ? 'admin' : 'client';

      dispatch(
        setUser({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: mappedRole,
          photo: updatedUser.photo
        })
      );

      setIsEditingProfile(false);
      setIsEditingAddress(false);
      setIsEditingPreferences(false);
      setStatus({ type: 'success', message: 'Profil mis à jour avec succès.' });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      const apiMessage = error?.response?.data?.message;
      setStatus({ type: 'error', message: apiMessage || 'Erreur lors de la mise à jour du profil.' });
    }
  };

  const handlePasswordChange = async (values: PasswordFormData) => {
    if (values.newPassword !== values.confirmPassword) {
      setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setStatus(null);

    try {
      const response = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      setStatus({ type: 'success', message: response.message });
      resetPasswordForm();
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      const apiMessage = error?.response?.data?.message;
      setStatus({ type: 'error', message: apiMessage || 'Erreur lors du changement de mot de passe.' });
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setStatus({ type: 'error', message: 'La géolocalisation n\'est pas supportée par votre navigateur.' });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
      );
      const data = await response.json();

      if (data.address) {
        const address = data.address;
        setValue(`addresses.${activeAddress}.streetNumber`, address.house_number || '');
        setValue(`addresses.${activeAddress}.street`, address.road || '');
        setValue(`addresses.${activeAddress}.postalCode`, address.postcode || '');
        setValue(
          `addresses.${activeAddress}.city`,
          address.city || address.town || address.village || ''
        );
        setValue(
          `addresses.${activeAddress}.additionalInfo`,
          `Géolocalisé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        );

        setStatus({ type: 'success', message: 'Adresse détectée automatiquement.' });
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      setStatus({ type: 'error', message: 'Impossible de récupérer votre position.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      setStatus({ type: 'error', message: "Impossible de retrouver l'utilisateur." });
      return;
    }

    const confirmation = window.confirm(
      '⚠️ Cette action est irréversible. Souhaitez-vous vraiment supprimer votre compte TapHair ?'
    );

    if (!confirmation) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      setStatus({ type: 'success', message: 'Suppression du compte en cours…' });
      await userService.deleteUser(userId);
      setStatus({ type: 'success', message: 'Compte supprimé avec succès. Redirection…' });

      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      console.error('Erreur suppression compte:', error);
      const apiMessage = error?.response?.data?.message;
      setStatus({ type: 'error', message: apiMessage || 'Erreur lors de la suppression du compte.' });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center text-gray-600">
          Chargement du profil…
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center text-red-600">
          Impossible de charger le profil utilisateur.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Mon profil</h1>

        {status && (
          <div
            className={`rounded-md px-4 py-3 border ${
              status.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <SimplePhotoUpload
              userId={userId}
              currentPhoto={profile?.photo || authUser?.photo || PHOTO_URLS.DEFAULT_AVATAR}
              onPhotoUpdate={handlePhotoUpdate}
            />
            <p className="text-sm text-gray-600 mt-2 text-center">
              Cliquez sur l'appareil photo pour changer votre photo de profil
            </p>
          </div>

          <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-6">
            {!isEditingProfile ? (
              <ProfileInfoDisplay
                name={profile?.name || ''}
                email={profile?.email || ''}
                phone={profile?.phone}
                bio={profile?.bio}
                onEdit={() => setIsEditingProfile(true)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">📝 Modifier les informations</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                </div>

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
                    placeholder="vous@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaPhone className="text-gray-500" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre numéro de téléphone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaStickyNote className="text-gray-500" />
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    {...register('bio')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Parlez-nous un peu de vous"
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-gray-500" />
                Mes adresses
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Configurez vos adresses principales pour les réservations
              </p>

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

              {(() => {
                const hasData = hasAddressContent(addressesFromProfile[activeAddress]);

                if (!isEditingAddress && hasData) {
                  return (
                    <AddressDisplay
                      addressType={activeAddress}
                      address={addressesFromProfile[activeAddress]}
                      onEdit={() => setIsEditingAddress(true)}
                    />
                  );
                }

                return (
                  <AddressForm
                    addressType={activeAddress}
                    register={register}
                    onView={() => setIsEditingAddress(false)}
                    hasExistingData={hasData}
                  />
                );
              })()}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaMapPin />
                  Utiliser ma position actuelle
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <PaymentMethodsList
                onAddPaymentMethod={() => setShowAddPaymentMethodModal(true)}
                showAddButton
              />
            </div>

            {profile?.preferences && (
              <div className="border-t pt-6">
                {!isEditingPreferences ? (
                  <PreferencesDisplay
                    preferences={profile.preferences}
                    onEdit={() => setIsEditingPreferences(true)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">⚙️ Modifier les préférences</h3>
                      <button
                        type="button"
                        onClick={() => setIsEditingPreferences(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                    <p className="text-gray-600">
                      Formulaire d'édition des préférences à implémenter.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaSave />
                {isSavingProfile ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </div>

            <AddPaymentMethodModal
              isOpen={showAddPaymentMethodModal}
              onClose={() => setShowAddPaymentMethodModal(false)}
              onSuccess={() => {
                setShowAddPaymentMethodModal(false);
                setStatus({ type: 'success', message: 'Carte ajoutée avec succès !' });
              }}
            />

            <div className="pt-6 border-t border-red-200">
              <div className="bg-red-50 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-red-800">⚠️ Zone dangereuse</h3>
                <p className="text-red-700 text-sm">
                  La suppression de votre compte est irréversible. Toutes vos données et réservations seront définitivement supprimées.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  🗑️ {isDeletingAccount ? 'Suppression en cours…' : 'Supprimer mon compte'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaLock className="text-gray-500" />
            Sécurité du compte
          </h2>
          <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
              <input
                type="password"
                {...registerPassword('currentPassword', { required: 'Mot de passe actuel requis' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mot de passe actuel"
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                {...registerPassword('newPassword', {
                  required: 'Nouveau mot de passe requis',
                  minLength: {
                    value: 8,
                    message: 'Le mot de passe doit contenir au moins 8 caractères'
                  }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nouveau mot de passe"
              />
              {passwordErrors.newPassword && (
                <p className="text-red-600 text-sm mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                {...registerPassword('confirmPassword', { required: 'Confirmation requise' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirmez le nouveau mot de passe"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingPassword ? 'Mise à jour…' : 'Mettre à jour mon mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
