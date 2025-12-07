'use client';

import { ThemeToggle } from '../ui/themetoggle';
import { Plus, Wifi } from 'lucide-react';

export default function DashboardHeader({ onAddWidget, onAddWebSocketWidget }) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              FinBoard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onAddWebSocketWidget}
              className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Wifi size={18} />
              Add WebSocket Widget
            </button>
            <button
              onClick={onAddWidget}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} />
              Add Widget
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}