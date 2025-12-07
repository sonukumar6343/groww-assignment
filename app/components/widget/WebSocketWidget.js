'use client';

import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Play, Square, RefreshCw } from 'lucide-react';

export function WebSocketWidget({ widget }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [messages, setMessages] = useState([]);
  const [latestPrices, setLatestPrices] = useState({}); // Track latest price per symbol
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (!widget.wssUrl) {
      setError('WebSocket URL not configured');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(widget.wssUrl);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        console.log('[WebSocketWidget] Connection opened');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;

        // Subscribe to all symbols
        if (widget.symbols && widget.symbols.length > 0) {
          widget.symbols.forEach(symbol => {
            ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
            console.log(`[WebSocketWidget] Subscribed to ${symbol}`);
          });
        }
      });

      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocketWidget] Message received:', data);
          
          // Extract trading data if it's in the expected format
          let tradingData = [];
          if (data.data && Array.isArray(data.data)) {
            tradingData = data.data.map(item => ({
              symbol: item.s || item.symbol || 'N/A',
              price: item.p || item.price || null,
              volume: item.v || item.volume || null,
              timestamp: item.t || item.timestamp || null,
              change: item.c || item.change || null,
              raw: item
            }));

            // Update latest prices
            setLatestPrices(prev => {
              const updated = { ...prev };
              tradingData.forEach(item => {
                if (item.symbol && item.price !== null) {
                  updated[item.symbol] = {
                    price: item.price,
                    volume: item.volume,
                    timestamp: item.timestamp,
                    lastUpdate: new Date().toISOString()
                  };
                }
              });
              return updated;
            });
          }
          
          setMessages(prev => {
            const newMessage = {
              raw: data,
              tradingData: tradingData,
              timestamp: new Date().toISOString(),
              messageType: tradingData.length > 0 ? 'trading' : 'other'
            };
            const newMessages = [newMessage, ...prev].slice(0, 100); // Keep last 100 messages
            return newMessages;
          });
        } catch (err) {
          // If not JSON, treat as plain text
          console.log('[WebSocketWidget] Message received (text):', event.data);
          setMessages(prev => {
            const newMessages = [{ 
              raw: event.data, 
              timestamp: new Date().toISOString(),
              messageType: 'text'
            }, ...prev].slice(0, 100);
            return newMessages;
          });
        }
      });

      ws.addEventListener('error', (err) => {
        console.error('[WebSocketWidget] WebSocket error:', err);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      });

      ws.addEventListener('close', () => {
        console.log('[WebSocketWidget] Connection closed');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
          console.log(`[WebSocketWidget] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
        }
      });
    } catch (err) {
      console.error('[WebSocketWidget] Error creating WebSocket:', err);
      setError(err.message || 'Failed to create WebSocket connection');
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      // Unsubscribe from all symbols before closing
      if (widget.symbols && widget.symbols.length > 0 && wsRef.current.readyState === WebSocket.OPEN) {
        widget.symbols.forEach(symbol => {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol: symbol }));
          console.log(`[WebSocketWidget] Unsubscribed from ${symbol}`);
        });
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    reconnectAttempts.current = 0;
  };

  const unsubscribe = (symbol) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol: symbol }));
      console.log(`[WebSocketWidget] Unsubscribed from ${symbol}`);
    }
  };

  const subscribe = (symbol) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
      console.log(`[WebSocketWidget] Subscribed to ${symbol}`);
    }
  };

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [widget.wssUrl]); // Reconnect if URL changes

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(volume);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle both Unix timestamp in milliseconds and ISO strings
      const date = typeof timestamp === 'number' 
        ? new Date(timestamp) 
        : new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  };

  const formatMessage = (message) => {
    if (message.raw && typeof message.raw === 'string') {
      return message.raw;
    }
    return JSON.stringify(message.raw || message, null, 2);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="text-green-600 dark:text-green-400" size={16} />;
      case 'connecting':
        return <RefreshCw className="text-yellow-600 dark:text-yellow-400 animate-spin" size={16} />;
      case 'error':
        return <WifiOff className="text-red-600 dark:text-red-400" size={16} />;
      default:
        return <WifiOff className="text-gray-600 dark:text-gray-400" size={16} />;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Connection Status Bar */}
      <div className="mb-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-xs font-semibold ${getStatusColor()}`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
            {widget.symbols && widget.symbols.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({widget.symbols.length} symbol{widget.symbols.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <button
                onClick={disconnect}
                className="px-2.5 py-1 bg-red-600 dark:bg-red-500 text-white text-xs rounded-lg hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1 transition-colors"
              >
                <Square size={12} />
                Disconnect
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={connectionStatus === 'connecting'}
                className="px-2.5 py-1 bg-green-600 dark:bg-green-500 text-white text-xs rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                <Play size={12} />
                Connect
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded mb-2">
            {error}
          </div>
        )}

        {/* Subscribed Symbols */}
        {widget.symbols && widget.symbols.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {widget.symbols.map((symbol, index) => (
              <div
                key={index}
                className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded flex items-center gap-1"
              >
                <span className="text-xs">{symbol}</span>
                {connectionStatus === 'connected' && (
                  <button
                    onClick={() => unsubscribe(symbol)}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs"
                    title="Unsubscribe"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Symbol Cards */}
      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0 overflow-hidden">
        {widget.symbols && widget.symbols.length > 0 ? (
          widget.symbols.map((symbol, index) => {
            const symbolData = latestPrices[symbol];
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 p-4 flex flex-col min-h-0 overflow-hidden"
              >
                {/* Symbol Name */}
                <div className="mb-3 flex-shrink-0">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {symbol}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {symbolData?.lastUpdate 
                      ? `Updated ${new Date(symbolData.lastUpdate).toLocaleTimeString()}`
                      : connectionStatus === 'connected' 
                        ? 'Waiting for data...'
                        : 'Not connected'
                    }
                  </div>
                </div>

                {/* Price */}
                <div className="flex-1 flex flex-col justify-center min-h-0">
                  {symbolData && symbolData.price !== null ? (
                    <>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1.5 break-words">
                        ${formatPrice(symbolData.price)}
                      </div>
                      {symbolData.volume !== null && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Vol: <span className="font-semibold">{formatVolume(symbolData.volume)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-lg text-gray-400 dark:text-gray-500">
                      {connectionStatus === 'connected' ? 'Waiting...' : 'No data'}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      symbolData && symbolData.price !== null 
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {symbolData && symbolData.price !== null ? 'Live' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Wifi size={32} className="mb-2 opacity-50 mx-auto" />
              <p className="text-sm">No symbols configured</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

