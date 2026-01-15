import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVote extends Document {
  pollId: mongoose.Types.ObjectId;
  studentId: string;
  optionIndex: number;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    optionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one vote per student per poll
VoteSchema.index({ pollId: 1, studentId: 1 }, { unique: true });

const Vote: Model<IVote> = mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;
