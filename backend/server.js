require('dotenv').config({ debug: false });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorHandler');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const app = express();

// ======================
// 🟢 Kết nối MongoDB
// ======================
connectDB();

// ======================
// 🛡️ Security Middleware
// ======================
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

// 🚦 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút',
});
app.use('/api/', limiter);

// 📦 Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🖼️ Static Files
app.use('/uploads', express.static('uploads'));

// 💓 Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ======================
// 📚 API Documentation (Swagger)
// ======================
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Attendance System API</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.7.2/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; }
        #swagger-ui { height: 100vh; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #3b4151; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.7.2/swagger-ui-bundle.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/api/docs.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            displayRequestDuration: true,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.json(swaggerSpec);
  } catch (error) {
    console.error('Swagger JSON error:', error);
    res.status(500).json({ error: 'Failed to load swagger spec' });
  }
});

// ======================
// 🧭 API Routes
// ======================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/classes', require('./src/routes/classRoutes'));
app.use('/api/subjects', require('./src/routes/subjectRoutes'));
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/statistics', require('./src/routes/statisticsRoutes'));
app.use('/api/settings', require('./src/routes/settingsRoutes'));
app.use('/api/security', require('./src/routes/securityRoutes'));

// ======================
// 🚫 404 Handler
// ======================
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route không tồn tại',
  });
});

// ======================
// ❌ Global Express Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error('\n🔥 [Express Error Middleware Triggered]');
  console.error('👉 URL:', req.originalUrl);
  console.error('👉 Method:', req.method);
  console.error('👉 Message:', err.message);
  console.error('👉 Stack:\n', err.stack);

  errorHandler(err, req, res, next);
});

// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://0.0.0.0:${PORT}`);
  console.log(`📚 Swagger Docs: http://0.0.0.0:${PORT}/api/docs`);
  console.log(`📚 Swagger JSON: http://0.0.0.0:${PORT}/api/docs.json`);
});
