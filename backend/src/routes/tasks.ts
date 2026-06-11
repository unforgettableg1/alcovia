import { Router, Request, Response } from 'express';
import { db, Task } from '../db';

const router = Router();

// Sync tasks from a device (last-logical-clock wins)
router.post('/sync', (req: Request, res: Response) => {
  const { tasks, deviceId } = req.body as { tasks: Task[]; deviceId: string };

  for (const incoming of tasks) {
    const existing = db.tasks.get(incoming.taskId);

    if (!existing) {
      // New task, just save it
      db.tasks.set(incoming.taskId, incoming);
      continue;
    }

    // Conflict resolution: higher logical clock wins
    // If same clock, "done" > "in_progress" > "not_started"
    if (incoming.updatedAt > existing.updatedAt) {
      db.tasks.set(incoming.taskId, incoming);
    } else if (incoming.updatedAt === existing.updatedAt) {
      // Tie-break: prefer more "done" state
      const priority = { done: 3, in_progress: 2, not_started: 1 };
      if ((priority[incoming.status] || 0) > (priority[existing.status] || 0)) {
        db.tasks.set(incoming.taskId, incoming);
      }
    }
    // else: existing is newer, keep it
  }

  // Return ALL tasks for this student so device can update
  const studentId = tasks[0]?.studentId || 'student_1';
  const allTasks = Array.from(db.tasks.values()).filter(
    (t) => t.studentId === studentId
  );

  res.json({ ok: true, tasks: allTasks });
});

// Get all tasks for student
router.get('/:studentId', (req: Request, res: Response) => {
  const tasks = Array.from(db.tasks.values()).filter(
    (t) => t.studentId === req.params.studentId
  );
  res.json(tasks);
});

export default router;