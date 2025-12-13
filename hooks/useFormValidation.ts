import { useState, useCallback, useMemo } from 'react';
import { ValidationRule, ValidationResult, validate, validateForm, isFormValid } from '../utils/validation/validators';

export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: Partial<Record<keyof T, ValidationRule[]>>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useFormValidation = <T extends Record<string, any>>({
  initialValues,
  validationRules,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string[]>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (name: keyof T, value: any): ValidationResult => {
      const rules = validationRules[name];
      if (!rules) {
        return { isValid: true, errors: [] };
      }
      return validate(value, rules);
    },
    [validationRules]
  );

  /**
   * Validate all fields
   */
  const validateAllFields = useCallback((): boolean => {
    const results = validateForm(values, validationRules as Record<string, ValidationRule[]>);
    const newErrors: Partial<Record<keyof T, string[]>> = {};

    Object.entries(results).forEach(([field, result]) => {
      if (!result.isValid) {
        newErrors[field as keyof T] = result.errors;
      }
    });

    setErrors(newErrors);
    return isFormValid(results);
  }, [values, validationRules]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (name: keyof T) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));

      if (validateOnChange) {
        const result = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: result.isValid ? [] : result.errors,
        }));
      }
    },
    [validateField, validateOnChange]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const result = validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: result.isValid ? [] : result.errors,
        }));
      }
    },
    [validateField, validateOnBlur, values]
  );

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Set field error programmatically
   */
  const setFieldError = useCallback((name: keyof T, error: string[]) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  /**
   * Set field touched programmatically
   */
  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) =>
      async (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
          event.preventDefault();
        }

        setIsSubmitting(true);

        // Mark all fields as touched
        const allTouched: Partial<Record<keyof T, boolean>> = {};
        Object.keys(initialValues).forEach((key) => {
          allTouched[key as keyof T] = true;
        });
        setTouched(allTouched);

        // Validate all fields
        const isValid = validateAllFields();

        if (isValid) {
          try {
            await onSubmit(values);
          } catch (error) {
            console.error('Form submission error:', error);
          }
        }

        setIsSubmitting(false);
      },
    [values, initialValues, validateAllFields]
  );

  /**
   * Get field props for easy integration
   */
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: values[name] || '',
      onChange: handleChange(name),
      onBlur: handleBlur(name),
    }),
    [values, handleChange, handleBlur]
  );

  /**
   * Get field meta information
   */
  const getFieldMeta = useCallback(
    (name: keyof T) => ({
      error: errors[name],
      touched: touched[name],
      hasError: !!(errors[name] && errors[name]!.length > 0 && touched[name]),
    }),
    [errors, touched]
  );

  /**
   * Check if form is valid
   */
  const formIsValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Check if form is dirty (has changes)
   */
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    formIsValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateAllFields,
    resetForm,
    getFieldProps,
    getFieldMeta,
  };
};
