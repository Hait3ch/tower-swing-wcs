import mongoose from 'mongoose';
import { Event, IEvent } from '../models/Event';
import { Registration } from '../models/Registration';
import dotenv from 'dotenv';

dotenv.config();

async function createInitialEvent() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tower-swing-wcs';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if 2025 event already exists
    const existingEvent = await Event.findOne({ year: 2025 });
    if (existingEvent) {
      console.log('2025 event already exists, skipping creation');
      return;
    }

    // Create the 2025 event
    const event2025 = new Event({
      year: 2025,
      name: 'Tower Swing 2025',
      date: new Date('2025-06-28T16:00:00.000Z'),
      maxCapacity: 10,
      isActive: true,
      registrationOpen: true,
      waitingListEnabled: true,
      price: 15,
      venue: 'Floor 33, REDI Helsinki',
      description: 'The highest West Coast Swing dance event in Helsinki! Join us for an unforgettable evening of dancing with stunning city views.'
    });

    await event2025.save();
    console.log('Created 2025 event:', event2025.name);

    // Migrate existing registrations to the new event
    const existingRegistrations = await Registration.find({ eventId: { $exists: false } });
    
    if (existingRegistrations.length > 0) {
      console.log(`Migrating ${existingRegistrations.length} existing registrations...`);
      
      for (const registration of existingRegistrations) {
        registration.eventId = (event2025 as any)._id.toString();
        await registration.save();
      }
      
      console.log('Migration completed successfully');
    } else {
      console.log('No existing registrations to migrate');
    }

    console.log('Initial event setup completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createInitialEvent(); 