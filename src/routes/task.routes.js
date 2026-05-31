const express = require('express');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { createTaskSchema, updateTaskSchema, patchStatusSchema } = require('../models/task.schema');
const Roles = require('../constants/roles');

const router = express.Router();

router.use(authenticate);

// create task (admin/manager only)
router.post('/', authorize(Roles.ADMIN, Roles.MANAGER), validate(createTaskSchema), taskController.createTask);

// get tasks list (automatically filtered for member role)
router.get('/', taskController.getTasks);

// get specific task details
router.get('/:id', taskController.getTaskById);

// update whole task details
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);

// update task status only, with business transitions
router.patch('/:id/status', validate(patchStatusSchema), taskController.updateTaskStatus);

// delete task (admin/manager only)
router.delete('/:id', authorize(Roles.ADMIN, Roles.MANAGER), taskController.deleteTask);

module.exports = router;
