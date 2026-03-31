const Task = require('../models/Task.model');
const Team = require('../models/Team.model');

/**
 * GET /api/tasks
 * - admin: ALL tasks
 * - others: tasks assigned to them or to a team they belong to
 */
const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find({ adminAll: true });
    } else {
      const myTeams = await Team.findByMember(req.user.id);
      const teamIds = myTeams.map(t => t.id);
      tasks = await Task.find({ userId: req.user.id, teamIds });
    }
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
  }
};

/**
 * POST /api/tasks
 * - Admin: assigns to a user, a team, or unassigned
 * - Others: task assigned to themselves (self)
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
      created_by:  req.user.id,
    };

    if (req.user.role === 'admin') {
      const at = assignment_type || 'user';
      taskData.assignment_type = at;
      taskData.assigned_to     = at === 'user' ? (assigned_to   || null) : null;
      taskData.assigned_team   = at === 'team' ? (assigned_team || null) : null;
    } else {
      taskData.assignment_type = 'self';
      taskData.assigned_to     = req.user.id;
    }

    const task = await Task.create(taskData);
    res.status(201).json({ message: 'Task created.', task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task.', error: err.message });
  }
};

/**
 * PATCH /api/tasks/:id
 * - Anyone with access can edit title, description, status, priority
 * - Only admin can change assignment
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Access check for non-admins
    if (req.user.role !== 'admin') {
      const assignedToId  = task.assigned_to?.id   || task.assigned_to;
      const createdById   = task.created_by?.id    || task.created_by;
      const isDirectAssignee = assignedToId?.toString()  === req.user.id.toString();
      const isCreator        = createdById?.toString()   === req.user.id.toString();

      let isTeamMember = false;
      if (task.assignment_type === 'team' && task.assigned_team) {
        const teamId = task.assigned_team?.id || task.assigned_team;
        const teams  = await Team.findByMember(req.user.id);
        isTeamMember = teams.some(t => t.id.toString() === teamId.toString());
      }

      if (!isDirectAssignee && !isCreator && !isTeamMember) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const { title, description, status, priority } = req.body;
    const updates = {};
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (status      !== undefined) updates.status      = status;
    if (priority    !== undefined) updates.priority    = priority;

    // Only admin can reassign
    if (req.user.role === 'admin') {
      const { assignment_type, assigned_to, assigned_team } = req.body;
      if (assignment_type !== undefined) {
        updates.assignment_type = assignment_type;
        updates.assigned_to     = assignment_type === 'user' ? (assigned_to   || null) : null;
        updates.assigned_team   = assignment_type === 'team' ? (assigned_team || null) : null;
      }
    }

    const updated = await Task.update(req.params.id, updates);
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
      const assignedToId = task.assigned_to?.id || task.assigned_to;
      const createdById  = task.created_by?.id  || task.created_by;
      const ok =
        assignedToId?.toString() === req.user.id.toString() ||
        createdById?.toString()  === req.user.id.toString();
      if (!ok) return res.status(403).json({ message: 'Access denied.' });
    }

    await Task.delete(req.params.id);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task.', error: err.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
