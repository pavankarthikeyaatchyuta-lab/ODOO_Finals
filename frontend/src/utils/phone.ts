/**
 * =============================================================================
 * File: phone.ts
 * Module: Shared Client Validation Utility
 * =============================================================================
 * Standardizes international & Indian phone number validation, E.164 canonicalization,
 * and user-friendly formatting adhering to the Royal Knot data hygiene standard.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { parsePhoneNumberFromString, PhoneNumber } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string;
  formattedInternational: string;
  formattedNational: string;
  error?: string;
}

/**
 * Validates and normalizes phone inputs.
 * Accepts:
 * - Indian national numbers: "98290 12345", "09829012345", "9829012345" -> +919829012345
 * - Full E.164 / International: "+91 98290 12345", "+1 415 555 2671"
 * Rejects:
 * - Alphabetic strings ("abc", "hello123", "123abc")
 * - Whitespace-only or empty strings
 * - Short / truncated invalid numbers
 */
export function validateAndFormatPhone(raw: string, defaultCountry = 'IN'): PhoneValidationResult {
  if (!raw || typeof raw !== 'string') {
    return {
      isValid: false,
      e164: '',
      formattedInternational: '',
      formattedNational: '',
      error: 'Phone number is required.'
    };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      e164: '',
      formattedInternational: '',
      formattedNational: '',
      error: 'Phone number cannot be empty.'
    };
  }

  // Reject strings with alphabetic characters immediately
  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      e164: '',
      formattedInternational: '',
      formattedNational: '',
      error: 'Phone number cannot contain alphabetic letters.'
    };
  }

  try {
    const parsed: PhoneNumber | undefined = parsePhoneNumberFromString(
      trimmed,
      defaultCountry as any
    );

    if (!parsed || !parsed.isValid()) {
      return {
        isValid: false,
        e164: '',
        formattedInternational: '',
        formattedNational: '',
        error: 'Please enter a valid 10-digit Indian mobile or full international number.'
      };
    }

    return {
      isValid: true,
      e164: parsed.format('E.164'),
      formattedInternational: parsed.formatInternational(),
      formattedNational: parsed.formatNational()
    };
  } catch (err) {
    return {
      isValid: false,
      e164: '',
      formattedInternational: '',
      formattedNational: '',
      error: 'Invalid telephone number format.'
    };
  }
}
