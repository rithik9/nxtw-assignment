const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'Task title is required.',
    }),
  description: Joi.string()
    .allow('', null)
    .optional(),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH')
    .default('MEDIUM')
    .optional(),
  dueDate: Joi.date()
    .greater('now')
    .allow(null)
    .optional()
    .messages({
      'date.greater': 'Due date must be in the future.',
    }),
  assigneeId: Joi.string()
    .required()
    .messages({
      'any.required': 'Assignee user ID is required.',
    }),
  projectId: Joi.string()
    .required()
    .messages({
      'any.required': 'Project ID is required.',
    }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string()
    .optional(),
  description: Joi.string()
    .allow('', null)
    .optional(),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH')
    .optional(),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED')
    .optional(),
  dueDate: Joi.date()
    .greater('now')
    .allow(null)
    .optional()
    .messages({
      'date.greater': 'Due date must be in the future.',
    }),
  assigneeId: Joi.string()
    .optional(),
  projectId: Joi.string()
    .optional(),
});

const patchStatusSchema = Joi.object({
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED')
    .required()
    .messages({
      'any.only': 'Invalid status. Must be TODO, IN_PROGRESS, IN_REVIEW, DONE, or BLOCKED.',
      'any.required': 'Status is required.',
    }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  patchStatusSchema,
};
