const mongoose = require('mongoose');

const ticketPurchaseSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  address: { type: String, required: true, trim: true, maxlength: 500 },
  purchasedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

ticketPurchaseSchema.index({ event: 1, email: 1 }, { unique: true });
module.exports = mongoose.model('TicketPurchase', ticketPurchaseSchema);
