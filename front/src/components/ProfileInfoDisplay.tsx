import React from 'react';
import { FaEdit } from 'react-icons/fa';

interface ProfileInfoDisplayProps {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  onEdit: () => void;
}

const ProfileInfoDisplay: React.FC<ProfileInfoDisplayProps> = ({ 
  name, 
  email, 
  phone, 
  bio, 
  onEdit 
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">📋 Informations personnelles</h4>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <FaEdit />
          Modifier
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom complet</label>
          <p className="text-lg text-gray-900 font-medium">{name}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="text-lg text-gray-900">{email}</p>
        </div>
        
        {phone && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
            <p className="text-lg text-gray-900">{phone}</p>
          </div>
        )}
        
        {bio && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <p className="text-lg text-gray-900">{bio}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileInfoDisplay;
