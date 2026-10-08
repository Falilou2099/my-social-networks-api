import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { notFound, errorHandler } from './middleware/errors.mjs';
import authRoutes from './routes/auth.mjs';
import userRoutes from './routes/users.mjs';
import groupRoutes from './routes/groups.mjs';
import eventRoutes from './routes/events.mjs';
import threadRoutes from './routes/threads.mjs';
import activityRoutes from './routes/activity.mjs';
import openapi from './openapi.mjs';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api', activityRoutes);

app.get('/openapi.json', (req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(notFound);
app.use(errorHandler);

export default app;
