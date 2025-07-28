import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/Button';
import { FaStar } from 'react-icons/fa';

interface ReviewFormProps {
  coiffeurId: string;
  coiffeurName: string;
  bookingId: string;
  onSubmit: (review: ReviewData) => Promise<void>;
  onCancel: () => void;
}

interface ReviewData {
  rating: number;
  comment: string;
  bookingId: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  coiffeurId, 
  coiffeurName, 
  bookingId, 
  onSubmit, 
  onCancel 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Veuillez donner une note');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ rating, comment, bookingId });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Laisser un avis</h3>
      <p className="text-gray-600 mb-4">
        Comment s'est passée votre prestation avec {coiffeurName} ?
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-2">Note</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                <FaStar />
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {rating > 0 && `${rating}/5 étoiles`}
          </p>
        </div>

        {/* Commentaire */}
        <div>
          <label className="block text-sm font-medium mb-2">Commentaire</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            rows={4}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 bg-accent hover:bg-accent/90"
          >
            {loading ? 'Envoi...' : 'Envoyer l\'avis'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400"
          >
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ReviewForm; 