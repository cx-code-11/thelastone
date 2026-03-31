/**
 * Tenant Middleware
 * Extracts the subdomain from the Host header and attaches it to req.tenant.
 *
 * Examples:
 *   client1.app.com  → tenant = "client1"
 *   team.app.com     → tenant = "team"
 *   localhost:4000   → tenant = "localhost" (dev fallback)
 *
 * In development you can pass X-Tenant header to simulate subdomains.
 */
const extractTenant = (req, res, next) => {
  // Allow manual override via header (useful for local dev / Postman)
  if (req.headers['x-tenant']) {
    req.tenant = req.headers['x-tenant'].toLowerCase().trim();
    return next();
  }

  const host = req.headers.host || '';

  // Strip port number (e.g. localhost:4000 → localhost)
  const hostname = host.split(':')[0];

  const parts = hostname.split('.');

  // If only one part (e.g. "localhost") use it directly as a dev tenant
  if (parts.length === 1) {
    req.tenant = parts[0];
    return next();
  }

  // For real domains like client1.app.com → parts = ["client1", "app", "com"]
  // The subdomain is always the first part
  req.tenant = parts[0].toLowerCase();
  next();
};

module.exports = { extractTenant };
