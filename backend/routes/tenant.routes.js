const express = require('express');
const router = express.Router();
const { createTenant, listTenants } = require('../controllers/tenant.controller');

// These are bootstrap routes — no auth required to create first tenant
// In production you'd want to protect listTenants
router.post('/', createTenant);
router.get('/list', listTenants);

module.exports = router;
