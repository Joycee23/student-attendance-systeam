// API Response Utilities

// Success Response
const successResponse = (res, data, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message: message,
    data: data
  });
};

// Error Response
const errorResponse = (res, message = 'Có lỗi xảy ra', statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message: message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Pagination Response
const paginationResponse = (res, data, page, limit, total, message = 'Thành công') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    status: 'success',
    message: message,
    data: data,
    pagination: {
      currentPage: parseInt(page),
      totalPages: totalPages,
      pageSize: parseInt(limit),
      totalItems: total,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  });
};

// Created Response (201)
const createdResponse = (res, data, message = 'Tạo thành công') => {
  return successResponse(res, data, message, 201);
};

// No Content Response (204)
const noContentResponse = (res) => {
  return res.status(204).send();
};

// Not Found Response (404)
const notFoundResponse = (res, message = 'Không tìm thấy dữ liệu') => {
  return errorResponse(res, message, 404);
};

// Bad Request Response (400)
const badRequestResponse = (res, message = 'Yêu cầu không hợp lệ', errors = null) => {
  return errorResponse(res, message, 400, errors);
};

// Unauthorized Response (401)
const unauthorizedResponse = (res, message = 'Không có quyền truy cập') => {
  return errorResponse(res, message, 401);
};

// Forbidden Response (403)
const forbiddenResponse = (res, message = 'Bị cấm truy cập') => {
  return errorResponse(res, message, 403);
};

// Conflict Response (409)
const conflictResponse = (res, message = 'Dữ liệu đã tồn tại') => {
  return errorResponse(res, message, 409);
};

// Server Error Response (500)
const serverErrorResponse = (res, message = 'Lỗi server') => {
  return errorResponse(res, message, 500);
};

module.exports = {
  successResponse,
  errorResponse,
  paginationResponse,
  createdResponse,
  noContentResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  serverErrorResponse
};