const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔥 [DB] Connecting to MongoDB...");
    console.log(
      "🔥 [DB] MONGODB_URI:",
      process.env.MONGODB_URI ? "SET" : "NOT SET"
    );

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`🔥 [DB] MongoDB Connected: ${conn.connection.host}`);
    console.log(`🔥 [DB] Database: ${conn.connection.name}`);

    // Xử lý lỗi sau khi kết nối
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error(`🔥 [DB] MongoDB connection failed: ${error.message}`);
    console.error(`🔥 [DB] Stack:`, error.stack);
    process.exit(1);
  }
};

module.exports = connectDB;
