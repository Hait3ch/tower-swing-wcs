import { Router, Request, Response } from 'express';
import { Event, IEvent } from '../models/Event';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Get all events (admin only)
router.get('/', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().sort({ year: -1 });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get active event (public)
router.get('/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      res.status(404).json({ message: 'No active event found' });
      return;
    }
    res.json(activeEvent);
  } catch (error) {
    console.error('Get active event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get event by ID (admin only)
router.get('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new event (admin only)
router.post('/', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const eventData = req.body;
    console.log('Creating event with data:', eventData);
    
    const event = new Event(eventData);
    console.log('Event object created:', event);
    
    await event.save();
    console.log('Event saved successfully:', event._id);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error: any) {
    console.error('Create event error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
      return;
    }

    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Duplicate key error - this event already exists' 
      });
      return;
    }

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update event (admin only)
router.patch('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error: any) {
    console.error('Update event error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Set event as active (admin only)
router.patch('/:id/activate', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // This will automatically deactivate other events due to the pre-save hook
    event.isActive = true;
    await event.save();

    res.json({
      message: 'Event activated successfully',
      event
    });

  } catch (error) {
    console.error('Activate event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 