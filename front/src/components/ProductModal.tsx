import React, { useState, useEffect } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';
import Modal from './ui/Modal';
import DragDropImageUpload from './DragDropImageUpload';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: any;
  onSubmit: (productData: any) => void;
  isSubmitting: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onClose,
  product,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    keywords: ''
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        keywords: product.keywords?.join(', ') || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        keywords: ''
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertir les fichiers en URLs temporaires pour l'affichage
    const imageUrls: string[] = [];
    
    // Ajouter les images existantes
    if (product?.images) {
      imageUrls.push(...product.images);
    }
    
    // Convertir les nouveaux fichiers en URLs
    for (const file of selectedImages) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
      imageUrls.push(url);
    }
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      images: imageUrls // Envoyer les URLs des images
    };
    
    onSubmit(productData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = [
    'shampooing',
    'après-shampooing',
    'masque',
    'sérum',
    'lisseur',
    'sèche-cheveux',
    'accessoires',
    'autre'
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title={product ? 'Modifier le produit' : 'Ajouter un produit'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom du produit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Nom du produit"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Description détaillée du produit"
            rows={4}
            required
          />
        </div>

        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (€) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
              €
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-lg font-medium"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Mots-clés */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mots-clés
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => handleInputChange('keywords', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="mots-clés, séparés, par, des, virgules"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images du produit
          </label>
          <DragDropImageUpload
            onImagesChange={setSelectedImages}
            existingImages={product?.images || []}
            maxImages={5}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : (product ? 'Modifier' : 'Ajouter')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal; 