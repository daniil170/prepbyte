/**
 * Generates a cryptographically secure 6-digit exam PIN.
 * Uses Web Crypto API when available.
 *
 * @returns {string} Exactly 6-digit numeric string.
 */
export function generateExamPin() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Range: 100000 - 999999
    const pinNumber = 100000 + (array[0] % 900000);
    return String(pinNumber);
  }

  // Fallback for non-browser/legacy test environments
  const fallback = Math.floor(100000 + Math.random() * 900000);
  return String(fallback);
}

/**
 * Validates whether a given string is a valid 6-digit PIN.
 *
 * @param {string|number} pin
 * @returns {boolean}
 */
export function isValidExamPin(pin) {
  if (typeof pin !== 'string' && typeof pin !== 'number') {
    return false;
  }
  const clean = String(pin).trim();
  return /^\d{6}$/.test(clean);
}

/**
 * Normalizes input PIN by removing spaces and non-digit characters.
 *
 * @param {string} pin
 * @returns {string}
 */
export function normalizeExamPin(pin) {
  if (!pin || typeof pin !== 'string') {
    return '';
  }
  return pin.replace(/\D/g, '').slice(0, 6);
}
