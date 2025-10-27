import mongoose from 'mongoose';

const cuttingSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomingStock',
    required: [true, 'Stock reference is required']
  },

  cuttingType: {
    type: String,
    enum: ['SHARING', 'CIRCULAR'],
    required: [true, 'Cutting type is required'],
    uppercase: true
  },

  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },

  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true
  },

  dia: {
    type: Number,
    required: [true, 'Diameter is required'],
    min: [0, 'Diameter must be positive']
  },

  material: {
    type: String,
    trim: true,
    uppercase: true
  },

  colorCode: {
    type: String,
    trim: true,
    uppercase: true
  },

  cuttingWeightMin: {
    type: Number,
    default: 0.490
  },

  cuttingWeightMax: {
    type: Number,
    default: 0.500
  },

  weightVariance: {
    type: Number,
    default: 0.010
  },

  endPieceWeight: {
    type: Number,
    default: 0.010
  },

  totalStockWeightUsed: {
    type: Number,
    required: [true, 'Total stock weight is required'],
    min: [0, 'Weight must be positive']
  },

  calculations: {
    type: Map,
    of: Number,
    default: {}
  }

}, {
  timestamps: true
});

// Pre-save middleware to calculate all values
cuttingSchema.pre('save', function(next) {
  try {
    // Initialize calculations
    const calculations = {};

    // 1. Average cutting weight
    const avgCuttingWeight = (this.cuttingWeightMin + this.cuttingWeightMax) / 2;
    calculations.avgCuttingWeight = Number(avgCuttingWeight.toFixed(6));

    // 2. Calculate blend weight (BHUKI - only for CIRCULAR)
    let blendWeight = 0;
    if (this.cuttingType === 'CIRCULAR') {
      blendWeight = this.dia * this.dia * 2 * 0.00000618;
    }
    calculations.blendWeight = Number(blendWeight.toFixed(6));

    // 3. Final cut weight per piece
    const finalCutWeight = avgCuttingWeight + this.weightVariance + this.endPieceWeight + blendWeight;
    calculations.finalCutWeight = Number(finalCutWeight.toFixed(6));

    // 4. Calculate total number of pieces
    const totalPieces = Math.floor(this.totalStockWeightUsed / finalCutWeight);
    calculations.totalPieces = totalPieces;

    // 5. Calculate total bhuki (only for CIRCULAR)
    let totalBhuki = 0;
    if (this.cuttingType === 'CIRCULAR') {
      totalBhuki = totalPieces * blendWeight;
    }
    calculations.totalBhuki = Number(totalBhuki.toFixed(6));

    // 6. Calculate weight used for cutting
    const weightUsedForCutting = totalPieces * finalCutWeight;
    calculations.weightUsedForCutting = Number(weightUsedForCutting.toFixed(6));

    // 7. Calculate ACTUAL waste
    const totalWaste = this.totalStockWeightUsed - weightUsedForCutting;
    calculations.totalWaste = Number(totalWaste.toFixed(6));

    // Set calculations as Map
    this.calculations = new Map(Object.entries(calculations));

    next();
  } catch (error) {
    console.error('Pre-save error:', error);
    next(error);
  }
});

// Transform to JSON - convert Map to Object
cuttingSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.calculations && ret.calculations instanceof Map) {
      ret.calculations = Object.fromEntries(ret.calculations);
    }
    return ret;
  }
});

cuttingSchema.set('toObject', {
  transform: function(doc, ret) {
    if (ret.calculations && ret.calculations instanceof Map) {
      ret.calculations = Object.fromEntries(ret.calculations);
    }
    return ret;
  }
});

cuttingSchema.index({ stockId: 1, date: -1 });
cuttingSchema.index({ cuttingType: 1 });

export default mongoose.model('Cutting', cuttingSchema);
