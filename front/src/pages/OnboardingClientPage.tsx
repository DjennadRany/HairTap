import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/api/auth';

interface OnboardingFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
}

const OnboardingClientPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormData>();

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      const response = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'user',
        phone: data.phone,
        address: { street: '', city: data.city, postalCode: '' }
      });
      if (response && response.token) {
        navigate('/client/dashboard');
      }
    } catch (err) {
      alert('Erreur lors de la création du compte.');
    }
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
          label="Email"
          type="email"
          {...register('email', { required: 'L\'email est requis' })}
          error={errors.email?.message}
        />
        <Input
          label="Mot de passe"
          type="password"
          {...register('password', { required: 'Le mot de passe est requis', minLength: { value: 6, message: '6 caractères minimum' } })}
          error={errors.password?.message}
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