import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPollOption {
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  question: string;
  options: IPollOption[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  duration: number; // in seconds, max 60
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>({
  text: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const PollSchema = new Schema<IPoll>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [PollOptionSchema],
      required: true,
      validate: {
        validator: (options: IPollOption[]) => options.length >= 2,
        message: 'Poll must have at least 2 options',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PollSchema.index({ status: 1 });
PollSchema.index({ createdAt: -1 });

const Poll: Model<IPoll> = mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;
