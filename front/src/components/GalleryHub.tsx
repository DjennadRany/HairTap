import React, { useState, useEffect } from 'react';
import { FaHeart, FaShare, FaEye, FaSearch, FaStar, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { coiffeurService } from '../services/api/coiffeurs';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';
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
    photoUrl: string;
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popularityScore' | 'likes' | 'recent'>('popularityScore');

  // Récupérer les vrais services de la base de données
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
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
              address: coiffeur.address
            }
          }));
          allServices.push(...servicesWithCoiffeur);
        } catch (error) {
          console.error(`Erreur pour ${coiffeur.name}:`, error);
        }
      }
      
      console.log('Services récupérés:', allServices);
      setServices(allServices);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      setServices([]);
    } finally {
      setLoading(false);
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

  // Obtenir la première image disponible (examplePhotos ou gallery)
  const getServiceImage = (service: Service) => {
    if (service.gallery && service.gallery.length > 0) {
      return getImageUrl(service.gallery[0].photoUrl, DEFAULT_SERVICE_IMAGE);
    }
    if (service.examplePhotos && service.examplePhotos.length > 0) {
      return getImageUrl(service.examplePhotos[0], DEFAULT_SERVICE_IMAGE);
    }
    // Image par défaut si aucune image n'est disponible
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
              {/* Image du service */}
              <img
                src={getServiceImage(service)}
                alt={service.name}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
              />

              {/* Overlay au survol */}
              <div className="gallery-overlay">
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
                          // TODO: Implémenter la logique des likes
                          console.log('Like clicked for service:', service._id);
                        }}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
                      >
                        <FaHeart className="w-4 h-4" />
                      </button>
                      <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors">
                        <FaShare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
