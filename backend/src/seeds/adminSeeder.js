require('dotenv').config({ debug: false });
const connectDB = require('../config/database');

const seedAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    const mongoose = require('mongoose');
    const User = require('../models/User');
    const Settings = require('../models/Settings');

    console.log('🔄 Starting admin seeding...');

    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping...');
      return;
    }

    // Tạo admin user
    const adminData = {
      fullName: 'System Administrator',
      email: 'admin@attendancesystem.com',
      password: 'Admin@123456', // Sẽ được hash bởi middleware
      role: 'admin',
      phoneNumber: '0123456789',
      address: '123 Admin Street, Tech City',
      isActive: true,
      isEmailVerified: true
    };

    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully:', admin.email);

    // Khởi tạo settings mặc định
    const settings = await Settings.getSettings();
    console.log('✅ System settings initialized');

    console.log('🎉 Admin seeding completed successfully!');

  } catch (error) {
    console.error('❌ Admin seeding failed:', error.message);
    throw error;
  }
};

const runAdminSeeder = async () => {
  try {
    await seedAdmin();
    console.log('🚀 Admin seeder finished successfully');
  } catch (error) {
    console.error('💥 Admin seeder failed:', error.message);
    process.exit(1);
  }
};

// Chạy nếu file được gọi trực tiếp
if (require.main === module) {
  runAdminSeeder();
}

module.exports = { seedAdmin, runAdminSeeder };