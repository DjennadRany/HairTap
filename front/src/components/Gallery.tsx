import React, { useState, useEffect } from 'react';
import { FaImage, FaChevronLeft, FaChevronRight, FaHeart, FaShoppingCart, FaCalendarAlt, FaComment } from 'react-icons/fa';
import { coiffeurService } from '../services/api/coiffeurs';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import InstagramGallery from './InstagramGallery'; // Instagram-like gallery
import InstagramComments from './InstagramComments'; // Commentaires Instagram
import '../styles/gallery.css';

interface GalleryProps {
  coiffeurId: string;
  isOwner?: boolean;
  onServiceBook?: (service: any) => void;
}

interface GalleryImage {
  _id: string;
  url: string;
  mediaType?: 'image' | 'video';
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceId: string;
  serviceDescription?: string;
  serviceCategory?: string;
  likes?: number;
  isLiked?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ coiffeurId, isOwner = false, onServiceBook }) => {
  const isMobile = useIsMobile();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCardComments, setShowCardComments] = useState<{ [imageId: string]: boolean }>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Gérer la touche Échap pour fermer les commentaires
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCardComments({});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!coiffeurId) {
      // coiffeurId manquant dans Gallery
      return;
    }
    fetchGalleryImages();
  }, [coiffeurId]);

  // Navigation par clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showModal || !selectedImage) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextSlide();
          break;
        case 'Escape':
          event.preventDefault();
          setShowModal(false);
          break;
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Empêcher le scroll de la page
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, selectedImage]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      // Fetching gallery images for coiffeurId
      
      if (!coiffeurId) {
        // coiffeurId est undefined ou null
        return;
      }
      
      // Récupérer UNIQUEMENT les services (pas les produits)
      const services = await coiffeurService.getCoiffeurServices(coiffeurId);
      
      console.log('✅ Services récupérés:', services.length);
      
      const galleryImages: GalleryImage[] = [];
      
        // Ajouter UNIQUEMENT les images des services
        services.forEach(service => {
          console.log(`🔍 Service: ${service.name}`);
          console.log(`📁 Propriétés disponibles:`, Object.keys(service));
          
          // Essayer d'abord avec 'gallery', puis 'images', puis 'examplePhotos'
          let serviceImages = [];
          
          if (service.gallery && service.gallery.length > 0) {
            console.log(`📁 Gallery trouvée:`, service.gallery);
            serviceImages = service.gallery.map((item: any) => ({
              url: item.mediaUrl || item.photoUrl || item,
              type: item.mediaType || 'image'
            })).filter((item: any) => item.url);
          } else if (service.images && service.images.length > 0) {
            console.log(`📁 Images trouvées:`, service.images);
            serviceImages = service.images.map((url: string) => ({ url, type: 'image' }));
          } else if (service.examplePhotos && service.examplePhotos.length > 0) {
            console.log(`📁 ExamplePhotos trouvées:`, service.examplePhotos);
            serviceImages = service.examplePhotos.map((url: string) => ({ url, type: 'image' }));
          }
          
          console.log(`📸 Images finales pour ${service.name}:`, serviceImages);
          
          if (serviceImages && serviceImages.length > 0) {
            serviceImages.forEach((media: any) => {
              if (media.url && media.url !== 'undefined' && media.url.trim() !== '') {
                galleryImages.push({
                  _id: `${service._id}_${media.url}`,
                  url: media.url,
                  mediaType: media.type || 'image',
                  serviceName: service.name,
                  servicePrice: service.price,
                  serviceDuration: service.duration,
                  serviceId: service._id,
                  serviceDescription: service.description,
                  serviceCategory: service.category,
                  likes: service.likes || 0,
                  isLiked: service.isLiked || false
                });
              }
            });
          } else {
            console.log(`⚠️ Aucun média trouvé pour ${service.name}`);
          }
        });
      
      console.log('📸 Images de galerie services créées:', galleryImages.length);
      setImages(galleryImages);
    } catch (error) {
      console.error('❌ Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const nextSlide = () => {
    if (selectedImage) {
      const currentIndex = images.findIndex(img => img._id === selectedImage._id);
      const nextIndex = (currentIndex + 1) % images.length;
      setSelectedImage(images[nextIndex]);
    }
  };

  const prevSlide = () => {
    if (selectedImage) {
      const currentIndex = images.findIndex(img => img._id === selectedImage._id);
      const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      setSelectedImage(images[prevIndex]);
    }
  };

  const handleBookService = (image?: GalleryImage) => {
    const targetImage = image || selectedImage;
    if (targetImage && onServiceBook) {
      onServiceBook({
        _id: targetImage.serviceId,
        name: targetImage.serviceName,
        price: targetImage.servicePrice,
        duration: targetImage.serviceDuration
      });
      // Ne fermer le modal que si on est dans le modal
      if (selectedImage) {
        setShowModal(false);
      }
    }
  };

  // Fonctions de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const handleLikeClick = async (image: GalleryImage) => {
    try {
      // Appeler le service pour liker/unliker
      const response = await coiffeurService.toggleServiceLike(coiffeurId, image.serviceId);
      
      // Utiliser la nouvelle structure de réponse
      const likes = response.data?.likes || response.likes || 0;
      const isLiked = response.data?.isLiked || response.isLiked || false;
      
      // Mettre à jour l'état local
      setImages(prevImages => 
        prevImages.map(img => 
          img._id === image._id 
            ? { 
                ...img, 
                likes: likes,
                isLiked: isLiked
              }
            : img
        )
      );

      // Mettre à jour l'image sélectionnée si elle est ouverte dans le modal
      if (selectedImage && selectedImage._id === image._id) {
        setSelectedImage({
          ...selectedImage,
          likes: likes,
          isLiked: isLiked
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };



  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement de la galerie...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune image</h3>
        <p className="text-gray-500">
          {isOwner 
            ? 'Ajoutez des photos d\'exemple à vos services pour enrichir votre galerie'
            : 'Ce coiffeur n\'a pas encore ajouté d\'images à sa galerie'
          }
        </p>
      </div>
    );
  }

  // Afficher la version mobile si on est sur mobile
  if (isMobile) {
    // Convertir les images en services pour InstagramGallery
    const servicesFromImages = images.map(image => ({
      _id: image.serviceId,
      name: image.serviceName,
      description: image.serviceDescription || '',
      price: image.servicePrice,
      category: image.serviceCategory || 'service',
      specialities: [],
      coiffeur: {
        _id: 'unknown',
        name: 'Coiffeur',
        rating: 0,
        address: { city: 'Ville' }
      },
      examplePhotos: [image.url],
      gallery: [{
        mediaUrl: image.url,
        mediaType: image.mediaType || 'image',
        caption: '',
        tags: [],
        likes: image.likes || 0,
        createdAt: new Date()
      }],
      likes: image.likes || 0,
      views: 0,
      popularityScore: 0,
      style: '',
      targetAudience: []
    }));
    
    return <InstagramGallery services={servicesFromImages} loading={loading} isProfileGallery={true} />;
  }

  return (
    <>
      {/* Mur d'images en grille */}
      <div className="gallery-masonry">
        {images.map((image) => (
          <div
            key={image._id}
            className="gallery-item cursor-pointer relative"
            onClick={() => handleImageClick(image)}
          >
              {image.mediaType === 'video' || image.url.includes('.mp4') || image.url.includes('.webm') || image.url.includes('.ogg') || image.url.includes('.avi') || image.url.includes('.mov') ? (
                <video
                  src={getImageUrl(image.url, DEFAULT_SERVICE_IMAGE)}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={getImageUrl(image.url, DEFAULT_SERVICE_IMAGE)}
                  alt={image.serviceName}
                  onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                />
              )}
              
              {/* Overlay avec informations */}
              <div className={`gallery-overlay ${showCardComments[image._id] ? 'gallery-overlay-visible' : ''}`}>
                <div className="gallery-overlay-content">
                  <h4 className="font-bold text-lg mb-2">{image.serviceName}</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-accent">{image.servicePrice}€</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {image.serviceDuration}min
                    </span>
                  </div>
                  
                  {/* Catégorie */}
                  {image.serviceCategory && (
                    <div className="mt-2">
                      <span className="inline-block bg-accent/20 text-white px-2 py-1 rounded-full text-xs">
                        {image.serviceCategory.charAt(0).toUpperCase() + image.serviceCategory.slice(1)}
                      </span>
                    </div>
                  )}
                  
                                     {/* Likes - Design amélioré */}
                   <div className="mt-3 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleLikeClick(image);
                         }}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-300 ${
                           image.isLiked 
                             ? 'bg-red-500 text-white shadow-lg scale-105' 
                             : 'bg-white/20 text-white hover:bg-red-500 hover:scale-105'
                         }`}
                       >
                         <FaHeart className={`text-sm ${image.isLiked ? 'text-white' : 'text-red-300'}`} />
                         <span className="text-sm font-medium">
                           {image.likes || 0}
                         </span>
                       </button>
                       
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowCardComments(prev => ({
                             ...prev,
                             [image._id]: !prev[image._id]
                           }));
                         }}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-300 ${
                           showCardComments[image._id]
                             ? 'bg-pink-500 text-white shadow-lg scale-105' 
                             : 'bg-white/20 text-white hover:bg-pink-500 hover:scale-105'
                         }`}
                       >
                         <FaComment className="text-sm" />
                         <span className="text-sm font-medium">Commentaires</span>
                       </button>
                     </div>
                     
                     {/* Bouton de réservation rapide */}
                     {!isOwner && onServiceBook && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleBookService(image);
                         }}
                         className="bg-gray-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-black transition-all duration-300 shadow-lg hover:scale-105"
                       >
                         Réserver
                       </button>
                     )}
                   </div>
                </div>
              </div>
              
              {/* Section des commentaires - Style Instagram */}
              {showCardComments[image._id] && !isMobile && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <InstagramComments
                    serviceId={image.serviceId}
                    coiffeurId={coiffeurId}
                    maxComments={3}
                    showAll={false}
                    onClose={() => setShowCardComments(prev => ({
                      ...prev,
                      [image._id]: false
                    }))}
                  />
                </div>
              )}
                             
              {/* Effet de brillance au survol */}
              <div className="gallery-shine"></div>
            </div>
          ))}
        </div>

      {/* Modal Full-Screen pour afficher l'image en grand avec slider */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Contenu du modal */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Bouton de fermeture */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image principale avec navigation */}
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex items-center justify-center">
              {selectedImage.mediaType === 'video' || selectedImage.url.includes('.mp4') || selectedImage.url.includes('.webm') || selectedImage.url.includes('.ogg') || selectedImage.url.includes('.avi') || selectedImage.url.includes('.mov') ? (
                <video
                  src={getImageUrl(selectedImage.url, DEFAULT_SERVICE_IMAGE)}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 select-none"
                  controls
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <img
                  src={getImageUrl(selectedImage.url, DEFAULT_SERVICE_IMAGE)}
                  alt={selectedImage.serviceName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 select-none"
                  onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              )}
              
              {/* Boutons de navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all duration-300 hover:scale-110"
                  >
                    <FaChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all duration-300 hover:scale-110"
                  >
                    <FaChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
            </div>
            
            {/* Informations du service - Barre fixe en bas */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <div className="max-w-4xl mx-auto">
                {/* Titre et catégorie */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedImage.serviceName}</h3>
                  {selectedImage.serviceCategory && (
                    <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImage.serviceCategory.charAt(0).toUpperCase() + selectedImage.serviceCategory.slice(1)}
                    </span>
                  )}
                </div>
                
                {/* Prix, durée et actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-3xl text-accent">{selectedImage.servicePrice}€</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/80">⏱️</span>
                      <span className="text-lg">{selectedImage.serviceDuration} min</span>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex items-center gap-4">
                    {/* Bouton Like */}
                    <button
                      onClick={() => handleLikeClick(selectedImage)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                        selectedImage.isLiked 
                          ? 'bg-red-500 text-white shadow-lg scale-105' 
                          : 'bg-white/20 text-white hover:bg-red-500 hover:text-white hover:scale-105'
                      }`}
                    >
                      <FaHeart className={`text-lg ${selectedImage.isLiked ? 'text-white' : 'text-red-300'}`} />
                      <span className="font-medium text-lg">
                        {selectedImage.likes || 0}
                      </span>
                    </button>
                    
                    {/* Bouton Commentaires */}
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                        showComments 
                          ? 'bg-pink-500 text-white shadow-lg scale-105' 
                          : 'bg-white/20 text-white hover:bg-pink-500 hover:text-white hover:scale-105'
                      }`}
                    >
                      <FaComment className="text-lg" />
                      <span className="font-medium text-lg">Commentaires</span>
                    </button>
                    
                    {/* Bouton de réservation */}
                    {onServiceBook && (
                      selectedImage.serviceCategory === 'produit' ? (
                        <button
                          onClick={() => handleBookService()}
                          className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:scale-105"
                        >
                          <FaShoppingCart />
                          Commander
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBookService()}
                          className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:scale-105"
                        >
                          <FaCalendarAlt />
                          Réserver
                        </button>
                      )
                    )}
                  </div>
                </div>
                
                {/* Description */}
                {selectedImage.serviceDescription && (
                  <div className="mt-4 text-center">
                    <p className="text-white/80 text-sm leading-relaxed">
                      {selectedImage.serviceDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Section des commentaires - Desktop uniquement */}
            {showComments && !isMobile && (
              <div className="absolute bottom-0 left-0 right-0 bg-white max-h-96 overflow-y-auto">
                <InstagramComments
                  serviceId={selectedImage.serviceId}
                  coiffeurId={coiffeurId}
                  maxComments={5}
                  showAll={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery; 