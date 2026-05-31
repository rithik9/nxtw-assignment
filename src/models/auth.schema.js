const Joi = require('joi');

// register schema requires email, password, name and either orgId or orgName
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address.',
      'any.required': 'Email is required.',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long.',
      'any.required': 'Password is required.',
    }),
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'Name is required.',
    }),
  orgId: Joi.string()
    .optional(),
  orgName: Joi.string()
    .optional(),
}).xor('orgId', 'orgName')
  .messages({
    'object.xor': 'Please provide either an existing organization ID (orgId) or a new organization name (orgName).',
  });

// login schema requires email and password
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address.',
      'any.required': 'Email is required.',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required.',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
