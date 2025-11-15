import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { userService } from '../services/api/users';
import { reviewService } from '../services/api/reviews';
import { favoriteService } from '../services/api/favorites';
import { chatService } from '../services/api/chat';
import type { User } from '../types/models';
import { FaStar, FaMapMarkerAlt, FaHeart, FaEdit, FaPlus, FaClock, FaPhone, FaEnvelope, FaEuroSign, FaImages, FaSpinner } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { useNotification } from '../components/ui/NotificationManager';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { useIsMobile } from '../hooks/useIsMobile';

// Composants de gestion coiffeur
import SpecialtyManager from '../components/SpecialtyManager';
import WorkingSlotManager from '../components/WorkingSlotManager';
import PricingManager from '../components/PricingManager';

import Gallery from '../components/Gallery';
import BookingForm from '../components/BookingForm';
import Modal from '../components/ui/Modal';
import { Card } from '../components/ui/card';
import FormattedBio from '../components/FormattedBio';
import ServicesSection from '../components/ServicesSection';
import ProductsSection from '../components/ProductsSection';
import ProductGallery from '../components/ProductGallery';
import ProductPaymentModal from '../components/ProductPaymentModal';
import ServiceModal from '../components/ServiceModal'; // Added import for ServiceModal
import { coiffeurService } from '../services/api/coiffeurs'; // Added import for coiffeurService

import { getImageUrl, handleImageError, DEFAULT_COIFFEUR_IMAGE, DEFAULT_USER_IMAGE } from '../utils/imageUtils';

const CoiffeurProfilePage = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user) as User | null;
  const id = paramId || user?._id;
  const isOwner = user && user._id === id && user.role === 'coiffeur';
  const isClient = user && (user.role === 'user' || user.role === 'client');
  const isMobile = useIsMobile();



  // Déterminer l'onglet actif basé sur l'URL
  const urlParams = new URLSearchParams(location.search);
  const tabParam = urlParams.get('tab') as 'gallery' | 'reviews' | 'services' | 'products';
  const defaultTab = tabParam || 'services'; // Par défaut, afficher les services
  
  // Gérer l'ouverture automatique de la modal de réservation
  const shouldOpenBooking = urlParams.get('booking') === 'true';
  const serviceIdFromUrl = urlParams.get('service');

  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [servicesTab, setServicesTab] = useState<'services' | 'products' | 'product-gallery'>(defaultTab === 'services' || defaultTab === 'products' ? defaultTab : 'services');
  const [galleryTab, setGalleryTab] = useState<'gallery' | 'reviews' | 'product-gallery'>(defaultTab === 'gallery' || defaultTab === 'reviews' ? defaultTab : 'gallery');
  
  // État pour les onglets de gestion coiffeur
  const [managementTab, setManagementTab] = useState<'specialties' | 'slots' | 'pricing'>('specialties');

  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasProducts, setHasProducts] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // Added state for details visibility

  // Fonction pour gérer l'envoi de message
  const handleSendMessage = async () => {
    if (!user || !coiffeur) return;
    
    setIsCreatingConversation(true);
    try {
      // Rediriger vers la page de chat avec les suggestions (sans envoyer de message)
      navigate(`/client/chat?coiffeur=${coiffeur._id}`);
      
    } catch (error) {
      console.error('Erreur lors de la redirection:', error);
      // En cas d'erreur, rediriger quand même vers la page de chat
      navigate(`/client/chat?coiffeur=${coiffeur._id}`);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered with:', { id, paramId, user: user?._id });
    
    if (!id) {
      console.log('❌ ID manquant:', { paramId, user: user?._id });
      return;
    }
    
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching coiffeur data for ID:', id);
        // Récupérer les données du coiffeur
        const coiffeurData = await userService.getUser(id);
        
        // Vérifier que l'utilisateur est un coiffeur
        if (coiffeurData.role !== 'coiffeur') {
          console.log('❌ Utilisateur n\'est pas un coiffeur:', coiffeurData.role);
          setCoiffeur(null);
          return;
        }
        
        setCoiffeur(coiffeurData);

        // Récupérer les avis du coiffeur
        const reviewsData = await reviewService.getCoiffeurReviews(id);
        console.log('📝 Avis récupérés:', reviewsData);
        console.log('📝 Structure du premier avis:', reviewsData[0]);
        if (reviewsData[0]?.client) {
          console.log('📝 Client du premier avis:', reviewsData[0].client);
        }
        setReviews(reviewsData);

        // Vérifier si le coiffeur a des produits
        try {
          const { productService } = await import('../services/api/products');
          const productsData = await productService.getCoiffeurProducts(id);
          setHasProducts(productsData.length > 0);
        } catch (error) {
          console.error('Error checking products:', error);
          setHasProducts(false);
        }

        // Vérifier si le coiffeur est en favori
        if (user && isClient) {
          try {
            const isFav = await favoriteService.isFavorite(id);
            setIsFavorite(isFav);
          } catch (error) {
            console.error('Error checking favorites:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching coiffeur data:', error);
        setCoiffeur(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, isClient]);

  // Gérer les changements d'onglets basés sur l'URL
  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'services' || tabParam === 'products') {
        setServicesTab(tabParam);
      } else if (tabParam === 'gallery' || tabParam === 'reviews') {
        setGalleryTab(tabParam);
      }
    }
  }, [tabParam]);

  // Gérer l'ouverture automatique de la modal de réservation
  useEffect(() => {
    if (shouldOpenBooking && serviceIdFromUrl && coiffeur) {
      // Récupérer le service correspondant
      const fetchServiceAndOpenModal = async () => {
        try {
          const { coiffeurService } = await import('../services/api/coiffeurs');
          const services = await coiffeurService.getCoiffeurServices(coiffeur._id);
          const service = services.find(s => s._id === serviceIdFromUrl);
          
          if (service) {
            setSelectedService(service);
            setShowBookingModal(true);
            // Nettoyer l'URL pour éviter la réouverture automatique
            navigate(`/coiffeur/${coiffeur._id}`, { replace: true });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du service:', error);
        }
      };
      
      fetchServiceAndOpenModal();
    }
  }, [shouldOpenBooking, serviceIdFromUrl, coiffeur, navigate]);

  const handleServiceBook = (service: any) => {
    console.log('🔍 handleServiceBook appelé avec:', service);
    console.log('👤 Utilisateur actuel:', user);
    console.log('🏪 Coiffeur:', coiffeur);
    console.log('👑 isOwner:', isOwner);
    console.log('👤 isClient:', isClient);
    console.log('📋 Service sélectionné:', {
      id: service?._id,
      name: service?.name,
      price: service?.price,
      duration: service?.duration
    });
    
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleProductBuy = (product: any) => {
    console.log('🛒 handleProductBuy appelé avec:', product);
    setSelectedProduct(product);
    setShowPaymentModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    navigate('/client/bookings');
  };

  const handleToggleFavorite = async () => {
    if (!user || !coiffeur) return;

    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(coiffeur._id);
      } else {
        await favoriteService.addFavorite(coiffeur._id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!coiffeur) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Coiffeur introuvable</h1>
          <p className="text-gray-600">Le profil demandé n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-8 ${galleryTab === 'gallery' && isMobile ? 'px-0' : 'px-4'}`}>
      {/* Section principale du profil - Layout comme capture d'écran */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Photo du coiffeur - PLUS GRANDE */}
          <div className="flex justify-center xl:justify-start">
            <div className="relative">
              <img
                src={getImageUrl(coiffeur.photo, DEFAULT_COIFFEUR_IMAGE)}
                alt={coiffeur.name}
                className="w-48 h-48 rounded-full object-cover border-2 border-accent"
                onError={(e) => handleImageError(e, DEFAULT_COIFFEUR_IMAGE)}
              />
              {coiffeur.sirenStatus === 'verified' && (
                <MdVerified className="absolute -bottom-1 -right-1 text-blue-500 text-lg" />
              )}
            </div>
          </div>

          {/* Informations du coiffeur */}
          <div className="flex-1 space-y-2">
            {/* Nom et rating - CENTRÉS */}
            <div className="text-center xl:text-left">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {coiffeur.name}
              </h1>
              <div className="flex items-center justify-center xl:justify-start gap-2">
                <FaStar className="text-yellow-400" />
                <span className="font-semibold text-gray-700">
                  {coiffeur.rating || 0} (avis)
                </span>
              </div>
              
              {/* Indicateur de statut de connexion */}
              <div className="flex items-center justify-center xl:justify-start gap-2 mt-2">
                <ConnectionIndicator 
                  status={coiffeur.connectionStatus} 
                  size="md" 
                  showLabel={true}
                />
              </div>
            </div>

            {/* Email - CENTRÉ */}
            <p className="text-center xl:text-left text-gray-600 text-sm">
              {coiffeur.email}
            </p>

            {/* Boutons d'action - CENTRÉS */}
            <div className="flex items-center justify-center xl:justify-start gap-2">
              {user && user.role === 'user' && (
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    isFavorite 
                      ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-110'
                      : 'bg-gray-600 text-white hover:bg-black hover:scale-110'
                  }`}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <FaHeart className="text-sm" />
                </button>
              )}
              
              {isOwner && (
                <button
                  onClick={() => navigate(`/coiffeur/${id}/edit`)}
                  className="p-2 bg-gray-600 text-white rounded-full hover:bg-black hover:scale-110 transition-all duration-300"
                  title="Modifier le profil"
                >
                  <FaEdit className="text-sm" />
                </button>
              )}
            </div>

            {/* Bio - À GAUCHE */}
            {coiffeur.bio && (
              <p className="text-left text-gray-600 text-sm leading-relaxed">
                {coiffeur.bio}
              </p>
            )}

            {/* Mode de travail - À GAUCHE */}
            {coiffeur.workingMode && coiffeur.workingMode.length > 0 && (
              <div className="text-left">
                <h3 className="font-semibold text-gray-700 text-sm mb-1">Mode de travail</h3>
                <div className="flex flex-wrap gap-2">
                  {coiffeur.workingMode.map((mode: string, index: number) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {mode === 'salon' ? 'Salon' : mode === 'domicile' ? 'Domicile' : 'Les deux'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Adresse du salon - À GAUCHE */}
            <div className="text-left">
              <h3 className="font-semibold text-gray-700 text-sm mb-1 flex items-center gap-2">
                <FaMapMarkerAlt className="text-accent" />
                Adresse du salon
              </h3>
              {coiffeur.salonAddress?.street ? (
                <p className="text-gray-600 text-sm">
                  {coiffeur.salonAddress.streetNumber || ''} {coiffeur.salonAddress.street}, {coiffeur.salonAddress.postalCode} {coiffeur.salonAddress.city}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">Adresse non renseignée</p>
              )}
            </div>

            {/* Téléphone salon - HORS DÉPLIANT */}
            {coiffeur.salonAddress?.phone && (
              <div className="text-left">
                <h3 className="font-semibold text-gray-700 text-sm mb-1">Téléphone salon</h3>
                <p className="text-gray-600 text-sm">{coiffeur.salonAddress.phone}</p>
              </div>
            )}

            {/* Bouton pour dérouler les informations détaillées - À GAUCHE */}
            <div className="text-left mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
              >
                <span>{showDetails ? 'Masquer' : 'Voir plus d\'informations'}</span>
                <span className="text-xs">{showDetails ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Informations détaillées - DÉROULABLES */}
            {showDetails && (
              <div className="text-left mt-3 space-y-3">
                {/* Spécialités - DANS LE DÉPLIANT */}
                {coiffeur.specialities && coiffeur.specialities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-1">Spécialités</h3>
                    <div className="flex flex-wrap gap-2">
                      {coiffeur.specialities.map((speciality: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {speciality}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expérience - DANS LE DÉPLIANT */}
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Expérience</h3>
                  <p className="text-gray-600 text-sm">
                    {coiffeur.experience ? `${coiffeur.experience} an(s)` : 'Non renseignée'}
                  </p>
                </div>

                {/* Formation */}
                {coiffeur.formation && (
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-1">Formation</h3>
                    <p className="text-gray-600 text-sm">{coiffeur.formation}</p>
                  </div>
                )}

                {/* Rayon de déplacement */}
                {coiffeur.travelRadius && coiffeur.workingMode?.includes('domicile') && (
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-1">Rayon de déplacement</h3>
                    <p className="text-gray-600 text-sm">{coiffeur.travelRadius} km</p>
                  </div>
                )}
              </div>
            )}

            {/* Bouton Envoyer un message - APRÈS l'adresse */}
            <div className="text-left mt-4">
              <button
                onClick={handleSendMessage}
                disabled={isCreatingConversation}
                className="bg-black text-white py-3 px-6 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingConversation ? (
                  <>
                    <FaSpinner className="animate-spin text-lg" />
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">💬</span>
                    <span>Envoyer un message</span>
                    <span className="text-sm opacity-90 group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 ml-1">
                💡 Cliquez pour démarrer une conversation avec {coiffeur.name}
              </p>
            </div>
          </div>

          {/* Colonne droite - Carte à côté des informations */}
          {coiffeur.salonAddress?.coordinates && (
            <div className="w-full xl:w-[43rem] flex-shrink-0">
              <div className="relative h-64 rounded-lg border border-gray-200 overflow-hidden">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coiffeur.salonAddress.coordinates.lng - 0.001},${coiffeur.salonAddress.coordinates.lat - 0.001},${coiffeur.salonAddress.coordinates.lng + 0.001},${coiffeur.salonAddress.coordinates.lat + 0.001}&layer=mapnik&marker=${coiffeur.salonAddress.coordinates.lat},${coiffeur.salonAddress.coordinates.lng}&zoom=16&scrollWheelZoom=false&doubleClickZoom=false&dragPan=false&keyboard=false&touchZoom=false&zoomControl=false&attributionControl=false&minZoom=16&maxZoom=16`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  title="Localisation du salon"
                  className="pointer-events-none"
                />
                {/* Overlay pour désactiver complètement les interactions */}
                <div className="absolute inset-0 pointer-events-none"></div>
                
                {/* Badge "Carte fixe" */}
                <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                  Carte fixe
                </div>
              </div>

              {/* Bouton itinéraire - SOUS LA CARTE */}
              <button
                onClick={() => {
                  if (coiffeur.salonAddress?.coordinates) {
                    const url = `https://waze.com/ul?ll=${coiffeur.salonAddress.coordinates.lat},${coiffeur.salonAddress.coordinates.lng}&navigate=yes`;
                    window.open(url, '_blank');
                  }
                }}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-black transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 mt-3 shadow-md hover:shadow-lg"
              >
                <FaMapMarkerAlt className="text-sm" />
                Itinéraire
              </button>

              {/* Horaires de travail - SOUS LA CARTE DANS LE MÊME CADRE */}
              {coiffeur.salonAddress?.openingHours && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                    🕐 Horaires
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(coiffeur.salonAddress.openingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {day === 'monday' ? 'Lun' : 
                           day === 'tuesday' ? 'Mar' : 
                           day === 'wednesday' ? 'Mer' : 
                           day === 'thursday' ? 'Jeu' : 
                           day === 'friday' ? 'Ven' : 
                           day === 'saturday' ? 'Sam' : 'Dim'}
                        </span>
                        <span className={hours.closed ? 'text-red-600' : 'text-green-600'}>
                          {hours.closed ? 'Fermé' : `${hours.open || '09:00'}-${hours.close || '18:00'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Section Services & Produits - COMPACTE pour propriétaires */}
      {isOwner && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Services & Produits</h2>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
            >
              <FaPlus />
              Ajouter un service
            </button>
          </div>
          
          {/* Tabs compacts */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setServicesTab('services')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                servicesTab === 'services'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setServicesTab('products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                servicesTab === 'products'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
            >
              Produits
            </button>
          </div>

          {/* Contenu des tabs */}
          {servicesTab === 'services' ? (
            <div>
              <ServicesSection
                coiffeurId={id || ''}
                isOwner={isOwner || false}
                showBookButton={isClient || false}
                onServiceBook={handleServiceBook}
              />
            </div>
          ) : (
            <div>
              <ProductsSection
                coiffeurId={id || ''}
                isOwner={isOwner || false}
                showBuyButton={isClient || false}
                onProductBuy={handleProductBuy}
              />
            </div>
          )}
        </div>
      )}

      {/* Section Gestion Coiffeur - UNIQUEMENT POUR LES PROPRIÉTAIRES */}
      {isOwner && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Gestion de Mon Salon</h2>
            <div className="text-sm text-gray-600">
              Gérez vos spécialités, créneaux et tarifs
            </div>
          </div>
          
          {/* Onglets de gestion */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setManagementTab('specialties')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                managementTab === 'specialties'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
            >
              ✨ Spécialités
            </button>
            <button
              onClick={() => setManagementTab('slots')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                managementTab === 'slots'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
            >
              🕐 Créneaux
            </button>
            <button
              onClick={() => setManagementTab('pricing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                managementTab === 'pricing'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
            >
              💰 Tarifs
            </button>
          </div>

          {/* Contenu des onglets de gestion */}
          <div className="min-h-[400px]">
            {managementTab === 'specialties' && (
              <SpecialtyManager />
            )}
            {managementTab === 'slots' && (
              <WorkingSlotManager />
            )}
            {managementTab === 'pricing' && (
              <PricingManager />
            )}
          </div>
        </div>
      )}

      {/* Section Galerie & Avis - VISIBLE POUR TOUS */}
      <div className={`bg-white rounded-xl shadow-lg ${galleryTab === 'gallery' && isMobile ? 'p-0' : 'p-6'}`}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Galerie & Avis</h2>
        
        {/* Onglets Galerie/Avis */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setGalleryTab('gallery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              galleryTab === 'gallery'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
            }`}
          >
            Galerie
          </button>
          <button
            onClick={() => setGalleryTab('product-gallery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              galleryTab === 'product-gallery'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
            }`}
          >
            Produits
          </button>
          <button
            onClick={() => setGalleryTab('reviews')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              galleryTab === 'reviews'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white'
            }`}
          >
            Avis ({reviews.length})
          </button>
        </div>

        {/* Contenu des onglets Galerie/Avis */}
        {galleryTab === 'gallery' ? (
          id ? (
            <Gallery 
              coiffeurId={id} 
              isOwner={isOwner || false} 
              onServiceBook={handleServiceBook}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Chargement...</p>
            </div>
          )
        ) : galleryTab === 'product-gallery' ? (
          id ? (
            <ProductGallery
              coiffeurId={id}
              isOwner={isOwner || false}
              onProductBuy={handleProductBuy}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Chargement...</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-gray-600">
                  Aucun avis pour le moment
                </p>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review._id} className="p-4">
                  <div className="flex items-start gap-4">
                    {review.client?.photo ? (
                      <img
                        src={getImageUrl(review.client.photo, DEFAULT_USER_IMAGE)}
                        alt={review.client.name || 'Client'}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg">
                        {review.client?.name ? review.client.name[0].toUpperCase() : 'C'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{review.client?.name || 'Client anonyme'}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`text-sm ${
                                star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de réservation */}
      {showBookingModal && selectedService && coiffeur && (
        <Modal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title="Réserver un service"
          size="xl"
        >
          {console.log('🔍 [Modal] Données passées au BookingForm:', {
            coiffeur: coiffeur?.name,
            selectedService: selectedService,
            hasSelectedService: !!selectedService
          })}
          <BookingForm
            coiffeur={coiffeur}
            selectedService={selectedService}
            onSuccess={handleBookingSuccess}
            onCancel={() => setShowBookingModal(false)}
          />
        </Modal>
      )}

      {/* Modal de paiement pour les produits */}
      {showPaymentModal && selectedProduct && coiffeur && (
        <ProductPaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          product={selectedProduct}
          coiffeurAddress={coiffeur.address ? `${coiffeur.address.streetNumber || ''} ${coiffeur.address.street || ''}, ${coiffeur.address.postalCode || ''} ${coiffeur.address.city || ''}` : undefined}
        />
      )}

      {/* Modal pour ajouter un service */}
      {showAddServiceModal && (
        <ServiceModal
          isOpen={showAddServiceModal}
          onClose={() => setShowAddServiceModal(false)}
          onSubmit={async (serviceData) => {
            try {
              await coiffeurService.addCoiffeurService(id || '', serviceData);
              setShowAddServiceModal(false);
              // Recharger les services
              window.location.reload();
            } catch (error) {
              console.error('Erreur lors de la création du service:', error);
            }
          }}
          service={undefined}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default CoiffeurProfilePage; 