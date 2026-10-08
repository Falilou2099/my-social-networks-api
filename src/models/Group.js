const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  iconUrl: { type: String, trim: true, default: '' },
  coverPhotoUrl: { type: String, trim: true, default: '' },
  visibility: { type: String, enum: ['public', 'private', 'secret'], default: 'private' },
  allowMemberPosts: { type: Boolean, default: true },
  allowMemberEvents: { type: Boolean, default: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Group', groupSchema);
