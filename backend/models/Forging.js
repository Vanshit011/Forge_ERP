import mongoose from 'mongoose';

const forgingSchema = new mongoose.Schema({
  // Reference to Cutting
  cuttingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cutting',
    required: [true, 'Cutting reference is required']
  },

  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },

  // Material (from cutting/stock)
  material: {
    type: String,
    required: [true, 'Material is required'],
    uppercase: true,
    trim: true
  },

  // Diameter
  dia: {
    type: Number,
    required: [true, 'Diameter is required']
  },

  // Size specification
  size: {
    type: String,
    required: [true, 'Size is required'],
    trim: true
  },

  // Part Name
  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true
  },

  // Total pieces from cutting
  totalPiecesFromCutting: {
    type: Number,
    required: [true, 'Total pieces from cutting is required']
  },

  // Forging quantity (pieces to forge)
  forgingQty: {
    type: Number,
    required: [true, 'Forging quantity is required'],
    min: [0, 'Forging quantity cannot be negative']
  },

  // Rejection quantity
  rejectionQty: {
    type: Number,
    required: [true, 'Rejection quantity is required'],
    default: 0,
    min: [0, 'Rejection quantity cannot be negative']
  },

  // Forging ring weight (per piece in kg)
  forgingRingWeight: {
    type: Number,
    required: [true, 'Forging ring weight is required'],
    min: [0, 'Forging ring weight cannot be negative']
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

    // Final OK pieces
    finalOkPieces: {
      type: Number,
      required: [true, 'Final OK pieces is required'],
      min: [0, 'Final OK pieces cannot be negative']
    },

    // Total forged pieces
    totalForgedPieces: {
      type: Number,
      required: true
    },

    // Total ring weight
    totalRingWeight: {
      type: Number,
      default: 0
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
    const { babariPerPiece, scrapPieces, finalOkPieces } = this.forgingResults;

    // Calculate total babari = babari per piece * forging qty
    this.forgingResults.totalBabari = Number((babariPerPiece * this.forgingQty).toFixed(3));

    // Calculate total forged pieces = final OK + scrap + rejection
    this.forgingResults.totalForgedPieces = finalOkPieces + scrapPieces + this.rejectionQty;

    // Calculate total ring weight = final OK pieces * ring weight per piece
    this.forgingResults.totalRingWeight = Number((finalOkPieces * this.forgingRingWeight).toFixed(3));

    // Calculate efficiency (OK pieces / Forging qty * 100)
    if (this.forgingQty > 0) {
      this.forgingResults.efficiency = Number(((finalOkPieces / this.forgingQty) * 100).toFixed(2));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
forgingSchema.index({ cuttingId: 1, date: -1 });
forgingSchema.index({ date: -1 });
forgingSchema.index({ material: 1 });

export default mongoose.model('Forging', forgingSchema);
