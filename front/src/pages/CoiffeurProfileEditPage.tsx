import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setUser } from '../store/slices/authSlice';
import { Input } from '../components/ui/Input';

interface GalleryImage {
  id: string;
  url: string;
}

const initialGallery: GalleryImage[] = JSON.parse(localStorage.getItem('coiffeur_gallery') || '[]');

const CoiffeurProfileEditPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('Passionné(e) par la coiffure, à votre service !');
  const [specialties, setSpecialties] = useState('Coupe homme, Brushing, Coloration');
  const [experience, setExperience] = useState('5');
  const [diplomas, setDiplomas] = useState('CAP Coiffure');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);
  const [tarifs, setTarifs] = useState('Coupe: 30€, Brushing: 25€');
  const [success, setSuccess] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: GalleryImage[] = Array.from(files).map((file) => {
        const id = Math.random().toString(36).substr(2, 9);
        return { id, url: URL.createObjectURL(file) };
      });
      setGallery((prev) => {
        const updated = [...prev, ...newImages];
        localStorage.setItem('coiffeur_gallery', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleRemoveImage = (id: string) => {
    setGallery((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      localStorage.setItem('coiffeur_gallery', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    dispatch(setUser({
      id: user.id,
      name,
      photo,
      email: user.email,
      role: user.role
    }));
    setSuccess('Profil mis à jour !');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Mon profil professionnel</h1>
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-2">
          <img src={photo || '/default-avatar.png'} alt="Profil" className="w-24 h-24 rounded-full object-cover bg-gray-100" />
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>
        <Input label="Nom" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Bio / Description" value={bio} onChange={e => setBio(e.target.value)} required />
        <Input label="Spécialités" value={specialties} onChange={e => setSpecialties(e.target.value)} required />
        <Input label="Années d'expérience" value={experience} onChange={e => setExperience(e.target.value)} required />
        <Input label="Diplômes / Certifications" value={diplomas} onChange={e => setDiplomas(e.target.value)} required />
        <Input label="Adresse du salon (optionnel)" value={address} onChange={e => setAddress(e.target.value)} />
        <Input label="Tarifs principaux" value={tarifs} onChange={e => setTarifs(e.target.value)} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Galerie de réalisations</label>
          <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {gallery.map((img) => (
              <div key={img.id} className="relative group">
                <img src={img.url} alt="Réalisation" className="w-full h-24 object-cover rounded" />
                <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full bg-accent text-white py-2 rounded-lg hover:bg-accent/90 transition-colors">Enregistrer</button>
      </form>
    </div>
  );
};

export default CoiffeurProfileEditPage; 