import React from 'react';
import { FaComments, FaUsers, FaBell, FaShieldAlt } from 'react-icons/fa';

export const ChatWelcome: React.FC = () => {
  const features = [
    {
      icon: <FaComments className="text-blue-500" />,
      title: 'Conversations en temps réel',
      description: 'Discutez directement avec vos coiffeurs préférés'
    },
    {
      icon: <FaUsers className="text-green-500" />,
      title: 'Profils vérifiés',
      description: 'Tous nos coiffeurs sont authentifiés et vérifiés'
    },
    {
      icon: <FaBell className="text-purple-500" />,
      title: 'Notifications intelligentes',
      description: 'Soyez informé des réponses et du statut en ligne'
    },
    {
      icon: <FaShieldAlt className="text-orange-500" />,
      title: 'Messages sécurisés',
      description: 'Vos conversations sont privées et sécurisées'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Bienvenue dans votre espace de chat
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connectez-vous avec vos coiffeurs préférés, posez des questions sur leurs services, 
          et prenez rendez-vous en toute simplicité.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-6 text-left hover:bg-gray-100 transition-colors">
            <div className="text-2xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-3">🚀 Comment commencer ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-white text-accent rounded-full w-6 h-6 flex items-center justify-center font-bold">1</span>
            <span>Parcourez les profils des coiffeurs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white text-accent rounded-full w-6 h-6 flex items-center justify-center font-bold">2</span>
            <span>Cliquez sur "Envoyer un message"</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white text-accent rounded-full w-6 h-6 flex items-center justify-center font-bold">3</span>
            <span>Choisissez un message de départ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
