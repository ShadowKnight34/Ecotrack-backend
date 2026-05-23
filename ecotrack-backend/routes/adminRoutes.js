const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(authorize(['admin']));

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminController.getDashboardStats);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminController.updateUserRole);

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

// POST /api/admin/users/import
router.post('/users/import', adminController.importUsers);

module.exports = router;
