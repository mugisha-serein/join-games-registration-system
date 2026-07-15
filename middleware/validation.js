const { errorResponse } = require('../utils/responses');

function validateRegistration(req, res, next) {
  const errors = {};
  const {
    fullName,
    phoneNumber,
    joinType,
    termsAccepted,
  } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.fullName = 'Full name is required and must be at least 2 characters';
  }

  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length < 7) {
    errors.phoneNumber = 'Valid phone number is required';
  }

  if (!joinType || !['ninja_region_family', 'tiktok_game'].includes(joinType)) {
    errors.joinType = 'Valid join type is required';
  }

  if (!termsAccepted) {
    errors.termsAccepted = 'You must agree to the terms and conditions';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errorResponse('Validation failed', errors));
  }

  next();
}

module.exports = validateRegistration;
