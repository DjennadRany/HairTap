import React from 'react';
import { FaCalendarAlt, FaShoppingBag, FaQuestionCircle, FaStar, FaEuroSign } from 'react-icons/fa';

interface ChatSuggestionsProps {
  coiffeurName: string;
  onSuggestionClick: (suggestion: string) => void;
  hasProducts?: boolean;
  hasServices?: boolean;
}

export const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({
  coiffeurName,
  onSuggestionClick,
  hasProducts = false,
  hasServices = false
}) => {
  const suggestions = [
    {
      id: 'greeting',
      icon: <FaStar className="text-yellow-500" />,
      title: 'Présentation simple',
      message: `Bonjour ${coiffeurName} ! J'aimerais en savoir plus sur vos services.`,
      color: 'bg-gradient-to-r from-blue-500 to-purple-600'
    },
    {
      id: 'booking',
      icon: <FaCalendarAlt className="text-blue-500" />,
      title: 'Prendre rendez-vous',
      message: `Bonjour ! Je souhaite prendre rendez-vous. Quelles sont vos disponibilités ?`,
      color: 'bg-gradient-to-r from-blue-500 to-cyan-600'
    },
    {
      id: 'service',
      icon: <FaQuestionCircle className="text-purple-500" />,
      title: 'Question sur un service',
      message: `Bonjour ! J'ai une question sur vos services. Pouvez-vous me conseiller ?`,
      color: 'bg-gradient-to-r from-purple-500 to-pink-600'
    },
    {
      id: 'pricing',
      icon: <FaEuroSign className="text-green-500" />,
      title: 'Tarifs et devis',
      message: `Bonjour ! Pourriez-vous me donner une estimation de prix pour une coupe ?`,
      color: 'bg-gradient-to-r from-green-500 to-teal-600'
    }
  ];

  // Ajouter des suggestions spécifiques si le coiffeur a des produits
  if (hasProducts) {
    suggestions.push({
      id: 'product',
      icon: <FaShoppingBag className="text-orange-500" />,
      title: 'Question sur un produit',
      message: `Bonjour ! J'ai une question sur vos produits. Pouvez-vous me conseiller ?`,
      color: 'bg-gradient-to-r from-orange-500 to-red-600'
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          💬 Démarrer une conversation
        </h3>
        <p className="text-gray-600 text-lg">
          Choisissez un message de départ qui correspond à votre besoin
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
          <span>💡</span>
          <span>Cliquez sur une suggestion pour l'envoyer directement</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.message)}
            className={`${suggestion.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-left group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl group-hover:scale-110 transition-transform">
                {suggestion.icon}
              </div>
              <h4 className="font-semibold text-lg">{suggestion.title}</h4>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              {suggestion.message}
            </p>
            <div className="mt-3 text-xs opacity-75">
              Cliquez pour utiliser ce message
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-3">
          💡 Ces suggestions vous aident à démarrer la conversation
        </p>
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
          <FaQuestionCircle />
          <span>Votre message sera envoyé dès que {coiffeurName} sera connecté</span>
        </div>
      </div>
    </div>
  );
};
