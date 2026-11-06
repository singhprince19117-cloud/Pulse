import mongoose from 'mongoose';

// One document per join session. Doubles as the source for meeting history.
const attendanceSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['host', 'participant'], default: 'participant' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
  },
  { timestamps: true }
);

export const Attendance = mongoose.model('Attendance', attendanceSchema);
