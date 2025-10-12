/**
 * Middleware xử lý lỗi tập trung.
 * Bắt lỗi từ các middleware và controller khác, gửi về một response JSON chuẩn hóa.
 * @param {Error} err - Đối tượng lỗi
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Ghi log lỗi ra console để debug

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    // Chỉ hiển thị stack trace chi tiết ở môi trường development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;