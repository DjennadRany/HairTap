import React, { useState, useEffect } from 'react';
import { FaHeart, FaShare, FaEye, FaSearch, FaStar, FaSpinner, FaComment } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { coiffeurService } from '../services/api/coiffeurs';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import InstagramGallery from './InstagramGallery'; // Instagram-like gallery
import InstagramComments from './InstagramComments'; // Commentaires Instagram
import '../styles/gallery.css';

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  specialities: Array<{
    specialtyId: {
      _id: string;
      name: string;
      category: string;
    };
    expertiseLevel: number;
  }>;
  coiffeur: {
    _id: string;
    name: string;
    rating: number;
    address: {
      city: string;
    };
  };
  examplePhotos: string[];
  gallery: Array<{
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    tags: string[];
    likes: number;
    createdAt: Date;
  }>;
  likes: number;
  views: number;
  popularityScore: number;
  style: string;
  targetAudience: string[];
}

interface GalleryHubProps {
  className?: string;
}

export const GalleryHub: React.FC<GalleryHubProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popularityScore' | 'likes' | 'recent'>('popularityScore');
  const [likedServices, setLikedServices] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showComments, setShowComments] = useState<{ [serviceId: string]: boolean }>({});

  // Gérer la touche Échap pour fermer les commentaires
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowComments({});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Récupérer les vrais services de la base de données
  useEffect(() => {
    fetchServices();
    loadUserLikes();
  }, []);

  // Charger les likes de l'utilisateur connecté
  const loadUserLikes = async () => {
    try {
      // Récupérer les services likés par l'utilisateur
      const response = await coiffeurService.getUserLikedServices();
      if (response && response.data) {
        const likedServiceIds = response.data.map(service => service._id);
        setLikedServices(likedServiceIds);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des likes:', error);
    }
  };

  // Recharger les services quand la page devient visible (pour capturer les nouveaux services)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchServices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Re-trier les services quand ils changent (pour les nouveaux services)
  useEffect(() => {
    if (services.length > 0) {
      const sortedServices = [...services].sort((a, b) => {
        // Priorité 1: Services avec plus de likes
        if (a.likes !== b.likes) {
          return b.likes - a.likes;
        }
        // Priorité 2: Services avec plus de vues
        if (a.views !== b.views) {
          return b.views - a.views;
        }
        // Priorité 3: Score de popularité
        return (b.popularityScore || 0) - (a.popularityScore || 0);
      });
      
      // Mettre à jour seulement si l'ordre a changé
      const hasChanged = sortedServices.some((service, index) => 
        service._id !== services[index]?._id
      );
      
      if (hasChanged) {
        setServices(sortedServices);
      }
    }
  }, [services.length]); // Se déclenche quand le nombre de services change

  const fetchServices = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Récupérer tous les coiffeurs d'abord
      const coiffeurs = await coiffeurService.searchCoiffeurs({});
      
      // Récupérer les services de chaque coiffeur
      const allServices = [];
      for (const coiffeur of coiffeurs) {
        try {
          const services = await coiffeurService.getCoiffeurServices(coiffeur._id);
          // Ajouter les informations du coiffeur à chaque service
          const servicesWithCoiffeur = services.map(service => ({
            ...service,
            coiffeur: {
              _id: coiffeur._id,
              name: coiffeur.name,
              rating: coiffeur.rating || 0,
              address: coiffeur.address || { city: 'Ville' }
            }
          }));
          allServices.push(...servicesWithCoiffeur);
        } catch (error) {
          console.error(`Erreur pour ${coiffeur.name}:`, error);
        }
      }
      
      console.log('Services récupérés:', allServices);
      
      // Debug: Vérifier la structure des galeries
      allServices.forEach(service => {
        if (service.gallery && service.gallery.length > 0) {
          console.log(`🔍 Service ${service.name} - Gallery:`, service.gallery);
          service.gallery.forEach((item, index) => {
            console.log(`  📁 Item ${index}:`, {
              mediaUrl: item.mediaUrl,
              mediaType: item.mediaType,
              photoUrl: item.photoUrl // Ancienne propriété
            });
          });
        }
      });
      
      if (append) {
        setServices(prev => [...prev, ...allServices]);
      } else {
        setServices(allServices);
      }
      
      // Simuler la fin des données après quelques pages
      setHasMore(page < 3); // Limiter à 3 pages pour la démo
      setCurrentPage(page);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      if (!append) {
        setServices([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchServices(currentPage + 1, true);
    }
  };

  const handleServiceClick = (service: Service) => {
    // Au lieu de naviguer vers /service/:id, naviguer vers le profil du coiffeur
    // car c'est là que se trouve la modal de réservation
    if (service.coiffeur?._id) {
      navigate(`/coiffeur/${service.coiffeur._id}`);
    }
  };

  const handleCoiffeurClick = (coiffeurId: string) => {
    navigate(`/coiffeur/${coiffeurId}`);
  };

  const handleReservationClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    // Naviguer vers le profil du coiffeur avec la modal de réservation ouverte
    if (service.coiffeur?._id) {
      navigate(`/coiffeur/${service.coiffeur._id}?booking=true&service=${service._id}`);
    }
  };

  const handleLikeService = async (serviceId: string) => {
    try {
      // Trouver le service pour obtenir le coiffeurId
      const service = services.find(s => s._id === serviceId);
      if (!service || !service.coiffeur) {
        console.error('Service ou coiffeur introuvable');
        return;
      }

      const coiffeurId = typeof service.coiffeur === 'string' ? service.coiffeur : service.coiffeur._id;
      
      // Appeler l'API pour liker/unliker
      const response = await coiffeurService.toggleServiceLike(coiffeurId, serviceId);
      
      // Utiliser la nouvelle structure de réponse
      const likes = response.data?.likes || response.likes || 0;
      const isLiked = response.data?.isLiked || response.isLiked || false;
      
      // Mettre à jour l'état local
      setServices(prev => prev.map(s => 
        s._id === serviceId 
          ? { ...s, likes: likes }
          : s
      ));

      // Mettre à jour les likes locaux
      if (isLiked) {
        setLikedServices(prev => [...prev, serviceId]);
      } else {
        setLikedServices(prev => prev.filter(id => id !== serviceId));
      }
      
    } catch (error) {
      console.error('Erreur lors de la gestion du like:', error);
    }
  };



  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'popularityScore':
        return (b.popularityScore || 0) - (a.popularityScore || 0);
      case 'likes':
        return (b.likes || 0) - (a.likes || 0);
      case 'recent':
        const bDate = b.gallery && b.gallery.length > 0 ? new Date(b.gallery[0]?.createdAt || 0).getTime() : 0;
        const aDate = a.gallery && a.gallery.length > 0 ? new Date(a.gallery[0]?.createdAt || 0).getTime() : 0;
        return bDate - aDate;
      default:
        return 0;
    }
  });

  // Obtenir le premier média disponible (examplePhotos ou gallery)
  const getServiceImage = (service: Service) => {
    if (service.gallery && service.gallery.length > 0) {
      const firstItem = service.gallery[0];
      // Support de la nouvelle structure (mediaUrl) et de l'ancienne (photoUrl)
      const mediaUrl = firstItem.mediaUrl || firstItem.photoUrl;
      return getImageUrl(mediaUrl, DEFAULT_SERVICE_IMAGE);
    }
    if (service.images && service.images.length > 0) {
      return getImageUrl(service.images[0], DEFAULT_SERVICE_IMAGE);
    }
    // Image par défaut si aucun média n'est disponible
    return DEFAULT_SERVICE_IMAGE;
  };

  // Obtenir les spécialités sous forme de chaînes
  const getServiceSpecialities = (service: Service) => {
    if (service.specialities && service.specialities.length > 0) {
      return service.specialities
        .filter(spec => spec.specialtyId && spec.specialtyId.name)
        .map(spec => spec.specialtyId.name);
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <FaSpinner className="animate-spin text-4xl text-gray-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement des services...</span>
      </div>
    );
  }

  // Afficher la version mobile si on est sur mobile
  if (isMobile) {
    return <InstagramGallery 
      services={services} 
      loading={loading} 
    />; // Instagram-like gallery
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête de la galerie */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Galerie des Services</h1>
        <p className="text-gray-600">Découvrez les plus belles coupes et trouvez l'inspiration</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un style, une coupe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        >
          <option value="">Toutes les catégories</option>
          <option value="coupe">Coupe</option>
          <option value="coloration">Coloration</option>
          <option value="brushing">Brushing</option>
          <option value="lissage">Lissage</option>
          <option value="permanente">Permanente</option>
          <option value="barbe">Barbe</option>
          <option value="soin">Soin</option>
          <option value="autre">Autre</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        >
          <option value="popularityScore">Popularité</option>
          <option value="likes">Likes</option>
          <option value="recent">Récent</option>
        </select>
      </div>

      {/* Grille mosaïque des services */}
      {sortedServices.length > 0 ? (
        <div className="gallery-masonry">
          {sortedServices.map((service) => (
            <div
              key={service._id}
              className="gallery-item relative cursor-pointer group"
              onClick={() => handleServiceClick(service)}
            >
              {/* Média du service (image ou vidéo) */}
              {(() => {
                const isVideo = service.gallery && service.gallery.length > 0 && service.gallery[0].mediaType === 'video';
                const url = getServiceImage(service);
                const isVideoByUrl = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.avi') || url.includes('.mov');
                return isVideo || isVideoByUrl;
              })() ? (
                <video
                  src={getServiceImage(service)}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={getServiceImage(service)}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                />
              )}

              {/* Overlay au survol */}
              <div className={`gallery-overlay ${showComments[service._id] ? 'gallery-overlay-visible' : ''}`}>
                <div className="gallery-overlay-content">
                  <div className="space-y-3">
                    {/* Titre et description */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
                      <p className="text-sm text-gray-200 line-clamp-2">{service.description}</p>
                    </div>

                    {/* Spécialités */}
                    <div className="flex flex-wrap gap-1">
                      {getServiceSpecialities(service).slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 bg-opacity-80 text-white text-xs rounded-full backdrop-blur-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    {/* Prix et coiffeur */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">{service.price}€</span>
                      <button
                        onClick={(e) => handleReservationClick(e, service)}
                        className="text-sm text-blue-200 hover:text-blue-100 font-medium underline"
                      >
                        Réserver
                      </button>
                    </div>

                    {/* Métriques et actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-200">
                        <span className="flex items-center">
                          <FaHeart className="mr-1 text-red-400" />
                          {service.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <FaEye className="mr-1 text-blue-400" />
                          {service.views || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(service.coiffeur?.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-white">
                          {service.coiffeur?.rating || 0}
                        </span>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex space-x-2 pt-2">
                      <button 
                        onClick={(e) => handleReservationClick(e, service)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Réserver
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeService(service._id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          likedServices.includes(service._id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                        }`}
                      >
                        <FaHeart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowComments(prev => ({
                            ...prev,
                            [service._id]: !prev[service._id]
                          }));
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          showComments[service._id]
                            ? 'bg-pink-500 text-white'
                            : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                        }`}
                      >
                        <FaComment className="w-4 h-4" />
                      </button>
                      <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors">
                        <FaShare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section des commentaires - Style Instagram */}
              {showComments[service._id] && !isMobile && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <InstagramComments
                    serviceId={service._id}
                    coiffeurId={service.coiffeur._id}
                    maxComments={3}
                    showAll={false}
                    onClose={() => setShowComments(prev => ({
                      ...prev,
                      [service._id]: false
                    }))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun service trouvé</p>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  );
};
