/**
 * Data Processing Utilities
 * Functions for data manipulation, transformation, and analysis
 */

/**
 * Array utilities
 */
export class ArrayUtils {
  /**
   * Remove duplicates from array
   */
  static unique<T>(array: T[], keyFn?: (item: T) => any): T[] {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Group array by key function
   */
  static groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    const groups = {} as Record<K, T[]>;
    
    array.forEach(item => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  }
  
  /**
   * Sort array by multiple keys
   */
  static sortBy<T>(
    array: T[],
    ...keyFns: Array<(item: T) => any>
  ): T[] {
    return [...array].sort((a, b) => {
      for (const keyFn of keyFns) {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  }
  
  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Flatten nested arrays
   */
  static flatten<T>(array: (T | T[])[]): T[] {
    return array.reduce<T[]>((acc, val) => {
      return acc.concat(Array.isArray(val) ? this.flatten(val) : val);
    }, []);
  }
  
  /**
   * Find intersection of arrays
   */
  static intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];
    
    return arrays.reduce((acc, current) =>
      acc.filter(item => current.includes(item))
    );
  }
  
  /**
   * Find difference between arrays
   */
  static difference<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => !array2.includes(item));
  }
  
  /**
   * Sample random items from array
   */
  static sample<T>(array: T[], count: number = 1): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  /**
   * Shuffle array
   */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Get min and max values from array
   */
  static minMax<T>(array: T[], keyFn: (item: T) => number): { min: T; max: T } | null {
    if (array.length === 0) return null;
    
    let min = array[0];
    let max = array[0];
    let minVal = keyFn(min);
    let maxVal = keyFn(max);
    
    for (let i = 1; i < array.length; i++) {
      const val = keyFn(array[i]);
      if (val < minVal) {
        min = array[i];
        minVal = val;
      }
      if (val > maxVal) {
        max = array[i];
        maxVal = val;
      }
    }
    
    return { min, max };
  }
  
  /**
   * Calculate sum of array values
   */
  static sum<T>(array: T[], keyFn: (item: T) => number): number {
    return array.reduce((sum, item) => sum + keyFn(item), 0);
  }
  
  /**
   * Calculate average of array values
   */
  static average<T>(array: T[], keyFn: (item: T) => number): number {
    if (array.length === 0) return 0;
    return this.sum(array, keyFn) / array.length;
  }
  
  /**
   * Calculate median of array values
   */
  static median<T>(array: T[], keyFn: (item: T) => number): number {
    if (array.length === 0) return 0;
    
    const sorted = [...array].sort((a, b) => keyFn(a) - keyFn(b));
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (keyFn(sorted[mid - 1]) + keyFn(sorted[mid])) / 2;
    } else {
      return keyFn(sorted[mid]);
    }
  }
  
  /**
   * Find mode (most frequent value) in array
   */
  static mode<T>(array: T[], keyFn?: (item: T) => any): T | null {
    if (array.length === 0) return null;
    
    const counts = new Map();
    let maxCount = 0;
    let mode: T | null = null;
    
    array.forEach(item => {
      const key = keyFn ? keyFn(item) : item;
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      
      if (count > maxCount) {
        maxCount = count;
        mode = item;
      }
    });
    
    return mode;
  }
  
  /**
   * Paginate array
   */
  static paginate<T>(
    array: T[],
    page: number,
    pageSize: number
  ): {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const total = array.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = array.slice(startIndex, endIndex);
    
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}

/**
 * Object utilities
 */
export class ObjectUtils {
  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as any;
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone((obj as any)[key]);
      });
      return cloned;
    }
    
    return obj;
  }
  
  /**
   * Deep merge objects
   */
  static deepMerge<T extends object>(...objects: Partial<T>[]): T {
    const result = {} as T;
    
    objects.forEach(obj => {
      Object.keys(obj).forEach(key => {
        const value = (obj as any)[key];
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          (result as any)[key] = this.deepMerge((result as any)[key] || {}, value);
        } else {
          (result as any)[key] = value;
        }
      });
    });
    
    return result;
  }
  
  /**
   * Get nested property value
   */
  static get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * Set nested property value
   */
  static set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  /**
   * Check if object has nested property
   */
  static has(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  }
  
  /**
   * Remove nested property
   */
  static unset(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        return false;
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    if (lastKey in current) {
      delete current[lastKey];
      return true;
    }
    
    return false;
  }
  
  /**
   * Pick specific properties from object
   */
  static pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }
  
  /**
   * Omit specific properties from object
   */
  static omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj } as any;
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }
  
  /**
   * Flatten nested object
   */
  static flatten(obj: any, prefix: string = '', separator: string = '.'): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flatten(value, newKey, separator));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  }
  
  /**
   * Unflatten object (reverse of flatten)
   */
  static unflatten(obj: Record<string, any>, separator: string = '.'): any {
    const result: any = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      this.set(result, key.split(separator).join('.'), value);
    });
    
    return result;
  }
  
  /**
   * Transform object keys
   */
  static mapKeys<T>(obj: Record<string, T>, keyFn: (key: string) => string): Record<string, T> {
    const result: Record<string, T> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[keyFn(key)] = value;
    });
    return result;
  }
  
  /**
   * Transform object values
   */
  static mapValues<T, U>(obj: Record<string, T>, valueFn: (value: T, key: string) => U): Record<string, U> {
    const result: Record<string, U> = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = valueFn(value, key);
    });
    return result;
  }
  
  /**
   * Check if objects are equal (deep comparison)
   */
  static isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime();
    }
    
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      return obj1.every((item, index) => this.isEqual(item, obj2[index]));
    }
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      return keys1.every(key => this.isEqual(obj1[key], obj2[key]));
    }
    
    return false;
  }
}

/**
 * String utilities
 */
export class StringUtils {
  /**
   * Convert string to camelCase
   */
  static camelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }
  
  /**
   * Convert string to PascalCase
   */
  static pascalCase(str: string): string {
    const camel = this.camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
  
  /**
   * Convert string to kebab-case
   */
  static kebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
  
  /**
   * Convert string to snake_case
   */
  static snakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
  
  /**
   * Convert string to Title Case
   */
  static titleCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
  
  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  }
  
  /**
   * Escape HTML entities
   */
  static escapeHtml(str: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    
    return str.replace(/[&<>"']/g, char => htmlEntities[char]);
  }
  
  /**
   * Unescape HTML entities
   */
  static unescapeHtml(str: string): string {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
    };
    
    return str.replace(/&(amp|lt|gt|quot|#39);/g, match => htmlEntities[match]);
  }
  
  /**
   * Generate slug from string
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  /**
   * Pad string with zeros
   */
  static padZero(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }
  
  /**
   * Remove accents from string
   */
  static removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  
  /**
   * Extract words from string
   */
  static extractWords(str: string): string[] {
    return str.match(/\b\w+\b/g) || [];
  }
  
  /**
   * Count words in string
   */
  static wordCount(str: string): number {
    return this.extractWords(str).length;
  }
  
  /**
   * Calculate reading time
   */
  static readingTime(str: string, wordsPerMinute: number = 200): number {
    const words = this.wordCount(str);
    return Math.ceil(words / wordsPerMinute);
  }
}

/**
 * Number utilities
 */
export class NumberUtils {
  /**
   * Check if number is in range
   */
  static inRange(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
  }
  
  /**
   * Clamp number to range
   */
  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }
  
  /**
   * Round to specified decimal places
   */
  static round(num: number, decimals: number = 0): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(num * multiplier) / multiplier;
  }
  
  /**
   * Format number with thousand separators
   */
  static formatThousands(num: number, separator: string = ','): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }
  
  /**
   * Format number as percentage
   */
  static formatPercentage(num: number, decimals: number = 1): string {
    return `${this.round(num * 100, decimals)}%`;
  }
  
  /**
   * Format number as currency
   */
  static formatCurrency(
    num: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(num);
  }
  
  /**
   * Convert bytes to human readable format
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${this.round(bytes / Math.pow(k, i), decimals)} ${sizes[i]}`;
  }
  
  /**
   * Generate random number in range
   */
  static random(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
  }
  
  /**
   * Generate random integer in range
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Check if number is prime
   */
  static isPrime(num: number): boolean {
    if (num < 2) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(num); i += 2) {
      if (num % i === 0) return false;
    }
    
    return true;
  }
  
  /**
   * Calculate factorial
   */
  static factorial(n: number): number {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    
    return result;
  }
  
  /**
   * Calculate greatest common divisor
   */
  static gcd(a: number, b: number): number {
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return Math.abs(a);
  }
  
  /**
   * Calculate least common multiple
   */
  static lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b);
  }
}

/**
 * Data transformation utilities
 */
export class TransformUtils {
  /**
   * Convert CSV string to array of objects
   */
  static csvToObjects(csv: string, delimiter: string = ','): any[] {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(delimiter).map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj;
    });
  }
  
  /**
   * Convert array of objects to CSV string
   */
  static objectsToCsv(objects: any[], delimiter: string = ','): string {
    if (objects.length === 0) return '';
    
    const headers = Object.keys(objects[0]);
    const csvRows = [headers.join(delimiter)];
    
    objects.forEach(obj => {
      const values = headers.map(header => {
        const value = obj[header] || '';
        return typeof value === 'string' && value.includes(delimiter)
          ? `"${value.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
          : value;
      });
      csvRows.push(values.join(delimiter));
    });
    
    return csvRows.join('\n');
  }
  
  /**
   * Normalize data to 0-1 range
   */
  static normalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) return values.map(() => 0);
    
    return values.map(value => (value - min) / range);
  }
  
  /**
   * Standardize data (z-score normalization)
   */
  static standardize(values: number[]): number[] {
    const mean = ArrayUtils.average(values, x => x);
    const variance = ArrayUtils.average(values, x => Math.pow(x - mean, 2));
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return values.map(() => 0);
    
    return values.map(value => (value - mean) / stdDev);
  }
  
  /**
   * Calculate correlation coefficient
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}

/**
 * Export all utilities
 */
export const dataUtils = {
  Array: ArrayUtils,
  Object: ObjectUtils,
  String: StringUtils,
  Number: NumberUtils,
  Transform: TransformUtils,
};