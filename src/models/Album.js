const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });
const photoSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true, maxlength: 2048 },
  caption: { type: String, trim: true, maxlength: 500, default: '' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [commentSchema]
}, { timestamps: true });
const albumSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
  title: { type: String, trim: true, maxlength: 120, default: 'Photos de l evenement' },
  photos: [photoSchema]
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Album', albumSchema);
