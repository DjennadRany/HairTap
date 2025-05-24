import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface OnboardingFormData {
  name: string;
  phone: string;
  city: string;
}

const OnboardingClientPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormData>();

  const onSubmit = (data: OnboardingFormData) => {
    console.log(data);
    // TODO: Implement client registration
    navigate('/client/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Créez votre profil</h2>
        <p className="mt-2 text-gray-600">
          Quelques informations pour personnaliser votre expérience
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nom complet"
          {...register('name', { required: 'Le nom est requis' })}
          error={errors.name?.message}
        />

        <Input
          label="Téléphone"
          type="tel"
          {...register('phone', { required: 'Le téléphone est requis' })}
          error={errors.phone?.message}
        />

        <Input
          label="Ville"
          {...register('city', { required: 'La ville est requise' })}
          error={errors.city?.message}
        />

        <Button type="submit" fullWidth>
          Créer mon compte
        </Button>
      </form>
    </div>
  );
};

export default OnboardingClientPage; 