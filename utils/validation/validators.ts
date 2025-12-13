/**
 * Comprehensive input validation utilities for frontend
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common validation rules
 */
export const validators = {
  required: (message: string = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: message || `Minimum length is ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: message || `Maximum length is ${max} characters`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  email: (message: string = 'Invalid email address'): ValidationRule => ({
    validate: (value: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  url: (message: string = 'Invalid URL'): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  number: (message: string = 'Must be a number'): ValidationRule => ({
    validate: (value: any) => !isNaN(Number(value)),
    message,
  }),

  integer: (message: string = 'Must be an integer'): ValidationRule => ({
    validate: (value: any) => Number.isInteger(Number(value)),
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: any) => Number(value) >= min,
    message: message || `Minimum value is ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: any) => Number(value) <= max,
    message: message || `Maximum value is ${max}`,
  }),

  fileSize: (maxSizeMB: number, message?: string): ValidationRule => ({
    validate: (file: File) => file.size <= maxSizeMB * 1024 * 1024,
    message: message || `File size must be less than ${maxSizeMB}MB`,
  }),

  fileType: (allowedTypes: string[], message?: string): ValidationRule => ({
    validate: (file: File) => allowedTypes.includes(file.type),
    message: message || `Allowed file types: ${allowedTypes.join(', ')}`,
  }),

  fileExtension: (allowedExtensions: string[], message?: string): ValidationRule => ({
    validate: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext ? allowedExtensions.includes(ext) : false;
    },
    message: message || `Allowed extensions: ${allowedExtensions.join(', ')}`,
  }),

  custom: (
    validatorFn: (value: any) => boolean,
    message: string
  ): ValidationRule => ({
    validate: validatorFn,
    message,
  }),
};

/**
 * Validate a value against multiple rules
 */
export const validate = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate multiple fields
 */
export const validateForm = (
  values: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    results[field] = validate(values[field], fieldRules);
  }

  return results;
};

/**
 * Check if form is valid
 */
export const isFormValid = (results: Record<string, ValidationResult>): boolean => {
  return Object.values(results).every((result) => result.isValid);
};

/**
 * Sanitize user input
 */
export const sanitize = {
  /**
   * Remove HTML tags
   */
  stripHtml: (value: string): string => {
    return value.replace(/<[^>]*>/g, '');
  },

  /**
   * Escape HTML entities
   */
  escapeHtml: (value: string): string => {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  },

  /**
   * Remove extra whitespace
   */
  trimWhitespace: (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
  },

  /**
   * Remove non-alphanumeric characters
   */
  alphanumeric: (value: string): string => {
    return value.replace(/[^a-zA-Z0-9]/g, '');
  },

  /**
   * Sanitize filename
   */
  filename: (value: string): string => {
    return value
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\./, '')
      .substring(0, 255);
  },

  /**
   * Sanitize for safe display
   */
  safe: (value: string): string => {
    return sanitize.escapeHtml(sanitize.trimWhitespace(value));
  },
};

/**
 * File validation utilities
 */
export const fileValidation = {
  /**
   * Validate image file
   */
  validateImageFile: (file: File): ValidationResult => {
    const rules = [
      validators.fileSize(10, 'Image must be less than 10MB'),
      validators.fileType(
        ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        'Only JPEG, PNG, GIF, and WebP images are allowed'
      ),
      validators.fileExtension(
        ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'Invalid file extension'
      ),
    ];

    return validate(file, rules);
  },

  /**
   * Check file magic bytes (more secure than MIME type)
   */
  checkMagicBytes: async (file: File, expectedSignatures: string[]): Promise<boolean> => {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    return expectedSignatures.some((sig) => hex.startsWith(sig));
  },

  /**
   * Validate image dimensions
   */
  validateImageDimensions: async (
    file: File,
    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const errors: string[] = [];

        if (minWidth && img.width < minWidth) {
          errors.push(`Minimum width is ${minWidth}px`);
        }
        if (minHeight && img.height < minHeight) {
          errors.push(`Minimum height is ${minHeight}px`);
        }
        if (maxWidth && img.width > maxWidth) {
          errors.push(`Maximum width is ${maxWidth}px`);
        }
        if (maxHeight && img.height > maxHeight) {
          errors.push(`Maximum height is ${maxHeight}px`);
        }

        resolve({
          isValid: errors.length === 0,
          errors,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          errors: ['Failed to load image'],
        });
      };

      img.src = url;
    });
  },
};

/**
 * Image file magic bytes signatures
 */
export const IMAGE_SIGNATURES = {
  JPEG: ['FFD8FF'],
  PNG: ['89504E47'],
  GIF: ['47494638'],
  WEBP: ['52494646'],
};
