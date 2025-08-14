import React from 'react';
import { FaEdit, FaBriefcase, FaGraduationCap, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

interface CoiffeurInfoDisplayProps {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  siren?: string;
  sirenStatus?: string;
  experience?: number;
  formation?: string;
  rib?: string;
  workingMode?: string[];
  travelRadius?: number;
  specialities?: string[];
  salonAddress?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
  };
  onEdit: () => void;
}

const CoiffeurInfoDisplay: React.FC<CoiffeurInfoDisplayProps> = ({ 
  name, 
  email, 
  phone, 
  bio, 
  siren,
  sirenStatus,
  experience,
  formation,
  rib,
  workingMode,
  travelRadius,
  specialities,
  salonAddress,
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
      
      <div className="space-y-4">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <p className="text-lg text-gray-900">{bio}</p>
            </div>
          )}
        </div>

        {/* Informations professionnelles */}
        <div className="border-t pt-4">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FaBriefcase className="text-blue-600" />
            Informations professionnelles
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {siren && (
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  SIREN
                  {sirenStatus === 'verified' && <MdVerified className="text-blue-500" />}
                </label>
                <p className="text-lg text-gray-900">{siren}</p>
              </div>
            )}
            
            {experience !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Années d'expérience</label>
                <p className="text-lg text-gray-900">{experience} an(s)</p>
              </div>
            )}
            
            {formation && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaGraduationCap className="text-gray-500" />
                  Formation
                </label>
                <p className="text-lg text-gray-900">{formation}</p>
              </div>
            )}
            
            {rib && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaCreditCard className="text-gray-500" />
                  RIB
                </label>
                <p className="text-lg text-gray-900 font-mono">{rib}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mode de travail et rayon */}
        {(workingMode?.length || travelRadius) && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3">Mode de travail</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workingMode?.length && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modes de travail</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {workingMode.map((mode, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {mode === 'salon' ? 'Salon' : mode === 'domicile' ? 'Domicile' : 'Les deux'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {travelRadius && workingMode?.includes('domicile') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rayon de déplacement</label>
                  <p className="text-lg text-gray-900">{travelRadius} km</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spécialités */}
        {specialities?.length && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3">Spécialités</h5>
            <div className="flex flex-wrap gap-2">
              {specialities.map((speciality, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {speciality}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Adresse du salon */}
        {salonAddress?.street && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-600" />
              Adresse du salon
            </h5>
            
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-900">
                {salonAddress.streetNumber && `${salonAddress.streetNumber} `}
                {salonAddress.street}
              </p>
              <p className="text-gray-900">
                {salonAddress.postalCode} {salonAddress.city}
              </p>
              {salonAddress.phone && (
                <p className="text-gray-600 text-sm mt-1">
                  Tél: {salonAddress.phone}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoiffeurInfoDisplay;
