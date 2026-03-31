const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/** Sign a JWT for a given user */
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, tenant: user.tenant },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user scoped to current tenant
    const user = await User.findOne({ email: email.toLowerCase(), tenant: req.tenant }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, getMe };
