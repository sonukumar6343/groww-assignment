import axios from 'axios';

export class ApiService {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.cacheTime = 5 * 60 * 1000; // 5 minutes
  }

  async fetchData(endpoint, params = {}, headers = {}) {
    // endpoint can be a full URL with API key already included
    // or we can accept endpoint and apiKey separately for backward compatibility
    const cacheKey = `${endpoint}:${JSON.stringify(params)}:${JSON.stringify(headers)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }

    try {
      // Merge custom headers with default Content-Type
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };

      const response = await axios.get(endpoint, {
        params: params,
        headers: requestHeaders,
      });

      const data = response.data;
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || error.response.headers['Retry-After'];
        const rateLimitError = new Error(
          `Rate limit exceeded. ${retryAfter ? `Please try again after ${retryAfter} seconds.` : 'Please try again later.'}`
        );
        rateLimitError.isRateLimit = true;
        rateLimitError.retryAfter = retryAfter ? parseInt(retryAfter) : null;
        throw rateLimitError;
      }
      
      // Handle other HTTP errors
      if (error.response) {
        const httpError = new Error(
          `API Error ${error.response.status}: ${error.response.statusText || 'Request failed'}`
        );
        httpError.status = error.response.status;
        throw httpError;
      }
      
      throw error;
    }
  }

  // Extract all unique keys from nested JSON
  extractKeys(data, prefix = '') {
    const keys = [];
    
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          keys.push(...this.extractKeys(value, fullKey));
        } else {
          keys.push({
            path: fullKey,
            value: value,
            type: typeof value,
          });
        }
      }
    }
    
    return keys;
  }

  // Get value by path - handles both dot notation and bracket notation for arrays
  getValueByPath(obj, path) {
    if (!path) {
      console.log('[getValueByPath] No path provided, returning object');
      return obj;
    }
    
    console.log(`[getValueByPath] 🔍 Looking for path: "${path}"`);
    console.log(`[getValueByPath] Object type: ${typeof obj}, IsArray: ${Array.isArray(obj)}`);
    if (Array.isArray(obj)) {
      console.log(`[getValueByPath] Array length: ${obj.length}`);
    } else if (typeof obj === 'object' && obj !== null) {
      console.log(`[getValueByPath] Object keys: ${Object.keys(obj).join(', ')}`);
    }
    
    // Convert bracket notation to dot notation (e.g., "data[0].name" -> "data.0.name")
    let normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    
    // Split path into parts
    const parts = normalizedPath.split('.').filter(p => p !== ''); // Filter out empty strings
    
    console.log(`[getValueByPath] Path parts (${parts.length}):`, parts);
    
    let current = obj;
    
    // Special case: If root is an object and path starts with a number,
    // try to find arrays in the object's values
    if (parts.length > 0 && typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const firstPart = parts[0];
      const numIndex = Number(firstPart);
      const isNumeric = !isNaN(numIndex) && firstPart !== '';
      
      if (isNumeric) {
        console.log(`[getValueByPath] ⚠️ Root is object but path starts with number "${firstPart}"`);
        console.log(`[getValueByPath] Attempting to find arrays in object values...`);
        
        // Try each object key to see if it contains an array
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value) && value.length > numIndex) {
            console.log(`[getValueByPath] ✓ Found array at key "${key}" with length ${value.length}`);
            console.log(`[getValueByPath] Trying to access ${key}[${numIndex}]...`);
            
            // Try to resolve the path starting from this array element
            const arrayElement = value[numIndex];
            if (arrayElement !== undefined && parts.length > 1) {
              // Continue with remaining path parts
              const remainingPath = parts.slice(1).join('.');
              const result = this.getValueByPath(arrayElement, remainingPath);
              if (result !== undefined) {
                console.log(`[getValueByPath] ✓✓✓ Successfully found value via "${key}[${numIndex}].${remainingPath}"`);
                return result;
              }
            } else if (arrayElement !== undefined && parts.length === 1) {
              // Path is just the array index
              console.log(`[getValueByPath] ✓✓✓ Successfully found value at "${key}[${numIndex}]"`);
              return arrayElement;
            }
          }
        }
        
        console.log(`[getValueByPath] ⚠️ Could not find array in object values that matches path`);
        // Continue with normal resolution (will likely fail, but let's try)
      }
    }
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (current === null || current === undefined) {
        console.log(`[getValueByPath] ❌ Stopped: null/undefined at part ${i} ("${part}")`);
        return undefined;
      }
      
      console.log(`[getValueByPath] Step ${i + 1}/${parts.length}: Processing "${part}"`);
      console.log(`[getValueByPath]   Current type: ${typeof current}, IsArray: ${Array.isArray(current)}`);
      
      // Check if part is a numeric index
      const numIndex = Number(part);
      const isNumeric = !isNaN(numIndex) && part !== '';
      
      // If current is an array and part is numeric, access by index
      if (isNumeric && Array.isArray(current)) {
        if (numIndex >= 0 && numIndex < current.length) {
          console.log(`[getValueByPath]   ✓ Array access [${numIndex}]`);
          current = current[numIndex];
          console.log(`[getValueByPath]   Value:`, current);
        } else {
          console.log(`[getValueByPath]   ❌ Array index out of bounds: ${numIndex} (length: ${current.length})`);
          return undefined;
        }
      } 
      // If current is an object (not array) and part exists as a key
      else if (typeof current === 'object' && current !== null) {
        if (part in current) {
          console.log(`[getValueByPath]   ✓ Object key access ["${part}"]`);
          current = current[part];
          console.log(`[getValueByPath]   Value:`, current);
        } else {
          console.log(`[getValueByPath]   ❌ Key "${part}" not found in object`);
          console.log(`[getValueByPath]   Available keys: ${Object.keys(current).join(', ')}`);
          return undefined;
        }
      }
      else {
        console.log(`[getValueByPath]   ❌ Cannot access "${part}" - invalid state`);
        return undefined;
      }
    }
    
    console.log(`[getValueByPath] ✓✓✓ Final value:`, current);
    return current;
  }
}