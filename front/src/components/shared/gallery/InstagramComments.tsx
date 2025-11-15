import React, { useState, useEffect } from 'react';
import { FaHeart, FaReply, FaPaperPlane, FaTrash, FaFlag, FaEllipsisV } from 'react-icons/fa';
import { getImageUrl, DEFAULT_USER_IMAGE } from '../../../utils/imageUtils';
import { commentService, Comment } from '../../../services/api/comments';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';

interface InstagramCommentsProps {
  serviceId: string;
  coiffeurId: string;
  maxComments?: number;
  showAll?: boolean;
  onClose?: () => void; // Fonction pour fermer les commentaires
}

export const InstagramComments: React.FC<InstagramCommentsProps> = ({
  serviceId,
  coiffeurId,
  maxComments = 3,
  showAll = false,
  onClose
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(showAll);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  
  const currentUser = useSelector(selectCurrentUser);

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(null);
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  // Charger les commentaires depuis l'API
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await commentService.getServiceComments(serviceId, 50, 0);
        
        if (response.success) {
          setComments(response.data);
        } else {
          setError('Erreur lors du chargement des commentaires');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        setError('Erreur lors du chargement des commentaires');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchComments();
    }
  }, [serviceId]);

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await commentService.toggleCommentLike(commentId);
      if (response.success) {
        // Mettre à jour l'état local
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? { ...comment, likes: response.data.isLiked ? [...comment.likes, currentUser?._id || ''] : comment.likes.filter(id => id !== currentUser?._id) }
            : comment
        ));
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      const response = await commentService.createComment({
        serviceId,
        coiffeurId,
        content: newComment.trim()
      });

      if (response.success) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      const response = await commentService.addReply(commentId, {
        content: replyText.trim()
      });

      if (response.success) {
        // Mettre à jour le commentaire avec la nouvelle réponse
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? { ...comment, replies: [...comment.replies, response.data] }
            : comment
        ));
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReply = async (commentId: string, replyIndex: number) => {
    try {
      const response = await commentService.toggleReplyLike(commentId, replyIndex);
      if (response.success) {
        // Mettre à jour l'état local
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                replies: comment.replies.map((reply, index) => 
                  index === replyIndex 
                    ? { 
                        ...reply, 
                        likes: response.data.isLiked 
                          ? [...reply.likes, currentUser?._id || ''] 
                          : reply.likes.filter(id => id !== currentUser?._id)
                      }
                    : reply
                )
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('Erreur lors du like de la réponse:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      const response = await commentService.deleteComment(commentId);
      if (response.success) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
        setShowMenu(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du commentaire');
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!reportReason.trim()) {
      alert('Veuillez indiquer la raison du signalement');
      return;
    }

    try {
      // Ici on appellerait l'API de signalement (à créer)
      console.log('Signalement:', { commentId, reason: reportReason });
      alert('Commentaire signalé avec succès');
      setShowReportModal(null);
      setReportReason('');
      setShowMenu(null);
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
      alert('Erreur lors du signalement');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `Il y a ${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, maxComments);

  return (
    <div className="p-4 space-y-4 relative">
      {/* Bouton fermer - seulement si onClose est fourni */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-1 transition-colors"
          title="Fermer les commentaires"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Input pour ajouter un commentaire */}
      {currentUser && (
        <form onSubmit={handleAddComment} className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
          <img
            src={getImageUrl(currentUser.profilePicture || currentUser.photo, DEFAULT_USER_IMAGE)}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_USER_IMAGE;
            }}
          />
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Ajouter un commentaire..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-pink-500 text-white text-sm rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <FaPaperPlane className="text-xs" />
              <span>{submitting ? '...' : 'Publier'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Liste des commentaires */}
      {error ? (
        <div className="text-center text-red-500 text-sm py-4">
          {error}
        </div>
      ) : (
        <>
          {displayedComments.map((comment) => (
            <div key={comment._id} className="space-y-2">
              {/* Commentaire principal */}
              <div className="flex space-x-3">
                <img
                  src={getImageUrl(comment.author.profilePicture || comment.author.photo, DEFAULT_USER_IMAGE)}
                  alt={comment.author.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_USER_IMAGE;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{comment.author.name}</span>
                      {comment.author._id === coiffeurId && (
                        <span className="text-pink-500 text-xs">Coiffeur</span>
                      )}
                    </div>
                    
                    {/* Menu dropdown pour supprimer/signaler */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === comment._id ? null : comment._id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <FaEllipsisV className="text-xs" />
                      </button>
                      
                      {showMenu === comment._id && (
                        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-32">
                          {comment.author._id === currentUser?._id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComment(comment._id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <FaTrash className="text-xs" />
                              <span>Supprimer</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReportModal(comment._id);
                                setShowMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                            >
                              <FaFlag className="text-xs" />
                              <span>Signaler</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-1">{comment.content}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatDate(comment.createdAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeComment(comment._id);
                      }}
                      className={`flex items-center space-x-1 ${
                        comment.likes.includes(currentUser?._id || '') ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      <FaHeart className={`text-xs ${comment.likes.includes(currentUser?._id || '') ? 'fill-current' : ''}`} />
                      <span>{comment.likes.length}</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingTo(replyingTo === comment._id ? null : comment._id);
                      }}
                      className="flex items-center space-x-1 text-gray-500"
                    >
                      <FaReply className="text-xs" />
                      <span>Répondre</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Input de réponse */}
              {replyingTo === comment._id && currentUser && (
                <form onSubmit={(e) => handleAddReply(comment._id, e)} className="ml-11 flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Répondre..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || submitting}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2 bg-pink-500 text-white text-sm rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '...' : 'Envoyer'}
                  </button>
                </form>
              )}

              {/* Réponses */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-2">
                  {comment.replies.map((reply, index) => (
                    <div key={index} className="flex space-x-3">
                      <img
                        src={getImageUrl(reply.author.profilePicture || reply.author.photo, DEFAULT_USER_IMAGE)}
                        alt={reply.author.name}
                        className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_USER_IMAGE;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm">{reply.author.name}</span>
                          {reply.author._id === coiffeurId && (
                            <span className="text-pink-500 text-xs">Coiffeur</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mb-1">{reply.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(reply.createdAt)}</span>
                          <button 
                            onClick={() => handleLikeReply(comment._id, index)}
                            className={`flex items-center space-x-1 ${
                              reply.likes.includes(currentUser?._id || '') ? 'text-red-500' : 'text-gray-500'
                            }`}
                          >
                            <FaHeart className={`text-xs ${reply.likes.includes(currentUser?._id || '') ? 'fill-current' : ''}`} />
                            <span>{reply.likes.length}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Bouton pour voir plus de commentaires */}
          {!showAllComments && comments.length > maxComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Voir les {comments.length - maxComments} commentaires restants
            </button>
          )}
        </>
      )}

      {/* Modal de signalement */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Signaler un commentaire</h3>
            <p className="text-sm text-gray-600 mb-4">
              Veuillez indiquer la raison du signalement :
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Décrivez le problème..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowReportModal(null);
                  setReportReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReportComment(showReportModal)}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramComments;
