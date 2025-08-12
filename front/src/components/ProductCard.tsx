import React, { useState } from 'react';
import { FaHeart, FaShoppingCart, FaEdit, FaTrash } from 'react-icons/fa';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    keywords?: string[];
    images?: string[];
    likes?: number;
    isLiked?: boolean;
  };
  isOwner?: boolean;
  showBuyButton?: boolean;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onBuy?: (product: any) => void;
  onLike?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isOwner = false, 
  showBuyButton = false,
  onEdit, 
  onDelete, 
  onBuy,
  onLike
}) => {
  const [quantity, setQuantity] = useState(1);

  const getCategoryColor = (category: string) => {
    const colors = {
      shampooing: 'bg-blue-100 text-blue-800',
      'après-shampooing': 'bg-purple-100 text-purple-800',
      masque: 'bg-pink-100 text-pink-800',
      sérum: 'bg-green-100 text-green-800',
      lisseur: 'bg-orange-100 text-orange-800',
      'sèche-cheveux': 'bg-gray-100 text-gray-800',
      accessoires: 'bg-teal-100 text-teal-800',
      autre: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.autre;
  };

  const handleBuy = () => {
    if (onBuy) {
      onBuy({
        ...product,
        quantity: quantity
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-fashion-light-gray">
      {/* Image du produit */}
      {product.images && product.images.length > 0 && (
        <div className="mb-3">
          <img
            src={getImageUrl(product.images[0], DEFAULT_PRODUCT_IMAGE)}
            alt={product.name}
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <div className="flex items-center gap-2">
          {onLike && !isOwner && (
            <button
              onClick={() => onLike(product._id)}
              className={`transition-colors ${
                product.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <FaHeart className="text-sm" />
            </button>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
            {product.category}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{product.description}</p>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-accent font-bold text-lg">{product.price}€</span>
        {product.likes && product.likes > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <FaHeart className="text-red-500" />
            <span>{product.likes}</span>
          </div>
        )}
      </div>

      {/* Mots-clés */}
      {product.keywords && product.keywords.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {product.keywords.slice(0, 3).map((keyword, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isOwner ? (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(product._id)}
                className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <FaEdit className="text-xs" />
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(product._id)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <FaTrash className="text-xs" />
                Supprimer
              </button>
            )}
          </>
        ) : (
          <>
            {/* Sélecteur de quantité */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Qté:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            {/* Bouton Commander */}
            {showBuyButton && onBuy && (
              <button
                onClick={handleBuy}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <FaShoppingCart className="text-sm" />
                Commander ({quantity})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 