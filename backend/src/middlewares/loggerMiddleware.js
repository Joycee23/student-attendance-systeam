// @desc    Request logger middleware
const logger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    // Color code based on status
    const statusColor = 
      res.statusCode >= 500 ? '\x1b[31m' : // Red
      res.statusCode >= 400 ? '\x1b[33m' : // Yellow
      res.statusCode >= 300 ? '\x1b[36m' : // Cyan
      res.statusCode >= 200 ? '\x1b[32m' : // Green
      '\x1b[0m'; // Default

    console.log(
      `${statusColor}[${log.timestamp}] ${log.method} ${log.url} ${log.status} ${log.duration}\x1b[0m`
    );

    // Log errors with more detail
    if (res.statusCode >= 400) {
      console.error('Error details:', {
        ...log,
        body: req.body,
        params: req.params,
        query: req.query
      });
    }
  });

  next();
};

// @desc    API call logger (specific for API routes)
const apiLogger = (req, res, next) => {
  const start = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Override send function to log response
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log({
      type: 'API_CALL',
      method: req.method,
      endpoint: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });

    // Call original send function
    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  logger,
  apiLogger
};