module.exports = function requireAdmin(role) {
    return (req, res, next) => {
      // Check if the user has the 'Admin' role
      if (req.user && req.user.role === 'Admin') {
        return next(); // Allow access for Admin
      } else {
        return res.status(403).json({ message: 'Access denied' }); // Access denied for other roles
      }
    };
  };

  function requireRole(role) {
    return (req, res, next) => {
      if (req.user && req.user.role === role) {
        next();
      } else {
        res.status(403).json({ error: 'Unauthorized' });
      }
    };
  }
  