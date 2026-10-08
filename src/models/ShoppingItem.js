const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  normalizedName: { type: String, required: true, lowercase: true, trim: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  arrivalAt: { type: Date, required: true },
  broughtBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, versionKey: false });

shoppingItemSchema.index({ event: 1, normalizedName: 1 }, { unique: true });
module.exports = mongoose.model('ShoppingItem', shoppingItemSchema);
