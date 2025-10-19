require("dotenv").config({ debug: false });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const connectDB = require("./src/config/database");
const errorHandler = require("./src/middlewares/errorHandler");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

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
    origin: [
      "http://localhost:3000", // Development frontend
      "http://localhost:3003", // Another local port
      "https://attendacestystem.duckdns.org", // Production domain
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================
// 🪵 Logging Middleware (Ghi ra file + console)
// ======================
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, "server.log");

function writeLog(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, line);
  console.log(message);
}

app.use((req, res, next) => {
  writeLog(`🚀 [REQUEST] ${req.method} ${req.originalUrl}`);
  writeLog(`📋 Headers: ${JSON.stringify(req.headers, null, 2)}`);

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    writeLog(`📦 Body: ${JSON.stringify(req.body, null, 2)}`);
  }

  writeLog(`🌐 IP: ${req.ip}`);
  next();
});

// ======================
// ⚙️ Rate limiting
// ======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
});
app.use("/api/", limiter);

// ======================
// 🧠 Body Parser
// ======================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ======================
// 🖼️ Static Files
// ======================
app.use("/uploads", express.static("uploads"));

// ======================
// 💓 Health Check
// ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ======================
// 📚 Swagger Documentation
// ======================
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ======================
// 🧭 API Routes
// ======================
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/classes", require("./src/routes/classRoutes"));
app.use("/api/subjects", require("./src/routes/subjectRoutes"));
app.use("/api/attendance", require("./src/routes/attendanceRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));
app.use("/api/statistics", require("./src/routes/statisticsRoutes"));
app.use("/api/settings", require("./src/routes/settingsRoutes"));
app.use("/api/security", require("./src/routes/securityRoutes"));

// ======================
// 🚫 404 Handler
// ======================
app.use((req, res, next) => {
  writeLog(`❌ [404] Route không tồn tại: ${req.originalUrl}`);
  res.status(404).json({
    status: "error",
    message: "Route không tồn tại",
  });
});

// ======================
// ❌ Global Error Handler
// ======================
app.use((err, req, res, next) => {
  writeLog(`🔥 [Express Error] ${err.message}`);
  writeLog(`👉 URL: ${req.originalUrl}`);
  writeLog(`👉 Stack: ${err.stack}`);

  errorHandler(err, req, res, next);
});

// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  writeLog(`🚀 Server đang chạy trên port ${PORT}`);
  writeLog(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  writeLog(`📚 Swagger Docs: https://attendacestystem.duckdns.org/api/docs`);
});
