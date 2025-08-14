import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '../store/slices/authSlice';
import { authService } from '../services/api/auth';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaBell, FaGlobe, FaCamera, FaTimes, FaCheck, FaCog, FaCut, FaGraduationCap, FaStar, FaClock, FaCar, FaBuilding, FaEuroSign, FaEye, FaEyeSlash } from 'react-icons/fa';
import StepIndicator from '../components/StepIndicator';
import StepNavigation from '../components/StepNavigation';
import AddressAutocomplete from '../components/AddressAutocomplete';

interface SignInCoiffeurData {
  // Étape 1: Informations de base
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Étape 2: Informations professionnelles
  phone: string;
  siren: string;
  experience: number;
  formation: string;
  bio: string;
  
  // Étape 3: Spécialités et mode de travail
  specialities: string[];
  workingMode: ('salon' | 'domicile')[];
  travelRadius: number;
  
  // Étape 4: Adresses
  personalAddress: {
    street: string;
    streetNumber: string;
    city: string;
    postalCode: string;
    floor: string;
    apartment: string;
    buildingCode: string;
    additionalInfo: string;
    coordinates: { lat: number; lng: number } | null;
  };
  salonAddress: {
    street: string;
    streetNumber: string;
    city: string;
    postalCode: string;
    floor: string;
    apartment: string;
    buildingCode: string;
    additionalInfo: string;
    phone: string;
    coordinates: { lat: number; lng: number } | null;
  };
  
  // Étape 5: Finalisation
  photo: string;
  workingHours: {
    monday: { start: string; end: string; isAvailable: boolean };
    tuesday: { start: string; end: string; isAvailable: boolean };
    wednesday: { start: string; end: string; isAvailable: boolean };
    thursday: { start: string; end: string; isAvailable: boolean };
    friday: { start: string; end: string; isAvailable: boolean };
    saturday: { start: string; end: string; isAvailable: boolean };
    sunday: { start: string; end: string; isAvailable: boolean };
  };
  services: Array<{
    name: string;
    description: string;
    duration: number;
    priceHT: number;
    tags: string[];
  }>;
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

const SignInCoiffeurPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingSiren, setIsCheckingSiren] = useState(false);
  const [sirenExists, setSirenExists] = useState(false);
  
  const [formData, setFormData] = useState<SignInCoiffeurData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    siren: '',
    experience: 0,
    formation: '',
    bio: '',
    specialities: [],
    workingMode: ['salon'],
    travelRadius: 15,
    personalAddress: {
      street: '',
      streetNumber: '',
      city: '',
      postalCode: '',
      floor: '',
      apartment: '',
      buildingCode: '',
      additionalInfo: '',
      coordinates: null
    },
    salonAddress: {
      street: '',
      streetNumber: '',
      city: '',
      postalCode: '',
      floor: '',
      apartment: '',
      buildingCode: '',
      additionalInfo: '',
      phone: '',
      coordinates: null
    },
    photo: '',
    workingHours: {
      monday: { start: '09:00', end: '18:00', isAvailable: true },
      tuesday: { start: '09:00', end: '18:00', isAvailable: true },
      wednesday: { start: '09:00', end: '18:00', isAvailable: true },
      thursday: { start: '09:00', end: '18:00', isAvailable: true },
      friday: { start: '09:00', end: '18:00', isAvailable: true },
      saturday: { start: '09:00', end: '17:00', isAvailable: true },
      sunday: { start: '10:00', end: '16:00', isAvailable: false }
    },
    services: [
      {
        name: 'Coupe homme',
        description: 'Coupe classique ou moderne',
        duration: 30,
        priceHT: 25,
        tags: ['coupe', 'homme']
      },
      {
        name: 'Coupe femme',
        description: 'Coupe et brushing',
        duration: 60,
        priceHT: 45,
        tags: ['coupe', 'femme', 'brushing']
      }
    ],
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

  // Étapes pour le progress bar
  const steps = [
    { label: 'Informations de base', icon: <FaUser className="text-gray-800" /> },
    { label: 'Informations professionnelles', icon: <FaGraduationCap className="text-gray-800" /> },
    { label: 'Spécialités & Mode de travail', icon: <FaCut className="text-gray-800" /> },
    { label: 'Adresse du salon', icon: <FaBuilding className="text-gray-800" /> },
    { label: 'Finalisation', icon: <FaCheck className="text-gray-800" /> }
  ];

  // Vérification téléphone en temps réel
  useEffect(() => {
    const checkPhone = async () => {
      if (formData.phone && formData.phone.length >= 8) {
        setIsCheckingPhone(true);
        try {
          const response = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(formData.phone)}`);
          const data = await response.json();
          setPhoneExists(data.exists);
        } catch (error) {
          console.error('Erreur vérification téléphone:', error);
          setPhoneExists(false);
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

  // Vérification email en temps réel (étape 1, contrôle strict)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkEmail = async () => {
      if (formData.email && /^\S+@\S+\.\S+$/.test(formData.email)) {
        // Éviter les appels multiples
        if (isCheckingEmail) return;
        
        setIsCheckingEmail(true);
        try {
          const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email)}`);
          const data = await response.json();
          
          // Mettre à jour l'état directement
          setEmailExists(data.exists);
          if (data.exists) {
            setError('Cet email est déjà utilisé');
          } else {
            setError(null);
          }
        } catch (error) {
          console.error('Erreur vérification email:', error);
          setEmailExists(false);
          setError(null);
        } finally {
          setIsCheckingEmail(false);
        }
      } else {
        setEmailExists(false);
        setError(null);
      }
    };

    timeoutId = setTimeout(checkEmail, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.email, isCheckingEmail]);

  // SUPPRIMÉ : Nettoyage automatique qui cause des problèmes

  // Vérification SIREN en temps réel
  useEffect(() => {
    const checkSiren = async () => {
      if (formData.siren && formData.siren.length === 9) {
        setIsCheckingSiren(true);
        try {
          const response = await fetch(`/api/auth/check-siren?siren=${encodeURIComponent(formData.siren)}`);
          const data = await response.json();
          setSirenExists(data.exists);
        } catch (error) {
          console.error('Erreur vérification SIREN:', error);
          setSirenExists(false);
        } finally {
          setIsCheckingSiren(false);
        }
      } else {
        setSirenExists(false);
      }
    };

    const timeoutId = setTimeout(checkSiren, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.siren]);

  const handleInputChange = (field: keyof SignInCoiffeurData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Si on change l'email, réinitialiser l'état de vérification
    if (field === 'email') {
      setEmailExists(false);
      setError(null);
    } else {
      // Effacer les erreurs quand on change un champ
      setError(null);
    }
  };

  const handlePersonalAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalAddress: {
        ...prev.personalAddress,
        [field]: value
      }
    }));
  };

  const handleSalonAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      salonAddress: {
        ...prev.salonAddress,
        [field]: value
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
    // SUPPRIMÉ : setError(null) qui interfère avec la vérification email
    
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
        // SUPPRIMÉ : Contrôle email - cause de problèmes
        if (formData.password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères');
          return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          setError('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return false;
        }
        break;
        
      case 2:
        if (!formData.phone.trim()) {
          setError('Le téléphone est requis');
          return false;
        }
        if (phoneExists) {
          setError('Ce numéro de téléphone est déjà utilisé');
          return false;
        }
        if (!formData.siren.trim() || formData.siren.length !== 9) {
          setError('Le SIREN doit contenir 9 chiffres');
          return false;
        }
        if (sirenExists) {
          setError('Ce SIREN est déjà utilisé');
          return false;
        }
        if (formData.experience < 0) {
          setError('L\'expérience doit être positive');
          return false;
        }
        break;
        
      case 3:
        if (formData.specialities.length === 0) {
          setError('Au moins une spécialité est requise');
          return false;
        }
        if (formData.workingMode.length === 0) {
          setError('Au moins un mode de travail est requis');
          return false;
        }
        if (formData.workingMode.includes('domicile') && formData.travelRadius <= 0) {
          setError('Le rayon de déplacement est requis pour le mode domicile');
          return false;
        }
        break;
        
      case 4:
        if (!formData.salonAddress.street.trim()) {
          setError('L\'adresse du salon est requise');
          return false;
        }
        if (!formData.salonAddress.city.trim()) {
          setError('La ville du salon est requise');
          return false;
        }
        if (!formData.salonAddress.postalCode.trim()) {
          setError('Le code postal du salon est requis');
          return false;
        }
        break;
        
      case 5:
        // Validation optionnelle pour la finalisation
        break;
    }
    
    return true;
  };

  const canProceedCurrentStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && 
               formData.email.trim() && 
               /^\S+@\S+\.\S+$/.test(formData.email) &&
               !emailExists &&
               formData.password.length >= 8 && 
               formData.password === formData.confirmPassword;
      case 2:
        return formData.phone.trim() && 
               !phoneExists &&
               formData.siren.trim() && 
               formData.siren.length === 9 &&
               !sirenExists &&
               formData.experience >= 0;
      case 3:
        return formData.specialities.length > 0 && 
               formData.workingMode.length > 0;
      case 4:
        return formData.salonAddress.street.trim() && 
               formData.salonAddress.city.trim() && 
               formData.salonAddress.postalCode.trim();
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData, emailExists, phoneExists, sirenExists]);

  const nextStep = () => {
    if (validateStep(currentStep) && canProceedCurrentStep) {
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
             // Préparer les données pour l'API
       const registrationData = {
         name: formData.name,
         email: formData.email,
         password: formData.password,
         phone: formData.phone,
         role: 'coiffeur' as const,
         siren: formData.siren,
         sirenStatus: 'pending',
         experience: formData.experience,
         formation: formData.formation,
         bio: formData.bio,
         specialities: formData.specialities,
         workingMode: formData.workingMode,
         travelRadius: formData.travelRadius,
         salonAddress: formData.salonAddress,
         workingHours: formData.workingHours,
         services: formData.services,
         preferences: formData.preferences
       };

      const response = await authService.register(registrationData);
      
      if (response.token) {
        dispatch(setToken(response.token));
        // Convertir le rôle 'user' en 'coiffeur' pour la compatibilité
        const userWithCorrectRole = {
          ...response.user,
          role: 'coiffeur' as const
        };
        dispatch(setUser(userWithCorrectRole));
        navigate('/coiffeur/profile');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 1: Informations de base
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Informations de base</h2>
        <p className="text-gray-600">Créez votre compte coiffeur en quelques étapes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaUser className="mr-2 text-gray-500" />
            Nom complet *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            placeholder="Votre nom complet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaEnvelope className="mr-2 text-gray-500" />
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaLock className="mr-2 text-gray-500" />
            Mot de passe *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              placeholder="Minimum 8 caractères"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* Indicateur de force du mot de passe */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => {
                  let color = 'bg-gray-200';
                  let isActive = false;
                  
                  // Niveau 1: Rouge pour toutes les barres si au moins 1 caractère
                  if (formData.password.length >= 1 && level <= 1) {
                    color = 'bg-red-500';
                    isActive = true;
                  }
                  // Niveau 2: Orange pour les 2 premières barres si au moins 8 caractères
                  if (formData.password.length >= 8 && level <= 2) {
                    color = 'bg-orange-500';
                    isActive = true;
                  }
                  // Niveau 3: Jaune pour les 3 premières barres si complexité moyenne
                  if (formData.password.length >= 10 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) && level <= 3) {
                    color = 'bg-yellow-500';
                    isActive = true;
                  }
                  // Niveau 4: Vert pour toutes les barres si complexité forte
                  if (formData.password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password) && level <= 4) {
                    color = 'bg-green-500';
                    isActive = true;
                  }
                  
                  return (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                        isActive ? color : 'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.password.length < 1 && 'Commencez à taper'}
                {formData.password.length >= 1 && formData.password.length < 8 && 'Trop court'}
                {formData.password.length >= 8 && formData.password.length < 10 && 'Faible'}
                {formData.password.length >= 10 && formData.password.length < 12 && 'Moyen'}
                {formData.password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password) && 'Fort'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaLock className="mr-2 text-gray-500" />
            Confirmer le mot de passe *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              placeholder="Répétez votre mot de passe"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* Indicateur de correspondance */}
          {formData.confirmPassword && (
            <div className="mt-2">
              <p className={`text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {formData.password === formData.confirmPassword ? '✓ Mots de passe identiques' : '✗ Mots de passe différents'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Étape 2: Informations professionnelles
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Informations professionnelles</h2>
        <p className="text-gray-600">Vos informations professionnelles et légales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaPhone className="mr-2 text-gray-500" />
            Téléphone *
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all ${
                phoneExists ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="06 12 34 56 78"
            />
            {isCheckingPhone && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              </div>
            )}
            {phoneExists && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaTimes className="text-red-500" />
              </div>
            )}
          </div>
          {phoneExists && (
            <p className="text-red-500 text-sm mt-1">Ce numéro est déjà utilisé</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaBuilding className="mr-2 text-gray-500" />
            SIREN *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.siren}
              onChange={(e) => handleInputChange('siren', e.target.value.replace(/\D/g, ''))}
              className={`w-full px-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all ${
                sirenExists ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123456789"
              maxLength={9}
            />
            {isCheckingSiren && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              </div>
            )}
            {sirenExists && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaTimes className="text-red-500" />
              </div>
            )}
          </div>
          {sirenExists && (
            <p className="text-red-500 text-sm mt-1">Ce SIREN est déjà utilisé</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaStar className="mr-2 text-gray-500" />
            Années d'expérience *
          </label>
          <input
            type="number"
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            placeholder="5"
            min="0"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaGraduationCap className="mr-2 text-gray-500" />
            Formation
          </label>
          <input
            type="text"
            value={formData.formation}
            onChange={(e) => handleInputChange('formation', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            placeholder="CAP Coiffure, Brevet Professionnel..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio professionnelle
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
          rows={4}
          placeholder="Présentez-vous et vos spécialités..."
        />
      </div>
    </div>
  );

  // Étape 3: Spécialités et mode de travail
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Spécialités & Mode de travail</h2>
        <p className="text-gray-600">Définissez vos spécialités et votre mode de travail</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Vos spécialités *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Coupe moderne', 'Coloration', 'Lissage', 'Permanente', 'Extensions',
            'Coiffures de mariage', 'Barbier', 'Coiffure homme', 'Coiffure femme',
            'Mèches', 'Balayage', 'Lissage brésilien', 'Défrisage', 'Tresses'
          ].map((speciality) => (
            <label key={speciality} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.specialities.includes(speciality)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleInputChange('specialities', [...formData.specialities, speciality]);
                  } else {
                    handleInputChange('specialities', formData.specialities.filter(s => s !== speciality));
                  }
                }}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700">{speciality}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Mode de travail *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'salon', label: 'Salon uniquement', icon: FaBuilding },
            { value: 'domicile', label: 'Domicile uniquement', icon: FaCar },
            { value: 'both', label: 'Salon & Domicile', icon: FaMapMarkerAlt }
          ].map((mode) => (
            <label key={mode.value} className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="workingMode"
                checked={
                  (mode.value === 'salon' && formData.workingMode.includes('salon') && formData.workingMode.length === 1) ||
                  (mode.value === 'domicile' && formData.workingMode.includes('domicile') && formData.workingMode.length === 1) ||
                  (mode.value === 'both' && formData.workingMode.includes('salon') && formData.workingMode.includes('domicile'))
                }
                onChange={() => {
                  // Logique radio : un seul choix possible
                  if (mode.value === 'salon') {
                    handleInputChange('workingMode', ['salon']);
                  } else if (mode.value === 'domicile') {
                    handleInputChange('workingMode', ['domicile']);
                  } else if (mode.value === 'both') {
                    handleInputChange('workingMode', ['salon', 'domicile']);
                  }
                }}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <mode.icon className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{mode.label}</span>
            </label>
          ))}
        </div>
      </div>

      {(formData.workingMode.includes('domicile')) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaCar className="mr-2 text-gray-500" />
            Rayon de déplacement (km) *
          </label>
          <input
            type="number"
            value={formData.travelRadius}
            onChange={(e) => handleInputChange('travelRadius', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            placeholder="15"
            min="1"
            max="100"
          />
        </div>
      )}
    </div>
  );

  // Étape 4: Adresses
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Adresses</h2>
        <p className="text-gray-600">Votre adresse personnelle et celle de votre salon</p>
      </div>

      {/* Adresse personnelle */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaUser className="mr-2 text-blue-500" />
          Adresse personnelle
        </h3>
        
        {/* Autocomplétion adresse personnelle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechercher votre adresse personnelle
          </label>
          <AddressAutocomplete
            onAddressSelect={(address) => {
              // Mettre à jour tous les champs d'adresse personnelle
              setFormData(prev => ({
                ...prev,
                personalAddress: {
                  ...prev.personalAddress,
                  streetNumber: address.streetNumber,
                  street: address.street,
                  city: address.city,
                  postalCode: address.postalCode,
                  coordinates: address.coordinates
                }
              }));
            }}
            placeholder="Tapez votre adresse personnelle..."
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de rue
            </label>
            <input
              type="text"
              value={formData.personalAddress.streetNumber}
              onChange={(e) => handlePersonalAddressChange('streetNumber', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              placeholder="42"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rue *
            </label>
            <input
              type="text"
              value={formData.personalAddress.street}
              onChange={(e) => handlePersonalAddressChange('street', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              placeholder="Avenue des Champs-Élysées"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville *
            </label>
            <input
              type="text"
              value={formData.personalAddress.city}
              onChange={(e) => handlePersonalAddressChange('city', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              placeholder="Paris"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal *
            </label>
            <input
              type="text"
              value={formData.personalAddress.postalCode}
              onChange={(e) => handlePersonalAddressChange('postalCode', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              placeholder="75008"
            />
          </div>
        </div>
      </div>

            {/* Adresse du salon - Conditionnelle selon le mode de travail */}
      {(formData.workingMode.includes('salon') || (formData.workingMode.includes('salon') && formData.workingMode.includes('domicile'))) && (
        <>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaBuilding className="mr-2 text-green-500" />
              Adresse du salon {formData.workingMode.includes('salon') && formData.workingMode.length === 1 ? '*' : '(optionnel)'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse du salon *
              </label>
              <AddressAutocomplete
                onAddressSelect={(address) => {
                  handleSalonAddressChange('streetNumber', address.streetNumber);
                  handleSalonAddressChange('street', address.street);
                  handleSalonAddressChange('city', address.city);
                  handleSalonAddressChange('postalCode', address.postalCode);
                  handleSalonAddressChange('country', address.country);
                  // Mettre à jour les coordonnées
                  if (address.coordinates) {
                    // Mettre à jour les coordonnées dans l'objet salonAddress
                    setFormData(prev => ({
                      ...prev,
                      salonAddress: {
                        ...prev.salonAddress,
                        coordinates: address.coordinates
                      }
                    }));
                  }
                }}
                placeholder="Tapez l'adresse de votre salon..."
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de rue
                </label>
                <input
                  type="text"
                  value={formData.salonAddress.streetNumber}
                  onChange={(e) => handleSalonAddressChange('streetNumber', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  placeholder="42"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rue *
                </label>
                <input
                  type="text"
                  value={formData.salonAddress.street}
                  onChange={(e) => handleSalonAddressChange('street', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  placeholder="Avenue des Champs-Élysées"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  value={formData.salonAddress.city}
                  onChange={(e) => handleSalonAddressChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  placeholder="Paris"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  value={formData.salonAddress.postalCode}
                  onChange={(e) => handleSalonAddressChange('postalCode', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  placeholder="75008"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Étage
              </label>
              <input
                type="text"
                value={formData.salonAddress.floor}
                onChange={(e) => handleSalonAddressChange('floor', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                placeholder="2ème étage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appartement
              </label>
              <input
                type="text"
                value={formData.salonAddress.apartment}
                onChange={(e) => handleSalonAddressChange('apartment', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                placeholder="Appartement A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code bâtiment
              </label>
              <input
                type="text"
                value={formData.salonAddress.buildingCode}
                onChange={(e) => handleSalonAddressChange('buildingCode', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                placeholder="Code 1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaPhone className="mr-2 text-gray-500" />
                Téléphone salon
              </label>
              <input
                type="tel"
                value={formData.salonAddress.phone}
                onChange={(e) => handleSalonAddressChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                placeholder="01 23 45 67 89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Informations complémentaires
              </label>
              <textarea
                value={formData.salonAddress.additionalInfo}
                onChange={(e) => handleSalonAddressChange('additionalInfo', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                rows={3}
                placeholder="Près de la station de métro, parking disponible..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Étape 5: Finalisation
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Finalisation</h2>
        <p className="text-gray-600">Dernières étapes pour finaliser votre inscription</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaClock className="mr-2 text-gray-500" />
          Horaires de travail par défaut
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.workingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center justify-between p-3 bg-white rounded border">
              <span className="font-medium text-gray-700 capitalize">
                {day === 'monday' ? 'Lundi' : 
                 day === 'tuesday' ? 'Mardi' : 
                 day === 'wednesday' ? 'Mercredi' : 
                 day === 'thursday' ? 'Jeudi' : 
                 day === 'friday' ? 'Vendredi' : 
                 day === 'saturday' ? 'Samedi' : 'Dimanche'}
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hours.isAvailable}
                  onChange={(e) => {
                    const newHours = { ...formData.workingHours };
                    newHours[day as keyof typeof formData.workingHours] = {
                      ...hours,
                      isAvailable: e.target.checked
                    };
                    handleInputChange('workingHours', newHours);
                  }}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                {hours.isAvailable && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={hours.start}
                      onChange={(e) => {
                        const newHours = { ...formData.workingHours };
                        newHours[day as keyof typeof formData.workingHours] = {
                          ...hours,
                          start: e.target.value
                        };
                        handleInputChange('workingHours', newHours);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hours.end}
                      onChange={(e) => {
                        const newHours = { ...formData.workingHours };
                        newHours[day as keyof typeof formData.workingHours] = {
                          ...hours,
                          end: e.target.value
                        };
                        handleInputChange('workingHours', newHours);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaEuroSign className="mr-2 text-gray-500" />
          Services par défaut
        </h3>
        <div className="space-y-4">
          {formData.services.map((service, index) => (
            <div key={index} className="bg-white p-4 rounded border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du service</label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[index] = { ...service, name: e.target.value };
                      handleInputChange('services', newServices);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    value={service.duration}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[index] = { ...service, duration: parseInt(e.target.value) || 0 };
                      handleInputChange('services', newServices);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix HT (€)</label>
                  <input
                    type="number"
                    value={service.priceHT}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[index] = { ...service, priceHT: parseInt(e.target.value) || 0 };
                      handleInputChange('services', newServices);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      const newServices = formData.services.filter((_, i) => i !== index);
                      handleInputChange('services', newServices);
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const newService = {
                name: 'Nouveau service',
                description: 'Description du service',
                duration: 30,
                priceHT: 25,
                tags: []
              };
              handleInputChange('services', [...formData.services, newService]);
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + Ajouter un service
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaBell className="mr-2 text-gray-500" />
          Préférences de notifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.preferences.notifications).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handlePreferencesChange('notifications', { [key]: e.target.checked })}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700 capitalize">
                {key === 'email' ? 'Notifications par email' :
                 key === 'sms' ? 'Notifications par SMS' :
                 key === 'push' ? 'Notifications push' :
                 key === 'marketing' ? 'Emails marketing' :
                 'Mises à jour'}
              </span>
            </label>
          ))}
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
      case 5:
        return renderStep5();
      default:
        return renderStep1();
    }
  };

     return (
     <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
       <div className="w-full max-w-4xl">
         {/* Indicateur de progression */}
         <StepIndicator 
           currentStep={currentStep}
           totalSteps={totalSteps}
           steps={steps}
         />
         
         {/* Formulaire */}
         <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-300">
           {renderCurrentStep()}
           
           {/* Navigation entre étapes */}
           <StepNavigation
             currentStep={currentStep}
             totalSteps={totalSteps}
             onPrevious={prevStep}
             onNext={nextStep}
             onSubmit={handleSubmit}
             isLoading={isLoading}
             canProceed={Boolean(canProceedCurrentStep)}
           />
           
           {/* Erreurs de validation en temps réel */}
           {currentStep === 1 && emailExists && (
             <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
               <p className="text-red-600 text-center">❌ Cet email est déjà utilisé</p>
             </div>
           )}
             
             {currentStep === 2 && phoneExists && (
               <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                 <p className="text-red-600 text-center">❌ Ce numéro de téléphone est déjà utilisé</p>
               </div>
             )}
           
           {currentStep === 2 && sirenExists && (
             <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
               <p className="text-red-600 text-center">❌ Ce SIREN est déjà utilisé</p>
             </div>
           )}
           
           {currentStep === 2 && !canProceedCurrentStep && !phoneExists && !sirenExists && (
             <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
               <p className="text-yellow-600 text-center">⚠️ Vérifiez que tous les champs obligatoires sont remplis</p>
             </div>
           )}
           
           {/* Lien de connexion */}
           <div className="text-center mt-6">
             <p className="text-gray-600">
               Déjà un compte coiffeur ?{' '}
               <button
                 onClick={() => navigate('/login')}
                 className="text-gray-800 hover:text-gray-600 transition-colors duration-300 underline font-medium"
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

export default SignInCoiffeurPage;
