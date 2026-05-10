import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Category, OrderStatus, OrderItem } from '../types';
import { ShoppingCart, Tag, Coffee, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomerView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(qProducts, 
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const qCategories = query(collection(db, 'categories'));
    const unsubCategories = onSnapshot(qCategories, 
      (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)).sort((a, b) => a.order - b.order));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = async () => {
    if (!customerName.trim() || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        customerName,
        items: cart,
        totalAmount,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCart([]);
      setCustomerName('');
      setOrderComplete(true);
      setTimeout(() => setOrderComplete(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
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
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-50">
      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TeaTime Menu</h1>
          <p className="text-gray-600">Freshly brewed happiness in every cup.</p>
        </header>

        {categories.map(category => (
          <section key={category.id} className="mb-10">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
              <Tag className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">{category.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter(p => p.category === category.id && p.isAvailable)
                .map(product => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -4 }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Coffee size={48} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-lg text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">${product.price}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </section>
        ))}

        {products.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Coffee className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="mb-4">還沒有菜單資料喔！</p>
            <p className="text-sm">請點擊右上角的 "Seed Initial Data" 來匯入範例菜單。</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
          </div>
          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">${item.price * item.quantity}</span>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Empty cart.</p>
              <p className="text-xs">Add some delicious drinks!</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Who is this for?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-lg text-gray-600">Total</span>
            <span className="text-3xl font-bold text-gray-900">${totalAmount}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={isSubmitting || cart.length === 0 || !customerName.trim()}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                Place Order <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {orderComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
              <p className="text-gray-600 mb-6">We're preparing your drinks. Thank you!</p>
              <button
                onClick={() => setOrderComplete(false)}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
