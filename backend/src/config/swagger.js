const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Attendance System API',
      version: '1.0.0',
      description: 'API documentation for Student Attendance Management System with Face Recognition',
      contact: {
        name: 'API Support',
        email: 'support@attendance.system'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://studentsattendance.duckdns.org:5000',
        description: 'Production server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            fullName: { type: 'string', example: 'Nguyen Van A' },
            email: { type: 'string', example: 'student@example.com' },
            role: { type: 'string', enum: ['admin', 'lecturer', 'student'], example: 'student' },
            studentCode: { type: 'string', example: 'SV001' },
            lecturerCode: { type: 'string', example: 'GV001' },
            avatarUrl: { type: 'string', example: 'https://cloudinary.com/avatar.jpg' },
            hasFaceRegistered: { type: 'boolean', example: false },
            isActive: { type: 'boolean', example: true }
          }
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'CNTT-K18A' },
            lecturerId: { type: 'string' },
            studentIds: { type: 'array', items: { type: 'string' } },
            courseIds: { type: 'array', items: { type: 'string' } },
            department: { type: 'string', example: 'CNTT' },
            courseYear: { type: 'string', example: 'K18' }
          }
        },
        Subject: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'IT001' },
            name: { type: 'string', example: 'Lập trình JavaScript' },
            credits: { type: 'number', example: 3 },
            lecturerIds: { type: 'array', items: { type: 'string' } }
          }
        },
        AttendanceSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            courseId: { type: 'string' },
            classId: { type: 'string' },
            sessionDate: { type: 'string', format: 'date-time' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string', example: 'A101' },
            status: { type: 'string', enum: ['open', 'closed', 'cancelled'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Authentication', description: 'Auth endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Classes', description: 'Class management' },
      { name: 'Subjects', description: 'Subject management' },
      { name: 'Attendance', description: 'Attendance management' },
      { name: 'Notifications', description: 'Notification system' },
      { name: 'Statistics', description: 'Statistics and analytics' },
      { name: 'Settings', description: 'System settings' },
      { name: 'Reports', description: 'Report generation' }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;