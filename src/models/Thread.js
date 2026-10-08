const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
}, { timestamps: true, versionKey: false });

threadSchema.pre('validate', function validateOwner(next) {
  if (Boolean(this.group) === Boolean(this.event)) this.invalidate('group', 'Un fil doit etre lie a un groupe ou un evenement');
  next();
});

module.exports = mongoose.model('Thread', threadSchema);
