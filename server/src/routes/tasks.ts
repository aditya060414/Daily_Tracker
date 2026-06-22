import { Router } from 'express';
import { Task } from '../models/Task';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// ─── Helpers ─────────────────────────────────────────────────────────────────

type UrgencyGroup = 'overdue' | 'today' | 'this_week' | 'later' | 'completed';

function computeUrgencyGroup(deadline: Date, status: string): UrgencyGroup {
  if (status === 'done') return 'completed';

  const now = new Date();

  // Strip to calendar-day boundaries in local server time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8); // +7 days, exclusive

  if (deadline < now) return 'overdue';
  if (deadline >= todayStart && deadline < todayEnd) return 'today';
  if (deadline >= todayEnd && deadline < weekEnd) return 'this_week';
  return 'later';
}

// ─── GET /api/v1/tasks ───────────────────────────────────────────────────────
// Fetch all tasks for the user sorted by deadline ascending.
// Attaches a computed `urgencyGroup` virtual on each result.
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user!.userId }).sort({ deadline: 1 });

    const tasksWithGroup = tasks.map((task) => {
      const obj = task.toObject() as any;
      obj.urgencyGroup = computeUrgencyGroup(task.deadline, task.status);
      return obj;
    });

    return res.json({ success: true, data: tasksWithGroup });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/v1/tasks ──────────────────────────────────────────────────────
// Create a new task.
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, description, tags, deadline, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Task title is required.',
      });
    }

    if (!deadline) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Deadline is required.',
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid deadline date.',
      });
    }

    const newTask = await Task.create({
      userId: req.user!.userId,
      title: title.trim(),
      description: description || '',
      tags: Array.isArray(tags) ? tags.filter((t: any) => typeof t === 'string' && t.trim()) : [],
      deadline: deadlineDate,
      status: status || 'todo',
    });

    const obj = newTask.toObject() as any;
    obj.urgencyGroup = computeUrgencyGroup(newTask.deadline, newTask.status);

    return res.status(201).json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/v1/tasks/:id ─────────────────────────────────────────────────
// Update any subset of fields on a task.
router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user!.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Task not found.',
      });
    }

    const { title, description, tags, deadline, status } = req.body;

    if (title !== undefined) task.title = String(title).trim();
    if (description !== undefined) task.description = description;
    if (tags !== undefined) {
      task.tags = Array.isArray(tags)
        ? tags.filter((t: any) => typeof t === 'string' && t.trim())
        : [];
    }
    if (deadline !== undefined) {
      const d = new Date(deadline);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, data: null, error: 'Invalid deadline date.' });
      }
      task.deadline = d;
    }
    if (status !== undefined) {
      if (!['todo', 'in_progress', 'done'].includes(status)) {
        return res.status(400).json({ success: false, data: null, error: 'Invalid status value.' });
      }
      task.status = status;
    }

    await task.save();

    const obj = task.toObject() as any;
    obj.urgencyGroup = computeUrgencyGroup(task.deadline, task.status);

    return res.json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/v1/tasks/:id ────────────────────────────────────────────────
// Permanently delete a task.
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Task not found.',
      });
    }

    return res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
});

export default router;
