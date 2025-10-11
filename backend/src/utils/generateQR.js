const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Tạo mã QR Code
const generateQRCode = async (data, options = {}) => {
  try {
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      ...options
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), qrOptions);
    
    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`Lỗi tạo QR code: ${error.message}`);
  }
};

// Tạo QR code cho buổi điểm danh
const generateAttendanceQR = async (sessionId, classId, expiresAt) => {
  const qrData = {
    sessionId: sessionId,
    classId: classId,
    type: 'attendance',
    code: uuidv4(),
    expiresAt: expiresAt,
    createdAt: new Date()
  };

  const qrCode = await generateQRCode(qrData);
  
  return {
    qrCode: qrCode,
    qrData: qrData
  };
};

// Tạo QR code cho sinh viên
const generateStudentQR = async (studentId, studentCode) => {
  const qrData = {
    studentId: studentId,
    studentCode: studentCode,
    type: 'student',
    createdAt: new Date()
  };

  const qrCode = await generateQRCode(qrData);
  
  return {
    qrCode: qrCode,
    qrData: qrData
  };
};

// Verify QR code data
const verifyQRData = (qrData) => {
  if (!qrData || typeof qrData !== 'object') {
    return { valid: false, message: 'QR code không hợp lệ' };
  }

  // Kiểm tra hết hạn
  if (qrData.expiresAt && new Date(qrData.expiresAt) < new Date()) {
    return { valid: false, message: 'QR code đã hết hạn' };
  }

  return { valid: true, data: qrData };
};

// Generate random code
const generateRandomCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// Generate OTP
const generateOTP = (length = 6) => {
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  
  return otp;
};

module.exports = {
  generateQRCode,
  generateAttendanceQR,
  generateStudentQR,
  verifyQRData,
  generateRandomCode,
  generateOTP
};