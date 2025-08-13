import React from 'react';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface ChatStatusNotificationProps {
  coiffeurName: string;
  isOnline: boolean;
  lastSeen?: Date;
  hasUnreadMessages?: boolean;
}

export const ChatStatusNotification: React.FC<ChatStatusNotificationProps> = ({
  coiffeurName,
  isOnline,
  lastSeen,
  hasUnreadMessages = false
}) => {
  const getStatusInfo = () => {
    if (isOnline) {
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        title: 'En ligne maintenant',
        message: `${coiffeurName} est actuellement en ligne et peut répondre rapidement.`,
        color: 'bg-green-50 border-green-200 text-green-800',
        iconColor: 'text-green-500'
      };
    }

    if (lastSeen) {
      const now = new Date();
      // Convertir lastSeen en Date si ce n'est pas déjà le cas
      const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
      
      // Vérifier que la date est valide
      if (isNaN(lastSeenDate.getTime())) {
        return {
          icon: <FaInfoCircle className="text-blue-500" />,
          title: 'Statut inconnu',
          message: `Nous ne pouvons pas déterminer quand ${coiffeurName} était en ligne.`,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          iconColor: 'text-blue-500'
        };
      }
      
      const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return {
          icon: <FaClock className="text-orange-500" />,
          title: 'Vu récemment',
          message: `${coiffeurName} était en ligne il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}.`,
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          iconColor: 'text-orange-500'
        };
      } else if (diffInMinutes < 1440) { // moins de 24h
        const hours = Math.floor(diffInMinutes / 60);
        return {
          icon: <FaClock className="text-yellow-500" />,
          title: 'Vu aujourd\'hui',
          message: `${coiffeurName} était en ligne il y a ${hours} heure${hours > 1 ? 's' : ''}.`,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconColor: 'text-yellow-500'
        };
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return {
          icon: <FaExclamationTriangle className="text-red-500" />,
          title: 'Absent depuis longtemps',
          message: `${coiffeurName} n'a pas été vu depuis ${days} jour${days > 1 ? 's' : ''}.`,
          color: 'bg-red-50 border-red-200 text-red-800',
          iconColor: 'text-red-500'
        };
      }
    }

    return {
      icon: <FaInfoCircle className="text-blue-500" />,
      title: 'Statut inconnu',
      message: `Nous ne pouvons pas déterminer quand ${coiffeurName} était en ligne.`,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-500'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`border rounded-xl p-4 mb-4 ${statusInfo.color}`}>
      <div className="flex items-start gap-3">
        <div className={`text-xl mt-0.5 ${statusInfo.iconColor}`}>
          {statusInfo.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{statusInfo.title}</h4>
          <p className="text-sm mb-2">{statusInfo.message}</p>
          
          {!isOnline && (
            <div className="bg-white/50 rounded-lg p-3 border border-current/20">
              <div className="flex items-center gap-2 text-sm">
                <FaInfoCircle className="text-current/70" />
                <span>
                  Votre message sera visible dès que {coiffeurName} se connectera.
                  {hasUnreadMessages && ' Il/elle a des messages non lus de votre part.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
