const express = require('express');
const router  = express.Router();
const { getUsers, getAllUsers, createUser, updateUserRole, deleteUser } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// IMPORTANT: specific routes before parameterized ones
router.get('/assignable', authorize('admin'), getAllUsers); // admin picks assignees

router.get('/',           authorize('admin'), getUsers);
router.post('/',          authorize('admin'), createUser);
router.patch('/:id/role', authorize('admin'), updateUserRole);
router.delete('/:id',     authorize('admin'), deleteUser);

module.exports = router;
