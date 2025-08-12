import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { productService, Product } from '../services/api/products';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import ProductOrderModal from './ProductOrderModal';
import { FaPlus } from 'react-icons/fa';

interface ProductsSectionProps {
  coiffeurId: string;
  isOwner?: boolean;
  showBuyButton?: boolean;
  onProductBuy?: (product: any) => void;
  onProductLike?: (productId: string) => void;
}



const ProductsSection: React.FC<ProductsSectionProps> = ({
  coiffeurId,
  isOwner = false,
  showBuyButton = false,
  onProductBuy,
  onProductLike
}) => {
  const user = useSelector(selectCurrentUser);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!coiffeurId) {
      console.log('❌ coiffeurId manquant dans ProductsSection');
      return;
    }
    fetchProducts();
  }, [coiffeurId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productService.getCoiffeurProducts(coiffeurId);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setEditingProduct(product);
      setShowModal(true);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await productService.deleteProduct(coiffeurId, productId);
        setSuccessMessage('Produit supprimé avec succès');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleProductSubmit = async (productData: any) => {
    try {
      setIsSubmitting(true);
      
      if (editingProduct) {
        // Modifier un produit existant
        await productService.updateProduct(coiffeurId, editingProduct._id, productData);
        setSuccessMessage('Produit modifié avec succès');
      } else {
        // Créer un nouveau produit
        await productService.addCoiffeurProduct(coiffeurId, productData);
        setSuccessMessage('Produit créé avec succès');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error submitting product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductBuy = (product: Product) => {
    setSelectedProduct(product);
    setShowOrderModal(true);
  };

  const handleProductLike = async (productId: string) => {
    if (onProductLike) {
      onProductLike(productId);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages de succès */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Produits</h2>
        {isOwner && (
          <button
            onClick={handleAddProduct}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
          >
            <FaPlus /> Ajouter un produit
          </button>
        )}
      </div>

      {/* Liste des produits */}
      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {isOwner ? 'Aucun produit créé pour le moment' : 'Aucun produit disponible'}
          </p>
          {isOwner && (
            <button
              onClick={handleAddProduct}
              className="mt-4 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors"
            >
              Créer votre premier produit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isOwner={isOwner}
              showBuyButton={showBuyButton}
              onEdit={isOwner ? handleEditProduct : undefined}
              onDelete={isOwner ? handleDeleteProduct : undefined}
              onBuy={!isOwner && showBuyButton ? handleProductBuy : undefined}
              onLike={!isOwner ? handleProductLike : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal pour ajouter/modifier un produit */}
      {showModal && (
        <ProductModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          product={editingProduct || undefined}
          onSubmit={handleProductSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Modal de commande */}
      {showOrderModal && selectedProduct && (
        <ProductOrderModal
          open={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          coiffeurId={coiffeurId}
        />
      )}
    </div>
  );
};

export default ProductsSection; 