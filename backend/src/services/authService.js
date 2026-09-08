import User from '../models/User.js';

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, phone, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Create user (password is hashed via pre-save hook)
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'DRIVER',
  });

  return user;
};

/**
 * Authenticate user by email and password
 */
export const authenticateUser = async ({ email, password }) => {
  // Find user and explicitly include the password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error(
      `Account suspended: ${user.blockReason || 'Your account has been suspended by an administrator.'}`
    );
    error.statusCode = 403;
    throw error;
  }

  return user;
};

/**
 * Get user by ID (without password)
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};
