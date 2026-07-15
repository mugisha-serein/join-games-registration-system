function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered.',
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided.',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
