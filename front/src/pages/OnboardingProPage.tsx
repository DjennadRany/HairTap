import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface OnboardingProFormData {
  businessName: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  services: string;
}

const OnboardingProPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingProFormData>();

  const onSubmit = (data: OnboardingProFormData) => {
    console.log(data);
    // TODO: Implement pro registration
    navigate('/coiffeur/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Créez votre profil professionnel</h2>
        <p className="mt-2 text-gray-600">
          Présentez votre salon ou activité aux clients
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nom du salon ou de l'activité"
          {...register('businessName', { required: 'Le nom est requis' })}
          error={errors.businessName?.message}
        />

        <Input
          label="Téléphone professionnel"
          type="tel"
          {...register('phone', { required: 'Le téléphone est requis' })}
          error={errors.phone?.message}
        />

        <Input
          label="Adresse"
          {...register('address', { required: "L'adresse est requise" })}
          error={errors.address?.message}
        />

        <Input
          label="Ville"
          {...register('city', { required: 'La ville est requise' })}
          error={errors.city?.message}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Description de votre activité
          </label>
          <textarea
            {...register('description', { required: 'La description est requise' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            rows={4}
          />
          {errors.description?.message && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Services proposés (séparés par des virgules)
          </label>
          <textarea
            {...register('services', { required: 'Les services sont requis' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            rows={3}
            placeholder="Ex: Coupe homme, Coupe femme, Brushing, Coloration..."
          />
          {errors.services?.message && (
            <p className="text-sm text-red-500">{errors.services.message}</p>
          )}
        </div>

        <Button type="submit" fullWidth>
          Créer mon profil professionnel
        </Button>
      </form>
    </div>
  );
};

export default OnboardingProPage; 