/**
 * Universal Date and Time Utilities
 * Cross-application date manipulation and formatting
 */

export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type DateFormat = 'iso' | 'local' | 'utc' | 'unix' | 'custom';
export type RelativeTimeFormat = 'short' | 'long' | 'narrow';

/**
 * Date range type
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Duration type
 */
export interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

/**
 * Timezone information
 */
export interface TimezoneInfo {
  name: string;
  offset: number; // in minutes
  abbreviation: string;
  isDST: boolean;
}

/**
 * Core Date Utilities
 */
export class DateUtils {
  /**
   * Create a new date with timezone support
   */
  static create(
    input?: string | number | Date,
    timezone?: string
  ): Date {
    const date = input ? new Date(input) : new Date();
    
    if (timezone && timezone !== 'local') {
      return this.convertTimezone(date, timezone);
    }
    
    return date;
  }

  /**
   * Check if a value is a valid date
   */
  static isValid(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Parse various date formats safely
   */
  static parse(input: string | number | Date): Date | null {
    try {
      const date = new Date(input);
      return this.isValid(date) ? date : null;
    } catch {
      return null;
    }
  }

  /**
   * Format date with various options
   */
  static format(
    date: Date,
    format: string,
    locale = 'en-US',
    timezone?: string
  ): string {
    const options: Intl.DateTimeFormatOptions = {};
    
    if (timezone) {
      options.timeZone = timezone;
    }

    // Parse custom format string
    if (format.includes('yyyy')) {
      options.year = 'numeric';
    } else if (format.includes('yy')) {
      options.year = '2-digit';
    }

    if (format.includes('MMMM')) {
      options.month = 'long';
    } else if (format.includes('MMM')) {
      options.month = 'short';
    } else if (format.includes('MM')) {
      options.month = '2-digit';
    } else if (format.includes('M')) {
      options.month = 'numeric';
    }

    if (format.includes('dd')) {
      options.day = '2-digit';
    } else if (format.includes('d')) {
      options.day = 'numeric';
    }

    if (format.includes('HH')) {
      options.hour = '2-digit';
      options.hour12 = false;
    } else if (format.includes('hh')) {
      options.hour = '2-digit';
      options.hour12 = true;
    }

    if (format.includes('mm')) {
      options.minute = '2-digit';
    }

    if (format.includes('ss')) {
      options.second = '2-digit';
    }

    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  static relative(
    date: Date,
    relativeTo = new Date(),
    format: RelativeTimeFormat = 'long',
    locale = 'en-US'
  ): string {
    const diffMs = date.getTime() - relativeTo.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const rtf = new Intl.RelativeTimeFormat(locale, { style: format });

    if (Math.abs(diffYears) >= 1) {
      return rtf.format(diffYears, 'year');
    } else if (Math.abs(diffMonths) >= 1) {
      return rtf.format(diffMonths, 'month');
    } else if (Math.abs(diffWeeks) >= 1) {
      return rtf.format(diffWeeks, 'week');
    } else if (Math.abs(diffDays) >= 1) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffHours) >= 1) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffMinutes) >= 1) {
      return rtf.format(diffMinutes, 'minute');
    } else {
      return rtf.format(diffSeconds, 'second');
    }
  }

  /**
   * Add time to a date
   */
  static add(date: Date, duration: Duration): Date {
    const result = new Date(date);

    if (duration.years) {
      result.setFullYear(result.getFullYear() + duration.years);
    }
    if (duration.months) {
      result.setMonth(result.getMonth() + duration.months);
    }
    if (duration.weeks) {
      result.setDate(result.getDate() + (duration.weeks * 7));
    }
    if (duration.days) {
      result.setDate(result.getDate() + duration.days);
    }
    if (duration.hours) {
      result.setHours(result.getHours() + duration.hours);
    }
    if (duration.minutes) {
      result.setMinutes(result.getMinutes() + duration.minutes);
    }
    if (duration.seconds) {
      result.setSeconds(result.getSeconds() + duration.seconds);
    }
    if (duration.milliseconds) {
      result.setMilliseconds(result.getMilliseconds() + duration.milliseconds);
    }

    return result;
  }

  /**
   * Subtract time from a date
   */
  static subtract(date: Date, duration: Duration): Date {
    const negatedDuration: Duration = {};
    
    Object.entries(duration).forEach(([key, value]) => {
      if (typeof value === 'number') {
        negatedDuration[key as keyof Duration] = -value;
      }
    });

    return this.add(date, negatedDuration);
  }

  /**
   * Get difference between two dates
   */
  static diff(
    date1: Date,
    date2: Date,
    unit: TimeUnit = 'milliseconds'
  ): number {
    const diffMs = date1.getTime() - date2.getTime();

    switch (unit) {
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      case 'years':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
      default:
        return diffMs;
    }
  }

  /**
   * Check if date is between two dates
   */
  static isBetween(
    date: Date,
    start: Date,
    end: Date,
    inclusive = true
  ): boolean {
    if (inclusive) {
      return date >= start && date <= end;
    } else {
      return date > start && date < end;
    }
  }

  /**
   * Get start of time unit (e.g., start of day, month, etc.)
   */
  static startOf(date: Date, unit: TimeUnit): Date {
    const result = new Date(date);

    switch (unit) {
      case 'years':
        result.setMonth(0, 1);
        result.setHours(0, 0, 0, 0);
        break;
      case 'months':
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        break;
      case 'weeks':
        const dayOfWeek = result.getDay();
        result.setDate(result.getDate() - dayOfWeek);
        result.setHours(0, 0, 0, 0);
        break;
      case 'days':
        result.setHours(0, 0, 0, 0);
        break;
      case 'hours':
        result.setMinutes(0, 0, 0);
        break;
      case 'minutes':
        result.setSeconds(0, 0);
        break;
      case 'seconds':
        result.setMilliseconds(0);
        break;
    }

    return result;
  }

  /**
   * Get end of time unit
   */
  static endOf(date: Date, unit: TimeUnit): Date {
    const result = new Date(date);

    switch (unit) {
      case 'years':
        result.setMonth(11, 31);
        result.setHours(23, 59, 59, 999);
        break;
      case 'months':
        result.setMonth(result.getMonth() + 1, 0);
        result.setHours(23, 59, 59, 999);
        break;
      case 'weeks':
        const dayOfWeek = result.getDay();
        result.setDate(result.getDate() + (6 - dayOfWeek));
        result.setHours(23, 59, 59, 999);
        break;
      case 'days':
        result.setHours(23, 59, 59, 999);
        break;
      case 'hours':
        result.setMinutes(59, 59, 999);
        break;
      case 'minutes':
        result.setSeconds(59, 999);
        break;
      case 'seconds':
        result.setMilliseconds(999);
        break;
    }

    return result;
  }

  /**
   * Convert timezone
   */
  static convertTimezone(date: Date, timezone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  /**
   * Get timezone information
   */
  static getTimezoneInfo(timezone: string, date = new Date()): TimezoneInfo {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(date);
    const abbreviation = parts.find(part => part.type === 'timeZoneName')?.value || '';

    // Calculate offset
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);

    // Check if DST
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    const janOffset = this.getTimezoneOffset(jan, timezone);
    const julOffset = this.getTimezoneOffset(jul, timezone);
    const isDST = Math.min(janOffset, julOffset) === offset;

    return {
      name: timezone,
      offset,
      abbreviation,
      isDST,
    };
  }

  /**
   * Get timezone offset in minutes
   */
  private static getTimezoneOffset(date: Date, timezone: string): number {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  }

  /**
   * Generate date range
   */
  static range(
    start: Date,
    end: Date,
    unit: TimeUnit = 'days',
    step = 1
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));

      switch (unit) {
        case 'days':
          current.setDate(current.getDate() + step);
          break;
        case 'weeks':
          current.setDate(current.getDate() + (step * 7));
          break;
        case 'months':
          current.setMonth(current.getMonth() + step);
          break;
        case 'years':
          current.setFullYear(current.getFullYear() + step);
          break;
        case 'hours':
          current.setHours(current.getHours() + step);
          break;
        case 'minutes':
          current.setMinutes(current.getMinutes() + step);
          break;
        case 'seconds':
          current.setSeconds(current.getSeconds() + step);
          break;
      }
    }

    return dates;
  }

  /**
   * Business days utilities
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  static isBusinessDay(date: Date): boolean {
    return !this.isWeekend(date);
  }

  static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < Math.abs(days)) {
      result.setDate(result.getDate() + (days > 0 ? 1 : -1));
      if (this.isBusinessDay(result)) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * Age calculation
   */
  static calculateAge(birthDate: Date, asOf = new Date()): number {
    let age = asOf.getFullYear() - birthDate.getFullYear();
    const monthDiff = asOf.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Duration formatting
   */
  static formatDuration(
    duration: Duration,
    format: 'compact' | 'full' | 'short' = 'full'
  ): string {
    const parts: string[] = [];

    const units = [
      { key: 'years' as keyof Duration, label: { compact: 'y', short: 'yr', full: 'year' } },
      { key: 'months' as keyof Duration, label: { compact: 'mo', short: 'mo', full: 'month' } },
      { key: 'weeks' as keyof Duration, label: { compact: 'w', short: 'wk', full: 'week' } },
      { key: 'days' as keyof Duration, label: { compact: 'd', short: 'day', full: 'day' } },
      { key: 'hours' as keyof Duration, label: { compact: 'h', short: 'hr', full: 'hour' } },
      { key: 'minutes' as keyof Duration, label: { compact: 'm', short: 'min', full: 'minute' } },
      { key: 'seconds' as keyof Duration, label: { compact: 's', short: 'sec', full: 'second' } },
    ];

    units.forEach(({ key, label }) => {
      const value = duration[key];
      if (value && value > 0) {
        const unit = value === 1 ? label[format] : label[format] + 's';
        parts.push(`${value}${format === 'compact' ? '' : ' '}${unit}`);
      }
    });

    if (parts.length === 0) {
      return '0 seconds';
    }

    return parts.join(format === 'compact' ? ' ' : ', ');
  }
}

/**
 * Convenience functions
 */
export const formatDate = (date: Date, format: string, locale?: string) =>
  DateUtils.format(date, format, locale);

export const parseDate = (input: string | number | Date) =>
  DateUtils.parse(input);

export const addDays = (date: Date, days: number) =>
  DateUtils.add(date, { days });

export const addHours = (date: Date, hours: number) =>
  DateUtils.add(date, { hours });

export const addMinutes = (date: Date, minutes: number) =>
  DateUtils.add(date, { minutes });

export const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date) => {
  const yesterday = DateUtils.subtract(new Date(), { days: 1 });
  return date.toDateString() === yesterday.toDateString();
};

export const isTomorrow = (date: Date) => {
  const tomorrow = DateUtils.add(new Date(), { days: 1 });
  return date.toDateString() === tomorrow.toDateString();
};

export const startOfWeek = (date: Date) => DateUtils.startOf(date, 'weeks');
export const endOfWeek = (date: Date) => DateUtils.endOf(date, 'weeks');
export const startOfMonth = (date: Date) => DateUtils.startOf(date, 'months');
export const endOfMonth = (date: Date) => DateUtils.endOf(date, 'months');
export const startOfYear = (date: Date) => DateUtils.startOf(date, 'years');
export const endOfYear = (date: Date) => DateUtils.endOf(date, 'years');

/**
 * Common date constants
 */
export const COMMON_FORMATS = {
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: 'yyyy-MM-ddTHH:mm:ss',
  US: 'MM/dd/yyyy',
  EU: 'dd/MM/yyyy',
  LONG: 'MMMM d, yyyy',
  SHORT: 'MMM d, yyyy',
  TIME_12: 'hh:mm a',
  TIME_24: 'HH:mm',
  DATETIME_12: 'MMM d, yyyy hh:mm a',
  DATETIME_24: 'MMM d, yyyy HH:mm',
} as const;

export const COMMON_TIMEZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  PST: 'America/Los_Angeles',
  CST: 'America/Chicago',
  MST: 'America/Denver',
  GMT: 'Europe/London',
  CET: 'Europe/Paris',
  JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney',
} as const;