const mongoose = require('mongoose');

const carpoolOfferSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departureLocation: { type: String, required: true, trim: true, maxlength: 300 },
  departureAt: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, uppercase: true, trim: true, default: 'EUR', minlength: 3, maxlength: 3 },
  seatsTotal: { type: Number, required: true, min: 1, max: 20, validate: Number.isInteger },
  seatsAvailable: { type: Number, required: true, min: 0, validate: Number.isInteger },
  maxDeviationMinutes: { type: Number, required: true, min: 0, max: 1440, validate: Number.isInteger },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('CarpoolOffer', carpoolOfferSchema);
