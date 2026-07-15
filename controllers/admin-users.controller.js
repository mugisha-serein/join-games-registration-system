const userRepository = require('../repositories/user.repository');
const adminUserService = require('../services/admin-user.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responses');
const {
  emitUserApproved,
  emitUserBanned,
  emitUserRemoved,
  emitUserRestored,
  emitStatsUpdated
} = require('../services/socket.service');

async function listUsersController(req, res, next) {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      status = '',
      joinType = '',
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    const result = await userRepository.getUsersWithPagination({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
      joinType,
      sort,
      order,
    });

    res.json(paginatedResponse(result.data, result.pagination));
  } catch (error) {
    next(error);
  }
}

async function getUserController(req, res, next) {
  try {
    const { id } = req.params;
    const user = await userRepository.getUserById(id);

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
}

async function approveUserController(req, res, next) {
  try {
    const { id } = req.params;
    const user = await adminUserService.approveUserAction(id);
    const io = req.app.get('io');
    if (io) {
      emitUserApproved(io, id);
      await emitStatsUpdated(io);
    }
    res.json(successResponse({ user }, 'User approved'));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message));
    }
    next(error);
  }
}

async function banUserController(req, res, next) {
  try {
    const { id } = req.params;
    const user = await adminUserService.banUserAction(id);
    const io = req.app.get('io');
    if (io) {
      emitUserBanned(io, id);
      await emitStatsUpdated(io);
    }
    res.json(successResponse({ user }, 'User banned'));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message));
    }
    next(error);
  }
}

async function removeUserController(req, res, next) {
  try {
    const { id } = req.params;
    const user = await adminUserService.removeUserAction(id);
    const io = req.app.get('io');
    if (io) {
      emitUserRemoved(io, id);
      await emitStatsUpdated(io);
    }
    res.json(successResponse({ user }, 'User removed'));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message));
    }
    next(error);
  }
}

async function restoreUserController(req, res, next) {
  try {
    const { id } = req.params;
    const user = await adminUserService.restoreUserAction(id);
    const io = req.app.get('io');
    if (io) {
      emitUserRestored(io, id);
      await emitStatsUpdated(io);
    }
    res.json(successResponse({ user }, 'User restored'));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message));
    }
    next(error);
  }
}

async function getStatsController(req, res, next) {
  try {
    const stats = await userRepository.getStatistics();
    res.json(successResponse(stats));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsersController,
  getUserController,
  approveUserController,
  banUserController,
  removeUserController,
  restoreUserController,
  getStatsController,
};
