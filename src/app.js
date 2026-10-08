require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/events', require('./routes/events'));
app.use('/api/threads', require('./routes/threads'));

const openapi = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'My Social Networks API', version: '1.0.0', description: 'API REST pour les groupes, evenements et leurs activites.' },
    servers: [{ url: '/api' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }
  },
  apis: ['./src/routes/*.js']
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
