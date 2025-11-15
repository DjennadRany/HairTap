import React, { useState } from 'react';
import { FaTruck, FaStore, FaUser, FaEnvelope, FaPhone, FaSpinner } from 'react-icons/fa';
import Modal from '../../ui/Modal';
import { orderService, CreateOrderData } from '../../../services/api/orders';

interface ProductOrderModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
  coiffeurId: string;
  coiffeurAddress?: string;
}

const ProductOrderModal: React.FC<ProductOrderModalProps> = ({
  open,
  onClose,
  product,
  coiffeurId,
  coiffeurAddress
}) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryOption: 'pickup' as 'pickup' | 'delivery' | 'coiffeur',
    deliveryAddress: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      const orderData: CreateOrderData = {
        productId: product._id,
        coiffeurId: coiffeurId,
        quantity: formData.quantity,
        deliveryOption: formData.deliveryOption,
        deliveryAddress: formData.deliveryOption !== 'pickup' ? formData.deliveryAddress : undefined,
        customerInfo: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone
        }
      };

      await orderService.createOrder(orderData);
      setSuccess(true);
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setFormData({
          quantity: 1,
          deliveryOption: 'pickup',
          deliveryAddress: '',
          customerName: '',
          customerEmail: '',
          customerPhone: ''
        });
      }, 2000);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création de la commande');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDeliveryFee = () => {
    switch (formData.deliveryOption) {
      case 'delivery': return 5;
      case 'coiffeur': return 8;
      default: return 0;
    }
  };

  const totalPrice = (product.price * formData.quantity) + getDeliveryFee();

  if (success) {
    return (
      <Modal isOpen={open} onClose={onClose} title="Commande confirmée">
        <div className="text-center py-8">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Commande créée avec succès !
          </h3>
          <p className="text-gray-600">
            Votre commande a été enregistrée et sera traitée par le coiffeur.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Commander le produit">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Résumé du produit */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            {product.images && product.images[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-600">{product.price}€</p>
            </div>
          </div>
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        {/* Options de livraison */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de livraison
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="deliveryOption"
                value="pickup"
                checked={formData.deliveryOption === 'pickup'}
                onChange={(e) => handleInputChange('deliveryOption', e.target.value)}
                className="text-accent"
              />
              <FaStore className="text-gray-500" />
              <div>
                <div className="font-medium">Retrait en salon</div>
                <div className="text-sm text-gray-500">
                  {coiffeurAddress || 'Adresse du salon'}
                </div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="deliveryOption"
                value="delivery"
                checked={formData.deliveryOption === 'delivery'}
                onChange={(e) => handleInputChange('deliveryOption', e.target.value)}
                className="text-accent"
              />
              <FaTruck className="text-gray-500" />
              <div>
                <div className="font-medium">Livraison standard</div>
                <div className="text-sm text-gray-500">+5€ de frais de livraison</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="deliveryOption"
                value="coiffeur"
                checked={formData.deliveryOption === 'coiffeur'}
                onChange={(e) => handleInputChange('deliveryOption', e.target.value)}
                className="text-accent"
              />
              <FaTruck className="text-gray-500" />
              <div>
                <div className="font-medium">Livraison par le coiffeur</div>
                <div className="text-sm text-gray-500">+8€ de frais de livraison</div>
              </div>
            </label>
          </div>
        </div>

        {/* Adresse de livraison */}
        {formData.deliveryOption !== 'pickup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse de livraison
            </label>
            <textarea
              value={formData.deliveryAddress}
              onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={3}
              placeholder="Votre adresse complète"
              required
            />
          </div>
        )}

        {/* Informations client */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaUser className="text-gray-500" />
            Informations de contact
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Résumé du paiement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Résumé de la commande</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Produit ({formData.quantity}x)</span>
              <span>{product.price * formData.quantity}€</span>
            </div>
            {formData.deliveryOption !== 'pickup' && (
              <div className="flex justify-between">
                <span>Frais de livraison</span>
                <span>{getDeliveryFee()}€</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{totalPrice}€</span>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                Commander {totalPrice}€
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductOrderModal; 