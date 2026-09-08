/**
 * Centralized error handling middleware
 * Guarantees standard { success: false, message: '...' } responses for:
 * 400, 401, 403, 404, 409, 422, 429, 500
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key conflict (409)
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'record';
    message = `A record with this ${field} already exists`;
  }

  // Mongoose schema validation failure (400)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    message = messages.length > 0 ? messages.join(', ') : 'Validation failed';
  }

  // Invalid MongoDB ObjectId (400)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier: ${err.value}`;
  }

  // JWT authentication failures (401)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed: Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication failed: Token has expired';
  }

  // Payload Too Large (413)
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Payload too large. Please upload smaller images or data.';
  }

  // Rate Limiting (429)
  if (statusCode === 429 || err.name === 'TooManyRequests') {
    statusCode = 429;
    message = message || 'Too many requests. Please try again later.';
  }

  // Log error in console
  console.error(`❌ [${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode === 500 && { stack: err.stack }),
  });
};

export default errorMiddleware;
