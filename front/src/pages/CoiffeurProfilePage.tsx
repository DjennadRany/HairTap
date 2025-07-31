import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { userService } from '../services/api/users';
import { reviewService } from '../services/api/reviews';
import { favoriteService } from '../services/api/favorites';
import type { User } from '../types/models';
import { FaStar, FaMapMarkerAlt, FaClock, FaPhone, FaEnvelope, FaHeart, FaHeartBroken, FaCamera, FaSpinner } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import ServicesSection from '../components/ServicesSection';
import Gallery from '../components/Gallery';
import BookingForm from '../components/BookingForm';
import Modal from '../components/ui/Modal';
import { Card } from '../components/ui/card';
import FormattedBio from '../components/FormattedBio';

const CoiffeurProfilePage = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser) as User | null;
  const id = paramId || user?._id;
  const isOwner = user && user._id === id && user.role === 'coiffeur';
  const isClient = user && user.role === 'user';

  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'services' | 'reviews'>('gallery');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // États pour l'upload de photo de profil
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string>('');
  const [photoSuccess, setPhotoSuccess] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        // Récupérer les données du coiffeur
        const coiffeurData = await userService.getUser(id);
        setCoiffeur(coiffeurData);

        // Récupérer les avis du coiffeur
        const reviewsData = await reviewService.getCoiffeurReviews(id);
        setReviews(reviewsData);

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

  const handleServiceBook = (service: any) => {
    setSelectedService(service);
    setShowBookingModal(true);
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

  // Fonction pour uploader une photo de profil
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !coiffeur) return;

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setPhotoError('Fichier trop volumineux. Taille maximum : 5MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoError('');
      setPhotoSuccess('');

      const result = await userService.uploadProfilePhoto(coiffeur._id, file);
      
      if (result.success) {
        // Mettre à jour l'état local
        setCoiffeur({
          ...coiffeur,
          photo: result.photo.url
        });
        setPhotoSuccess('Photo de profil mise à jour avec succès !');
      } else {
        setPhotoError('Erreur lors de l\'upload de la photo');
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      setPhotoError(error.response?.data?.message || 'Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploadingPhoto(false);
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
    <div className="container mx-auto px-4 py-8">
      {/* En-tête du profil */}
      <div className="bg-fashion-light-gray rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Photo de profil avec upload pour le propriétaire */}
          <div className="relative">
            <div className="relative group">
              <img
                src={coiffeur.photo || '/default-avatar.png'}
                alt={coiffeur.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
              
              {/* Badge vérifié */}
              {coiffeur.sirenStatus === 'verified' && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                  <MdVerified className="text-lg" />
                </div>
              )}
              
              {/* Bouton upload pour le propriétaire - TOUJOURS VISIBLE */}
              {isOwner && (
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                    <div className="p-2 bg-fashion-light-gray/80 hover:bg-fashion-light-gray text-gray-800 rounded-full transition-colors duration-200">
                      {isUploadingPhoto ? <FaSpinner className="animate-spin" /> : <FaCamera />}
                    </div>
                  </label>
                </div>
              )}
            </div>
            
            {/* Messages d'état pour l'upload - TOUJOURS VISIBLE */}
            {isOwner && (
              <div className="mt-2 text-center">
                {photoError && (
                  <div className="text-red-600 text-xs mb-1">{photoError}</div>
                )}
                {photoSuccess && (
                  <div className="text-green-600 text-xs mb-1">{photoSuccess}</div>
                )}
                <div className="text-xs text-gray-500">
                  {isUploadingPhoto ? 'Upload en cours...' : 'Cliquez pour changer'}
                </div>
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{coiffeur.name}</h1>
              {isClient && (
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  {isFavorite ? <FaHeart /> : <FaHeartBroken />}
                </button>
              )}
            </div>

            <p className="text-gray-600 mb-2">{coiffeur.email}</p>

            {/* Note et avis */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-400" />
                <span className="font-semibold">{coiffeur.rating || 0}</span>
                <span className="text-gray-500">({coiffeur.totalRatings || 0} avis)</span>
              </div>
              {coiffeur.phone && (
                <div className="flex items-center gap-1 text-gray-600">
                  <FaPhone />
                  <span>{coiffeur.phone}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {coiffeur.bio && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">À propos</h3>
                <FormattedBio bio={coiffeur.bio} className="text-gray-700 leading-relaxed" />
              </div>
            )}

            {/* Spécialités */}
            {coiffeur.specialities && coiffeur.specialities.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Spécialités</h3>
                <div className="flex flex-wrap gap-2">
                  {coiffeur.specialities.map((speciality, index) => (
                    <span
                      key={index}
                      className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm"
                    >
                      {speciality}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mode de travail */}
            {coiffeur.workingMode && coiffeur.workingMode.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt />
                  <span>
                    {coiffeur.workingMode.includes('salon') && coiffeur.workingMode.includes('domicile')
                      ? 'Salon & Domicile'
                      : coiffeur.workingMode.includes('salon')
                      ? 'Salon uniquement'
                      : 'Domicile uniquement'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'gallery'
              ? 'bg-fashion-dark-gray text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Galerie
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'services'
              ? 'bg-fashion-dark-gray text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Services
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'reviews'
              ? 'bg-fashion-dark-gray text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Avis ({reviews.length})
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'gallery' ? (
        <Gallery
          coiffeurId={id || ''}
          isOwner={isOwner || false}
          onServiceBook={handleServiceBook}
        />
      ) : activeTab === 'services' ? (
        <ServicesSection
          coiffeurId={id || ''}
          isOwner={isOwner || false}
          onServiceBook={handleServiceBook}
          showBookButton={true}
        />
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
                  <img
                    src={review.client.photo || '/default-avatar.png'}
                    alt={review.client.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{review.client.name}</span>
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

      {/* Modal de réservation */}
      {showBookingModal && selectedService && coiffeur && (
        <Modal
          open={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title="Réserver un service"
          size="xl"
        >
          <BookingForm
            coiffeur={coiffeur}
            selectedService={selectedService}
            onSuccess={handleBookingSuccess}
            onCancel={() => setShowBookingModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default CoiffeurProfilePage; 