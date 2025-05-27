import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { userService } from '../services/api/users';
import type { User } from '../types/models';

const getGalleryKey = (id: string) => `coiffeur_gallery_${id}`;
const getProfileKey = (id: string) => `coiffeur_profile_${id}`;
const getServicesKey = (id: string) => `coiffeur_services_${id}`;

interface Service {
  name: string;
  priceHT: number;
  duration: string;
  description: string;
}

const TVA = 0.2;

const CoiffeurProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isOwner = user && user._id === id && user.role === 'coiffeur';
  const isClient = user && user.role === 'client';

  // Charger le coiffeur depuis l'API
  const [coiffeur, setCoiffeur] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    userService.getUser(id)
      .then(setCoiffeur)
      .catch(() => setCoiffeur(null))
      .finally(() => setLoading(false));
  }, [id]);

  const initialGallery = isOwner
    ? JSON.parse(localStorage.getItem(getGalleryKey(id!)) || 'null') || coiffeur?.gallery || []
    : coiffeur?.gallery || [];
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [edit, setEdit] = useState(false);
  // Champs éditables
  const [bio, setBio] = useState(coiffeur?.bio || '');
  const [experience, setExperience] = useState(coiffeur?.experience || '');
  const [diplomas, setDiplomas] = useState(coiffeur?.diplomas || '');
  const [address, setAddress] = useState(coiffeur?.address || '');
  const [tarifs, setTarifs] = useState(coiffeur?.tarifs || '');
  // Prestations (CRUD avancé)
  const initialServices: Service[] = isOwner
    ? JSON.parse(localStorage.getItem(getServicesKey(id!)) || 'null') || []
    : coiffeur?.services || [];
  const [services, setServices] = useState<Service[]>(initialServices);
  const [newService, setNewService] = useState<Service>({ name: '', priceHT: 0, duration: '', description: '' });

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = Array.from(files).map((file) => URL.createObjectURL(file));
      setGallery((prev) => {
        const updated = [...prev, ...newImages];
        if (isOwner) localStorage.setItem(getGalleryKey(id!), JSON.stringify(updated));
        return updated;
      });
    }
  };

  React.useEffect(() => {
    if (isOwner) {
      localStorage.setItem(getGalleryKey(id!), JSON.stringify(gallery));
      localStorage.setItem(getServicesKey(id!), JSON.stringify(services));
    }
  }, [gallery, services, isOwner, id]);

  // Sauvegarde du profil édité
  const handleSave = () => {
    const profile = {
      ...coiffeur,
      bio,
      experience,
      diplomas,
      address,
      tarifs,
      gallery,
      services
    };
    localStorage.setItem(getProfileKey(id!), JSON.stringify(profile));
    setEdit(false);
  };

  const handleAddService = () => {
    if (!newService.name || !newService.priceHT || !newService.duration) return;
    setServices([...services, newService]);
    setNewService({ name: '', priceHT: 0, duration: '', description: '' });
  };

  const handleRemoveService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  if (!coiffeur) return <div className="container mx-auto px-4 py-8">Coiffeur introuvable.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
        <img src={coiffeur.photos?.[0] || '/default-avatar.png'} alt={coiffeur.name} className="w-32 h-32 rounded-full object-cover border-4 border-accent" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{coiffeur.name}</h1>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-500 font-bold">{coiffeur.rating}★</span>
            {/* <span className="text-gray-500 text-sm">({coiffeur.reviewsCount} avis)</span> */}
          </div>
          {edit ? (
            <>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full p-2 border rounded mb-2" />
              <input value={experience} onChange={e => setExperience(e.target.value)} className="p-1 border rounded mb-2 w-full" placeholder="Expérience (années)" />
              <input value={diplomas} onChange={e => setDiplomas(e.target.value)} className="p-1 border rounded mb-2 w-full" placeholder="Diplômes" />
              <input value={address} onChange={e => setAddress(e.target.value)} className="p-1 border rounded mb-2 w-full" placeholder="Adresse" />
              <input value={tarifs} onChange={e => setTarifs(e.target.value)} className="p-1 border rounded mb-2 w-full" placeholder="Tarifs principaux" />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Ajouter une prestation</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <input value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} className="p-1 border rounded" placeholder="Nom" />
                  <input type="number" value={newService.priceHT} onChange={e => setNewService({ ...newService, priceHT: Number(e.target.value) })} className="p-1 border rounded w-24" placeholder="Prix HT" />
                  <input value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} className="p-1 border rounded w-24" placeholder="Durée" />
                  <input value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} className="p-1 border rounded w-48" placeholder="Description" />
                  <button type="button" onClick={handleAddService} className="bg-accent text-white px-2 rounded">Ajouter</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {services.map((s, i) => (
                    <div key={i} className="bg-accent/10 rounded p-2 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{s.name}</span>
                        <button type="button" onClick={() => handleRemoveService(i)} className="text-red-500 ml-2">✕</button>
                      </div>
                      <span className="text-xs text-gray-500">{s.description}</span>
                      <span className="text-xs">Prix HT : {s.priceHT}€ | Prix TTC : {(s.priceHT * (1 + TVA)).toFixed(2)}€</span>
                      <span className="text-xs text-gray-500">Durée : {s.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded mt-2">Enregistrer</button>
              <button onClick={() => setEdit(false)} className="ml-2 text-gray-500 underline">Annuler</button>
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-2">{coiffeur.bio}</p>
              <div className="text-gray-600 text-sm mb-1">Expérience : <span className="font-medium">{coiffeur.experience} ans</span></div>
              <div className="text-gray-600 text-sm mb-1">Diplômes : <span className="font-medium">{coiffeur.diplomas}</span></div>
              {coiffeur.address && <div className="text-gray-600 text-sm mb-1">Adresse : <span className="font-medium">{coiffeur.address}</span></div>}
              <div className="text-gray-600 text-sm mb-1">Tarifs : <span className="font-medium">{coiffeur.tarifs}</span></div>
              {/* Grille tarifaire moderne */}
              {services.length > 0 && (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold mb-2">Prestations & Tarifs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((s, i) => (
                      <div key={i} className="bg-white/10 border border-accent rounded-lg p-4 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-accent">{s.name}</span>
                          <span className="text-lg font-bold">{(s.priceHT * (1 + TVA)).toFixed(2)}€ TTC</span>
                        </div>
                        <span className="text-xs text-gray-500">Prix HT : {s.priceHT}€</span>
                        <span className="text-xs text-gray-500">Durée : {s.duration}</span>
                        <span className="text-xs text-gray-500">{s.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isOwner && <button onClick={() => setEdit(true)} className="bg-accent text-white px-4 py-2 rounded mt-2">Modifier le profil</button>}
              {/* Bouton Réserver visible côté client */}
              {isClient && (
                <button onClick={() => navigate(`/booking/${id}`)} className="bg-green-600 text-white px-4 py-2 rounded mt-4">Réserver</button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Galerie de réalisations</h2>
          {isOwner && (
            <label className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 cursor-pointer">
              Ajouter des photos
              <input type="file" accept="image/*" multiple onChange={handleAddImages} className="hidden" />
            </label>
          )}
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