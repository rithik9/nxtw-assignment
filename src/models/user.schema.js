const Joi = require('joi');
const Roles = require('../constants/roles');

// schema for updating a user's role
const updateRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(Roles))
    .required()
    .messages({
      'any.only': 'Role must be ADMIN, MANAGER, or MEMBER.',
      'any.required': 'Role is required.',
    }),
});

module.exports = {
  updateRoleSchema,
};
