// Global error handler for auth middleware errors and general fallbacks
export const errorHandler = (err, req, res, next) => {
  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'Audio file exceeds the 10MB upload limit'
      });
    }

    return res.status(400).json({
      error: 'Invalid upload request',
      message: err.message
    });
  }

  if (err?.status === 400) {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message || 'The request is invalid'
    });
  }

  if (err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing access token'
    });
  }
  if (err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};
