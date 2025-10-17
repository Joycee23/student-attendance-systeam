const swaggerJsdoc = require('swagger-jsdoc');

// Minimal swagger config to avoid issues
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Attendance System API',
      version: '1.0.0',
      description: 'API documentation for Student Attendance Management System with Face Recognition'
    },
    servers: [
      {
        url: 'http://studentsattendance.duckdns.org:5000',
        description: 'Production server'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;