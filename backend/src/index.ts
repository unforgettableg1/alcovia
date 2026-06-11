import express from 'express';
import cors from 'cors';
import sessionsRouter from './routes/sessions';
import tasksRouter from './routes/tasks';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/sessions', sessionsRouter);
app.use('/tasks', tasksRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});