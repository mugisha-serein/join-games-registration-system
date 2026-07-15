const express = require('express');
const router = express.Router();
const { registerUserController } = require('../controllers/registration.controller');
const { registrationLimiter } = require('../middleware/rate-limit');
const validateRegistration = require('../middleware/validation');

router.post(
  '/registrations',
  registrationLimiter,
  validateRegistration,
  registerUserController
);

module.exports = router;
