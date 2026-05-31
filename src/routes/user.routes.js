const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { updateRoleSchema } = require('../models/user.schema');
const Roles = require('../constants/roles');

const router = express.Router();

router.use(authenticate);

// fetch users in organization - both ADMIN and MANAGER can view to assign tasks
router.get('/', authorize(Roles.ADMIN, Roles.MANAGER), userController.getUsers);

// change role of an existing user - ADMIN only
router.patch('/:id/role', authorize(Roles.ADMIN), validate(updateRoleSchema), userController.updateUserRole);

module.exports = router;
