import React, { useState, useEffect } from 'react';
import { FaSpinner, FaImage, FaChevronLeft, FaChevronRight, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { coiffeurService } from '../services/api/coiffeurs';
import { getImageUrl, handleImageError, DEFAULT_SERVICE_IMAGE } from '../utils/imageUtils';
import Modal from './ui/Modal';
import BookingButton from './ui/BookingButton';
import '../styles/gallery.css';

interface GalleryProps {
  coiffeurId: string;
  isOwner?: boolean;
  onServiceBook?: (service: any) => void;
}

interface GalleryImage {
  _id: string;
  url: string;
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
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!coiffeurId) {
      console.log('❌ coiffeurId manquant dans Gallery');
      return;
    }
    fetchGalleryImages();
  }, [coiffeurId]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching gallery images for coiffeurId:', coiffeurId);
      console.log('🔍 Type de coiffeurId:', typeof coiffeurId);
      console.log('🔍 coiffeurId est défini:', !!coiffeurId);
      
      if (!coiffeurId) {
        console.error('❌ coiffeurId est undefined ou null');
        return;
      }
      
      // Récupérer UNIQUEMENT les services (pas les produits)
      const services = await coiffeurService.getCoiffeurServices(coiffeurId);
      
      console.log('✅ Services récupérés:', services.length);
      
      const galleryImages: GalleryImage[] = [];
      
      // Ajouter UNIQUEMENT les images des services
      services.forEach(service => {
        if (service.examplePhotos && service.examplePhotos.length > 0) {
          service.examplePhotos.forEach((photo: string) => {
            galleryImages.push({
              _id: `${service._id}_${photo}`,
              url: photo,
              serviceName: service.name,
              servicePrice: service.price,
              serviceDuration: service.duration,
              serviceId: service._id,
              serviceDescription: service.description,
              serviceCategory: service.category,
              likes: service.likes || 0,
              isLiked: service.isLiked || false
            });
          });
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
    setCurrentSlide(0);
  };

  const nextSlide = () => {
    if (selectedImage) {
      const serviceImages = images.filter(img => img.serviceId === selectedImage.serviceId);
      const nextIndex = (currentSlide + 1) % serviceImages.length;
      setCurrentSlide(nextIndex);
      setSelectedImage(serviceImages[nextIndex]);
    }
  };

  const prevSlide = () => {
    if (selectedImage) {
      const serviceImages = images.filter(img => img.serviceId === selectedImage.serviceId);
      const prevIndex = currentSlide === 0 ? serviceImages.length - 1 : currentSlide - 1;
      setCurrentSlide(prevIndex);
      setSelectedImage(serviceImages[prevIndex]);
    }
  };

  const handleBookService = () => {
    if (selectedImage && onServiceBook) {
      onServiceBook({
        _id: selectedImage.serviceId,
        name: selectedImage.serviceName,
        price: selectedImage.servicePrice,
        duration: selectedImage.serviceDuration
      });
      setShowModal(false);
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

  return (
    <>
      {/* Mur d'images en grille */}
      <div className="gallery-masonry">
        {images.map((image, index) => (
          <div
            key={image._id}
            className="gallery-item cursor-pointer"
            onClick={() => handleImageClick(image)}
          >
              <img
                src={getImageUrl(image.url, DEFAULT_SERVICE_IMAGE)}
                alt={image.serviceName}
                onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
              />
              
              {/* Overlay avec informations */}
              <div className="gallery-overlay">
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
                     </div>
                     
                     {/* Bouton de réservation rapide */}
                     {!isOwner && onServiceBook && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleBookService();
                         }}
                         className="bg-gray-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-black transition-all duration-300 shadow-lg hover:scale-105"
                       >
                         Réserver
                       </button>
                     )}
                   </div>
                </div>
              </div>
              
                             {/* Effet de brillance au survol */}
               <div className="gallery-shine"></div>
             </div>
           ))}
       </div>

      {/* Modal pour afficher l'image en grand avec slider */}
      {showModal && selectedImage && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title=""
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Image principale */}
            <div className="relative">
              <img
                src={getImageUrl(selectedImage.url, DEFAULT_SERVICE_IMAGE)}
                alt={selectedImage.serviceName}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
                onError={(e) => handleImageError(e, DEFAULT_SERVICE_IMAGE)}
              />
              
              {/* Boutons de navigation du slider */}
              {(() => {
                const serviceImages = images.filter(img => img.serviceId === selectedImage.serviceId);
                if (serviceImages.length > 1) {
                  return (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Informations du service */}
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-bold mb-3 text-gray-800">{selectedImage.serviceName}</h3>
              
              {/* Catégorie */}
              {selectedImage.serviceCategory && (
                <div className="mb-3">
                  <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                    {selectedImage.serviceCategory.charAt(0).toUpperCase() + selectedImage.serviceCategory.slice(1)}
                  </span>
                </div>
              )}
              
                             {/* Prix et durée */}
               <div className="flex items-center justify-center gap-6 text-lg text-gray-600 mb-4">
                 <div className="flex items-center gap-2">
                   <span className="font-bold text-2xl text-accent">{selectedImage.servicePrice}€</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-gray-500">⏱️</span>
                   <span>{selectedImage.serviceDuration} min</span>
                 </div>
                                                                      {/* Likes dans le modal - Design amélioré */}
                                   <div className="flex items-center gap-2">
                                     <button
                                       onClick={() => handleLikeClick(selectedImage)}
                                       className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                         selectedImage.isLiked 
                                           ? 'bg-red-500 text-white shadow-lg scale-105' 
                                           : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white hover:scale-105'
                                       }`}
                                     >
                                       <FaHeart className={`text-lg ${selectedImage.isLiked ? 'text-white' : 'text-red-400'}`} />
                                       <span className="font-medium">
                                         {selectedImage.likes || 0}
                                       </span>
                                     </button>
                                   </div>
               </div>
              
              {/* Description */}
              {selectedImage.serviceDescription && (
                <div className="mb-6 text-left">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Description du service</h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {selectedImage.serviceDescription}
                  </p>
                </div>
              )}
              
                             {/* Bouton de réservation/commande */}
               {onServiceBook && (
                 selectedImage.serviceCategory === 'produit' ? (
                   <button
                     onClick={handleBookService}
                     className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-black transition-colors flex items-center gap-2 mx-auto font-medium shadow-lg"
                   >
                     <FaShoppingCart />
                     Commander ce produit
                   </button>
                 ) : (
                   <BookingButton onClick={handleBookService} />
                 )
               )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Gallery; 