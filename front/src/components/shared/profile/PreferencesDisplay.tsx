import React from 'react';
import { FaEdit } from 'react-icons/fa';

interface PreferencesDisplayProps {
  preferences: any;
  onEdit: () => void;
}

const PreferencesDisplay: React.FC<PreferencesDisplayProps> = ({ preferences, onEdit }) => {
  if (!preferences) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">⚙️ Préférences</h4>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <FaEdit />
          Modifier
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {preferences.notifications && (
          <div>
            <h5 className="font-medium text-gray-700 mb-2">🔔 Notifications</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Email: {preferences.notifications.email ? '✅' : '❌'}</div>
              <div>SMS: {preferences.notifications.sms ? '✅' : '❌'}</div>
              <div>Push: {preferences.notifications.push ? '✅' : '❌'}</div>
              {preferences.notifications.marketing && (
                <div>Marketing: {preferences.notifications.marketing ? '✅' : '❌'}</div>
              )}
              {preferences.notifications.updates && (
                <div>Mises à jour: {preferences.notifications.updates ? '✅' : '❌'}</div>
              )}
            </div>
          </div>
        )}
        
        <div>
          <h5 className="font-medium text-gray-700 mb-2">🌍 Paramètres</h5>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Langue: {preferences.language || 'Non défini'}</div>
            <div>Thème: {preferences.theme || 'Non défini'}</div>
            {preferences.timezone && <div>Fuseau horaire: {preferences.timezone}</div>}
            {preferences.currency && <div>Devise: {preferences.currency}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesDisplay;
