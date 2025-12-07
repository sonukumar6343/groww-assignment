'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Settings, RefreshCw, Layers, Layers3 } from 'lucide-react';
import { useStore } from '../../../lib/store';
import { ApiService } from '../../../lib/api';
import { WidgetCard } from './WidgetCard';
import { WidgetChart } from './WidgetChart';
import { WidgetTable } from './WidgetTable';
import { WidgetConfig } from './WidgetConfig';
import { WebSocketWidget } from './WebSocketWidget';

export function Widget({ widget, onHeaderMouseDown }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [lastFetchedAt, setLastFetchedAt] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const prevConfigRef = useRef(null);

    const { updateWidget, hideWidget, bringToFront, sendToBack } = useStore();
    const apiService = new ApiService();

    const fetchData = useCallback(async () => {
        if (!widget.endpoint) {
            setError('No API endpoint configured for this widget');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Build full URL with params if provided
            let url;
            try {
                url = new URL(widget.endpoint);
            } catch (e) {
                setError('Invalid API endpoint URL format');
                setLoading(false);
                return;
            }
            
            // Append additional params if provided
            Object.entries(widget.params || {}).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    url.searchParams.append(key, String(value));
                }
            });
            
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`[Widget: ${widget.title || widget.id}] Starting data fetch`);
            console.log('═══════════════════════════════════════════════════════════');
            console.log('[Widget] Endpoint:', url.toString());
            console.log('[Widget] Headers:', widget.headers || {});
            console.log('[Widget] Params:', widget.params || {});
            
            const result = await apiService.fetchData(url.toString(), {}, widget.headers || {});
            
            console.log('───────────────────────────────────────────────────────────');
            console.log(`[Widget: ${widget.title || widget.id}] API Response received`);
            console.log('───────────────────────────────────────────────────────────');
            console.log('[Widget] Response type:', Array.isArray(result) ? 'Array' : typeof result);
            console.log('[Widget] Response structure:', JSON.stringify(result, null, 2));
            console.log('[Widget] Response keys (if object):', typeof result === 'object' && result !== null && !Array.isArray(result) ? Object.keys(result) : 'N/A');
            console.log('[Widget] Array length (if array):', Array.isArray(result) ? result.length : 'N/A');

            // Extract selected fields
            if (widget.selectedFields && widget.selectedFields.length > 0) {
                console.log('───────────────────────────────────────────────────────────');
                console.log(`[Widget: ${widget.title || widget.id}] Extracting ${widget.selectedFields.length} selected field(s)`);
                console.log('───────────────────────────────────────────────────────────');
                console.log('[Widget] Widget type:', widget.type);
                console.log('[Widget] Selected fields configuration:', JSON.stringify(widget.selectedFields, null, 2));
                
                // For chart type, use the stored values array from flattened JSON
                if (widget.type === 'chart') {
                    // Chart mode stores values array in selectedFields[0].values
                    const chartField = widget.selectedFields[0];
                    if (!chartField || !chartField.values || !Array.isArray(chartField.values)) {
                        console.error('[Widget] ❌ No values array found for chart widget');
                        setError('Chart data not found. Please reconfigure the widget.');
                        setData(null);
                        return;
                    }
                    
                    console.log(`[Widget] Processing ${chartField.values.length} values for chart display`);
                    console.log(`[Widget] Chart field: "${chartField.label}" (path: "${chartField.path}")`);
                    
                    // Format data for WidgetChart: array of {label, value} objects
                    // Use index as label to preserve original order
                    const chartData = chartField.values.map((value, index) => {
                        const numValue = typeof value === 'number' ? value : Number(value);
                        return {
                            label: `Item ${index + 1}`,
                            value: isNaN(numValue) ? 0 : numValue,
                        };
                    });
                    
                    console.log(`[Widget] ✓✓✓ Successfully created chart data with ${chartData.length} points`);
                    setData(chartData);
                }
                // For table type, extract array data with selected fields as columns
                else if (widget.type === 'table') {
                    // Find the array in the response
                    let arrayData = null;
                    
                    if (Array.isArray(result)) {
                        arrayData = result;
                    } else if (typeof result === 'object' && result !== null) {
                        // Look for arrays in object values
                        for (const [key, value] of Object.entries(result)) {
                            if (Array.isArray(value) && value.length > 0) {
                                arrayData = value;
                                console.log(`[Widget] Found array in key "${key}" with ${value.length} items`);
                                break;
                            }
                        }
                    }
                    
                    if (!arrayData || arrayData.length === 0) {
                        console.error('[Widget] ❌ No array data found for table widget');
                        setError('No array data found in API response. Table widgets require an array response.');
                        setData(null);
                        return;
                    }
                    
                    console.log(`[Widget] Processing ${arrayData.length} array items for table display`);
                    
                    // Extract data for each array item using selected fields
                    const tableRows = arrayData.map((item, itemIndex) => {
                        const row = {};
                        
                        widget.selectedFields.forEach((field) => {
                            // For table type, field.path is just the key name (e.g., "symbol", "min_price")
                            const fieldName = field.path;
                            const value = item[fieldName];
                            
                            row[fieldName] = value;
                            
                            if (itemIndex === 0) {
                                console.log(`[Widget] Column "${fieldName}":`, value, `(type: ${typeof value})`);
                            }
                        });
                        
                        return row;
                    });
                    
                    console.log(`[Widget] ✓✓✓ Successfully created table with ${tableRows.length} rows and ${widget.selectedFields.length} columns`);
                    setData(tableRows);
                } else {
                    // For card/chart types, extract individual field values
                    const extractedData = widget.selectedFields.map((field, index) => {
                    console.log(`\n[Widget] ──── Field ${index + 1}/${widget.selectedFields.length} ────`);
                    console.log(`[Widget] Field Label: "${field.label}"`);
                    console.log(`[Widget] Field Path: "${field.path}"`);
                    console.log(`[Widget] Field Type: ${field.type}`);
                    console.log(`[Widget] Looking for path: "${field.path}" in response...`);
                    
                    const value = apiService.getValueByPath(result, field.path);
                    
                    console.log(`[Widget] ✓ Extracted value:`, value);
                    console.log(`[Widget] ✓ Value type:`, typeof value);
                    console.log(`[Widget] ✓ Is undefined:`, value === undefined);
                    console.log(`[Widget] ✓ Is null:`, value === null);
                    
                    // Check if value is undefined
                    if (value === undefined) {
                        console.error(`\n[Widget]  FIELD NOT FOUND: "${field.path}"`);
                        console.error('[Widget] ── Debugging path resolution ──');
                        
                        // Show what we're working with
                        console.error('[Widget] Response root type:', Array.isArray(result) ? 'Array' : typeof result);
                        if (Array.isArray(result)) {
                            console.error('[Widget] Array length:', result.length);
                            console.error('[Widget] First element:', result[0]);
                            if (result.length > 0) {
                                console.error('[Widget] First element keys:', typeof result[0] === 'object' && result[0] !== null ? Object.keys(result[0]) : 'N/A');
                            }
                        } else if (typeof result === 'object' && result !== null) {
                            console.error('[Widget] Object keys:', Object.keys(result));
                        }
                        
                        // Try to find the value manually for debugging
                        if (result && typeof result === 'object') {
                            console.error('[Widget] Attempting manual path resolution...');
                            const pathParts = field.path.split('.').filter(p => p !== '');
                            console.error('[Widget] Path parts:', pathParts);
                            
                            if (pathParts.length > 0) {
                                const firstPart = pathParts[0];
                                const numIndex = Number(firstPart);
                                console.error('[Widget] First part:', firstPart, 'Is numeric:', !isNaN(numIndex));
                                
                                if (!isNaN(numIndex) && Array.isArray(result)) {
                                    console.error(`[Widget] ✓ Root is array, accessing index ${numIndex}`);
                                    console.error(`[Widget] Element at index ${numIndex}:`, result[numIndex]);
                                    
                                    if (result[numIndex] && pathParts.length > 1) {
                                        const remainingPath = pathParts.slice(1).join('.');
                                        console.error(`[Widget] Remaining path: "${remainingPath}"`);
                                        console.error(`[Widget] Element type:`, typeof result[numIndex]);
                                        console.error(`[Widget] Element keys:`, typeof result[numIndex] === 'object' && result[numIndex] !== null ? Object.keys(result[numIndex]) : 'N/A');
                                        
                                        const manualValue = apiService.getValueByPath(result[numIndex], remainingPath);
                                        console.error(`[Widget] Manual extraction result:`, manualValue);
                                        
                                        if (manualValue !== undefined) {
                                            console.error(`[Widget] ⚠️ MANUAL EXTRACTION SUCCEEDED! Path resolution bug detected.`);
                                        }
                                    } else if (pathParts.length === 1) {
                                        console.error(`[Widget] Path is just array index, value:`, result[numIndex]);
                                    }
                                } else if (typeof result === 'object' && result !== null && firstPart in result) {
                                    console.error(`[Widget] ✓ First part exists as object key`);
                                    console.error(`[Widget] Value at "${firstPart}":`, result[firstPart]);
                                } else {
                                    console.error(`[Widget] ✗ First part "${firstPart}" not found in root`);
                                }
                            }
                        }
                        
                        console.error('[Widget] ── End debugging ──\n');
                    } else {
                        console.log(`[Widget] ✓✓✓ SUCCESS: Field "${field.path}" =`, value);
                    }
                    
                        return {
                            label: field.label || field.path,
                            value: value,
                            type: field.type,
                            path: field.path,
                        };
                    });
                    
                    console.log('───────────────────────────────────────────────────────────');
                    console.log(`[Widget: ${widget.title || widget.id}] Extraction Summary`);
                    console.log('───────────────────────────────────────────────────────────');
                    
                    const validData = extractedData.filter(item => item.value !== undefined);
                    const undefinedFields = extractedData.filter(item => item.value === undefined);
                    
                    console.log('[Widget] Total fields:', extractedData.length);
                    console.log('[Widget] Successfully extracted:', validData.length);
                    console.log('[Widget] Failed to extract:', undefinedFields.length);
                    
                    if (undefinedFields.length > 0) {
                        console.error('[Widget] ❌ Failed fields:');
                        undefinedFields.forEach(f => {
                            console.error(`  - "${f.label}" (path: "${f.path}")`);
                        });
                    }
                    
                    if (validData.length > 0) {
                        console.log('[Widget] ✓ Successfully extracted fields:');
                        validData.forEach(f => {
                            console.log(`  - "${f.label}" (path: "${f.path}") =`, f.value);
                        });
                    }
                    
                    // Check if all values are undefined
                    if (undefinedFields.length === extractedData.length) {
                        console.error('═══════════════════════════════════════════════════════════');
                        console.error(`[Widget: ${widget.title || widget.id}]  ALL FIELDS FAILED`);
                        console.error('═══════════════════════════════════════════════════════════');
                        setError('Selected fields not found in API response. The API structure may have changed. Please reconfigure the widget.');
                        setData(null);
                    } else if (undefinedFields.length > 0) {
                        console.warn('═══════════════════════════════════════════════════════════');
                        console.warn(`[Widget: ${widget.title || widget.id}] ⚠️ PARTIAL SUCCESS`);
                        console.warn('═══════════════════════════════════════════════════════════');
                        // Still show valid data, but add a note about missing fields
                        setData(validData);
                        setError(`Some fields not found: ${undefinedFields.map(f => f.label).join(', ')}`);
                    } else {
                        console.log('═══════════════════════════════════════════════════════════');
                        console.log(`[Widget: ${widget.title || widget.id}] ✓✓✓ ALL FIELDS EXTRACTED SUCCESSFULLY`);
                        console.log('═══════════════════════════════════════════════════════════');
                        setData(extractedData);
                    }
                }
            } else {
                setData(result);
            }
            
            // Update last fetched time on successful fetch
            setLastFetchedAt(new Date());
        } catch (err) {
            console.error('[Widget] Error fetching data:', err);
            
            // Handle rate limiting specifically
            if (err.isRateLimit) {
                setError(`⚠️ Rate Limit Exceeded: ${err.message}`);
            } else if (err.status) {
                setError(`API Error (${err.status}): ${err.message}`);
            } else {
                setError(err.message || 'Failed to fetch data');
            }
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [widget.endpoint, widget.params, widget.headers, widget.selectedFields]);

    // Update in Widget.js - only refetch when relevant fields change, not on position/size changes
    useEffect(() => {
        // Skip data fetching for WebSocket widgets (they handle their own connections)
        if (widget.type === 'websocket') {
            return;
        }

        // Create a config object with only the fields that should trigger a refetch
        const currentConfig = {
            endpoint: widget.endpoint,
            refreshInterval: widget.refreshInterval,
            params: widget.params,
            headers: widget.headers,
            selectedFields: widget.selectedFields,
        };

        // Compare with previous config to avoid unnecessary refetches
        const prevConfig = prevConfigRef.current;
        const configChanged = !prevConfig || 
            prevConfig.endpoint !== currentConfig.endpoint ||
            prevConfig.refreshInterval !== currentConfig.refreshInterval ||
            JSON.stringify(prevConfig.params) !== JSON.stringify(currentConfig.params) ||
            JSON.stringify(prevConfig.headers) !== JSON.stringify(currentConfig.headers) ||
            JSON.stringify(prevConfig.selectedFields) !== JSON.stringify(currentConfig.selectedFields);

        if (configChanged) {
            fetchData();
            prevConfigRef.current = currentConfig;
        }

        // Use widget-specific refresh interval if set, otherwise default to 60 seconds
        const intervalTime = widget.refreshInterval || 60;
        console.log(`[Widget] Setting up auto-refresh interval: ${intervalTime} seconds`);
        const interval = setInterval(() => {
            console.log(`[Widget] Auto-refresh triggered for widget: ${widget.title || widget.id}`);
            fetchData();
        }, intervalTime * 1000);

        return () => {
            console.log(`[Widget] Clearing auto-refresh interval for widget: ${widget.title || widget.id}`);
            clearInterval(interval);
        };
    }, [
        widget.type,
        widget.endpoint,
        widget.refreshInterval,
        JSON.stringify(widget.params),
        JSON.stringify(widget.headers),
        JSON.stringify(widget.selectedFields),
        fetchData
    ]);

    // Update current time every second to refresh the "time ago" display
    useEffect(() => {
        if (!lastFetchedAt) return;
        
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => clearInterval(interval);
    }, [lastFetchedAt]);

    const formatLastFetchedTime = (timestamp) => {
        const now = currentTime;
        const diff = now - timestamp;
        const totalSeconds = Math.floor(diff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const days = Math.floor(totalHours / 24);
        
        if (totalSeconds < 60) {
            return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''} ago`;
        } else if (totalMinutes < 60) {
            const remainingSeconds = totalSeconds % 60;
            if (remainingSeconds > 0) {
                return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} ago`;
            } else {
                return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} ago`;
            }
        } else if (totalHours < 24) {
            const remainingMinutes = totalMinutes % 60;
            if (remainingMinutes > 0) {
                return `${totalHours} hour${totalHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} ago`;
            } else {
                return `${totalHours} hour${totalHours !== 1 ? 's' : ''} ago`;
            }
        } else if (days < 7) {
            const remainingHours = totalHours % 24;
            if (remainingHours > 0) {
                return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} ago`;
            } else {
                return `${days} day${days !== 1 ? 's' : ''} ago`;
            }
        } else {
            return timestamp.toLocaleString();
        }
    };

    const renderWidgetContent = () => {
        // WebSocket widgets handle their own rendering
        if (widget.type === 'websocket') {
            return <WebSocketWidget widget={widget} />;
        }

        if (loading) {
            return (
                <div className="flex items-center justify-center h-40">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Loading...</span>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-4 border-2 border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-red-700 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Error: {error}</span>
                    </div>
                    {error.includes('Rate Limit') && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            The API has rate limiting enabled. Please wait before refreshing or reduce the refresh interval.
                        </div>
                    )}
                    {error.includes('not found in API response') && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            The API response structure may have changed. Click the settings icon to reconfigure the widget fields.
                        </div>
                    )}
                </div>
            );
        }

        if (!data) {
            return (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">📭</span>
                        <span className="font-medium">No data available</span>
                    </div>
                </div>
            );
        }

        switch (widget.type) {
            case 'card':
                return <WidgetCard data={data} widget={widget} />;
            case 'chart':
                return <WidgetChart data={data} widget={widget} />;
            case 'table':
                return <WidgetTable data={data} widget={widget} />;
            default:
                return <pre>{JSON.stringify(data, null, 2)}</pre>;
        }
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 h-full flex flex-col overflow-hidden">
            <div 
                className="flex flex-col border-b border-gray-200 dark:border-gray-700 cursor-move bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
                onMouseDown={onHeaderMouseDown}
            >
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{widget.title}</h3>
                    </div>

                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                bringToFront(widget.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            title="Bring to Front"
                        >
                            <Layers3 size={14} />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                sendToBack(widget.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            title="Send to Back"
                        >
                            <Layers size={14} />
                        </button>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setShowConfig(true)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            title="Configure"
                        >
                            <Settings size={14} />
                        </button>

                        <button
                            onClick={() => hideWidget(widget.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            title="Hide from screen"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
                
                {lastFetchedAt && (
                    <div className="px-2 pb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Last fetched: <span className="text-gray-700 dark:text-gray-300">{formatLastFetchedTime(lastFetchedAt)}</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="p-2 flex-1 overflow-auto bg-white dark:bg-gray-900">
                {renderWidgetContent()}
            </div>

            {showConfig && (
                <WidgetConfig
                    widget={widget}
                    onClose={() => setShowConfig(false)}
                    onSave={(updates) => {
                        updateWidget(widget.id, updates);
                        setShowConfig(false);
                    }}
                />
            )}
        </div>
    );
}