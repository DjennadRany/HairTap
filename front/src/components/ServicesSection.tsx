import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { userService } from '../services/api/users';
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
  keywords: string[];
  examplePhotos: string[];
  likes: number;
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
      const servicesData = await userService.getCoiffeurServices(coiffeurId);
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
    setEditingService(null);
    setShowModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await userService.deleteService(coiffeurId, serviceId);
        setServices(services.filter(s => s._id !== serviceId));
        setSuccessMessage('Service supprimé avec succès !');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleLikeService = async (serviceId: string) => {
    if (!user) return;
    
    try {
      await userService.toggleServiceLike(coiffeurId, serviceId);
      setServices(services.map(service => 
        service._id === serviceId 
          ? { ...service, isLiked: !service.isLiked, likes: service.isLiked ? service.likes - 1 : service.likes + 1 }
          : service
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitService = async (serviceData: any) => {
    setIsSubmitting(true);
    try {
      if (editingService) {
        const updatedService = await userService.updateService(coiffeurId, editingService._id, serviceData);
        setServices(services.map(s => s._id === editingService._id ? { ...updatedService, keywords: updatedService.keywords || [], examplePhotos: updatedService.examplePhotos || [], likes: updatedService.likes || 0, isLiked: updatedService.isLiked || false } : s));
        setSuccessMessage('Service modifié avec succès !');
      } else {
        const newService = await userService.addCoiffeurService(coiffeurId, serviceData);
        setServices([{ ...newService, keywords: newService.keywords || [], examplePhotos: newService.examplePhotos || [], likes: newService.likes || 0, isLiked: newService.isLiked || false }, ...services]);
        setSuccessMessage('Service ajouté avec succès !');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceBook = (serviceId: string) => {
    if (onServiceBook) {
      const service = services.find(s => s._id === serviceId);
      if (service) {
        onServiceBook(service);
      }
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
    <div>
      {/* Messages de succès */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* En-tête avec bouton d'ajout */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Services</h2>
        {isOwner && (
          <button
            onClick={handleAddService}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Ajouter un service
          </button>
        )}
      </div>

      {/* Liste des services */}
      {services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {isOwner ? 'Aucun service disponible pour le moment.' : 'Aucun service disponible.'}
          </p>
          {isOwner && (
            <button
              onClick={handleAddService}
              className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Ajouter votre premier service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              isOwner={isOwner}
              showBookButton={showBookButton}
              onEdit={isOwner ? () => handleEditService(service) : undefined}
              onDelete={isOwner ? () => handleDeleteService(service._id) : undefined}
              onBook={!isOwner ? () => handleServiceBook(service._id) : undefined}
              onLike={!isOwner ? () => handleLikeService(service._id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal pour ajouter/modifier un service */}
      <ServiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitService}
        service={editingService || undefined}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ServicesSection; 