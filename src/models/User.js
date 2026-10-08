const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  avatarUrl: { type: String, trim: true, default: '' },
  bio: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('User', userSchema);
