const express = require('express');
const router = express.Router();
const isAdminAuthenticated = require('../middleware/admin-auth');
const {
  listUsersController,
  getUserController,
  approveUserController,
  banUserController,
  removeUserController,
  restoreUserController,
  getStatsController,
} = require('../controllers/admin-users.controller');

// Apply admin authentication check middleware to all routes below
router.use(isAdminAuthenticated);

router.get('/admin/users', listUsersController);
router.get('/admin/users/:id', getUserController);
router.patch('/admin/users/:id/approve', approveUserController);
router.patch('/admin/users/:id/ban', banUserController);
router.delete('/admin/users/:id', removeUserController);
router.patch('/admin/users/:id/restore', restoreUserController);
router.get('/admin/stats', getStatsController);

module.exports = router;
