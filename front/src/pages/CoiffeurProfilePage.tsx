import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coiffeurService } from '../services/api/coiffeurs';
import { serviceService } from '../services/api/services';
import type { User, Service } from '../types/models';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const TVA = 0.2;

const CoiffeurProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      coiffeurService.getCoiffeur(id),
      serviceService.getServicesByCoiffeur(id)
    ])
      .then(([coiffeurData, servicesData]) => {
        setCoiffeur(coiffeurData);
        setServices(servicesData);
        setGallery(coiffeurData.gallery || []);
      })
      .catch(() => {
        setCoiffeur(null);
        setServices([]);
        setGallery([]);
        setError('Coiffeur introuvable.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  if (!coiffeur) return <div className="container mx-auto px-4 py-8">{error || 'Coiffeur introuvable.'}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
        <img src={coiffeur.photos?.[0] || '/default-avatar.png'} alt={coiffeur.name} className="w-32 h-32 rounded-full object-cover border-4 border-accent" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{coiffeur.name}</h1>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-500 font-bold">{coiffeur.rating}★</span>
          </div>
          <p className="text-gray-700 mb-2">{coiffeur.bio}</p>
          <div className="text-gray-600 text-sm mb-1">Expérience : <span className="font-medium">{coiffeur.experience} ans</span></div>
          <div className="text-gray-600 text-sm mb-1">Diplômes : <span className="font-medium">{coiffeur.diplomas}</span></div>
          {coiffeur.address && <div className="text-gray-600 text-sm mb-1">Adresse : <span className="font-medium">{typeof coiffeur.address === 'string' ? coiffeur.address : `${coiffeur.address.street}, ${coiffeur.address.city}`}</span></div>}
          <div className="text-gray-600 text-sm mb-1">Tarifs : <span className="font-medium">{coiffeur.tarifs}</span></div>
          {services.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Prestations & Tarifs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s, i) => (
                  <div key={i} className="bg-white/10 border border-accent rounded-lg p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-accent">{s.name}</span>
                      <span className="text-lg font-bold">{(s.price * (1 + TVA)).toFixed(2)}€ TTC</span>
                    </div>
                    <span className="text-xs text-gray-500">Prix HT : {s.price}€</span>
                    <span className="text-xs text-gray-500">Durée : {s.duration} min</span>
                    <span className="text-xs text-gray-500">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {user && user.role !== 'coiffeur' && (
            <button onClick={() => navigate(`/booking/${id}`)} className="bg-green-600 text-white px-4 py-2 rounded mt-4">Réserver</button>
          )}
        </div>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Galerie de réalisations</h2>
        </div>
        {gallery.length === 0 ? (
          <p className="text-gray-500">Aucune photo pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img, i) => (
              <img key={i} src={img} alt="Réalisation" className="w-full h-40 object-cover rounded-lg shadow" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoiffeurProfilePage; 