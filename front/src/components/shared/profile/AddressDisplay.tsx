import React from 'react';
import { FaEdit } from 'react-icons/fa';

interface AddressDisplayProps {
  addressType: 'home' | 'office';
  address: any;
  onEdit: () => void;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ addressType, address, onEdit }) => {
  // Formater l'adresse pour l'affichage
  const formatAddress = () => {
    const parts = [];
    
    if (address.streetNumber && address.street) {
      parts.push(`${address.streetNumber} ${address.street}`);
    } else if (address.street) {
      parts.push(address.street);
    }
    
    if (address.postalCode && address.city) {
      parts.push(`${address.postalCode} ${address.city}`);
    } else if (address.city) {
      parts.push(address.city);
    }
    
    if (address.floor) parts.push(`Étage ${address.floor}`);
    if (address.apartment) parts.push(`Appartement ${address.apartment}`);
    if (address.buildingCode) parts.push(`Code ${address.buildingCode}`);
    if (address.additionalInfo) parts.push(address.additionalInfo);
    
    return parts.join(', ');
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">
          {addressType === 'home' ? '🏠 Adresse domicile' : '🏢 Adresse bureau'}
        </h4>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <FaEdit />
          Modifier
        </button>
      </div>
      
      {/* Adresse affichée en dur */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-gray-900">
          {formatAddress()}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          {address.floor && (
            <span>Étage: {address.floor}</span>
          )}
          {address.apartment && (
            <span>Appartement: {address.apartment}</span>
          )}
          {address.buildingCode && (
            <span>Code d'entrée: {address.buildingCode}</span>
          )}
          {address.additionalInfo && (
            <span className="md:col-span-2">
              Informations: {address.additionalInfo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressDisplay;
