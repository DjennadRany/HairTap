import React, { useState, useEffect } from 'react';
import { FaBox, FaTruck, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { orderService, Order } from '../services/api/orders';

interface OrdersManagementProps {
  coiffeurId: string;
}

const OrdersManagement: React.FC<OrdersManagementProps> = ({ coiffeurId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [coiffeurId, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const ordersData = await orderService.getCoiffeurOrders(coiffeurId, status);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingOrder(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Rafraîchir la liste
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaBox className="text-yellow-500" />;
      case 'paid': return <FaCheck className="text-blue-500" />;
      case 'shipped': return <FaTruck className="text-purple-500" />;
      case 'delivered': return <FaCheck className="text-green-500" />;
      case 'cancelled': return <FaTimes className="text-red-500" />;
      default: return <FaBox className="text-gray-500" />;
    }
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <button
            onClick={() => handleStatusUpdate(order._id, 'paid')}
            disabled={updatingOrder === order._id}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {updatingOrder === order._id ? <FaSpinner className="animate-spin" /> : 'Marquer payé'}
          </button>
        );
      case 'paid':
        return (
          <button
            onClick={() => handleStatusUpdate(order._id, 'shipped')}
            disabled={updatingOrder === order._id}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            {updatingOrder === order._id ? <FaSpinner className="animate-spin" /> : 'Marquer expédié'}
          </button>
        );
      case 'shipped':
        return (
          <button
            onClick={() => handleStatusUpdate(order._id, 'delivered')}
            disabled={updatingOrder === order._id}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {updatingOrder === order._id ? <FaSpinner className="animate-spin" /> : 'Marquer livré'}
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
        <p className="text-gray-600">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
                      className={`px-4 py-2 rounded-lg ${selectedStatus === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Toutes
        </button>
        <button
          onClick={() => setSelectedStatus('pending')}
                      className={`px-4 py-2 rounded-lg ${selectedStatus === 'pending' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          En attente
        </button>
        <button
          onClick={() => setSelectedStatus('paid')}
                      className={`px-4 py-2 rounded-lg ${selectedStatus === 'paid' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Payées
        </button>
        <button
          onClick={() => setSelectedStatus('shipped')}
                      className={`px-4 py-2 rounded-lg ${selectedStatus === 'shipped' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Expédiées
        </button>
        <button
          onClick={() => setSelectedStatus('delivered')}
                      className={`px-4 py-2 rounded-lg ${selectedStatus === 'delivered' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Livrées
        </button>
      </div>

      {/* Liste des commandes */}
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{order.product.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Client:</span> {order.customerInfo.name}
                    </div>
                    <div>
                      <span className="font-medium">Quantité:</span> {order.quantity}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span> {order.totalPrice}€
                    </div>
                    <div>
                      <span className="font-medium">Livraison:</span> {order.deliveryOption}
                    </div>
                  </div>
                  
                  {order.deliveryAddress && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Adresse:</span> {order.deliveryAddress}
                    </div>
                  )}
                  
                  <div className="mt-2 text-sm text-gray-500">
                    Commandé le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {getStatusIcon(order.status)}
                  {getStatusActions(order)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManagement; 