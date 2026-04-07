// Global error handler for auth middleware errors and general fallbacks
export const errorHandler = (err, req, res, next) => {
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
