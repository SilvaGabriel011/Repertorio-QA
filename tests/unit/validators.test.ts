import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidQuantity, validatePassword } from '../../src/domain/validators.js';

describe('isValidEmail — equivalence partitions', () => {
  it.each(['alice.qa@example.com', 'a@sub.domain.co', 'first+tag@example.io'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    ['missing @', 'alice.example.com'],
    ['missing tld', 'alice@example'],
    ['contains spaces', 'alice @example.com'],
    ['empty string', ''],
    ['over 254 chars', `${'a'.repeat(250)}@example.com`],
  ])('rejects %s', (_label, email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it.each([42, null, undefined, {}])('rejects non-string %o', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('validatePassword — one violation per broken rule', () => {
  it('accepts a compliant password', () => {
    expect(validatePassword('S3curePass!')).toEqual([]);
  });

  it.each([
    { password: 'S3cure!', expected: ['too_short'] },
    { password: 's3curepass!', expected: ['missing_upper'] },
    { password: 'S3CUREPASS!', expected: ['missing_lower'] },
    { password: 'SecurePass!', expected: ['missing_digit'] },
  ])('flags $expected for $password', ({ password, expected }) => {
    expect(validatePassword(password)).toEqual(expected);
  });

  it('reports every violation at once', () => {
    expect(validatePassword('abc')).toEqual(['too_short', 'missing_upper', 'missing_digit']);
  });
});

describe('isValidQuantity — boundary analysis on 1..10', () => {
  it.each([1, 2, 10])('accepts %d', (value) => {
    expect(isValidQuantity(value)).toBe(true);
  });

  it.each([0, 11, -1, 1.5, NaN, '2', null])('rejects %o', (value) => {
    expect(isValidQuantity(value)).toBe(false);
  });
});
