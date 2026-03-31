const express = require('express');
const router  = express.Router();
const { getTeams, createTeam, updateTeam, deleteTeam } = require('../controllers/team.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/',       getTeams);                           // all (filtered by role in controller)
router.post('/',      authorize('admin'), createTeam);
router.patch('/:id',  authorize('admin'), updateTeam);
router.delete('/:id', authorize('admin'), deleteTeam);

module.exports = router;
