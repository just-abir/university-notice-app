/**
 * Role Guard Middleware Factory
 * Usage: requireRole('TEACHER') or requireRole('TEACHER', 'ADMIN')
 *
 * Must be used AFTER the `protect` middleware (which attaches req.user)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
