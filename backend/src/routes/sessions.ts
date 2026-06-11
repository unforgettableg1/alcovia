import { Router, Request, Response } from 'express';
import { db, FocusSession } from '../db';
import axios from 'axios';

const router = Router();

// Sync focus sessions from a device
router.post('/sync', async (req: Request, res: Response) => {
  const { sessions } = req.body as { sessions: FocusSession[] };

  const results: string[] = [];

  for (const session of sessions) {
    // IDEMPOTENCY: skip if already processed
    if (db.processedSessions.has(session.sessionId)) {
      results.push(`${session.sessionId}: already processed`);
      continue;
    }

    // Save session
    db.sessions.set(session.sessionId, session);

    if (session.status === 'completed') {
      // Grant rewards exactly once
      const student = db.students.get(session.studentId)!;
      const today = new Date().toISOString().split('T')[0];

      // Update streak
      if (student.lastFocusDate === getPreviousDay(today)) {
        student.streak += 1;
      } else if (student.lastFocusDate !== today) {
        student.streak = 1;
      }

      student.lastFocusDate = today;
      student.coins += 50;
      student.todayFocusMinutes += session.targetMinutes;

      db.students.set(session.studentId, student);

      // Mark as processed BEFORE firing webhook (idempotency)
      db.processedSessions.add(session.sessionId);

      // Fire n8n webhook (only once per session)
      if (!session.notificationSent) {
        try {
          await axios.post(
            process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/focus-complete',
            {
              sessionId: session.sessionId,
              studentId: session.studentId,
              streak: student.streak,
              coins: student.coins,
              minutesFocused: session.targetMinutes,
            }
          );
          session.notificationSent = true;
          db.sessions.set(session.sessionId, session);
        } catch (e) {
          console.log('n8n webhook failed (continuing):', e);
        }
      }

      results.push(`${session.sessionId}: rewarded`);
    } else {
      db.processedSessions.add(session.sessionId);
      results.push(`${session.sessionId}: failed session recorded`);
    }
  }

  const student = db.students.get(sessions[0]?.studentId || 'student_1');
  res.json({ ok: true, results, student });
});

// Get student state
router.get('/state/:studentId', (req: Request, res: Response) => {
  const student = db.students.get(req.params.studentId);
  res.json(student || null);
});

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default router;