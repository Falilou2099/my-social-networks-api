import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Message', messageSchema);
