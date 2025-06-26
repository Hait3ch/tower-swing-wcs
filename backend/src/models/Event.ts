import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  year: number;
  name: string;
  date: Date;
  maxCapacity: number;
  isActive: boolean;
  registrationOpen: boolean;
  waitingListEnabled: boolean;
  price: number;
  venue: string;
  address: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
  },
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Maximum capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: false
  },
  registrationOpen: {
    type: Boolean,
    default: true
  },
  waitingListEnabled: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
    maxlength: [200, 'Venue cannot exceed 200 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ year: -1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ registrationOpen: 1 });

// Ensure only one active event at a time
eventSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('Event').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

export const Event = mongoose.model<IEvent>('Event', eventSchema); 