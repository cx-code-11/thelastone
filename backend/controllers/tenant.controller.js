const User = require('../models/User.model');

/**
 * POST /api/tenants
 * Creates a new tenant by creating its first admin user.
 * This is a bootstrap endpoint — typically called once per tenant setup.
 * Body: { tenantName, adminName, adminEmail, adminPassword }
 */
const createTenant = async (req, res) => {
  try {
    const { tenantName, adminName, adminEmail, adminPassword } = req.body;

    if (!tenantName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'All fields are required: tenantName, adminName, adminEmail, adminPassword.' });
    }

    const tenant = tenantName.toLowerCase().trim().replace(/\s+/g, '-');

    // Check if tenant already has an admin
    const existingAdmin = await User.findOne({ tenant, role: 'admin' });
    if (existingAdmin) {
      return res.status(409).json({ message: `Tenant "${tenant}" already exists.` });
    }

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      tenant,
    });

    res.status(201).json({
      message: `Tenant "${tenant}" created with admin user.`,
      tenant,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create tenant.', error: err.message });
  }
};

/**
 * GET /api/tenants/list
 * Returns a list of all unique tenants (based on users)
 */
const listTenants = async (req, res) => {
  try {
    const tenants = await User.distinct('tenant');
    res.json({ tenants });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list tenants.', error: err.message });
  }
};

module.exports = { createTenant, listTenants };
