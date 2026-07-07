const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 10;

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export type PasswordViolation = 'too_short' | 'missing_upper' | 'missing_lower' | 'missing_digit';

export function validatePassword(value: string): PasswordViolation[] {
  const violations: PasswordViolation[] = [];
  if (value.length < 8) violations.push('too_short');
  if (!/[A-Z]/.test(value)) violations.push('missing_upper');
  if (!/[a-z]/.test(value)) violations.push('missing_lower');
  if (!/\d/.test(value)) violations.push('missing_digit');
  return violations;
}

export function isValidQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= QUANTITY_MIN && value <= QUANTITY_MAX;
}
