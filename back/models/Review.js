import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  coiffeurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  comment: String,
  date: Date
});

export default mongoose.model('Review', ReviewSchema); 