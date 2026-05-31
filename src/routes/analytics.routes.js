const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const Roles = require('../constants/roles');

const router = express.Router();

// all analytics are restricted to admin or manager roles under active sessions
router.use(authenticate);
router.use(authorize(Roles.ADMIN, Roles.MANAGER));

// overdue tasks analytics endpoint
router.get('/overdue', analyticsController.getOverdueTasks);

// task completion duration statistics endpoint
router.get('/completion-time', analyticsController.getCompletionTimeStats);

module.exports = router;
