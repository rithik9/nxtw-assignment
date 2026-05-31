const express = require('express');
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { createProjectSchema } = require('../models/project.schema');
const Roles = require('../constants/roles');

const router = express.Router();

router.use(authenticate);

// create project (admin/manager only)
router.post('/', authorize(Roles.ADMIN, Roles.MANAGER), validate(createProjectSchema), projectController.createProject);

// list all projects
router.get('/', projectController.getProjects);

// get single project details
router.get('/:id', projectController.getProjectById);

// delete project (admin/manager only)
router.delete('/:id', authorize(Roles.ADMIN, Roles.MANAGER), projectController.deleteProject);

module.exports = router;
