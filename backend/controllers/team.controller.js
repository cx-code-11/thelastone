const Team = require('../models/Team.model');

const populateTeam = q => q
  .populate('members',    'name email role')
  .populate('created_by', 'name email');

/** GET /api/teams — admin sees all; others see their own teams */
const getTeams = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { members: req.user._id };
    const teams  = await populateTeam(Team.find(filter).sort({ createdAt: -1 }));
    res.json({ teams, count: teams.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch teams.', error: err.message });
  }
};

/** POST /api/teams — admin only */
const createTeam = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required.' });
    const team = await Team.create({ name, description: description || '', members: members || [], created_by: req.user._id });
    const populated = await populateTeam(Team.findById(team._id));
    res.status(201).json({ message: 'Team created.', team: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create team.', error: err.message });
  }
};

/** PATCH /api/teams/:id — admin only */
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    const { name, description, members } = req.body;
    if (name        !== undefined) team.name        = name;
    if (description !== undefined) team.description = description;
    if (members     !== undefined) team.members     = members;
    await team.save();
    const updated = await populateTeam(Team.findById(team._id));
    res.json({ message: 'Team updated.', team: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update team.', error: err.message });
  }
};

/** DELETE /api/teams/:id — admin only */
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    res.json({ message: 'Team deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete team.', error: err.message });
  }
};

module.exports = { getTeams, createTeam, updateTeam, deleteTeam };
