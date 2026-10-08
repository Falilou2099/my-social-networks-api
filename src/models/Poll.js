const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({ text: { type: String, required: true, trim: true, maxlength: 300 } }, { _id: true });
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  options: { type: [answerSchema], validate: (options) => options.length >= 2 }
}, { _id: true });
const voteSchema = new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, required: true },
  option: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { _id: false });
const pollSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  questions: { type: [questionSchema], validate: (questions) => questions.length >= 1 },
  votes: [voteSchema]
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Poll', pollSchema);
