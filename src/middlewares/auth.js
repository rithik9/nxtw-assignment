const { verifyAccessToken } = require('../utils/jwt');
const { AppError, ErrorCodes } = require('../constants/errors');
const prisma = require('../config/db');

// authentication middleware to protect endpoints
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Access token is required. Please login.');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new AppError(401, ErrorCodes.INVALID_TOKEN, 'Authentication token is invalid or has expired.');
    }

    // make sure the user still exists in the db
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'The user session is no longer active.');
    }

    // attach user context to the request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
};
