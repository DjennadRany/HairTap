import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectProfile } from "../store/slices/profileSlice";
import ChatWindow from "../components/ChatWindow";
import { ChatSuggestions } from "../components/ChatSuggestions";
import { ChatWelcome } from "../components/ChatWelcome";
import { getConversations } from "../hooks/useChat";
import { userService } from "../services/api/users";
import { chatService } from "../services/api/chat";
import type { User } from "../types/models";
import { getImageUrl, handleImageError, DEFAULT_USER_IMAGE } from '../utils/imageUtils';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export const ClientChatPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const profile = useAppSelector(selectProfile);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCoiffeurId, setSelectedCoiffeurId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [coiffeurs, setCoiffeurs] = useState<Record<string, User>>({});
  const [newConversationCoiffeur, setNewConversationCoiffeur] = useState<User | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hook pour récupérer les statuts de connexion
  const { status: myStatus } = useConnectionStatus(user?._id || null);

   // Charger les conversations
   useEffect(() => {
     const fetchData = async () => {
       if (user) {
         setIsLoading(true);
         try {
           const convs = await getConversations();
           
           // L'API backend retourne maintenant des conversations uniques !
           setConversations(convs);
           
           // Filtrer les conversations (exclure celles avec soi-même)
           const filteredConvs = convs.filter(conv => conv.userId !== user._id);
           setFilteredConversations(filteredConvs);

           // Récupérer les informations des coiffeurs (exclure l'utilisateur connecté)
           const coiffeurIds = filteredConvs.map(conv => conv.userId);
           const uniqueCoiffeurIds = [...new Set(coiffeurIds)];
           
           // Vérifier quels coiffeurs on n'a pas encore
           const existingCoiffeurIds = Object.keys(coiffeurs);
           const newCoiffeurIds = uniqueCoiffeurIds.filter(id => !existingCoiffeurIds.includes(id));
           
           if (newCoiffeurIds.length > 0) {
             const coiffeursData = await Promise.all(
               newCoiffeurIds.map(id => {
                 let userId: string | null = null;
                 if (typeof id === 'string') {
                   userId = id;
                 } else if (id && typeof id === 'object') {
                   userId = (id as any)._id || (id as any).id || null;
                 }
                 return userId ? userService.getUser(userId) : Promise.resolve(null);
               })
             );
             
             const newCoiffeursMap = (coiffeursData.filter((coiffeur): coiffeur is User => !!coiffeur)).reduce((acc, coiffeur) => {
               // Enrichir le coiffeur avec son statut de connexion par défaut
               const enrichedCoiffeur = {
                 ...coiffeur,
                 connectionStatus: {
                   isOnline: false, // Par défaut hors ligne
                   status: 'offline' as const,
                   lastSeen: new Date(),
                   availability: { 
                     isAvailable: false,
                     nextAvailable: undefined,
                     workingHours: {
                       monday: { start: '09:00', end: '18:00', isAvailable: false },
                       tuesday: { start: '09:00', end: '18:00', isAvailable: false },
                       wednesday: { start: '09:00', end: '18:00', isAvailable: false },
                       thursday: { start: '09:00', end: '18:00', isAvailable: false },
                       friday: { start: '09:00', end: '18:00', isAvailable: false },
                       saturday: { start: '09:00', end: '18:00', isAvailable: false },
                       sunday: { start: '09:00', end: '18:00', isAvailable: false }
                     }
                   }
                 }
               };
               acc[coiffeur._id] = enrichedCoiffeur;
               return acc;
             }, {} as Record<string, User>);
             
             setCoiffeurs(prev => ({ ...prev, ...newCoiffeursMap }));
           }
         } catch (error) {
           console.error('Error fetching chat data:', error);
         } finally {
           setIsLoading(false);
         }
       }
     };

     fetchData();
     const interval = setInterval(fetchData, 30000); // Rafraîchir toutes les 30 secondes
     return () => clearInterval(interval);
   }, [user]); // Retirer coiffeurs des dépendances pour éviter les boucles

     // Mettre à jour les statuts des coiffeurs en temps réel
   useEffect(() => {
     if (Object.keys(coiffeurs).length === 0) return;
     
     const updateCoiffeursStatus = async () => {
       try {
         const { connectionService } = await import('../services/api/connection');
         
         for (const [coiffeurId, coiffeur] of Object.entries(coiffeurs)) {
           const status = await connectionService.getUserStatus(coiffeurId);
           
           setCoiffeurs(prev => ({
             ...prev,
             [coiffeurId]: {
               ...prev[coiffeurId],
               connectionStatus: status
             }
           }));
         }
       } catch (error) {
         console.error('Erreur lors de la mise à jour des statuts:', error);
       }
     };
     
     updateCoiffeursStatus();
     const interval = setInterval(updateCoiffeursStatus, 30000);
     
     return () => clearInterval(interval);
   }, [coiffeurs]);

  // Vérifier s'il y a un coiffeur spécifique dans l'URL
  useEffect(() => {
    const coiffeurId = searchParams.get('coiffeur');
    const isNewConversation = searchParams.get('new') === 'true';
    
    if (coiffeurId && user) {
      const fetchCoiffeur = async () => {
        try {
          const coiffeur = await userService.getUser(coiffeurId);
                   if (coiffeur && coiffeur.role === 'coiffeur') {
           setNewConversationCoiffeur(coiffeur);
           
           // AJOUTER LE COIFFEUR À L'ÉTAT IMMÉDIATEMENT
           setCoiffeurs(prev => ({ ...prev, [coiffeur._id]: coiffeur }));
            
                         // NE PAS CRÉER DE CONVERSATION MANUELLEMENT
             // L'API backend gère déjà les conversations
            
            // SÉLECTIONNER LA CONVERSATION (existante ou nouvelle)
            setSelectedCoiffeurId(coiffeur._id);
           
           // Toujours afficher les suggestions pour une nouvelle conversation
           setShowSuggestions(true);
            
            // Vérifier si le coiffeur a des produits
            try {
              const { productService } = await import('../services/api/products');
              const products = await productService.getCoiffeurProducts(coiffeurId);
              setHasProducts(products.length > 0);
            } catch (error) {
              setHasProducts(false);
            }
          }
        } catch (error) {
          console.error('Error fetching coiffeur:', error);
        }
      };
      fetchCoiffeur();
    }
  }, [searchParams, user, navigate]);

     // Sélectionner automatiquement la première conversation si aucune n'est sélectionnée
   useEffect(() => {
     if (filteredConversations.length > 0 && !selectedCoiffeurId && !showSuggestions) {
       setSelectedCoiffeurId(filteredConversations[0].userId);
     }
   }, [filteredConversations, selectedCoiffeurId, showSuggestions]);

  const handleConversationClick = (coiffeurId: string) => {
    setSelectedCoiffeurId(coiffeurId);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = async (message: string) => {
    if (newConversationCoiffeur && user) {
      try {
        // Envoyer le message de suggestion
        await chatService.sendMessage(newConversationCoiffeur._id, message);
        
        // Créer une conversation locale
        const newConversation = {
          userId: newConversationCoiffeur._id,
          lastMessage: {
            from: user._id,
            to: newConversationCoiffeur._id,
            content: message,
            date: new Date().toISOString(),
            read: false
          },
          unread: 0
        };
        
        // Ajouter la nouvelle conversation aux listes
        setConversations(prev => [newConversation, ...prev]);
        setFilteredConversations(prev => [newConversation, ...prev]);
        setCoiffeurs(prev => ({
          ...prev,
          [newConversationCoiffeur._id]: newConversationCoiffeur
        }));
        
        // Sélectionner la nouvelle conversation
        setSelectedCoiffeurId(newConversationCoiffeur._id);
        setShowSuggestions(false);
        
        // Nettoyer l'URL et les états
        navigate('/client/chat', { replace: true });
        setNewConversationCoiffeur(null);
        
      } catch (error) {
        console.error('Error sending suggestion message:', error);
      }
    }
  };

  if (!user) return <div>Veuillez vous connecter.</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[85vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[85vh] max-w-6xl mx-auto mt-8 border rounded-xl shadow-xl bg-white overflow-hidden">
      <div className="w-1/3 border-r p-4 overflow-y-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="font-bold text-xl mb-2 text-gray-800">💬 Mes conversations</h2>
                     <p className="text-sm text-gray-600">
             {filteredConversations.length === 0 
               ? 'Aucune conversation pour le moment' 
               : `${filteredConversations.length} conversation${filteredConversations.length > 1 ? 's' : ''}`
             }
           </p>
        </div>
        
                 {filteredConversations.length === 0 ? (
           <div className="text-center py-4">
             <ChatWelcome />
           </div>
         ) : (
                  <ul className="space-y-3">
            {filteredConversations.map((conv) => {
             const coiffeur = coiffeurs[conv.userId];
             if (!coiffeur || !coiffeur._id) {
               console.log('❌ Coiffeur manquant pour conv:', conv.userId, 'coiffeurs disponibles:', Object.keys(coiffeurs));
               return null;
             }
            const lastMsg = conv.lastMessage;
            const isUnread = conv.unread > 0;
            const isSelected = selectedCoiffeurId === conv.userId;
            
                         return (
               <li 
                 key={conv.userId} 
                 className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-accent/30 ${
                   isSelected ? 'ring-2 ring-accent bg-accent/5 border-accent/50' : ''
                 }`}
                 onClick={() => handleConversationClick(conv.userId)}
               >
                <div className="relative">
                                     {coiffeur.photo ? (
                     <img 
                       src={getImageUrl(coiffeur.photo, DEFAULT_USER_IMAGE)} 
                       alt={coiffeur.name} 
                       className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200"
                       onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                     />
                   ) : null}
                   <div className={`w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 flex items-center justify-center bg-black text-white text-2xl font-bold ${coiffeur.photo ? 'hidden' : ''}`}>
                     {coiffeur.name[0]}
                   </div>
                                     {/* Indicateur de statut de connexion - Utiliser le statut du coiffeur */}
                   <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                     coiffeur.connectionStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                   }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold truncate ${isUnread ? 'text-accent font-bold' : 'text-gray-800'}`}>
                      {coiffeur.name}
                    </span>
                    {coiffeur.sirenStatus === 'verified' && (
                      <span className="text-blue-500 text-xs" title="Coiffeur vérifié">✓</span>
                    )}
                    {isUnread && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <span className={`block text-sm truncate mb-1 ${isUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {lastMsg.from === user._id ? 'Moi: ' : coiffeur.name + ': '}{lastMsg.content}
                    </span>
                  )}
                                                        <div className="flex items-center justify-between">
                     {lastMsg && (
                       <span className="text-xs text-gray-400">
                         {new Date(lastMsg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     )}
                   </div>
                </div>
              </li>
            );
          })}
        </ul>
        )}
      </div>
                     <div className="flex-1">
          {selectedCoiffeurId ? (
            <ChatWindow 
              currentUserId={user._id} 
              otherUserId={selectedCoiffeurId} 
              otherUser={coiffeurs[selectedCoiffeurId]}
              otherUserStatus={coiffeurs[selectedCoiffeurId]?.connectionStatus}
            />
          ) : showSuggestions && newConversationCoiffeur ? (
           <div className="flex flex-col h-full">
             <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
               <div className="flex items-center gap-4">
                 <div className="relative">
                   {newConversationCoiffeur.photo ? (
                     <img
                       src={getImageUrl(newConversationCoiffeur.photo, DEFAULT_USER_IMAGE)}
                       alt={newConversationCoiffeur.name}
                       className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-200"
                       onError={(e) => handleImageError(e, DEFAULT_USER_IMAGE)}
                     />
                   ) : (
                     <div className="w-16 h-16 rounded-full bg-black text-white text-2xl font-bold flex items-center justify-center">
                       {newConversationCoiffeur.name[0]}
                     </div>
                   )}
                                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      newConversationCoiffeur.connectionStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                 </div>
                                    <div>
                     <h3 className="text-xl font-bold text-gray-800">
                       Nouvelle conversation avec {newConversationCoiffeur.name}
                     </h3>
                     <div className="flex items-center gap-2 mt-1">
                       <div className={`w-3 h-3 rounded-full ${
                         newConversationCoiffeur.connectionStatus?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                       }`} />
                       <p className={`text-sm font-medium ${
                         newConversationCoiffeur.connectionStatus?.isOnline ? 'text-green-600' : 'text-gray-500'
                       }`}>
                         {newConversationCoiffeur.connectionStatus?.isOnline ? 'En ligne' : 'Hors ligne'}
                       </p>
                     </div>
                     {!newConversationCoiffeur.connectionStatus?.isOnline && (
                       <p className="text-xs text-gray-500 mt-1">
                         Votre message sera délivré dès qu'il sera connecté
                       </p>
                     )}
                   </div>
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6">
               <ChatSuggestions
                 coiffeurName={newConversationCoiffeur.name}
                 onSuggestionClick={handleSuggestionClick}
                 hasProducts={hasProducts}
                 hasServices={true}
               />
             </div>
           </div>
         ) : filteredConversations.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
             <div className="text-6xl mb-4">💬</div>
             <h3 className="text-xl font-semibold mb-2">Aucune conversation</h3>
             <p className="text-center max-w-md">
               Vous n'avez pas encore de conversations. 
               Commencez par envoyer un message à un coiffeur depuis son profil.
             </p>
             <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
               <p className="text-blue-700 text-sm">
                 💡 <strong>Conseil :</strong> Visitez le profil d'un coiffeur et cliquez sur 
                 "Envoyer un message" pour démarrer une conversation !
               </p>
             </div>
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
             <div className="text-6xl mb-4">👆</div>
             <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
             <p className="text-center max-w-md">
               Choisissez un coiffeur dans la liste à gauche pour commencer à discuter.
             </p>
           </div>
         )}
       </div>
    </div>
  );
}; 