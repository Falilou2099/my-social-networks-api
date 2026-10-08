const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  coverPhotoUrl: { type: String, trim: true, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
  shoppingListEnabled: { type: Boolean, default: false },
  carpoolEnabled: { type: Boolean, default: false },
  ticketingEnabled: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

eventSchema.pre('validate', function validateDates(next) {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) this.invalidate('endsAt', 'La fin doit etre posterieure au debut');
  if (!this.organizers?.length) this.invalidate('organizers', 'Un evenement doit avoir au moins un organisateur');
  next();
});

module.exports = mongoose.model('Event', eventSchema);
