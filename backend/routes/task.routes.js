const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All task routes require authentication
router.use(protect);

router.get('/', getTasks);                               // admin, team, client
router.get('/:id', getTask);                             // admin, team, client
router.post('/', authorize('admin'), createTask);        // admin only
router.patch('/:id', authorize('admin', 'team'), updateTask); // admin + team
router.delete('/:id', authorize('admin'), deleteTask);   // admin only

module.exports = router;
