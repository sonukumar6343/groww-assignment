'use client';

import { useState } from 'react';
import { Wifi, X } from 'lucide-react';
import { useStore } from '../../../lib/store';

export function WebSocketWidgetAdder({ onClose }) {
  const [widgetConfig, setWidgetConfig] = useState({
    title: 'WebSocket Widget',
    wssUrl: 'wss://ws.finnhub.io?token=',
    token: 'd4pgrq9r01qjpnav7650d4pgrq9r01qjpnav765g',
    symbols: ['AAPL', 'BINANCE:BTCUSDT', 'IC MARKETS:1'],
  });
  const [newSymbol, setNewSymbol] = useState('');

  const { addWidget } = useStore();

  const handleAddSymbol = () => {
    if (newSymbol.trim() && !widgetConfig.symbols.includes(newSymbol.trim())) {
      setWidgetConfig(prev => ({
        ...prev,
        symbols: [...prev.symbols, newSymbol.trim()],
      }));
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (symbol) => {
    setWidgetConfig(prev => ({
      ...prev,
      symbols: prev.symbols.filter(s => s !== symbol),
    }));
  };

  const handleCreateWidget = () => {
    const fullWssUrl = `${widgetConfig.wssUrl}${widgetConfig.token}`;
    
    const newWidget = {
      id: Date.now().toString(),
      title: widgetConfig.title,
      type: 'websocket',
      wssUrl: fullWssUrl,
      token: widgetConfig.token,
      symbols: widgetConfig.symbols,
      createdAt: new Date().toISOString(),
    };

    addWidget(newWidget);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Wifi className="text-purple-600 dark:text-purple-400" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add WebSocket Widget</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Widget Title</label>
              <input
                type="text"
                value={widgetConfig.title}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                placeholder="Enter widget title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">WebSocket URL</label>
              <input
                type="text"
                value={widgetConfig.wssUrl}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, wssUrl: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                placeholder="wss://ws.finnhub.io?token="
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                WebSocket server URL (token will be appended automatically)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Token</label>
              <input
                type="text"
                value={widgetConfig.token}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, token: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                placeholder="Enter your WebSocket token"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Symbols to Subscribe</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSymbol();
                      }
                    }}
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                    placeholder="Enter symbol (e.g., AAPL, BINANCE:BTCUSDT)"
                  />
                  <button
                    onClick={handleAddSymbol}
                    className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {widgetConfig.symbols.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {widgetConfig.symbols.map((symbol, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
                      >
                        <span>{symbol}</span>
                        <button
                          onClick={() => handleRemoveSymbol(symbol)}
                          className="text-sm hover:text-purple-200 transition-colors font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Add symbols to subscribe to. Examples: AAPL, BINANCE:BTCUSDT, IC MARKETS:1
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWidget}
              disabled={!widgetConfig.wssUrl || !widgetConfig.token || widgetConfig.symbols.length === 0}
              className="px-6 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Create WebSocket Widget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

