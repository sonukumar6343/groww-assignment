'use client';

import { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter
} from 'lucide-react';

export function WidgetTable({ data, widget }) {
  const [sortConfig, setSortConfig] = useState({ 
    key: null, 
    direction: 'asc' 
  });
  const [filter, setFilter] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});

  // Transform data for table display
  const tableData = useMemo(() => {
    if (!Array.isArray(data)) {
      // If data is an object, convert to array of key-value pairs
      if (data && typeof data === 'object') {
        return Object.entries(data).map(([key, value]) => ({
          key,
          value,
          type: typeof value
        }));
      }
      return [];
    }
    
    // Check if data is an array of objects (table mode) or array of field objects (card mode)
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      // Check if first item has 'label' and 'value' properties (old card mode format)
      if ('label' in data[0] && 'value' in data[0]) {
        // Old format: array of field objects
        return data.map((item, index) => ({
          id: index,
          label: item.label || `Field ${index + 1}`,
          value: item.value,
          type: item.type || typeof item.value,
          path: item.path || ''
        }));
      } else {
        // New format: array of data objects (table mode)
        // Each object in the array is a row, with selected fields as properties
        return data.map((item, index) => ({
          id: index,
          ...item // Spread all properties from the item
        }));
      }
    }
    
    // Fallback: array of primitives
    return data.map((item, index) => ({
      id: index,
      value: item,
      type: typeof item
    }));
  }, [data]);

  // Get unique keys for filter dropdowns
  const tableKeys = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  }, [tableData]);

  // Apply filters
  const filteredData = useMemo(() => {
    let result = [...tableData];
    
    // Apply search filter
    if (filter.trim()) {
      const searchTerm = filter.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchTerm)
        )
      );
    }
    
    // Apply column filters
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    
    return result;
  }, [tableData, filter, selectedFilters]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // Handle different types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // String comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Show all data - no pagination
  const paginatedData = sortedData;

  // Format value based on type
  const formatValue = (value, type) => {
    if (value == null || value === undefined) {
      return <span className="text-yellow-600 dark:text-yellow-400">⚠️ Not found</span>;
    }
    
    if (type === 'number' || typeof value === 'number') {
      // Check if it's a currency or percentage based on value range
      if (Math.abs(value) > 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(value) > 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
      }
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    
    if (type === 'boolean') return value ? 'Yes' : 'No';
    
    return String(value);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilter('');
    setSelectedFilters({});
  };

  // Render header with sort and filter options
  const renderHeader = () => {
    if (tableData.length === 0) return null;
    
    const sampleItem = tableData[0];
    
    return (
      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
        <tr>
          {Object.keys(sampleItem).map((key) => (
            <th 
              key={key} 
              className="text-left p-3 text-gray-700 dark:text-gray-200"
            >
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSort(key)}
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                >
                  <span className="font-semibold capitalize text-sm">
                    {key === 'id' ? '#' : key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  {sortConfig.key === key && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {sortConfig.direction === 'asc' ? 
                        <ChevronUp size={16} /> : 
                        <ChevronDown size={16} />
                      }
                    </span>
                  )}
                </button>
                
                <div className="relative">
                  <input
                    type="text"
                    value={selectedFilters[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    placeholder={`Filter ${key}`}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  {selectedFilters[key] && (
                    <button
                      onClick={() => handleFilterChange(key, '')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  // Render table rows
  const renderRows = () => {
    if (sortedData.length === 0) {
      return (
        <tr>
          <td 
            colSpan={tableKeys.length} 
            className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg">📭</span>
              <span className="font-medium">No data available</span>
            </div>
          </td>
        </tr>
      );
    }

    return sortedData.map((item, rowIndex) => (
      <tr 
        key={item.id || rowIndex} 
        className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-800/70 transition-colors duration-150 even:bg-gray-50/30 dark:even:bg-gray-900/30"
      >
        {Object.entries(item).map(([key, value], cellIndex) => (
          <td 
            key={`${rowIndex}-${cellIndex}`} 
            className="p-3 text-gray-900 dark:text-gray-100"
          >
            <div className={key === 'value' && (item.type === 'number' || typeof value === 'number') 
              ? 'font-mono text-right font-medium' 
              : ''
            }>
              {key === 'type' ? (
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-md font-medium">
                  {value}
                </span>
              ) : (
                formatValue(value, item.type)
              )}
            </div>
          </td>
        ))}
      </tr>
    ));
  };


  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search in all columns..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>
        
        
        {/* Clear Filters Button */}
        {(filter || Object.values(selectedFilters).some(v => v)) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Filter size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            {renderHeader()}
            <tbody className="bg-white dark:bg-gray-900">
              {renderRows()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4">
          <span className="font-medium">Total Records: <span className="text-gray-900 dark:text-gray-100">{tableData.length}</span></span>
          <span className="font-medium">Filtered: <span className="text-gray-900 dark:text-gray-100">{filteredData.length}</span></span>
          <span className="font-medium">Displayed: <span className="text-gray-900 dark:text-gray-100">{sortedData.length}</span></span>
        </div>
      </div>
    </div>
  );
}