const User = require('../models/User.model');

/**
 * GET /api/users
 * Admin: list all users in tenant
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenant: req.tenant }).sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
};

/**
 * POST /api/users
 * Admin: create a new user in the tenant
 * Body: { name, email, password, role }
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check duplicate within tenant
    const exists = await User.findOne({ email: email.toLowerCase(), tenant: req.tenant });
    if (exists) {
      return res.status(409).json({ message: 'A user with this email already exists in this tenant.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'client',
      tenant: req.tenant,
    });

    res.status(201).json({
      message: 'User created.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user.', error: err.message });
  }
};

/**
 * DELETE /api/users/:id
 * Admin: delete a user from the tenant
 */
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete yourself.' });
    }

    const user = await User.findOneAndDelete({ _id: req.params.id, tenant: req.tenant });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.', error: err.message });
  }
};

module.exports = { getUsers, createUser, deleteUser };
