'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { JsonExplorer } from '../ui/JsonExplorer';
import { ApiService } from '@/lib/api';

export function WidgetConfig({ widget, onClose, onSave }) {
  const [config, setConfig] = useState({
    title: widget.title || '',
    description: widget.description || '',
    endpoint: widget.endpoint || '',
    refreshInterval: widget.refreshInterval || 60,
    displayFormat: widget.displayFormat || 'auto',
    selectedFields: widget.selectedFields || [],
    params: widget.params || {},
    headers: widget.headers || {},
  });
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const apiService = new ApiService();

  const handleSave = () => {
    // Clean up empty headers before saving
    const cleanedHeaders = {};
    Object.entries(config.headers || {}).forEach(([key, value]) => {
      if (key && value) {
        cleanedHeaders[key] = value;
      }
    });

    onSave({ ...config, headers: cleanedHeaders });
  };

  const removeField = (index) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.filter((_, i) => i !== index),
    }));
  };

  const updateField = (index, updates) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      ),
    }));
  };

  const addField = (path, value) => {
    // Check if field is already selected - toggle it
    const isAlreadySelected = config.selectedFields.some(f => f.path === path);
    if (isAlreadySelected) {
      // Deselect if already selected
      setConfig(prev => ({
        ...prev,
        selectedFields: prev.selectedFields.filter(f => f.path !== path),
      }));
    } else {
      // Select if not selected
      setConfig(prev => ({
        ...prev,
        selectedFields: [...prev.selectedFields, {
          path,
          label: path.split(/[\.\[\]]/).filter(Boolean).pop() || path,
          type: typeof value,
        }],
      }));
    }
  };

  const testApiConnection = async () => {
    if (!config.endpoint) {
      setTestResult({ error: 'Please provide an API endpoint URL' });
      return;
    }

    setLoadingTest(true);
    try {
      let url;
      try {
        url = new URL(config.endpoint);
      } catch (e) {
        setTestResult({ error: 'Invalid URL format. Please include http:// or https://' });
        setLoadingTest(false);
        return;
      }
      
      Object.entries(config.params || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
      
      console.log('[WidgetConfig] Testing API connection:', url.toString());
      const result = await apiService.fetchData(url.toString(), {}, config.headers || {});
      console.log('[WidgetConfig] API test response:', result);
      setTestResult(result);
      setShowFieldSelector(true);
    } catch (error) {
      console.error('[WidgetConfig] API test error:', error);
      
      // Handle rate limiting specifically
      if (error.isRateLimit) {
        setTestResult({ 
          error: `⚠️ Rate Limit Exceeded: ${error.message}. Please wait before trying again.` 
        });
      } else if (error.status) {
        setTestResult({ 
          error: `API Error (${error.status}): ${error.message}` 
        });
      } else {
        setTestResult({ error: error.message || 'Failed to fetch data from API' });
      }
    } finally {
      setLoadingTest(false);
    }
  };

  const addHeader = () => {
    setConfig(prev => ({
      ...prev,
      headers: { ...prev.headers, '': '' }
    }));
  };

  const updateHeader = (oldKey, newKey, value) => {
    setConfig(prev => {
      const newHeaders = { ...prev.headers };
      if (oldKey !== newKey) {
        delete newHeaders[oldKey];
      }
      if (newKey) {
        newHeaders[newKey] = value !== undefined ? value : (newHeaders[newKey] || '');
      }
      return { ...prev, headers: newHeaders };
    });
  };

  const removeHeader = (key) => {
    setConfig(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configure Widget</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Settings */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">Basic Settings</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">API Endpoint URL</label>
                  <input
                    type="text"
                    value={config.endpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="https://api.example.com/data"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    The API endpoint URL for this widget (use Headers section for API keys)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Widget Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Refresh Interval (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="3600"
                    value={config.refreshInterval}
                    onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    How often to refresh data (10-3600 seconds)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Display Format</label>
                  <select
                    value={config.displayFormat}
                    onChange={(e) => setConfig(prev => ({ ...prev, displayFormat: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Headers</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                        <div className="col-span-5">Key</div>
                        <div className="col-span-6">Value</div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                      {Object.entries(config.headers || {}).map(([key, value], index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => updateHeader(key, e.target.value, value)}
                            placeholder="e.g., x-api-key"
                            className="col-span-5 p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-gray-100 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateHeader(key, key, e.target.value)}
                            placeholder="Header value"
                            className="col-span-6 p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-gray-100 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <button
                            onClick={() => removeHeader(key)}
                            className="col-span-1 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-bold"
                            title="Remove header"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {Object.keys(config.headers || {}).length === 0 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                          No headers added. Click "Add Header" to add one.
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <button
                        onClick={addHeader}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                      >
                        + Add Header
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Add custom headers like API keys (e.g., x-api-key, Authorization)
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Fields */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Selected Data Fields</h3>
                <button
                  onClick={testApiConnection}
                  disabled={loadingTest || !config.endpoint}
                  className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all"
                >
                  <RefreshCw size={14} className={loadingTest ? 'animate-spin' : ''} />
                  {loadingTest ? 'Testing...' : 'Load & Select Fields'}
                </button>
              </div>

              {testResult?.error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{testResult.error}</p>
                </div>
              )}

              {showFieldSelector && testResult && !testResult.error && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click "Select" to add fields from the API response
                    </p>
                    <button
                      onClick={() => setShowFieldSelector(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Hide
                    </button>
                  </div>
                  <JsonExplorer 
                    data={testResult} 
                    onSelect={addField}
                    selectedPaths={config.selectedFields.map(f => f.path)}
                  />
                </div>
              )}

              {config.selectedFields.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">No fields selected. Click "Load & Select Fields" to choose fields from your API.</p>
              ) : (
                <div className="space-y-3">
                  {config.selectedFields.map((field, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{field.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{field.path}</div>
                        </div>
                        <button
                          onClick={() => removeField(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Display Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Format Type</label>
                          <select
                            value={field.format || 'auto'}
                            onChange={(e) => updateField(index, { format: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                          >
                            <option value="auto">Auto-detect</option>
                            <option value="currency">Currency</option>
                            <option value="percentage">Percentage</option>
                            <option value="number">Number</option>
                            <option value="text">Text</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget Type Settings */}
            {widget.type === 'chart' && (
              <div>
                <h3 className="font-semibold mb-4">Chart Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Chart Type</label>
                    <select
                      value={widget.chartType || 'line'}
                      onChange={(e) => setConfig(prev => ({ ...prev, chartType: e.target.value }))}
                      className="w-full p-2 border rounded dark:bg-gray-800"
                    >
                      <option value="line">Line Chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="area">Area Chart</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={widget.showGrid || true}
                        onChange={(e) => setConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Show Grid</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={widget.showTooltip || true}
                        onChange={(e) => setConfig(prev => ({ ...prev, showTooltip: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Show Tooltip</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {widget.type === 'table' && (
              <div>
                <h3 className="font-semibold mb-4">Table Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Items Per Page</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={widget.itemsPerPage || 10}
                      onChange={(e) => setConfig(prev => ({ ...prev, itemsPerPage: parseInt(e.target.value) }))}
                      className="w-full p-2 border rounded dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={widget.sortable || true}
                        onChange={(e) => setConfig(prev => ({ ...prev, sortable: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Sortable Columns</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={widget.filterable || true}
                        onChange={(e) => setConfig(prev => ({ ...prev, filterable: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Filterable</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}