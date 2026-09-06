import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const applicationRoot = process.cwd();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoneyMate API',
      version: '1.0.0',
      description: 'Smart Personal Finance Management System – REST API documentation',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(applicationRoot, 'src/routes/*.{ts,js}'),
    path.join(applicationRoot, 'src/controllers/*.{ts,js}'),
    path.join(applicationRoot, 'dist/routes/*.js'),
    path.join(applicationRoot, 'dist/controllers/*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
