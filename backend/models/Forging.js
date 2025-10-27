import mongoose from 'mongoose';

const forgingSchema = new mongoose.Schema({
  // Reference to Cutting
  cuttingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cutting',
    required: [true, 'Cutting reference is required']
  },

  // Date
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },

  // Part Name (from cutting)
  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true
  },

  // Diameter (from cutting)
  dia: {
    type: Number,
    required: [true, 'Diameter is required']
  },

  // Size specification
  size: {
    type: String,
    trim: true
  },

  // Final Cut Weight per piece (from cutting)
  finalCutWeight: {
    type: Number,
    required: [true, 'Final cut weight is required']
  },

  // Total pieces from cutting
  totalPiecesFromCutting: {
    type: Number,
    required: [true, 'Total pieces from cutting is required']
  },

  // Forging Results
  forgingResults: {
    // Babari (Flash/Excess material per piece in kg)
    babariPerPiece: {
      type: Number,
      required: [true, 'Babari per piece is required'],
      default: 0
    },

    // Total babari weight
    totalBabari: {
      type: Number,
      default: 0
    },

    // Scrap pieces (damaged during forging)
    scrapPieces: {
      type: Number,
      required: [true, 'Scrap pieces count is required'],
      default: 0,
      min: [0, 'Scrap pieces cannot be negative']
    },

    // Rejection pieces (quality failures)
    rejectionPieces: {
      type: Number,
      required: [true, 'Rejection pieces count is required'],
      default: 0,
      min: [0, 'Rejection pieces cannot be negative']
    },

    // Final OK pieces
    finalOkPieces: {
      type: Number,
      required: [true, 'Final OK pieces is required'],
      min: [0, 'Final OK pieces cannot be negative']
    },

    // Total forged pieces (OK + Scrap + Rejection)
    totalForgedPieces: {
      type: Number,
      required: true
    },

    // Forging efficiency percentage
    efficiency: {
      type: Number,
      default: 0
    }
  },

  // Remarks
  remarks: {
    type: String,
    trim: true,
    maxLength: [500, 'Remarks cannot exceed 500 characters']
  }

}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
forgingSchema.pre('save', function(next) {
  try {
    const { babariPerPiece, scrapPieces, rejectionPieces, finalOkPieces } = this.forgingResults;

    // Calculate total babari
    this.forgingResults.totalBabari = Number((babariPerPiece * this.totalPiecesFromCutting).toFixed(3));

    // Calculate total forged pieces
    this.forgingResults.totalForgedPieces = finalOkPieces + scrapPieces + rejectionPieces;

    // Calculate efficiency (OK pieces / Total pieces from cutting * 100)
    if (this.totalPiecesFromCutting > 0) {
      this.forgingResults.efficiency = Number(((finalOkPieces / this.totalPiecesFromCutting) * 100).toFixed(2));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
forgingSchema.index({ cuttingId: 1, date: -1 });
forgingSchema.index({ date: -1 });

export default mongoose.model('Forging', forgingSchema);
