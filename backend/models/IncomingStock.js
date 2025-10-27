import mongoose from 'mongoose';

const incomingStockSchema = new mongoose.Schema({
  // Date
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },

  // Party Name
  partyName: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true
  },

  // Material
  material: {
    type: String,
    required: [true, 'Material is required'],
    trim: true,
    uppercase: true
  },

   // Diameter (NEW FIELD)
  dia: { 
    type: Number,
    required: [true, 'Diameter is required'],
    min: [0, 'Diameter must be positive']
  },

  // Color Code
  colorCode: {
    type: String,
    required: [true, 'Color code is required'],
    trim: true,
    uppercase: true
  },

  // Quantity
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },

  // TC Report
  tcReport: {
    type: String,
    trim: true,
    uppercase: true
  },

  // Part Name
  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true
  },

  // Heat Number
  heatNo: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true
  }

}, {
  timestamps: true
});

// Indexes for better query performance
incomingStockSchema.index({ date: -1 });
incomingStockSchema.index({ partyName: 1 });
incomingStockSchema.index({ heatNo: 1 });

export default mongoose.model('IncomingStock', incomingStockSchema);
