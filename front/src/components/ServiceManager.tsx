import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { coiffeurService } from '../services/api/coiffeurs';
import { FaPlus, FaEdit, FaTrash, FaHeart, FaHeartBroken, FaImage, FaTags, FaClock, FaEuroSign, FaStar, FaSearch } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import ServiceModal from './ServiceModal';
// ServiceImage component removed - will be reimplemented later
import ServiceCard from './ServiceCard';

// Type pour les services coiffeur avec nouvelles propriétés
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

interface ServiceManagerProps {
  coiffeurId: string;
  isOwner?: boolean;
  onServiceBook?: (serviceId: string) => void;
  onServiceLike?: (serviceId: string) => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({
  coiffeurId,
  isOwner = false,
  onServiceBook,
  onServiceLike
}) => {
  const user = useSelector(selectCurrentUser);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, [coiffeurId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const servicesData = await coiffeurService.getCoiffeurServices(coiffeurId);
      // Convertir les données pour inclure les propriétés par défaut
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
    setShowAddModal(true);
  };

  const handleEditService = (service: Service) => {
    console.log('handleEditService called with:', service);
    setEditingService(service);
    setShowAddModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await coiffeurService.deleteService(coiffeurId, serviceId);
        setServices(services.filter(s => s._id !== serviceId));
        setSuccessMessage('Service supprimé avec succès !');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleSubmitService = async (serviceData: any) => {
    setIsSubmitting(true);
    try {
      if (editingService) {
        const updatedService = await coiffeurService.updateService(coiffeurId, editingService._id, serviceData);
        setServices(services.map(s => s._id === editingService._id ? { ...updatedService, keywords: updatedService.keywords || [], examplePhotos: updatedService.examplePhotos || [], likes: updatedService.likes || 0, isLiked: updatedService.isLiked || false } : s));
        setSuccessMessage('Service modifié avec succès !');
      } else {
        const newService = await coiffeurService.addCoiffeurService(coiffeurId, serviceData);
        setServices([{ ...newService, keywords: newService.keywords || [], examplePhotos: newService.examplePhotos || [], likes: newService.likes || 0, isLiked: newService.isLiked || false }, ...services]);
        setSuccessMessage('Service ajouté avec succès !');
      }

      // Synchroniser la galerie avec les nouvelles images
      if (serviceData.examplePhotos && serviceData.examplePhotos.length > 0) {
        try {
          await coiffeurService.syncGallery(coiffeurId);
        } catch (error) {
          console.error('Error syncing gallery:', error);
        }
      }

      // Fermer le modal et réinitialiser
      setShowAddModal(false);
      setEditingService(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'coloration', label: 'Coloration' },
    { value: 'brushing', label: 'Brushing' },
    { value: 'lissage', label: 'Lissage' },
    { value: 'permanente', label: 'Permanente' },
    { value: 'barbe', label: 'Barbe' },
    { value: 'soin', label: 'Soin' },
    { value: 'autre', label: 'Autre' }
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement des services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages de succès */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* En-tête avec filtres et recherche */}
      <div className="bg-fashion-light-gray rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mes Services</h2>
            <p className="text-gray-600 mt-1">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} disponible{filteredServices.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {isOwner && (
            <button
              onClick={handleAddService}
              className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FaPlus /> Ajouter un service
            </button>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              placeholder="Nom, description, mots-clés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
              }}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des services */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-fashion-light-gray rounded-xl shadow-lg">
          <div className="text-gray-400 text-6xl mb-4">✂️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {isOwner ? 'Aucun service disponible' : 'Aucun service trouvé'}
          </h3>
          <p className="text-gray-500 mb-6">
            {isOwner 
              ? 'Commencez par ajouter votre premier service pour attirer des clients !'
              : 'Aucun service ne correspond à vos critères de recherche.'
            }
          </p>
          {isOwner && (
            <button
              onClick={handleAddService}
              className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Ajouter mon premier service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              isOwner={isOwner}
              onEdit={() => handleEditService(service)}
              onDelete={() => handleDeleteService(service._id)}
              onBook={onServiceBook ? () => onServiceBook(service._id) : undefined}
              onLike={onServiceLike ? () => onServiceLike(service._id) : undefined}
              showBookButton={onServiceBook !== undefined}
            />
          ))}
        </div>
      )}

      {/* Modal pour ajouter/modifier un service */}
      <ServiceModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingService(null);
        }}
        onSubmit={handleSubmitService}
        service={editingService || undefined}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ServiceManager; 