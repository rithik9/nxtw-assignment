const { AppError, ErrorCodes } = require('../constants/errors');

// rbac factory middleware to restrict routes to specific roles
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication is required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to perform this action.'));
    }

    next();
  };
}

module.exports = {
  authorize,
};
