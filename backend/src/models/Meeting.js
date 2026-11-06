import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, default: 'Instant meeting', trim: true, maxlength: 100 },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    removedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
  },
  { timestamps: true }
);

export const Meeting = mongoose.model('Meeting', meetingSchema);
