const { AppError, ErrorCodes } = require('../constants/errors');

// middleware helper to validate request body using a Joi schema
function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // strip out fields not defined in the schema for safety
    });

    if (error) {
      // join all validation errors into a single readable string
      const message = error.details
        .map((detail) => detail.message)
        .join(' ');
      return next(new AppError(400, ErrorCodes.VALIDATION_ERROR, message));
    }

    // replace request body with the validated/cleaned values
    req.body = value;
    next();
  };
}

module.exports = {
  validate,
};
