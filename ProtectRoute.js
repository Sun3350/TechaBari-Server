const requireAdmin = require('./Middleware');

// Example: Protect an admin-only route
router.get('/admin-dashboard', requireAdmin('admin'), (req, res) => {
  // Your admin-only route logic here
});
