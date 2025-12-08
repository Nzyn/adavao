/**
 * Input Sanitization Utilities
 * Provides functions to sanitize and validate user inputs
 */

/**
 * Sanitize text input (names, etc.)
 * Allows: letters, spaces, hyphens, apostrophes
 * Max length: 50 characters
 */
export function sanitizeTextInput(text: string): string {
  return text
    .trim()
    .replace(/[^a-zA-Z\s'-]/g, '') // Remove non-text characters
    .slice(0, 50); // Limit to 50 characters
}

/**
 * Validate and sanitize name
 * Returns sanitized name and validation result
 */
export function validateName(
  name: string
): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  const sanitized = sanitizeTextInput(name);

  if (!sanitized || sanitized.length < 2) {
    return {
      valid: false,
      sanitized,
      error: 'Name must be 2-50 characters',
    };
  }

  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  if (!nameRegex.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: 'Only letters, spaces, hyphens, and apostrophes allowed',
    };
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize email input
 * Converts to lowercase, trims whitespace
 * Max length: 100 characters
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 100);
}

/**
 * Validate email address
 * Returns validation result with error message
 */
export function validateEmail(
  email: string
): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  const sanitized = sanitizeEmail(email);

  if (!sanitized) {
    return { valid: false, sanitized, error: 'Email is required' };
  }

  if (!sanitized.includes('@')) {
    return {
      valid: false,
      sanitized,
      error: 'Email must contain @ symbol',
    };
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: 'Invalid email format',
    };
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize phone number
 * Keeps: digits, +, -, spaces, parentheses
 * Max length: 20 characters
 */
export function sanitizePhone(phone: string): string {
  return phone
    .replace(/[^0-9\+\-\s()]/g, '') // Remove non-phone characters
    .trim()
    .slice(0, 20); // Limit to 20 characters
}

/**
 * Validate phone number
 * Returns validation result with error message
 */
export function validatePhone(
  phone: string
): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  const sanitized = sanitizePhone(phone);

  if (!sanitized || sanitized.length < 7) {
    return {
      valid: false,
      sanitized,
      error: 'Phone number must be 7-20 characters',
    };
  }

  const phoneRegex = /^[0-9\+\-\s()]{7,20}$/;
  if (!phoneRegex.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: 'Invalid phone format',
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 * - At least one symbol (@$!%*?&)
 */
export function validatePassword(
  password: string
): {
  valid: boolean;
  error?: string;
} {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }

  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  const hasSymbol = /[@$!%*?&]/.test(password);
  if (!hasSymbol) {
    return {
      valid: false,
      error: 'Password must contain at least one symbol (@$!%*?&)',
    };
  }

  return { valid: true };
}

/**
 * Validate password confirmation
 * Checks if two passwords match
 */
export function validatePasswordMatch(
  password: string,
  confirmation: string
): {
  valid: boolean;
  error?: string;
} {
  if (password !== confirmation) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
}

/**
 * Normalize phone number to international format
 * Converts 09123456789 to +639123456789
 */
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.trim().replace(/\s+/g, '');

  // If starts with 0, replace with +63
  if (normalized.startsWith('0')) {
    normalized = '+63' + normalized.slice(1);
  }

  // If doesn't start with +, assume it's Philippine and add +63
  if (!normalized.startsWith('+')) {
    normalized = '+63' + normalized;
  }

  return normalized;
}

/**
 * Validate OTP code
 * Must be exactly 6 digits
 */
export function validateOTP(
  code: string
): {
  valid: boolean;
  error?: string;
} {
  if (!code) {
    return { valid: false, error: 'OTP is required' };
  }

  if (!/^\d{6}$/.test(code)) {
    return { valid: false, error: 'OTP must be exactly 6 digits' };
  }

  return { valid: true };
}

/**
 * Sanitize and validate captcha input
 */
export function validateCaptcha(
  input: string,
  expectedValue: string
): {
  valid: boolean;
  error?: string;
} {
  const sanitized = input.toUpperCase().trim();

  if (!sanitized) {
    return { valid: false, error: 'Security code is required' };
  }

  if (sanitized !== expectedValue.toUpperCase()) {
    return { valid: false, error: 'Security code is incorrect' };
  }

  return { valid: true };
}

/**
 * Comprehensive registration validation
 * Returns all validation results at once
 */
export function validateRegistration(data: {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  captchaInput: string;
  captchaWord: string;
  termsAccepted: boolean;
}): {
  valid: boolean;
  errors: { [key: string]: string };
  sanitized: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
} {
  const errors: { [key: string]: string } = {};
  const sanitized: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  } = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
  };

  // Validate first name
  const firstnameResult = validateName(data.firstname);
  if (!firstnameResult.valid) {
    errors.firstname = firstnameResult.error || 'Invalid first name';
  }
  sanitized.firstname = firstnameResult.sanitized;

  // Validate last name
  const lastnameResult = validateName(data.lastname);
  if (!lastnameResult.valid) {
    errors.lastname = lastnameResult.error || 'Invalid last name';
  }
  sanitized.lastname = lastnameResult.sanitized;

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error || 'Invalid email';
  }
  sanitized.email = emailResult.sanitized;

  // Validate phone
  const phoneResult = validatePhone(data.phone);
  if (!phoneResult.valid) {
    errors.phone = phoneResult.error || 'Invalid phone number';
  }
  sanitized.phone = phoneResult.sanitized;

  // Validate password
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.error || 'Invalid password';
  }

  // Validate password match
  const matchResult = validatePasswordMatch(
    data.password,
    data.passwordConfirmation
  );
  if (!matchResult.valid) {
    errors.passwordConfirmation =
      matchResult.error || 'Passwords do not match';
  }

  // Validate captcha
  const captchaResult = validateCaptcha(
    data.captchaInput,
    data.captchaWord
  );
  if (!captchaResult.valid) {
    errors.captcha = captchaResult.error || 'Invalid security code';
  }

  // Validate terms
  if (!data.termsAccepted) {
    errors.terms = 'You must accept the Terms & Conditions';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
