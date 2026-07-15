const bcrypt = require('bcrypt');
const config = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responses');

async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email and password are required')
      );
    }

    // Validate credentials
    const adminPasswordHash = bcrypt.hashSync(config.adminPassword, 10);
    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (
      email !== config.adminEmail ||
      !passwordMatch
    ) {
      return res.status(401).json(
        errorResponse('Invalid email or password')
      );
    }

    // Regenerate session
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.admin = true;
      req.session.email = email;
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        res.json(successResponse({ email }, 'Login successful'));
      });
    });
  } catch (error) {
    next(error);
  }
}

async function logoutController(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      res.json(successResponse({}, 'Logout successful'));
    });
  } catch (error) {
    next(error);
  }
}

async function sessionController(req, res) {
  if (req.session && req.session.admin) {
    return res.json(
      successResponse(
        { email: req.session.email, admin: true },
        'Session active'
      )
    );
  }
  res.status(401).json(
    errorResponse('No active session')
  );
}

module.exports = {
  loginController,
  logoutController,
  sessionController,
};
