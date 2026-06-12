import { Router } from 'express';
import { StickyNote } from '../models/StickyNote';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all sticky notes routes
router.use(authenticateToken);

// GET /api/v1/sticky-notes - Get all sticky notes for the user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const notes = await StickyNote.find({ userId: req.user!.userId }).sort({ updatedAt: -1 });
    return res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/sticky-notes - Create a new sticky note
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, content, color, position, isMinimized } = req.body;
    
    const newNote = await StickyNote.create({
      userId: req.user!.userId,
      title: title || 'Untitled Note',
      content: content || '',
      color: color || 'yellow',
      position: position || { x: 50, y: 50 },
      isMinimized: isMinimized !== undefined ? isMinimized : false,
    });

    return res.status(201).json({
      success: true,
      data: newNote,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/sticky-notes/:id - Update a sticky note
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, content, color, position, isMinimized } = req.body;
    
    // Find note owned by the current authenticated user
    const note = await StickyNote.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Sticky note not found.',
      });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;
    if (position !== undefined) note.position = position;
    if (isMinimized !== undefined) note.isMinimized = isMinimized;

    await note.save();

    return res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/sticky-notes/:id - Delete a sticky note
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const note = await StickyNote.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.userId
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Sticky note not found.',
      });
    }

    return res.json({
      success: true,
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
