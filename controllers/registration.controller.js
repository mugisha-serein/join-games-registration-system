const registrationService = require('../services/registration.service');
const userRepository = require('../repositories/user.repository');
const { emitNewUserJoined, emitStatsUpdated } = require('../services/socket.service');
const { successResponse, errorResponse } = require('../utils/responses');

async function registerUserController(req, res, next) {
  try {
    const {
      fullName,
      phoneNumber,
      shortComment,
      joinType,
      termsAccepted,
      termsVersion,
    } = req.body;

    const userId = await registrationService.registerUser({
      fullName,
      phoneNumber,
      shortComment,
      joinType,
      termsAccepted,
      termsVersion,
    });

    const user = await userRepository.getUserById(userId);
    const io = req.app.get('io');
    if (io && user) {
      emitNewUserJoined(io, user);
      await emitStatsUpdated(io);
    }

    res.status(201).json(
      successResponse({ id: userId }, 'Registration successful')
    );
  } catch (error) {
    if (error.status && error.message) {
      return res.status(error.status).json(errorResponse(error.message));
    }
    next(error);
  }
}

module.exports = {
  registerUserController,
};
