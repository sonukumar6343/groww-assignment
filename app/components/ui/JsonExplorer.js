'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { flattenJsonForChart } from '../../../lib/utils';

export function JsonExplorer({ data, onSelect, selectedPaths = [], mode = 'normal' }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (path) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const renderNode = (key, value, path = '', isArrayItem = false) => {
    // Handle array indices properly - ensure path is always a string
    const currentPath = path 
      ? (isArrayItem ? `${path}[${key}]` : `${path}.${String(key)}`) 
      : String(key);
    const isExpanded = expanded.has(currentPath);
    const isObject = typeof value === 'object' && value !== null;
    const isArray = Array.isArray(value);
    const isPrimitive = !isObject;
    const isSelected = selectedPaths.includes(currentPath);

    return (
      <div key={currentPath} className="ml-4">
        <div className={`flex items-center gap-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}>
          {isObject ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(currentPath);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <span className="font-mono text-sm">{isArrayItem ? `[${key}]` : `${key}:`}</span>
          
          {isPrimitive ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">
                {String(value)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(currentPath, value);
                }}
                className={`ml-auto text-xs px-2 py-1 rounded ${
                  isSelected 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-500">
                {isArray ? `Array[${value.length}]` : 'Object'}
              </span>
              {/* Allow selecting objects/arrays themselves */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(currentPath, value);
                }}
                className={`ml-auto text-xs px-2 py-1 rounded ${
                  isSelected 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </>
          )}
        </div>
        
        {isObject && isExpanded && (
          <div className="border-l border-gray-300 dark:border-gray-700 ml-2">
            {isArray ? (
              // Handle arrays
              value.map((item, index) => 
                renderNode(index, item, path ? (isArrayItem ? path : currentPath) : '', true)
              )
            ) : (
              // Handle objects
              Object.entries(value).map(([k, v]) => 
                renderNode(k, v, currentPath, false)
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // Handle chart mode - show flattened keys sorted by frequency
  const renderChartMode = () => {
    const flattened = useMemo(() => flattenJsonForChart(data), [data]);
    const { keys, keyData, keyFrequency } = flattened;

    if (keys.length === 0) {
      return (
        <div className="text-sm text-yellow-600 dark:text-yellow-400 p-4">
          ⚠️ No valid numeric data found. Chart mode requires numeric values.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-blue-50 dark:bg-blue-900 rounded">
          Chart mode: Select a field to display. Fields are sorted by frequency (most common first). 
          The chart will show all values in original order.
        </div>
        {keys.map((key) => {
          const isSelected = selectedPaths.includes(key);
          const frequency = keyFrequency[key] || 0;
          const sampleValue = keyData[key] && keyData[key].length > 0 ? keyData[key][0] : null;
          const valueCount = keyData[key] ? keyData[key].length : 0;

          return (
            <div 
              key={key} 
              className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white font-medium truncate">{key}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ({frequency} occurrence{frequency !== 1 ? 's' : ''}, {valueCount} value{valueCount !== 1 ? 's' : ''})
                  </span>
                </div>
                {sampleValue !== null && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                    Sample: {typeof sampleValue === 'number' ? sampleValue.toLocaleString() : String(sampleValue)}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(key, keyData[key]);
                }}
                className={`ml-auto text-xs px-3 py-1 rounded whitespace-nowrap ${
                  isSelected 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSelected ? 'Selected' : 'Select Field'}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle table mode - show only keys from first array element
  const renderTableMode = () => {
    // Find the array in the data
    let arrayData = null;
    
    if (Array.isArray(data)) {
      arrayData = data;
    } else if (typeof data === 'object' && data !== null) {
      // Look for arrays in object values
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0) {
          arrayData = value;
          break;
        }
      }
    }
    
    if (!arrayData || arrayData.length === 0) {
      return (
        <div className="text-sm text-yellow-600 dark:text-yellow-400 p-4">
          ⚠️ No array data found. Table mode requires an array response.
        </div>
      );
    }
    
    const firstItem = arrayData[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return (
        <div className="text-sm text-yellow-600 dark:text-yellow-400 p-4">
          ⚠️ Array items must be objects to use table mode.
        </div>
      );
    }
    
    // Show only the keys from the first item
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-blue-50 dark:bg-blue-900 rounded">
          Table mode: Select column labels. The table will show {arrayData.length} row(s) with these columns.
        </div>
        {Object.entries(firstItem).map(([key, value]) => {
          const isSelected = selectedPaths.includes(key);
          return (
            <div 
              key={key} 
              className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
            >
              <span className="font-mono text-sm font-medium">{key}:</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">
                {typeof value === 'object' && value !== null ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
              </span>
              <span className="text-xs text-gray-500">({typeof value})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(key, value);
                }}
                className={`ml-auto text-xs px-3 py-1 rounded ${
                  isSelected 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSelected ? 'Selected' : 'Select Column'}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle different data types
  const renderData = () => {
    // Chart mode - show flattened keys sorted by frequency
    if (mode === 'chart') {
      return renderChartMode();
    }
    
    // Table mode - show only keys from first array element
    if (mode === 'table') {
      return renderTableMode();
    }
    
    // Normal mode - show full structure
    if (Array.isArray(data)) {
      return data.map((item, index) => 
        renderNode(index, item, '', true)
      );
    } else if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => 
        renderNode(key, value)
      );
    } else {
      return (
        <div className="text-sm text-gray-500">
          Primitive value: {String(data)}
          <button
            onClick={() => onSelect('', data)}
            className="ml-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select
          </button>
        </div>
      );
    }
  };

  return (
    <div className="border rounded-lg p-4 text-white dark:bg-gray-900 max-h-96 overflow-auto">
      <h3 className="font-semibold mb-3">
        {mode === 'table' ? 'Select Table Columns' : 
         mode === 'chart' ? 'Select Chart Field' : 
         'Select Data Fields'}
      </h3>
      <p className="text-xs text-gray-500 mb-2">
        {mode === 'table' 
          ? 'Select column labels to display in the table. Each row will show data from the API array.'
          : mode === 'chart'
          ? 'Select a field to display in the chart. Fields are sorted by frequency (most common first).'
          : 'Click "Select" to choose fields. Expand objects/arrays to see nested values.'}
      </p>
      {renderData()}
    </div>
  );
}