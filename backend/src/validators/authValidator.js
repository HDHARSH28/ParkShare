/**
 * Validate registration input
 */
export const validateRegister = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.phone || !/^[+]?[\d\s\-()]{7,15}$/.test(data.phone)) {
    errors.push('Please provide a valid phone number');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (data.role && !['DRIVER', 'HOST', 'ADMIN'].includes(data.role)) {
    errors.push('Role must be DRIVER, HOST, or ADMIN');
  }

  return errors;
};

/**
 * Validate login input
 */
export const validateLogin = (data) => {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  }

  return errors;
};
