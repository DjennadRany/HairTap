import React, { useState, useEffect } from 'react';
import { selectCurrentUser } from '../store/slices/authSlice';
import { productService, Product } from '../services/api/products';
import ProductOrderModal from './ProductOrderModal';
import { FaHeart, FaHeartBroken, FaShoppingCart, FaSpinner } from 'react-icons/fa';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import { useAppSelector } from '../store/hooks';

interface ProductGalleryProps {
  coiffeurId: string;
  isOwner?: boolean;
  onProductBuy?: (product: Product) => void;
}

interface GalleryProduct {
  _id: string;
  url: string;
  productName: string;
  productPrice: number;
  productDescription: string;
  productCategory: string;
  productId: string;
  likes: number;
  isLiked: boolean;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  coiffeurId,
  isOwner = false,
  onProductBuy
}) => {
  const user = useAppSelector(selectCurrentUser);
  const [products, setProducts] = useState<GalleryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!coiffeurId) {
      console.log('❌ coiffeurId manquant dans ProductGallery');
      return;
    }
    fetchGalleryProducts();
  }, [coiffeurId]);

  const fetchGalleryProducts = async () => {
    try {
      setLoading(true);
      console.log('🛍️ Fetching gallery products for coiffeurId:', coiffeurId);
      
      const productsData = await productService.getCoiffeurProducts(coiffeurId);
      console.log('✅ Produits récupérés pour galerie:', productsData.length);
      
      const galleryProducts: GalleryProduct[] = [];
      
      productsData.forEach(product => {
        // Toujours créer une entrée pour chaque produit
        galleryProducts.push({
          _id: `product_${product._id}`,
          url: product.images && product.images.length > 0 ? product.images[0] : DEFAULT_PRODUCT_IMAGE,
          productName: product.name,
          productPrice: product.price,
          productDescription: product.description,
          productCategory: product.category,
          productId: product._id,
          likes: product.likes || 0,
          isLiked: product.isLiked || false
        });
      });
      
      console.log('🛍️ Images de galerie produits créées:', galleryProducts.length);
      setProducts(galleryProducts);
    } catch (error) {
      console.error('Error fetching gallery products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductLike = async (productId: string) => {
    try {
      const response = await productService.toggleProductLike(coiffeurId, productId);
      console.log('❤️ Like toggle response:', response);
      
      // Mettre à jour l'état local
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.productId === productId 
            ? { 
                ...product, 
                likes: response.likes, 
                isLiked: response.isLiked 
              }
            : product
        )
      );
    } catch (error) {
      console.error('Error toggling product like:', error);
    }
  };

  const handleProductBuy = (product: GalleryProduct) => {
    // Trouver le produit complet dans les données
    const fullProduct: Product = {
      _id: product.productId,
      name: product.productName,
      description: product.productDescription,
      price: product.productPrice,
      category: product.productCategory,
      images: [product.url],
      stock: 0,
      deliveryOptions: ['pickup'],
      likes: product.likes,
      isLiked: product.isLiked || false,
      coiffeur: coiffeurId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSelectedProduct(fullProduct);
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <FaSpinner className="animate-spin text-4xl text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Chargement de la galerie produits...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🛍️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Aucun produit disponible
        </h3>
        <p className="text-gray-500">
          {isOwner 
            ? 'Ajoutez des produits pour qu\'ils apparaissent dans la galerie'
            : 'Ce coiffeur n\'a pas encore ajouté de produits'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Titre de la section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Galerie Produits</h2>
        <span className="text-sm text-gray-500">{products.length} produit(s)</span>
      </div>

      {/* Grille des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            onClick={() => handleProductBuy(product)}
          >
            {/* Image du produit */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={getImageUrl(product.url)}
                alt={product.productName}
                onError={handleImageError}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay avec boutons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                  {!isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductLike(product.productId);
                      }}
                      className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all duration-200"
                    >
                      {product.isLiked ? (
                        <FaHeart className="text-red-500 text-lg" />
                      ) : (
                        <FaHeartBroken className="text-gray-600 text-lg" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductBuy(product);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
                  >
                    <FaShoppingCart className="text-sm" />
                    Commander
                  </button>
                </div>
              </div>
            </div>

            {/* Informations du produit */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-lg line-clamp-2">
                  {product.productName}
                </h3>
                <span className="text-accent font-bold text-lg">
                  {product.productPrice}€
                </span>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {product.productDescription}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {product.productCategory}
                </span>
                
                {!isOwner && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <FaHeart className="text-sm" />
                    <span className="text-sm">{product.likes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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

export default ProductGallery; 