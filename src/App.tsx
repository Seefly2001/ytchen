/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import SeedingButton from './components/SeedingButton';
import { Coffee, Settings, LayoutDashboard, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'customer' | 'admin'>('customer');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <Coffee className="text-white" size={24} />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">TeaTime</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView('customer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                view === 'customer' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              id="view-customer-btn"
            >
              <LayoutTemplate size={16} />
              點單 (Menu)
            </button>
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                view === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              id="view-admin-btn"
            >
              <LayoutDashboard size={16} />
              後台 (Admin)
            </button>
          </div>
          
          <div className="hidden sm:block">
            <SeedingButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'customer' ? (
            <motion.div
              key="customer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <CustomerView />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <AdminView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
