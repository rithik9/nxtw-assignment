const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { updateRoleSchema } = require('../models/user.schema');
const Roles = require('../constants/roles');

const router = express.Router();

// all routes here require admin access for safety
router.use(authenticate);
router.use(authorize(Roles.ADMIN));

// fetch users in organization
router.get('/', userController.getUsers);

// change role of an existing user
router.patch('/:id/role', validate(updateRoleSchema), userController.updateUserRole);

module.exports = router;
