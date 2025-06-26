import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistration extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  dietaryRestrictions?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'waiting';
  eventId?: string; // Reference to Event model
  eventYear?: number; // Quick access for queries
  registrationDate: Date;
  eventDate: Date;
  price: number;
  notes?: string;
}

const registrationSchema = new Schema<IRegistration>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Experience must be beginner, intermediate, or advanced'
    }
  },
  dietaryRestrictions: {
    type: String,
    trim: true,
    maxlength: [200, 'Dietary restrictions cannot exceed 200 characters']
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: {
      values: ['pending', 'paid', 'cancelled', 'waiting'],
      message: 'Payment status must be pending, paid, cancelled, or waiting'
    },
    default: 'pending'
  },
  eventId: {
    type: String,
    trim: true
  },
  eventYear: {
    type: Number,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
registrationSchema.index({ registrationDate: -1 });
registrationSchema.index({ paymentStatus: 1 });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema); 