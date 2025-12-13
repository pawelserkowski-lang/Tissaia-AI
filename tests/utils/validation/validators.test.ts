import { describe, it, expect } from 'vitest';
import { validators, validate } from '../../../utils/validation/validators';

describe('validators', () => {
  describe('required', () => {
    it('should pass for non-empty values', () => {
      const rule = validators.required('Required');
      expect(rule('text').isValid).toBe(true);
      expect(rule(123).isValid).toBe(true);
      expect(rule(true).isValid).toBe(true);
    });

    it('should fail for empty values', () => {
      const rule = validators.required('Required');
      expect(rule('').isValid).toBe(false);
      expect(rule(null).isValid).toBe(false);
      expect(rule(undefined).isValid).toBe(false);
    });
  });

  describe('email', () => {
    it('should pass for valid emails', () => {
      const rule = validators.email('Invalid email');
      expect(rule('test@example.com').isValid).toBe(true);
      expect(rule('user.name@domain.co.uk').isValid).toBe(true);
    });

    it('should fail for invalid emails', () => {
      const rule = validators.email('Invalid email');
      expect(rule('invalid').isValid).toBe(false);
      expect(rule('test@').isValid).toBe(false);
      expect(rule('@example.com').isValid).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should pass for strings meeting minimum length', () => {
      const rule = validators.minLength(5, 'Too short');
      expect(rule('12345').isValid).toBe(true);
      expect(rule('123456').isValid).toBe(true);
    });

    it('should fail for strings below minimum length', () => {
      const rule = validators.minLength(5, 'Too short');
      expect(rule('1234').isValid).toBe(false);
      expect(rule('').isValid).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('should pass for strings within maximum length', () => {
      const rule = validators.maxLength(5, 'Too long');
      expect(rule('12345').isValid).toBe(true);
      expect(rule('123').isValid).toBe(true);
    });

    it('should fail for strings exceeding maximum length', () => {
      const rule = validators.maxLength(5, 'Too long');
      expect(rule('123456').isValid).toBe(false);
    });
  });

  describe('pattern', () => {
    it('should pass for matching patterns', () => {
      const rule = validators.pattern(/^\d{3}-\d{4}$/, 'Invalid format');
      expect(rule('123-4567').isValid).toBe(true);
    });

    it('should fail for non-matching patterns', () => {
      const rule = validators.pattern(/^\d{3}-\d{4}$/, 'Invalid format');
      expect(rule('1234567').isValid).toBe(false);
      expect(rule('abc-defg').isValid).toBe(false);
    });
  });

  describe('fileSize', () => {
    it('should pass for files within size limit', () => {
      const rule = validators.fileSize(10, 'Too large');
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.txt');
      expect(rule(file).isValid).toBe(true);
    });

    it('should fail for files exceeding size limit', () => {
      const rule = validators.fileSize(10, 'Too large');
      const file = new File(['x'.repeat(15 * 1024 * 1024)], 'test.txt');
      expect(rule(file).isValid).toBe(false);
    });
  });

  describe('fileType', () => {
    it('should pass for allowed file types', () => {
      const rule = validators.fileType(['image/png', 'image/jpeg'], 'Invalid type');
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(rule(file).isValid).toBe(true);
    });

    it('should fail for disallowed file types', () => {
      const rule = validators.fileType(['image/png', 'image/jpeg'], 'Invalid type');
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(rule(file).isValid).toBe(false);
    });
  });
});

describe('validate', () => {
  it('should run all validation rules', () => {
    const rules = [
      validators.required('Required'),
      validators.minLength(5, 'Too short'),
    ];

    const result1 = validate('12345', rules);
    expect(result1.isValid).toBe(true);

    const result2 = validate('123', rules);
    expect(result2.isValid).toBe(false);
    expect(result2.error).toBe('Too short');
  });

  it('should return first error', () => {
    const rules = [
      validators.required('Required'),
      validators.minLength(5, 'Too short'),
      validators.maxLength(10, 'Too long'),
    ];

    const result = validate('', rules);
    expect(result.error).toBe('Required');
  });
});
