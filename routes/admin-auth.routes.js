const express = require('express');
const router = express.Router();
const { loginLimiter } = require('../middleware/rate-limit');
const {
  loginController,
  logoutController,
  sessionController,
} = require('../controllers/admin-auth.controller');

router.post('/admin/login', loginLimiter, loginController);
router.post('/admin/logout', logoutController);
router.get('/admin/session', sessionController);

module.exports = router;
