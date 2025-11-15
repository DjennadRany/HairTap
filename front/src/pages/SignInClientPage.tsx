import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setUser, setToken } from '../store/slices/authSlice';
import { authService } from '../services/api/auth';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaBell, FaGlobe, FaCamera, FaTimes, FaCheck, FaCog } from 'react-icons/fa';
import StepIndicator from '../components/StepIndicator';
import StepNavigation from '../components/StepNavigation';
import AddressAutocomplete from '../components/AddressAutocomplete';

interface SignInData {
  // Étape 1: Informations de base
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Étape 2: Coordonnées et contact
  phone: string;
  bio: string;
  
  // Étape 3: Adresses détaillées
  addresses: {
    home: {
      street: string;
      streetNumber: string;
      city: string;
      postalCode: string;
      floor: string;
      apartment: string;
      buildingCode: string;
      additionalInfo: string;
    };
    office: {
      street: string;
      streetNumber: string;
      city: string;
      postalCode: string;
      floor: string;
      apartment: string;
      buildingCode: string;
      additionalInfo: string;
    };
  };
  
  // Étape 4: Préférences et photo
  photo: string;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
      updates: boolean;
    };
    language: 'fr' | 'en';
    theme: 'light' | 'dark';
    timezone: string;
    currency: 'EUR' | 'USD';
  };
}

const SignInClientPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  
  const [formData, setFormData] = useState<SignInData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    addresses: {
      home: {
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        floor: '',
        apartment: '',
        buildingCode: '',
        additionalInfo: ''
      },
      office: {
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        floor: '',
        apartment: '',
        buildingCode: '',
        additionalInfo: ''
      }
    },
    photo: '',
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
        marketing: false,
        updates: true
      },
      language: 'fr',
      theme: 'light',
      timezone: 'Europe/Paris',
      currency: 'EUR'
    }
  });

  // Vérification téléphone en temps réel
  useEffect(() => {
    const checkPhone = async () => {
      if (formData.phone && formData.phone.length >= 8) {
        setIsCheckingPhone(true);
        try {
          // Appel API pour vérifier si le téléphone existe
          const response = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(formData.phone)}`);
          const data = await response.json();
          setPhoneExists(data.exists);
        } catch (error) {
          console.error('Erreur vérification téléphone:', error);
          setPhoneExists(false); // En cas d'erreur, on laisse passer
        } finally {
          setIsCheckingPhone(false);
        }
      } else {
        setPhoneExists(false);
      }
    };

    const timeoutId = setTimeout(checkPhone, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.phone]);

  const handleInputChange = (field: keyof SignInData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleAddressChange = (type: 'home' | 'office', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: {
        ...prev.addresses,
        [type]: {
          ...prev.addresses[type],
          [field]: value
        }
      }
    }));
  };

  const handlePreferencesChange = (type: string, value: any) => {
    if (type === 'notifications') {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          notifications: {
            ...prev.preferences.notifications,
            ...value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [type]: value
        }
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Le nom est requis');
          return false;
        }
        if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
          setError('Email valide requis');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return false;
        }
        break;
        
      case 2:
        if (!formData.phone.trim()) {
          setError('Le numéro de téléphone est requis');
          return false;
        }
        if (phoneExists) {
          setError('Ce numéro de téléphone est déjà utilisé');
          return false;
        }
        if (isCheckingPhone) {
          setError('Vérification du téléphone en cours...');
          return false;
        }
        break;
        
      case 3:
        // Validation plus souple des adresses - au moins une adresse partiellement remplie
        const homeAddress = formData.addresses.home;
        const officeAddress = formData.addresses.office;
        
        const hasHomeData = homeAddress.street || homeAddress.city || homeAddress.postalCode;
        const hasOfficeData = officeAddress.street || officeAddress.city || officeAddress.postalCode;
        
        if (!hasHomeData && !hasOfficeData) {
          setError('Veuillez remplir au moins quelques informations d\'adresse');
          return false;
        }
        break;
        
      case 4:
        // Étape finale - pas de validation stricte
        break;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Préparer les données pour l'envoi (sans photo pour éviter l'erreur 413)
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        bio: formData.bio,
        addresses: formData.addresses,
        preferences: formData.preferences,
        role: 'user' as const // Rôle client
      };
      
      console.log('📤 Envoi des données:', submitData);
      
      // Appel à l'API d'inscription
      const response = await authService.register(submitData);
      
      if (response.token && response.user) {
        // Inscription réussie - conversion du rôle pour compatibilité
        const userForStore = {
          ...response.user,
          role: (response.user.role === 'user' ? 'client' : response.user.role) as 'client' | 'coiffeur'
        };
        
        dispatch(setUser(userForStore));
        dispatch(setToken(response.token));
        
        // Redirection vers la configuration de la photo
        navigate('/photo-setup');
      } else {
        setError('Erreur lors de l\'inscription');
      }
      
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      
      if (error.response?.status === 413) {
        setError('La photo est trop volumineuse. Veuillez choisir une image plus petite (max 2MB).');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Configuration des étapes pour le composant StepIndicator
  const steps = [
    { label: 'Informations', icon: <FaUser /> },
    { label: 'Contact', icon: <FaPhone /> },
    { label: 'Adresses', icon: <FaMapMarkerAlt /> },
    { label: 'Finalisation', icon: <FaCamera /> }
  ];

  // Éviter la boucle infinie avec useMemo
  const canProceedCurrentStep = useMemo(() => {
    return validateStep(currentStep);
  }, [currentStep, formData, phoneExists, isCheckingPhone]);

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Créer votre compte client
        </h2>
        <p className="text-gray-300">
          Commençons par vos informations de base
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <FaUser className="inline mr-2" />
            Nom complet
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300"
            placeholder="Votre nom complet"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <FaEnvelope className="inline mr-2" />
            Adresse email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300"
            placeholder="votre@email.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <FaLock className="inline mr-2" />
            Mot de passe
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300"
            placeholder="Minimum 8 caractères"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <FaLock className="inline mr-2" />
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300"
            placeholder="Retapez votre mot de passe"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Vos coordonnées
        </h2>
        <p className="text-gray-300">
          Comment pouvons-nous vous contacter ?
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <FaPhone className="inline mr-2" />
            Numéro de téléphone
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-4 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 ${
                phoneExists ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Votre numéro de téléphone"
            />
            {isCheckingPhone && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {phoneExists && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <FaTimes className="text-red-500 text-xl" />
              </div>
            )}
          </div>
          {phoneExists && (
            <div className="mt-2 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400 flex items-center">
                <FaTimes className="mr-2" />
                Ce numéro de téléphone est déjà utilisé. Veuillez utiliser un autre numéro ou vous connecter.
              </p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300 resize-none"
            placeholder="Parlez-nous un peu de vous..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Vos adresses
        </h2>
        <p className="text-gray-300">
          Configurez vos adresses principales
        </p>
      </div>
      
      <div className="space-y-8">
        {/* Adresse domicile */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-green-400" />
            Adresse domicile
          </h3>
          
          {/* Autocomplétion adresse domicile */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rechercher votre adresse
            </label>
            <AddressAutocomplete
              onAddressSelect={(address) => {
                handleAddressChange('home', 'streetNumber', address.streetNumber);
                handleAddressChange('home', 'street', address.street);
                handleAddressChange('home', 'city', address.city);
                handleAddressChange('home', 'postalCode', address.postalCode);
                // Mettre à jour les coordonnées
                if (address.coordinates) {
                  setFormData(prev => ({
                    ...prev,
                    addresses: {
                      ...prev.addresses,
                      home: {
                        ...prev.addresses.home,
                        coordinates: address.coordinates
                      }
                    }
                  }));
                }
              }}
              placeholder="Tapez votre adresse domicile..."
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de rue</label>
              <input
                type="text"
                value={formData.addresses.home.streetNumber}
                onChange={(e) => handleAddressChange('home', 'streetNumber', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rue</label>
              <input
                type="text"
                value={formData.addresses.home.street}
                onChange={(e) => handleAddressChange('home', 'street', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Rue de la Paix"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
              <input
                type="text"
                value={formData.addresses.home.city}
                onChange={(e) => handleAddressChange('home', 'city', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
              <input
                type="text"
                value={formData.addresses.home.postalCode}
                onChange={(e) => handleAddressChange('home', 'postalCode', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="75001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Étage</label>
              <input
                type="text"
                value={formData.addresses.home.floor}
                onChange={(e) => handleAddressChange('home', 'floor', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="2ème"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Appartement</label>
              <input
                type="text"
                value={formData.addresses.home.apartment}
                onChange={(e) => handleAddressChange('home', 'apartment', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Code bâtiment</label>
              <input
                type="text"
                value={formData.addresses.home.buildingCode}
                onChange={(e) => handleAddressChange('home', 'buildingCode', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Informations supplémentaires</label>
              <input
                type="text"
                value={formData.addresses.home.additionalInfo}
                onChange={(e) => handleAddressChange('home', 'additionalInfo', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Interphone, digicode..."
              />
            </div>
          </div>
        </div>

        {/* Adresse bureau */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-blue-400" />
            Adresse bureau (optionnel)
          </h3>
          
          {/* Autocomplétion adresse bureau */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rechercher votre adresse bureau
            </label>
            <AddressAutocomplete
              onAddressSelect={(address) => {
                handleAddressChange('office', 'streetNumber', address.streetNumber);
                handleAddressChange('office', 'street', address.street);
                handleAddressChange('office', 'city', address.city);
                handleAddressChange('office', 'postalCode', address.postalCode);
                // Mettre à jour les coordonnées
                if (address.coordinates) {
                  setFormData(prev => ({
                    ...prev,
                    addresses: {
                      ...prev.addresses,
                      office: {
                        ...prev.addresses.office,
                        coordinates: address.coordinates
                      }
                    }
                  }));
                }
              }}
              placeholder="Tapez votre adresse bureau..."
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de rue</label>
              <input
                type="text"
                value={formData.addresses.office.streetNumber}
                onChange={(e) => handleAddressChange('office', 'streetNumber', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rue</label>
              <input
                type="text"
                value={formData.addresses.office.street}
                onChange={(e) => handleAddressChange('office', 'street', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Avenue des Champs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
              <input
                type="text"
                value={formData.addresses.office.city}
                onChange={(e) => handleAddressChange('office', 'city', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Lyon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
              <input
                type="text"
                value={formData.addresses.office.postalCode}
                onChange={(e) => handleAddressChange('office', 'postalCode', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="69001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Étage</label>
              <input
                type="text"
                value={formData.addresses.office.floor}
                onChange={(e) => handleAddressChange('office', 'floor', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="1er"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bureau</label>
              <input
                type="text"
                value={formData.addresses.office.apartment}
                onChange={(e) => handleAddressChange('office', 'apartment', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Bureau 12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Code bâtiment</label>
              <input
                type="text"
                value={formData.addresses.office.buildingCode}
                onChange={(e) => handleAddressChange('office', 'buildingCode', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Informations supplémentaires</label>
              <input
                type="text"
                value={formData.addresses.office.additionalInfo}
                onChange={(e) => handleAddressChange('office', 'additionalInfo', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Réception, badge..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Finalisation
        </h2>
        <p className="text-gray-300">
          Dernières étapes pour personnaliser votre expérience
        </p>
      </div>
      
      <div className="space-y-8">
        {/* Message de finalisation */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaCheck className="mr-2 text-green-400" />
            Finalisation
          </h3>
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-green-600 flex items-center justify-center mb-4">
              <FaCheck className="text-4xl text-white" />
            </div>
            <p className="text-gray-300 mb-2">
              <strong>Votre compte est presque prêt !</strong>
            </p>
            <p className="text-sm text-gray-400">
              Cliquez sur "Créer mon compte" pour finaliser votre inscription. 
              Vous pourrez ajouter votre photo de profil après votre première connexion.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaBell className="mr-2 text-yellow-400" />
            Notifications
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.email}
                onChange={(e) => handlePreferencesChange('notifications', { email: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-gray-300">Notifications par email</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.sms}
                onChange={(e) => handlePreferencesChange('notifications', { sms: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-gray-300">Notifications par SMS</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.push}
                onChange={(e) => handlePreferencesChange('notifications', { push: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-gray-300">Notifications push</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.marketing}
                onChange={(e) => handlePreferencesChange('notifications', { marketing: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-gray-300">Marketing et promotions</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.updates}
                onChange={(e) => handlePreferencesChange('notifications', { updates: e.target.checked })}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-gray-300">Mises à jour de l'app</span>
            </label>
          </div>
        </div>

        {/* Paramètres personnalisés */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaCog className="mr-2 text-blue-400" />
            Paramètres personnalisés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Langue</label>
              <select
                value={formData.preferences.language}
                onChange={(e) => handlePreferencesChange('language', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Thème</label>
              <select
                value={formData.preferences.theme}
                onChange={(e) => handlePreferencesChange('theme', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fuseau horaire</label>
              <select
                value={formData.preferences.timezone}
                onChange={(e) => handlePreferencesChange('timezone', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Devise</label>
              <select
                value={formData.preferences.currency}
                onChange={(e) => handlePreferencesChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Autres préférences */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaGlobe className="mr-2 text-blue-400" />
            Autres préférences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Langue</label>
              <select
                value={formData.preferences.language}
                onChange={(e) => handlePreferencesChange('language', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Thème</label>
              <select
                value={formData.preferences.theme}
                onChange={(e) => handlePreferencesChange('theme', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fuseau horaire</label>
              <select
                value={formData.preferences.timezone}
                onChange={(e) => handlePreferencesChange('timezone', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Devise</label>
              <select
                value={formData.preferences.currency}
                onChange={(e) => handlePreferencesChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Indicateur de progression */}
        <StepIndicator 
          currentStep={currentStep}
          totalSteps={totalSteps}
          steps={steps}
        />
        
        {/* Formulaire */}
        <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-700">
          {renderCurrentStep()}
          
          {/* Navigation entre étapes */}
          <StepNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={prevStep}
            onNext={nextStep}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            canProceed={canProceedCurrentStep}
          />
          
          {/* Message d'erreur */}
          {error && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}
          
          {/* Lien de connexion */}
          <div className="text-center mt-6">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-white hover:text-green-400 transition-colors duration-300 underline"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInClientPage;
