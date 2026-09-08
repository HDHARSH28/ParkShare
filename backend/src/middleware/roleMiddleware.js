/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'HOST')
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — please login first',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires one of: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

export default roleMiddleware;
