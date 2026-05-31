const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'Project name is required.',
    }),
  description: Joi.string()
    .allow('', null)
    .optional(),
});

module.exports = {
  createProjectSchema,
};
