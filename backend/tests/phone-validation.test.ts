/**
 * =============================================================================
 * Test Suite: phone-validation.test.ts
 * Purpose: Phone Number Validation & Canonical E.164 Normalization
 * =============================================================================
 * This test suite makes sure phone numbers across India and the world are
 * checked and formatted properly.
 *
 * In simple terms, it ensures:
 * 1. Valid numbers (like 10-digit Indian mobiles, +91, US +1, UK +44) pass and get
 *    converted into standard E.164 format (e.g. +919829012345).
 * 2. Letters, typos, and garbage strings (like "abc", "hello123") are rejected.
 * 3. Incomplete numbers (too short) or fake digits (too long) are rejected.
 * 4. Client phone numbers can be optional, but vendor contact numbers are mandatory.
 * =============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { phoneSchema, clientInput } from '../src/contracts.js';
import { vendorInput } from '../src/workflow-contracts.js';

describe('Phone Number Validation & Normalization Engine', () => {
  // Scenario 1: Standard 10-digit Indian phone numbers without country code
  it('accepts and normalizes 10-digit Indian national mobile numbers', () => {
    const res = phoneSchema.safeParse('9829012345');
    assert.equal(res.success, true);
    if (res.success) assert.equal(res.data, '+919829012345');
  });

  // Scenario 2: Indian phone numbers dialed with a leading zero (e.g. 09829012345)
  it('accepts and normalizes Indian mobile numbers with leading zero', () => {
    const res = phoneSchema.safeParse('09829012345');
    assert.equal(res.success, true);
    if (res.success) assert.equal(res.data, '+919829012345');
  });

  // Scenario 3: Indian phone numbers with explicit +91 country prefix
  it('accepts and normalizes Indian numbers explicitly prefixed with +91', () => {
    const res = phoneSchema.safeParse('+91 98290 12345');
    assert.equal(res.success, true);
    if (res.success) assert.equal(res.data, '+919829012345');
  });

  // Scenario 4: Valid United States phone numbers (+1)
  it('accepts and normalizes valid US international numbers (+1)', () => {
    const res = phoneSchema.safeParse('+1 415 555 2671');
    assert.equal(res.success, true);
    if (res.success) assert.equal(res.data, '+14155552671');
  });

  // Scenario 5: Valid United Kingdom phone numbers (+44)
  it('accepts and normalizes valid UK international numbers (+44)', () => {
    const res = phoneSchema.safeParse('+44 20 7946 0991');
    assert.equal(res.success, true);
    if (res.success) assert.equal(res.data, '+442079460991');
  });

  // Scenario 6: Rejecting pure letters
  it('rejects purely alphabetic input (e.g. "abc")', () => {
    const res = phoneSchema.safeParse('abc');
    assert.equal(res.success, false);
  });

  // Scenario 7: Rejecting words with numbers (alphanumeric)
  it('rejects alphanumeric strings (e.g. "hello123")', () => {
    const res = phoneSchema.safeParse('hello123');
    assert.equal(res.success, false);
  });

  // Scenario 8: Rejecting numbers mixed with letters
  it('rejects mixed numbers and letters (e.g. "123abc456")', () => {
    const res = phoneSchema.safeParse('123abc456');
    assert.equal(res.success, false);
  });

  // Scenario 9: Rejecting numbers that are way too short
  it('rejects numbers that are clearly too short (e.g. 5 digits)', () => {
    const res = phoneSchema.safeParse('12345');
    assert.equal(res.success, false);
  });

  // Scenario 10: Rejecting incomplete 8-digit mobile numbers
  it('rejects incomplete Indian mobile numbers (e.g. 8 digits)', () => {
    const res = phoneSchema.safeParse('98290123');
    assert.equal(res.success, false);
  });

  // Scenario 11: Rejecting numbers that are ridiculously long
  it('rejects excessively long digit strings beyond phone specification', () => {
    const res = phoneSchema.safeParse('+91 98290 1234567890123');
    assert.equal(res.success, false);
  });

  // Scenario 12: Rejecting non-existent country codes
  it('rejects invalid or unassigned international country codes', () => {
    const res = phoneSchema.safeParse('+999 12345678');
    assert.equal(res.success, false);
  });

  // Scenario 13: Rejecting empty spaces
  it('rejects whitespace-only values for required phone fields', () => {
    const res = phoneSchema.safeParse('   ');
    assert.equal(res.success, false);
  });

  // Scenario 14: Client phone numbers can be empty or omitted
  it('allows null and undefined for optional client phone', () => {
    const optRes = clientInput.safeParse({ name: 'Rahul Sharma', email: 'rahul@example.com' });
    assert.equal(optRes.success, true);
  });

  // Scenario 15: Vendor phone numbers must always be provided and valid
  it('strictly requires valid phone in vendorInput contract', () => {
    const missingRes = vendorInput.safeParse({
      name: 'Royal Florals',
      categoryCode: 'FLORAL',
      contactName: 'Amit Singh',
      email: 'amit@florals.in',
      serviceDetails: 'Floral design and mandap decor'
    });
    assert.equal(missingRes.success, false);
  });
});
