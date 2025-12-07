// Utility functions

export function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  
  export function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }
  
  export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  export function validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  export function safeParseJSON(str, defaultValue = {}) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Flattens JSON structure and collects all keys with their values in original order
   * Returns an object with:
   * - keys: array of unique keys sorted by frequency (descending)
   * - keyData: object mapping each key to its array of values in original order
   * - keyFrequency: object mapping each key to its frequency count
   */
  export function flattenJsonForChart(data, prefix = '', keyData = {}, keyFrequency = {}) {
    // Initialize if called at root level
    const isRootCall = Object.keys(keyData).length === 0 && Object.keys(keyFrequency).length === 0;
    
    if (data === null || data === undefined) {
      if (isRootCall) {
        return { keys: [], keyData: {}, keyFrequency: {} };
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          // For arrays of objects, process each object without prefix to collect keys directly
          flattenJsonForChart(item, prefix, keyData, keyFrequency);
        } else if (isValidChartValue(item)) {
          // For array of primitives, use prefix or 'value' as key
          const key = prefix || 'value';
          if (!keyData[key]) keyData[key] = [];
          if (!keyFrequency[key]) keyFrequency[key] = 0;
          keyData[key].push(item);
          keyFrequency[key]++;
        }
      });
      // Don't return early - continue to sorting if root call
      if (!isRootCall) return;
    }
    // Handle objects
    else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively process nested objects
          flattenJsonForChart(value, fullKey, keyData, keyFrequency);
        } else if (Array.isArray(value)) {
          // Process arrays - for arrays of objects, collect keys from each object
          flattenJsonForChart(value, fullKey, keyData, keyFrequency);
        } else if (isValidChartValue(value)) {
          // Store primitive values
          if (!keyData[fullKey]) keyData[fullKey] = [];
          if (!keyFrequency[fullKey]) keyFrequency[fullKey] = 0;
          keyData[fullKey].push(value);
          keyFrequency[fullKey]++;
        }
      });
    } 
    // Handle primitives
    else if (isValidChartValue(data)) {
      const key = prefix || 'value';
      if (!keyData[key]) keyData[key] = [];
      if (!keyFrequency[key]) keyFrequency[key] = 0;
      keyData[key].push(data);
      keyFrequency[key]++;
    }

    // Only sort and return if this is the root call
    if (isRootCall) {
      // Sort keys by frequency (descending) and filter out keys with no valid data
      const sortedKeys = Object.entries(keyFrequency)
        .filter(([key, count]) => count > 0 && keyData[key] && keyData[key].length > 0)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency descending
        .map(([key]) => key);

      return {
        keys: sortedKeys,
        keyData,
        keyFrequency
      };
    }
  }

  /**
   * Check if a value is valid for chart display (numeric or can be converted to number)
   */
  function isValidChartValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return true;
    if (typeof value === 'string') {
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    }
    return false;
  }