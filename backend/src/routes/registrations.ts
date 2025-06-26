import { Router, Request, Response } from 'express';
import { Registration, IRegistration } from '../models/Registration';
import { Event, IEvent } from '../models/Event';
import { authenticateAdmin } from '../middleware/auth';
import { sendRegistrationConfirmation, sendPaymentConfirmation } from '../services/emailService';
import mongoose from 'mongoose';

const router = Router();

// Create a new registration
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const registrationData = req.body;
    
    // Get the active event
    const activeEvent = await Event.findOne({ isActive: true });
    if (!activeEvent) {
      res.status(400).json({ 
        message: 'No active event found. Registration is currently closed.' 
      });
      return;
    }

    if (!activeEvent.registrationOpen) {
      res.status(400).json({ 
        message: 'Registration is currently closed for this event.' 
      });
      return;
    }

    // Set event data from active event
    registrationData.eventId = (activeEvent as any)._id.toString();
    registrationData.eventYear = activeEvent.year;
    registrationData.eventDate = activeEvent.date;
    registrationData.price = activeEvent.price;

    // Check current registration count for this event (excluding cancelled and waiting registrations)
    const currentRegistrations = await Registration.countDocuments({
      eventId: (activeEvent as any)._id.toString(),
      paymentStatus: { $nin: ['cancelled', 'waiting'] }
    });

    // Determine if this registration should go on waiting list
    const isWaitingList = activeEvent.waitingListEnabled && currentRegistrations >= activeEvent.maxCapacity;
    
    if (isWaitingList) {
      registrationData.paymentStatus = 'waiting';
    } else {
      registrationData.paymentStatus = 'pending';
    }

    const registration = new Registration(registrationData);
    await registration.save();

    // Send appropriate confirmation email
    try {
      if (isWaitingList) {
        await sendRegistrationConfirmation({
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          experience: registration.experience,
          registrationDate: registration.registrationDate.toISOString(),
          waitingListStatus: 'active'
        });
      } else {
        await sendRegistrationConfirmation({
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          experience: registration.experience,
          registrationDate: registration.registrationDate.toISOString(),
          waitingListStatus: 'none'
        });
      }
    } catch (emailError) {
      console.error('Email sending failed, but registration was saved:', emailError);
      // Don't fail the registration if email fails
    }

    const message = isWaitingList 
      ? 'Registration successful! You have been added to the waiting list.'
      : 'Registration successful';

    res.status(201).json({
      message,
      registration,
      isWaitingList,
      currentRegistrations: currentRegistrations + 1,
      maxRegistrations: activeEvent.maxCapacity,
      eventName: activeEvent.name,
      eventYear: activeEvent.year
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'A registration with this email already exists' 
      });
      return;
    }

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

// Get all registrations (admin only)
router.get('/', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      experience = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.paymentStatus = status;
    }

    if (experience) {
      query.experience = experience;
    }

    const registrations = await Registration.find(query)
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get event details for all registrations
    const eventIds = [...new Set(registrations.map(reg => reg.eventId).filter(Boolean))];
    const events = await Event.find({ _id: { $in: eventIds } });
    const eventMap = new Map(events.map((event: any) => [event._id.toString(), event]));

    // Add event information to registrations
    const registrationsWithEvents = registrations.map(registration => {
      const event = eventMap.get(registration.eventId);
      return {
        ...registration.toObject(),
        event: event ? {
          _id: event._id,
          name: event.name,
          year: event.year,
          date: event.date
        } : null
      };
    });

    const total = await Registration.countDocuments(query);

    res.json({
      registrations: registrationsWithEvents,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get registration by ID (admin only)
router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log('Registration lookup for id:', req.params.id);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid registration ID' });
      return;
    }
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    res.json(registration);

  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update registration status (admin only)
router.patch('/:id/status', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid registration ID' });
      return;
    }
    const { paymentStatus } = req.body;

    if (!paymentStatus || !['pending', 'paid', 'cancelled', 'waiting'].includes(paymentStatus)) {
      res.status(400).json({ 
        message: 'Valid payment status required (pending, paid, cancelled, waiting)' 
      });
      return;
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    );

    if (!registration) {
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    // Send appropriate email based on status change
    if (paymentStatus === 'paid') {
      try {
        await sendPaymentConfirmation({
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          experience: registration.experience,
          registrationDate: registration.registrationDate.toISOString()
        });
      } catch (emailError) {
        console.error('Payment confirmation email failed:', emailError);
        // Don't fail the status update if email fails
      }
    } else if (paymentStatus === 'pending') {
      // Send registration confirmation email when moved from waiting to pending
      try {
        await sendRegistrationConfirmation({
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          experience: registration.experience,
          registrationDate: registration.registrationDate.toISOString(),
          waitingListStatus: 'none'
        });
      } catch (emailError) {
        console.error('Registration confirmation email failed:', emailError);
        // Don't fail the status update if email fails
      }
    }

    res.json({
      message: 'Status updated successfully',
      registration
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete registration (admin only)
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid registration ID' });
      return;
    }
    const registration = await Registration.findByIdAndDelete(req.params.id);
    
    if (!registration) {
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    res.json({ message: 'Registration deleted successfully' });

  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get registration statistics (admin only)
router.get('/stats/overview', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, eventYear } = req.query;
    
    // Build base query
    const baseQuery: any = {};
    if (eventId) {
      baseQuery.eventId = eventId;
    } else if (eventYear) {
      baseQuery.eventYear = parseInt(eventYear as string);
    }

    const total = await Registration.countDocuments(baseQuery);
    const paid = await Registration.countDocuments({ ...baseQuery, paymentStatus: 'paid' });
    const pending = await Registration.countDocuments({ ...baseQuery, paymentStatus: 'pending' });
    const cancelled = await Registration.countDocuments({ ...baseQuery, paymentStatus: 'cancelled' });
    const waiting = await Registration.countDocuments({ ...baseQuery, paymentStatus: 'waiting' });
    
    // Count active registrations (excluding cancelled and waiting list)
    const totalRegistrations = await Registration.countDocuments({
      ...baseQuery,
      paymentStatus: { $nin: ['cancelled', 'waiting'] }
    });

    const experienceStats = await Registration.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$experience',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentRegistrations = await Registration.find(baseQuery)
      .sort({ registrationDate: -1 })
      .limit(5);

    // Get event details if filtering by specific event
    let eventDetails = null;
    if (eventId) {
      eventDetails = await Event.findById(eventId);
    } else if (eventYear) {
      eventDetails = await Event.findOne({ year: parseInt(eventYear as string) });
    }

    res.json({
      total,
      paid,
      pending,
      cancelled,
      waiting,
      totalRegistrations,
      maxRegistrations: eventDetails?.maxCapacity || 'N/A',
      experienceStats,
      recentRegistrations,
      eventDetails
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test email endpoint (for development/testing)
router.post('/test-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, experience } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Send test registration confirmation email with actual user data
    await sendRegistrationConfirmation({
      firstName: firstName || 'Test',
      lastName: lastName || 'User',
      email: email,
      experience: experience || 'Beginner',
      registrationDate: new Date().toISOString()
    });

    res.json({
      message: 'Test email sent successfully',
      sentTo: email,
      userData: {
        firstName: firstName || 'Test',
        lastName: lastName || 'User',
        experience: experience || 'Beginner'
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 