import mongoose from 'mongoose';

// Speaker and timestamp are set by the server from the authenticated user, never by the client.
const segmentSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    speaker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    speakerName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
    spokenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const TranscriptSegment = mongoose.model('TranscriptSegment', segmentSchema);
