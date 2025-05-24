import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { selectProfile } from '../store/slices/profileSlice';

interface ProfileFormData {
  name: string;
  location: string;
  services: string[];
  pricing: { [key: string]: number };
  availability: string[];
}

const defaultServices = ['Coupe femme', 'Brushing', 'Coloration'];
const defaultAvailability = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const ProfileEditPage = () => {
  const profile = useSelector(selectProfile);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile?.userId || '',
      location: profile?.professionalInfo?.location || '',
      services: profile?.professionalInfo?.services || defaultServices,
      pricing: profile?.professionalInfo?.pricing || {},
      availability: profile?.professionalInfo?.availability || defaultAvailability
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch(`http://localhost:3001/coiffeurs/${profile?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          professionalInfo: {
            location: data.location,
            services: data.services,
            pricing: data.pricing,
            availability: data.availability
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      // TODO: Dispatch update profile success
    } catch (error) {
      console.error('Erreur:', error);
      // TODO: Dispatch update profile error
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier mon profil</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Informations de base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du salon
            </label>
            <input
              type="text"
              {...register('name', { required: 'Le nom est requis' })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Localisation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              {...register('location', { required: 'L\'adresse est requise' })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Services et tarifs */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Services et tarifs</h2>
            {defaultServices.map((service: string, index: number) => (
              <div key={service} className="flex items-center gap-4 mb-2">
                <input
                  type="text"
                  defaultValue={service}
                  className="flex-1 p-2 border rounded-lg"
                  {...register(`services.${index}`)}
                />
                <input
                  type="number"
                  defaultValue={profile?.professionalInfo?.pricing[service] || 0}
                  className="w-24 p-2 border rounded-lg"
                  {...register(`pricing.${service}`)}
                />
                <span className="text-gray-600">€</span>
              </div>
            ))}
          </div>

          {/* Disponibilités */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Disponibilités</h2>
            <div className="grid grid-cols-2 gap-4">
              {defaultAvailability.map((day: string) => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                    {...register('availability')}
                    value={day}
                    defaultChecked={profile?.professionalInfo?.availability.includes(day)}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditPage; 