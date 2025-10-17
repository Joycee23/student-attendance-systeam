const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Attendance System API',
      version: '1.0.0',
      description: 'API documentation for Student Attendance Management System with Face Recognition',
    },
    servers: [
      {
        url: 'https://studentsattendance.duckdns.org',
        description: 'Production server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // quét tất cả route có swagger comment
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
