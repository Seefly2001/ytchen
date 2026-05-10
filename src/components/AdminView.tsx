import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { ClipboardList, Clock, CheckCircle2, XCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(qOrders, 
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );
    return unsub;
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage incoming tea orders in real-time.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-medium">{orders.filter(o => o.status === OrderStatus.PENDING).length} Pending</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-medium">{orders.filter(o => o.status === OrderStatus.PREPARING).length} Preparing</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {orders.map(order => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(-6).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900">{order.customerName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-1">${order.totalAmount}</p>
                </div>
              </div>

              <div className="p-5 flex-1 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      <span className="font-bold mr-2 text-blue-500">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-gray-400">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 flex items-center justify-between gap-2 mt-auto">
                <div className="flex gap-2">
                  {order.status === OrderStatus.PENDING && (
                    <button
                      onClick={() => updateStatus(order.id, OrderStatus.PREPARING)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      title="Start Preparing"
                    >
                      <Clock size={20} />
                    </button>
                  )}
                  {order.status === OrderStatus.PREPARING && (
                    <button
                      onClick={() => updateStatus(order.id, OrderStatus.COMPLETED)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      title="Complete Order"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                  {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
                    <button
                      onClick={() => updateStatus(order.id, OrderStatus.CANCELLED)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                      title="Cancel Order"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title="Delete Record"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-medium text-gray-500">No orders yet</h2>
          <p className="text-gray-400">When customers place orders, they will appear here.</p>
        </div>
      )}
    </div>
  );
}
