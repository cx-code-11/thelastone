const Task = require('../models/Task.model');
const Team = require('../models/Team.model');

const populateTask = q => q
  .populate('assigned_to',   'name email role')
  .populate({ path: 'assigned_team', select: 'name', populate: { path: 'members', select: 'name email role' } })
  .populate('created_by',    'name email role');

/**
 * GET /api/tasks
 * - admin: ALL tasks
 * - everyone else: tasks assigned to them personally OR tasks assigned to a team they're in
 */
const getTasks = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      const myTeams = await Team.find({ members: req.user._id }).select('_id');
      const teamIds = myTeams.map(t => t._id);
      filter = {
        $or: [
          { assignment_type: 'user',  assigned_to:   req.user._id },
          { assignment_type: 'self',  assigned_to:   req.user._id },
          { assignment_type: 'team',  assigned_team: { $in: teamIds } },
          { created_by: req.user._id },          // own created tasks (unassigned ones)
        ],
      };
    }
    const tasks = await populateTask(Task.find(filter).sort({ createdAt: -1 }));
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
  }
};

/**
 * POST /api/tasks
 * - Admin: assigns to a user, a team, or leaves unassigned
 * - Others: task is assigned to themselves (self)
 */
const createTask = async (req, res) => {
  try {
    const { title, description, priority, status, assignment_type, assigned_to, assigned_team } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    let taskData = {
      title,
      description: description || '',
      priority:    priority    || 'medium',
      status:      status      || 'pending',
      created_by:  req.user._id,
    };

    if (req.user.role === 'admin') {
      const at = assignment_type || 'user';
      taskData.assignment_type = at;
      taskData.assigned_to     = at === 'user' ? (assigned_to || null) : null;
      taskData.assigned_team   = at === 'team' ? (assigned_team || null) : null;
    } else {
      taskData.assignment_type = 'self';
      taskData.assigned_to     = req.user._id;
    }

    const task = await Task.create(taskData);
    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ message: 'Task created.', task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task.', error: err.message });
  }
};

/**
 * PATCH /api/tasks/:id
 * - ANYONE with access can edit title, description, status, priority
 * - Only ADMIN can change assignment (assigned_to, assigned_team, assignment_type)
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Check access
    if (req.user.role !== 'admin') {
      const isDirectAssignee = task.assigned_to?.toString() === req.user._id.toString();
      const isCreator = task.created_by?.toString() === req.user._id.toString();

      let isTeamMember = false;
      if (task.assignment_type === 'team' && task.assigned_team) {
        const team = await Team.findById(task.assigned_team);
        if (team) isTeamMember = team.members.some(m => m.toString() === req.user._id.toString());
      }

      if (!isDirectAssignee && !isCreator && !isTeamMember) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    // Everyone can update content
    const { title, description, status, priority } = req.body;
    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (status      !== undefined) task.status      = status;
    if (priority    !== undefined) task.priority    = priority;

    // Only admin can reassign
    if (req.user.role === 'admin') {
      const { assignment_type, assigned_to, assigned_team } = req.body;
      if (assignment_type !== undefined) {
        task.assignment_type = assignment_type;
        task.assigned_to     = assignment_type === 'user' ? (assigned_to || null) : null;
        task.assigned_team   = assignment_type === 'team' ? (assigned_team || null) : null;
      }
    }

    await task.save();
    const updated = await populateTask(Task.findById(task._id));
    res.json({ message: 'Task updated.', task: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task.', error: err.message });
  }
};

/**
 * DELETE /api/tasks/:id
 * - Admin: any task
 * - Others: only tasks they created or are directly assigned to
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (req.user.role !== 'admin') {
      const ok =
        task.assigned_to?.toString() === req.user._id.toString() ||
        task.created_by?.toString()  === req.user._id.toString();
      if (!ok) return res.status(403).json({ message: 'Access denied.' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task.', error: err.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
