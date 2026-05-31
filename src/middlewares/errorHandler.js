const { AppError, ErrorCodes } = require('../constants/errors');

// express error handler middleware to intercept and format all errors
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || ErrorCodes.INTERNAL_ERROR;
  
  // hide internal messages for unhandled 500 errors to prevent leakages
  const message = status === 500
    ? 'An unexpected error occurred.'
    : err.message;

  console.error(`[${code}] ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    status,
    code,
    message,
  });
}

module.exports = errorHandler;
