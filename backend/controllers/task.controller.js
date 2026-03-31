const Task = require('../models/Task.model');

/**
 * GET /api/tasks
 * - admin: all tasks in tenant
 * - team: tasks assigned to them
 * - client: tasks assigned to them
 */
const getTasks = async (req, res) => {
  try {
    const filter = { tenant: req.tenant };

    // Non-admins only see their own tasks
    if (req.user.role !== 'admin') {
      filter.assigned_to = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks.', error: err.message });
  }
};

/**
 * GET /api/tasks/:id
 */
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, tenant: req.tenant })
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Non-admins can only view tasks assigned to them
    if (req.user.role !== 'admin' && task.assigned_to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task.', error: err.message });
  }
};

/**
 * POST /api/tasks  (admin only)
 * Body: { title, description, assigned_to }
 */
const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to } = req.body;

    if (!title || !assigned_to) {
      return res.status(400).json({ message: 'Title and assigned_to are required.' });
    }

    const task = await Task.create({
      title,
      description,
      assigned_to,
      created_by: req.user._id,
      tenant: req.tenant,
    });

    const populated = await task.populate([
      { path: 'assigned_to', select: 'name email role' },
      { path: 'created_by', select: 'name email' },
    ]);

    res.status(201).json({ message: 'Task created.', task: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task.', error: err.message });
  }
};

/**
 * PATCH /api/tasks/:id
 * - admin: can update everything
 * - team: can only update status of their own tasks
 * - client: cannot update
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, tenant: req.tenant });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (req.user.role === 'team') {
      // Team can only update status of tasks assigned to them
      if (task.assigned_to.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own tasks.' });
      }
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Team members can only update task status.' });
      }
      task.status = status;
    } else if (req.user.role === 'admin') {
      const { title, description, status, assigned_to } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (assigned_to) task.assigned_to = assigned_to;
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email');

    res.json({ message: 'Task updated.', task: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task.', error: err.message });
  }
};

/**
 * DELETE /api/tasks/:id  (admin only)
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, tenant: req.tenant });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task.', error: err.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
