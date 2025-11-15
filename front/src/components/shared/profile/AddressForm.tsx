import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { FaEye } from 'react-icons/fa';

interface AddressFormProps {
  addressType: 'home' | 'office';
  register: UseFormRegister<any>;
  onView: () => void;
  hasExistingData: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  addressType, 
  register, 
  onView, 
  hasExistingData 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">
          {addressType === 'home' ? '🏠 Adresse domicile' : '🏢 Adresse bureau'}
        </h4>
        {hasExistingData && (
          <button
            type="button"
            onClick={onView}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <FaEye />
            Voir
          </button>
        )}
      </div>
      
      {/* Formulaire d'édition des adresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de rue</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.streetNumber`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rue</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.street`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rue de la Paix"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.postalCode`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="75001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.city`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Paris"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Étage</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.floor`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2ème étage"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Appartement</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.apartment`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Apt 4B"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code d'entrée</label>
          <input
            type="text"
            {...register(`addresses.${addressType}.buildingCode`)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Informations complémentaires</label>
          <textarea
            {...register(`addresses.${addressType}.additionalInfo`)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Instructions d'accès, interphone, etc."
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
