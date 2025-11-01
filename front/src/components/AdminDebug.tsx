import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const AdminDebug: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="fixed top-4 right-4 bg-white p-4 border rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-red-600 mb-2">🐛 DEBUG ADMIN</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>URL actuelle:</strong> {location.pathname}
        </div>
        
        <div>
          <strong>Authentifié:</strong> {isAuthenticated ? '✅ Oui' : '❌ Non'}
        </div>
        
        <div>
          <strong>Utilisateur:</strong> {user ? user.name : 'Aucun'}
        </div>
        
        <div>
          <strong>Rôle:</strong> {user ? user.role : 'Aucun'}
        </div>
        
        <div>
          <strong>ID:</strong> {user ? user._id : 'Aucun'}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={() => navigate('/admin')}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Aller à /admin
        </button>
        
        <button
          onClick={() => navigate('/admin/users')}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Aller à /admin/users
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-500 text-white px-3 py-1 rounded text-sm"
        >
          Aller à /
        </button>
      </div>

      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        <strong>Store Redux:</strong>
        <pre className="mt-1 overflow-auto">
          {JSON.stringify({ user, isAuthenticated }, null, 2)}
        </pre>
      </div>
    </div>
  );
};
