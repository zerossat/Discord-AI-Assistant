import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI spec assembled from JSDoc `@openapi` blocks in the route files.
 * Served at `/api/docs` (Swagger UI) and `/api/docs.json` (raw spec).
 */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Discord AI Assistant API',
      version: '1.0.0',
      description:
        'HTTP API exposed by the Discord bot for the admin dashboard ' +
        '(stats, guild management, health).',
    },
    servers: [{ url: '/', description: 'Same-origin' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Stats: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer' },
            totalConversations: { type: 'integer' },
            totalGuilds: { type: 'integer' },
            totalMessages: { type: 'integer' },
            totalTokens: { type: 'integer' },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
        GuildSummary: {
          type: 'object',
          properties: {
            guildId: { type: 'string' },
            name: { type: 'string', nullable: true },
            memberCount: { type: 'integer', nullable: true },
            aiModel: { type: 'string' },
            prefix: { type: 'string' },
            memoryEnabled: { type: 'boolean' },
          },
        },
      },
    },
  },
  // Globs are resolved relative to the bot package cwd (src for dev, dist for prod).
  apis: ['src/server/routes/*.ts', 'dist/server/routes/*.js'],
});
