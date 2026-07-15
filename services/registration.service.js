const userRepository = require('../repositories/user.repository');
const { normalizePhoneNumber, validatePhoneNumber } = require('../utils/phone');
const { validateFullName, validateJoinType } = require('../utils/validation');

async function registerUser(registrationData) {
  const {
    fullName,
    phoneNumber,
    shortComment,
    joinType,
    termsAccepted,
    termsVersion,
  } = registrationData;

  // Validate input
  if (!validateFullName(fullName)) {
    throw {
      status: 400,
      message: 'Full name is invalid',
    };
  }

  if (!validatePhoneNumber(phoneNumber)) {
    throw {
      status: 400,
      message: 'Phone number is invalid',
    };
  }

  if (!validateJoinType(joinType)) {
    throw {
      status: 400,
      message: 'Join type is invalid',
    };
  }

  if (!termsAccepted) {
    throw {
      status: 400,
      message: 'You must accept the terms and conditions',
    };
  }

  // Check for duplicate phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const existingUser = await userRepository.getUserByPhoneNumber(normalizedPhone);
  if (existingUser) {
    throw {
      status: 409,
      message: 'This phone number is already registered',
    };
  }

  // Create user
  const userId = await userRepository.createUser({
    fullName: fullName.trim(),
    phoneNumber: normalizedPhone,
    shortComment: shortComment ? shortComment.trim() : null,
    joinType,
    termsAccepted: true,
    termsVersion,
    termsAcceptedAt: new Date().toISOString(),
  });

  return userId;
}

module.exports = {
  registerUser,
};
