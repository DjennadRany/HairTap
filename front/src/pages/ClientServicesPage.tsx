import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { userService } from '../services/api/users';
import type { User } from '../types/models';
import { FaStar, FaMapMarkerAlt, FaClock, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import ServicesSection from '../components/ServicesSection';

const ClientServicesPage = () => {
  const { coiffeurId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser) as User | null;
  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coiffeurId) return;
    
    const fetchCoiffeur = async () => {
      try {
        setLoading(true);
        const coiffeurData = await userService.getUser(coiffeurId);
        setCoiffeur(coiffeurData);
      } catch (error) {
        console.error('Error fetching coiffeur:', error);
        setCoiffeur(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCoiffeur();
  }, [coiffeurId]);

  const handleServiceBook = (serviceId: string) => {
    navigate(`/booking/${serviceId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!coiffeur) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Coiffeur introuvable.</p>
          <button
            onClick={handleBack}
            className="mt-4 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Bouton retour */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-6"
      >
        <FaArrowLeft /> Retour
      </button>

      {/* En-tête du coiffeur */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-8 bg-white rounded-lg shadow-lg p-6">
        <div className="relative">
          <img 
            src={coiffeur.photo || '/default-avatar.png'} 
            alt={coiffeur.name} 
            className="w-40 h-40 rounded-full object-cover border-4 border-accent"
          />
          {coiffeur.sirenStatus === 'verified' && (
            <MdVerified className="absolute bottom-2 right-2 text-blue-500 text-3xl" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{coiffeur.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 font-bold flex items-center">
                <FaStar className="mr-1" /> {coiffeur.rating || 4.7}
              </span>
              <span className="text-gray-500 text-sm">({coiffeur.totalRatings || 0} avis)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            {coiffeur.specialities?.map((speciality, index) => (
              <span key={index} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm">
                {speciality}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            {coiffeur.workingMode?.map((mode, index) => (
              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                <FaMapMarkerAlt className="mr-1" /> {mode}
              </span>
            ))}
          </div>

          <p className="text-gray-700 mb-4">{coiffeur.bio}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FaClock className="text-accent" />
              <span className="text-sm">Disponible aujourd'hui</span>
            </div>
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-accent" />
              <span className="text-sm">{coiffeur.address?.city || 'Paris'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaPhone className="text-accent" />
              <span className="text-sm">{coiffeur.phone || '0700000001'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaEnvelope className="text-accent" />
              <span className="text-sm">{coiffeur.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section des services */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <ServicesSection
          coiffeurId={coiffeurId || ''}
          isOwner={false}
          onServiceBook={handleServiceBook}
        />
      </div>
    </div>
  );
};

export default ClientServicesPage; 