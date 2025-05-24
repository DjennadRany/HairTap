import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { useForm } from 'react-hook-form';

interface Service {
  name: string;
  price: number;
  duration: string;
}

interface CoiffeurProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  services: Service[];
  mode: ('salon' | 'domicile')[];
  availability: string[];
  cancellationPolicy: string;
  photo?: string;
}

const defaultServices = [
  'Coupe Homme',
  'Coupe Femme',
  'Brushing',
  'Coloration',
  'Mèches',
  'Balayage',
];

const defaultAvailability = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

const CoiffeurProfileEditPage = () => {
  const user = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, setValue } = useForm<CoiffeurProfile>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/coiffeurs/${user?.id}`
        );
        const data = await response.json();
        
        // Pré-remplir le formulaire avec les données existantes
        Object.entries(data).forEach(([key, value]) => {
          setValue(key as keyof CoiffeurProfile, value);
        });
      } catch (error) {
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, setValue]);

  const onSubmit = async (data: CoiffeurProfile) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/coiffeurs/${user?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour du profil');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier mon profil</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Profil mis à jour avec succès
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom commercial
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                {...register('name')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full p-2 border rounded-lg"
                {...register('email')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                className="w-full p-2 border rounded-lg"
                {...register('phone')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                {...register('address')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full p-2 border rounded-lg"
                rows={4}
                {...register('description')}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          {/* Mode d'exercice */}
          <h2 className="text-lg font-semibold mb-4">Mode d'exercice</h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                value="salon"
                {...register('mode')}
              />
              <span>En salon</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                value="domicile"
                {...register('mode')}
              />
              <span>À domicile</span>
            </label>
          </div>
        </Card>

        <Card className="p-6">
          {/* Services et tarifs */}
          <h2 className="text-lg font-semibold mb-4">Services et tarifs</h2>
          <div className="space-y-4">
            {defaultServices.map((service, index) => (
              <div key={service} className="flex items-center gap-4">
                <input
                  type="text"
                  defaultValue={service}
                  className="flex-1 p-2 border rounded-lg"
                  {...register(`services.${index}.name`)}
                />
                <input
                  type="number"
                  placeholder="Prix"
                  className="w-24 p-2 border rounded-lg"
                  {...register(`services.${index}.price`)}
                />
                <span className="text-gray-600">€</span>
                <input
                  type="text"
                  placeholder="Durée"
                  className="w-24 p-2 border rounded-lg"
                  {...register(`services.${index}.duration`)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          {/* Disponibilités */}
          <h2 className="text-lg font-semibold mb-4">Disponibilités</h2>
          <div className="grid grid-cols-2 gap-4">
            {defaultAvailability.map((day) => (
              <label key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  value={day}
                  {...register('availability')}
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          {/* Politique d'annulation */}
          <h2 className="text-lg font-semibold mb-4">Politique d'annulation</h2>
          <textarea
            className="w-full p-2 border rounded-lg"
            rows={4}
            placeholder="Décrivez votre politique d'annulation..."
            {...register('cancellationPolicy')}
          />
        </Card>

        <Button
          type="submit"
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
        >
          Enregistrer les modifications
        </Button>
      </form>
    </div>
  );
};

export default CoiffeurProfileEditPage; 