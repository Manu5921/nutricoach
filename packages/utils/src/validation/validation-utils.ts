/**
 * Universal Validation Utilities
 * Cross-application validation helpers
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ValidationUtils {
  /**
   * Validate email address
   */
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   */
  static isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate UUID
   */
  static isUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate phone number (basic)
   */
  static isPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push('Password should contain at least one special character');
    }

    if (password.length < 12) {
      warnings.push('Consider using a longer password (12+ characters) for better security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate required fields
   */
  static validateRequired(fields: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    Object.entries(fields).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        errors.push(`${key} is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate string length
   */
  static validateLength(
    value: string,
    min?: number,
    max?: number,
    fieldName = 'Field'
  ): ValidationResult {
    const errors: string[] = [];

    if (min !== undefined && value.length < min) {
      errors.push(`${fieldName} must be at least ${min} characters long`);
    }

    if (max !== undefined && value.length > max) {
      errors.push(`${fieldName} must be no more than ${max} characters long`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate number range
   */
  static validateRange(
    value: number,
    min?: number,
    max?: number,
    fieldName = 'Value'
  ): ValidationResult {
    const errors: string[] = [];

    if (min !== undefined && value < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
      errors.push(`${fieldName} must be no more than ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}

export const isEmail = ValidationUtils.isEmail;
export const isUrl = ValidationUtils.isUrl;
export const isUuid = ValidationUtils.isUuid;
export const isPhoneNumber = ValidationUtils.isPhoneNumber;