/**
 * Universal Formatting Utilities
 * Cross-application formatting functions
 */

export type NumberFormat = 'decimal' | 'currency' | 'percent' | 'scientific' | 'compact';
export type TextCase = 'lower' | 'upper' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'kebab';

/**
 * Number formatting utilities
 */
export class NumberFormatter {
  /**
   * Format number with locale support
   */
  static format(
    value: number,
    options: {
      locale?: string;
      style?: NumberFormat;
      currency?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      minimumIntegerDigits?: number;
      useGrouping?: boolean;
      notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    } = {}
  ): string {
    const {
      locale = 'en-US',
      style = 'decimal',
      currency = 'USD',
      minimumFractionDigits,
      maximumFractionDigits,
      minimumIntegerDigits,
      useGrouping = true,
      notation = 'standard',
    } = options;

    const formatOptions: Intl.NumberFormatOptions = {
      useGrouping,
      notation,
    };

    if (style === 'currency') {
      formatOptions.style = 'currency';
      formatOptions.currency = currency;
    } else if (style === 'percent') {
      formatOptions.style = 'percent';
    } else if (style === 'scientific') {
      formatOptions.notation = 'scientific';
    } else if (style === 'compact') {
      formatOptions.notation = 'compact';
    }

    if (minimumFractionDigits !== undefined) {
      formatOptions.minimumFractionDigits = minimumFractionDigits;
    }
    if (maximumFractionDigits !== undefined) {
      formatOptions.maximumFractionDigits = maximumFractionDigits;
    }
    if (minimumIntegerDigits !== undefined) {
      formatOptions.minimumIntegerDigits = minimumIntegerDigits;
    }

    return new Intl.NumberFormat(locale, formatOptions).format(value);
  }

  /**
   * Format currency
   */
  static currency(
    value: number,
    currency = 'USD',
    locale = 'en-US',
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string {
    return this.format(value, {
      locale,
      style: 'currency',
      currency,
      ...options,
    });
  }

  /**
   * Format percentage
   */
  static percent(
    value: number,
    locale = 'en-US',
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string {
    return this.format(value, {
      locale,
      style: 'percent',
      ...options,
    });
  }

  /**
   * Format with thousands separators
   */
  static thousands(value: number, locale = 'en-US'): string {
    return this.format(value, { locale, useGrouping: true });
  }

  /**
   * Format bytes to human readable
   */
  static bytes(
    bytes: number,
    options: {
      binary?: boolean;
      locale?: string;
      precision?: number;
    } = {}
  ): string {
    const { binary = false, locale = 'en-US', precision = 1 } = options;
    const base = binary ? 1024 : 1000;
    const units = binary
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    if (bytes === 0) return '0 B';

    const exp = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
    const value = bytes / Math.pow(base, exp);
    const unit = units[Math.min(exp, units.length - 1)];

    return `${this.format(value, {
      locale,
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    })} ${unit}`;
  }

  /**
   * Format duration in milliseconds to human readable
   */
  static duration(
    milliseconds: number,
    options: {
      format?: 'short' | 'long' | 'compact';
      precision?: number;
      maxUnits?: number;
    } = {}
  ): string {
    const { format = 'long', precision = 0, maxUnits = 3 } = options;

    const units = [
      { name: 'year', short: 'y', value: 365 * 24 * 60 * 60 * 1000 },
      { name: 'month', short: 'mo', value: 30 * 24 * 60 * 60 * 1000 },
      { name: 'day', short: 'd', value: 24 * 60 * 60 * 1000 },
      { name: 'hour', short: 'h', value: 60 * 60 * 1000 },
      { name: 'minute', short: 'm', value: 60 * 1000 },
      { name: 'second', short: 's', value: 1000 },
      { name: 'millisecond', short: 'ms', value: 1 },
    ];

    if (milliseconds === 0) {
      return format === 'compact' ? '0ms' : '0 milliseconds';
    }

    const parts: string[] = [];
    let remaining = Math.abs(milliseconds);

    for (const unit of units) {
      if (parts.length >= maxUnits) break;

      const count = Math.floor(remaining / unit.value);
      if (count > 0) {
        remaining -= count * unit.value;

        let unitName: string;
        if (format === 'compact') {
          unitName = unit.short;
        } else if (format === 'short') {
          unitName = unit.short;
        } else {
          unitName = count === 1 ? unit.name : `${unit.name}s`;
        }

        const formattedCount = precision > 0 && unit.name === 'second'
          ? this.format(count + remaining / unit.value, {
              minimumFractionDigits: 0,
              maximumFractionDigits: precision,
            })
          : count.toString();

        parts.push(format === 'compact' ? `${formattedCount}${unitName}` : `${formattedCount} ${unitName}`);

        if (precision > 0 && unit.name === 'second') {
          break; // Stop here if we're showing fractional seconds
        }
      }
    }

    if (parts.length === 0) {
      return format === 'compact' ? '0ms' : '0 milliseconds';
    }

    const result = format === 'compact' ? parts.join(' ') : parts.join(', ');
    return milliseconds < 0 ? `-${result}` : result;
  }

  /**
   * Format ordinal numbers (1st, 2nd, 3rd, etc.)
   */
  static ordinal(value: number, locale = 'en-US'): string {
    const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
    const suffixes: Record<string, string> = {
      one: 'st',
      two: 'nd',
      few: 'rd',
      other: 'th',
    };
    const rule = pr.select(value);
    const suffix = suffixes[rule];
    return `${value}${suffix}`;
  }
}

/**
 * Text formatting utilities
 */
export class TextFormatter {
  /**
   * Convert text case
   */
  static changeCase(text: string, targetCase: TextCase): string {
    switch (targetCase) {
      case 'lower':
        return text.toLowerCase();
      case 'upper':
        return text.toUpperCase();
      case 'title':
        return text.replace(/\w\S*/g, txt =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'sentence':
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case 'camel':
        return text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
          )
          .replace(/\s+/g, '');
      case 'pascal':
        return text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
          .replace(/\s+/g, '');
      case 'snake':
        return text
          .replace(/\W+/g, ' ')
          .split(/ |\B(?=[A-Z])/)
          .map(word => word.toLowerCase())
          .join('_');
      case 'kebab':
        return text
          .replace(/\W+/g, ' ')
          .split(/ |\B(?=[A-Z])/)
          .map(word => word.toLowerCase())
          .join('-');
      default:
        return text;
    }
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(
    text: string,
    maxLength: number,
    options: {
      ellipsis?: string;
      wordBoundary?: boolean;
      stripHtml?: boolean;
    } = {}
  ): string {
    const { ellipsis = '...', wordBoundary = true, stripHtml = false } = options;

    let processedText = stripHtml ? this.stripHtml(text) : text;

    if (processedText.length <= maxLength) {
      return processedText;
    }

    if (wordBoundary) {
      const truncated = processedText.slice(0, maxLength - ellipsis.length);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > 0) {
        return truncated.slice(0, lastSpace) + ellipsis;
      }
    }

    return processedText.slice(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * Strip HTML tags
   */
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Slugify text for URLs
   */
  static slugify(
    text: string,
    options: {
      separator?: string;
      lowercase?: boolean;
      trim?: boolean;
    } = {}
  ): string {
    const { separator = '-', lowercase = true, trim = true } = options;

    let slug = text
      .normalize('NFD') // Normalize unicode
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, separator) // Replace spaces with separator
      .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove duplicate separators

    if (lowercase) {
      slug = slug.toLowerCase();
    }

    if (trim) {
      slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
    }

    return slug;
  }

  /**
   * Pluralize text
   */
  static pluralize(
    count: number,
    singular: string,
    plural?: string,
    locale = 'en-US'
  ): string {
    const pluralForm = plural || `${singular}s`;
    const pr = new Intl.PluralRules(locale);
    const rule = pr.select(count);
    
    return rule === 'one' ? singular : pluralForm;
  }

  /**
   * Highlight search terms in text
   */
  static highlight(
    text: string,
    searchTerms: string | string[],
    options: {
      className?: string;
      tag?: string;
      caseSensitive?: boolean;
    } = {}
  ): string {
    const { className = 'highlight', tag = 'mark', caseSensitive = false } = options;
    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
    
    if (terms.length === 0) return text;

    const flags = caseSensitive ? 'g' : 'gi';
    const pattern = terms
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    const regex = new RegExp(`(${pattern})`, flags);
    
    return text.replace(regex, `<${tag} class="${className}">$1</${tag}>`);
  }

  /**
   * Extract initials from name
   */
  static initials(name: string, maxLength = 2): string {
    return name
      .split(/\s+/)
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, maxLength)
      .join('');
  }

  /**
   * Mask sensitive information
   */
  static mask(
    text: string,
    options: {
      maskChar?: string;
      visibleStart?: number;
      visibleEnd?: number;
      minMaskLength?: number;
    } = {}
  ): string {
    const { maskChar = '*', visibleStart = 0, visibleEnd = 0, minMaskLength = 3 } = options;

    if (text.length <= visibleStart + visibleEnd) {
      return maskChar.repeat(Math.max(minMaskLength, text.length));
    }

    const start = text.slice(0, visibleStart);
    const end = text.slice(-visibleEnd);
    const maskLength = Math.max(minMaskLength, text.length - visibleStart - visibleEnd);
    const mask = maskChar.repeat(maskLength);

    return start + mask + end;
  }

  /**
   * Word wrap text
   */
  static wordWrap(text: string, lineLength: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= lineLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }
}

/**
 * Phone number formatting
 */
export class PhoneFormatter {
  /**
   * Format phone number
   */
  static format(
    phoneNumber: string,
    format: 'international' | 'national' | 'e164' | 'rfc3966' = 'national',
    country = 'US'
  ): string {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');

    // US phone number formatting
    if (country === 'US' && digits.length === 10) {
      const area = digits.slice(0, 3);
      const exchange = digits.slice(3, 6);
      const number = digits.slice(6);

      switch (format) {
        case 'international':
          return `+1 (${area}) ${exchange}-${number}`;
        case 'national':
          return `(${area}) ${exchange}-${number}`;
        case 'e164':
          return `+1${digits}`;
        case 'rfc3966':
          return `tel:+1-${area}-${exchange}-${number}`;
        default:
          return phoneNumber;
      }
    }

    // For other countries or invalid numbers, return as-is
    return phoneNumber;
  }

  /**
   * Mask phone number
   */
  static mask(phoneNumber: string, visibleDigits = 4): string {
    const formatted = this.format(phoneNumber);
    const digits = formatted.replace(/\D/g, '');
    
    if (digits.length <= visibleDigits) {
      return '*'.repeat(formatted.length);
    }

    const visiblePart = digits.slice(-visibleDigits);
    const maskedPart = '*'.repeat(digits.length - visibleDigits);
    
    return formatted.replace(/\d/g, (digit, index) => {
      const digitIndex = formatted.slice(0, index + 1).replace(/\D/g, '').length - 1;
      return digitIndex < maskedPart.length ? '*' : digit;
    });
  }
}

/**
 * Address formatting
 */
export class AddressFormatter {
  /**
   * Format address for display
   */
  static format(
    address: {
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    },
    format: 'single_line' | 'multi_line' | 'postal' = 'multi_line'
  ): string {
    const parts: string[] = [];

    if (address.street1) parts.push(address.street1);
    if (address.street2) parts.push(address.street2);

    const cityStateZip = [
      address.city,
      address.state,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(', ');

    if (cityStateZip) parts.push(cityStateZip);
    if (address.country) parts.push(address.country);

    switch (format) {
      case 'single_line':
        return parts.join(', ');
      case 'multi_line':
        return parts.join('\n');
      case 'postal':
        // Format for mailing labels
        const lines = [];
        if (address.street1) lines.push(address.street1);
        if (address.street2) lines.push(address.street2);
        
        const lastLine = [address.city, address.state]
          .filter(Boolean)
          .join(', ');
        
        if (lastLine && address.postalCode) {
          lines.push(`${lastLine} ${address.postalCode}`);
        } else if (lastLine) {
          lines.push(lastLine);
        }
        
        if (address.country && address.country !== 'US') {
          lines.push(address.country);
        }
        
        return lines.join('\n');
      default:
        return parts.join('\n');
    }
  }
}

/**
 * Convenience functions
 */
export const formatNumber = (value: number, options?: any) =>
  NumberFormatter.format(value, options);

export const formatCurrency = (value: number, currency?: string, locale?: string) =>
  NumberFormatter.currency(value, currency, locale);

export const formatPercent = (value: number, locale?: string) =>
  NumberFormatter.percent(value, locale);

export const formatBytes = (bytes: number, options?: any) =>
  NumberFormatter.bytes(bytes, options);

export const formatDuration = (milliseconds: number, options?: any) =>
  NumberFormatter.duration(milliseconds, options);

export const truncateText = (text: string, maxLength: number, options?: any) =>
  TextFormatter.truncate(text, maxLength, options);

export const slugify = (text: string, options?: any) =>
  TextFormatter.slugify(text, options);

export const pluralize = (count: number, singular: string, plural?: string) =>
  TextFormatter.pluralize(count, singular, plural);

export const maskText = (text: string, options?: any) =>
  TextFormatter.mask(text, options);

export const toTitleCase = (text: string) =>
  TextFormatter.changeCase(text, 'title');

export const toCamelCase = (text: string) =>
  TextFormatter.changeCase(text, 'camel');

export const toPascalCase = (text: string) =>
  TextFormatter.changeCase(text, 'pascal');

export const toSnakeCase = (text: string) =>
  TextFormatter.changeCase(text, 'snake');

export const toKebabCase = (text: string) =>
  TextFormatter.changeCase(text, 'kebab');