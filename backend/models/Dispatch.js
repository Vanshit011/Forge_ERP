import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema({
  forgingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forging',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  challanNo: {
    type: String,
    required: true,
    trim: true
  },
  dispatchQty: {
    type: Number,
    required: true,
    min: 1
  },
  remarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Dispatch', dispatchSchema);