import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, uppercase: true, trim: true, default: 'EUR', minlength: 3, maxlength: 3 },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  remaining: { type: Number, required: true, min: 0, validate: Number.isInteger }
}, { timestamps: true, versionKey: false });

export default mongoose.model('TicketType', ticketTypeSchema);
