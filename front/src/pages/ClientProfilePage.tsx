import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setUser, User as AuthUser } from '../store/slices/authSlice';
import { useParams } from 'react-router-dom';
import { userService } from '../services/api/users';
import type { User as UserModel } from '../types/models';

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const ClientProfilePage = () => {
  const dispatch = useDispatch();
  const { id: paramId } = useParams();
  const user = useSelector(selectCurrentUser) as UserModel | null;
  const id = paramId || user?._id;
  const [photoPreview, setPhotoPreview] = useState<string>(user?.photo || '');
  const [success, setSuccess] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [profile, setProfile] = useState<UserModel | null>(null);

  const defaultName = profile?.name || user?.name || '';
  const defaultEmail = profile?.email || user?.email || '';
  const defaultPhoto = profile?.photo || user?.photo || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSuccess('');
      setErrorMsg('');
      if (!id) {
        setErrorMsg("Impossible de retrouver l'utilisateur.");
        return;
      }
      const payload: any = {
        name: data.name,
        email: data.email,
        photo: photoPreview,
      };
      if (data.password) {
        if (data.password === data.confirmPassword) {
          payload.password = data.password;
        } else {
          setErrorMsg('Les mots de passe ne correspondent pas');
          return;
        }
      }
      const updatedUser = await userService.updateUser(id, payload);
      // Ne jamais mapper admin côté front
      let mappedRole: 'client' | 'coiffeur' = 'client';
      if (updatedUser.role === 'coiffeur') mappedRole = 'coiffeur';
      // Si jamais admin, fallback sur client
      dispatch(setUser({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: mappedRole,
        photo: updatedUser.photo
      }));
      setSuccess('Profil mis à jour avec succès !');
    } catch (error) {
      setErrorMsg('Erreur lors de la mise à jour du profil');
      console.error('Erreur:', error);
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    userService.getUser(id)
      .then((data) => {
        setProfile(data);
        reset({
          name: data.name,
          email: data.email,
          password: '',
          confirmPassword: '',
        });
        setPhotoPreview(data.photo || '');
      })
      .catch(() => setProfile(null));
  }, [id, reset]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMsg}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <img
            src={photoPreview || defaultPhoto || '/default-avatar.png'}
            alt="Preview"
            className="w-24 h-24 rounded-full mb-4 object-cover bg-gray-100"
          />
          <input
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            className="mb-4"
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              {...register('name', { required: 'Le nom est requis' })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email', { required: 'L\'email est requis' })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              {...register('password', {
                minLength: { value: 6, message: 'Le mot de passe doit faire au moins 6 caractères' },
              })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                validate: (value) => value === password || 'Les mots de passe ne correspondent pas',
              })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </form>
      {Array.isArray(profile?.services) && profile.services.map((service, idx) => (
        <div key={idx}>{typeof service === 'object' && service !== null && 'name' in service ? (typeof service.name === 'string' ? service.name : String(service.name)) : String(service)}</div>
      ))}
    </div>
  );
};

export default ClientProfilePage; 