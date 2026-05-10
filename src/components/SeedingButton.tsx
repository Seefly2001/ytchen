import { useState } from 'react';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Database, Loader2, Sparkles } from 'lucide-react';

export default function SeedingButton() {
  const [seeding, setSeeding] = useState(false);

  const seedData = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);

      // Categories
      const categories = [
        { id: 'cat-tea', name: '找好茶 Flavored Tea', order: 1 },
        { id: 'cat-milktea', name: '找奶茶 Milk Tea', order: 2 },
        { id: 'cat-latte', name: '找拿鐵 Tea Latte', order: 3 },
        { id: 'cat-fresh', name: '找新鮮 Fresh Juice', order: 4 },
      ];

      categories.forEach(cat => {
        batch.set(doc(db, 'categories', cat.id), { name: cat.name, order: cat.order });
      });

      // Products
      const products = [
        { name: '茉莉綠茶', price: 30, category: 'cat-tea', description: 'Jasmine Green Tea', isAvailable: true },
        { name: '四季春青茶', price: 30, category: 'cat-tea', description: 'Four Season Tea', isAvailable: true },
        { name: '阿薩姆紅茶', price: 30, category: 'cat-tea', description: 'Assam Black Tea', isAvailable: true },
        { name: '奶茶', price: 40, category: 'cat-milktea', description: 'Classic Milk Tea', isAvailable: true },
        { name: '珍珠奶茶', price: 40, category: 'cat-milktea', description: 'Milk Tea with Tapioca', isAvailable: true },
        { name: '波霸奶茶', price: 40, category: 'cat-milktea', description: 'Milk Tea with Large Pearls', isAvailable: true },
        { name: '紅茶拿鐵', price: 50, category: 'cat-latte', description: 'Black Tea with Fresh Milk', isAvailable: true },
        { name: '珍珠紅茶拿鐵', price: 50, category: 'cat-latte', description: 'Fresh Milk Tea with Pearls', isAvailable: true },
        { name: '檸檬汁', price: 50, category: 'cat-fresh', description: 'Fresh Lemon Juice', isAvailable: true },
        { name: '柚子茶', price: 40, category: 'cat-fresh', description: 'Yuzu Juice', isAvailable: true },
      ];

      products.forEach((p, i) => {
        const id = `p-${i}`;
        batch.set(doc(db, 'products', id), p);
      });

      await batch.commit();
      alert('Seeding successful! Products and categories are now live.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <button
      onClick={seedData}
      disabled={seeding}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
    >
      {seeding ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles size={16} />}
      初始化菜單資料
    </button>
  );
}
