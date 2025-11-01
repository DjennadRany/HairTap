import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { coiffeurService } from '../services/api/coiffeurs';
import ServiceCard from './ServiceCard';
import ServiceModal from './ServiceModal';
import { FaPlus } from 'react-icons/fa';

interface ServicesSectionProps {
  coiffeurId: string;
  isOwner?: boolean;
  showBookButton?: boolean;
  onServiceBook?: (service: any) => void;
  onServiceLike?: (serviceId: string) => void;
}

interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  keywords?: string[];
  examplePhotos?: string[];
  likes?: number;
  isLiked?: boolean;
  coiffeur: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({
  coiffeurId,
  isOwner = false,
  showBookButton = false,
  onServiceBook,
  onServiceLike
}) => {
  const user = useSelector(selectCurrentUser);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [coiffeurId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const servicesData = await coiffeurService.getCoiffeurServices(coiffeurId);
      // Enrichir les services avec les propriétés par défaut
      const enrichedServices = servicesData.map(service => ({
        ...service,
        keywords: service.keywords || [],
        examplePhotos: service.examplePhotos || [],
        likes: service.likes || 0,
        isLiked: service.isLiked || false
      }));
      setServices(enrichedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    console.log('🔍 handleAddService appelé');
    setEditingService(null);
    setShowModal(true);
    console.log('✅ Modal ouvert:', true);
  };

  const handleEditService = (serviceId: string) => {
    const service = services.find(s => s._id === serviceId);
    if (service) {
      setEditingService(service);
      setShowModal(true);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await coiffeurService.deleteService(coiffeurId, serviceId);
        setSuccessMessage('Service supprimé avec succès');
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleServiceSubmit = async (serviceData: any) => {
    try {
      setIsSubmitting(true);
      if (editingService) {
        await coiffeurService.updateService(coiffeurId, editingService._id, serviceData);
        setSuccessMessage('Service mis à jour avec succès');
      } else {
        await coiffeurService.addCoiffeurService(coiffeurId, serviceData);
        setSuccessMessage('Service créé avec succès');
      }
      setShowModal(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error('Error submitting service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceBook = (service: any) => {
    if (service && onServiceBook) {
      onServiceBook(service);
    }
  };

  const handleServiceLike = (serviceId: string) => {
    if (onServiceLike) {
      onServiceLike(serviceId);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-2">Chargement des services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages de succès */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Liste des services */}
      {services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {isOwner ? 'Aucun service créé pour le moment' : 'Aucun service disponible'}
          </p>
          {isOwner && (
            <button
              onClick={handleAddService}
              className="mt-4 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors"
            >
              Créer votre premier service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              isOwner={isOwner}
              showBookButton={showBookButton}
              onEdit={isOwner ? handleEditService : undefined}
              onDelete={isOwner ? handleDeleteService : undefined}
              onBook={!isOwner && showBookButton ? handleServiceBook : undefined}
              onLike={!isOwner ? handleServiceLike : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal pour ajouter/modifier un service */}
      {showModal && (
        <ServiceModal
          isOpen={showModal}
          onClose={() => {
            console.log('🔍 Modal fermé');
            setShowModal(false);
            setEditingService(null);
          }}
          service={editingService || undefined}
          onSubmit={handleServiceSubmit}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};

export default ServicesSection; 