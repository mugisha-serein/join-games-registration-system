function isAdminAuthenticated(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'Unauthorized. Please log in.',
  });
}

module.exports = isAdminAuthenticated;
