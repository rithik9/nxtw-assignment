const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../models/auth.schema');

const router = express.Router();

// public register endpoint
router.post('/register', validate(registerSchema), authController.register);

// public login endpoint
router.post('/login', validate(loginSchema), authController.login);

// token refresh endpoint (uses cookies)
router.post('/refresh', authController.refresh);

// logout endpoint (invalidates token)
router.post('/logout', authController.logout);

module.exports = router;
