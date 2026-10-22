import express from 'express';
import { errorHandler } from './shared/middleware/http';
import cors from 'cors';
import { localAccess, localOrigins } from './shared/middleware/local-access';
import { config } from './shared/lib/config';
import { projectsRouter } from './modules/projects/projects.router';
import { leadsRouter } from './modules/leads/leads.router';
import { contentRouter } from './modules/content/content.router';
import { marketRouter } from './modules/market/market.router';
import { publishRouter } from './publish.router';
import { initScheduler } from './scheduler.service';
import { outreachRouter } from './modules/outreach/outreach.router';
import { aiRouter } from './modules/ai/ai.router';
import { trafficRouter, goRouter } from './modules/traffic/traffic.router';
import { tasksRouter } from './modules/tasks/tasks.router';
import { ideasRouter } from './modules/ideas/ideas.router';

const app = express();
const PORT = config.port;

app.use(localAccess);
app.use(cors({
  origin: localOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

app.get('/', (req, res) => {
  res.send('Server is alive!');
});


app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/content', contentRouter);
app.use('/api/market', marketRouter);
app.use('/api/posts', publishRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/ai', aiRouter);
app.use('/api/traffic', trafficRouter);
app.use('/go', goRouter);


app.use(errorHandler);

app.listen(PORT, config.host, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  initScheduler();
});
