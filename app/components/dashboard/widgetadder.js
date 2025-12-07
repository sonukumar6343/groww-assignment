'use client';

import { useState } from 'react';
import { CreditCard, BarChart3, Table } from 'lucide-react';
import { JsonExplorer } from '../ui/JsonExplorer';
import { useStore } from '../../../lib/store';
import { ApiService } from '../../../lib/api';

export function WidgetAdder({ onClose }) {
  const [step, setStep] = useState(1);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    type: 'card',
    endpoint: '',
    params: {},
    headers: {},
  });

  const { addWidget } = useStore();
  const apiService = new ApiService();

  const testApiConnection = async () => {
    if (!widgetConfig.endpoint) {
      setTestResult({ error: 'Please provide an API endpoint URL' });
      return;
    }

    setLoading(true);
    try {
      // Build full URL with params if provided
      let url;
      try {
        url = new URL(widgetConfig.endpoint);
      } catch (e) {
        setTestResult({ error: 'Invalid URL format. Please include http:// or https://' });
        setLoading(false);
        return;
      }
      
      // Append additional params if provided
      Object.entries(widgetConfig.params || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
      
      const result = await apiService.fetchData(url.toString(), {}, widgetConfig.headers || {});
      setTestResult(result);
      setStep(2);
    } catch (error) {
      setTestResult({ error: error.message || 'Failed to fetch data from API' });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSelect = (path, value) => {
    // Ensure path is a string
    const pathString = String(path || '');
    
    if (!pathString) {
      console.warn('[WidgetAdder] handleFieldSelect received invalid path:', path);
      return;
    }
    
    // For chart type, store the field key and the array of values
    // Chart mode only allows selecting one field
    if (widgetConfig.type === 'chart') {
      const fieldName = pathString; // In chart mode, path is the flattened key name
      // For chart, replace any existing selection (only one field allowed)
      setSelectedFields([{
        path: fieldName,
        label: fieldName,
        type: Array.isArray(value) && value.length > 0 ? typeof value[0] : 'number',
        values: Array.isArray(value) ? value : [value], // Store the array of values
      }]);
    }
    // For table type, store just the field name (key) as both path and label
    else if (widgetConfig.type === 'table') {
      const fieldName = pathString; // In table mode, path is just the key name
      const isAlreadySelected = selectedFields.some(f => f.path === fieldName);
      if (isAlreadySelected) {
        setSelectedFields(prev => prev.filter(f => f.path !== fieldName));
      } else {
        setSelectedFields(prev => [...prev, {
          path: fieldName, // Store just the field name (e.g., "symbol", "min_price")
          label: fieldName, // Use same as label
          type: typeof value,
        }]);
      }
    } else {
      // For card type, use the full path
      const isAlreadySelected = selectedFields.some(f => f.path === pathString);
      if (isAlreadySelected) {
        setSelectedFields(prev => prev.filter(f => f.path !== pathString));
      } else {
        const label = pathString.split(/[\.\[\]]/).filter(Boolean).pop() || pathString;
        setSelectedFields(prev => [...prev, {
          path: pathString,
          label: label,
          type: typeof value,
        }]);
      }
    }
  };

  const handleCreateWidget = () => {
    // Clean up empty headers
    const cleanedHeaders = {};
    Object.entries(widgetConfig.headers || {}).forEach(([key, value]) => {
      if (key && value) {
        cleanedHeaders[key] = value;
      }
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[WidgetAdder] Creating new widget');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[WidgetAdder] Widget title:', widgetConfig.title || `Widget ${selectedFields.length} fields`);
    console.log('[WidgetAdder] Widget type:', widgetConfig.type);
    console.log('[WidgetAdder] Endpoint:', widgetConfig.endpoint);
    console.log('[WidgetAdder] Selected fields count:', selectedFields.length);
    console.log('[WidgetAdder] Selected fields details:');
    selectedFields.forEach((field, index) => {
      console.log(`  ${index + 1}. Label: "${field.label}"`);
      console.log(`     Path: "${field.path}"`);
      console.log(`     Type: ${field.type}`);
    });
    console.log('[WidgetAdder] Params:', widgetConfig.params);
    console.log('[WidgetAdder] Headers:', cleanedHeaders);
    console.log('═══════════════════════════════════════════════════════════');

    const newWidget = {
      id: Date.now().toString(),
      title: widgetConfig.title || `Widget ${selectedFields.length} fields`,
      type: widgetConfig.type,
      endpoint: widgetConfig.endpoint,
      selectedFields,
      params: widgetConfig.params,
      headers: cleanedHeaders,
      createdAt: new Date().toISOString(),
    };

    addWidget(newWidget);
    onClose();
  };

  const addHeader = () => {
    setWidgetConfig(prev => ({
      ...prev,
      headers: { ...prev.headers, '': '' }
    }));
  };

  const updateHeader = (oldKey, newKey, value) => {
    setWidgetConfig(prev => {
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
    setWidgetConfig(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const applyPreset = (type, endpoint) => {
    const apiKey = 'sk-live-GuiMaqLJoL52p0sxfoa9No8rgG8QEgt8jPSfPNGn';
    setWidgetConfig({
      title: '',
      type: type,
      endpoint: endpoint,
      params: {},
      headers: {
        'x-api-key': apiKey
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Widget</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Setup API</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => applyPreset('card', 'https://stock.indianapi.in/ipo')}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all group"
              >
                <CreditCard size={24} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">IPO Card</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Stock IPO Data</span>
              </button>
              
              <button
                onClick={() => applyPreset('table', 'https://stock.indianapi.in/ipo')}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:shadow-lg transition-all group"
              >
                <Table size={24} className="text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">IPO Table</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Stock IPO List</span>
              </button>
              
              <button
                onClick={() => applyPreset('chart', 'https://stock.indianapi.in/stock?name=lenskart')}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all group"
              >
                <BarChart3 size={24} className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Stock Chart</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Lenskart Stock Data</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Click any template to auto-fill API endpoint and credentials
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${step >= 1 ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                1
              </div>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600 dark:bg-blue-500 w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${step >= 2 ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                2
              </div>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-6">Configure Widget</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">API Endpoint URL</label>
                  <input
                    type="text"
                    value={widgetConfig.endpoint}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="https://api.example.com/data"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Enter the API endpoint URL (use Headers section below for API keys)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Widget Title</label>
                  <input
                    type="text"
                    value={widgetConfig.title}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Enter widget title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Widget Type</label>
                  <select
                    value={widgetConfig.type}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  >
                    <option value="card">Card</option>
                    <option value="chart">Chart</option>
                    <option value="table">Table</option>
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
                      {Object.entries(widgetConfig.headers || {}).map(([key, value], index) => (
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
                      {Object.keys(widgetConfig.headers || {}).length === 0 && (
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

              <div className="mt-6 flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={testApiConnection}
                  disabled={loading || !widgetConfig.endpoint}
                  className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? 'Testing...' : 'Test API & Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && testResult && !testResult.error && (
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">Select Data Fields</h3>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  {widgetConfig.type === 'table' 
                    ? 'Select column labels to display in the table. Each row will show data from the API array.'
                    : widgetConfig.type === 'chart'
                    ? 'Select one field to display in the chart. Fields are sorted by frequency (most common first).'
                    : 'Click "Select" next to the fields you want to display in this widget'}
                </p>
                <JsonExplorer 
                  data={testResult} 
                  onSelect={handleFieldSelect}
                  selectedPaths={selectedFields.map(f => f.path)}
                  mode={widgetConfig.type === 'table' ? 'table' : widgetConfig.type === 'chart' ? 'chart' : 'normal'}
                />
              </div>

              {selectedFields.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Selected Fields:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFields.map((field, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
                      >
                        <span>{field.label}</span>
                        <button
                          onClick={() => setSelectedFields(prev => prev.filter((_, i) => i !== index))}
                          className="text-sm hover:text-red-200 transition-colors font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateWidget}
                  disabled={selectedFields.length === 0 || (widgetConfig.type === 'chart' && selectedFields.length !== 1)}
                  className="px-6 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Create Widget
                </button>
              </div>
            </div>
          )}

          {testResult?.error && (
            <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
              <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <span>⚠️</span>
                <span>API Error</span>
              </h4>
              <p className="text-red-600 dark:text-red-400 mb-4">{testResult.error}</p>
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}