import mongoose from 'mongoose';

const cuttingSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomingStock',
    required: true
  },

  cuttingType: {
    type: String,
    enum: ['SHARING', 'CIRCULAR'],
    required: true,
    uppercase: true
  },

  date: {
    type: Date,
    required: true,
    default: Date.now
  },

  partName: {
    type: String,
    required: true,
    trim: true
  },

  material: String,
  colorCode: String,

  dia: {
    type: Number,
    required: true
  },

  targetPieces: {
    type: Number,
    required: true,
    min: 1
  },

  cuttingWeightMin: {
    type: Number,
    default: 0.495
  },

  cuttingWeightMax: {
    type: Number,
    default: 0.505
  },

  totalCutWeight: {
    type: Number,
    required: true,
    default: 0.520
  },

  endPieceWeight: {
    type: Number,
    default: 0.010
  },

  bhukiWeight: {
    type: Number,
    default: 0.010
  },
  remarks: {
    type: String,
    default: '' // This is usually fine for String
  },
    calculations: {
      type: {
        steelUsedForPieces: Number,
        endPieceUsed: Number,
        scrapUsed: Number,
        totalSteelUsed: Number,
        totalPieces: Number,
        totalWaste: Number,
        totalBhuki: Number
      },
      default: {}
    }
  }, {
    timestamps: true
  });

cuttingSchema.pre('save', function (next) {
  try {
    this.calculations = this.calculations || {};

    this.calculations.steelUsedForPieces = Number((this.targetPieces * this.totalCutWeight).toFixed(3));
    this.calculations.endPieceUsed = Number((this.targetPieces * this.endPieceWeight).toFixed(3));

    if (this.cuttingType === 'CIRCULAR') {
      this.calculations.scrapUsed = Number((this.targetPieces * this.bhukiWeight).toFixed(3));
      this.calculations.totalBhuki = this.calculations.scrapUsed;
    } else {
      this.calculations.scrapUsed = 0;
      this.calculations.totalBhuki = 0;
    }

    this.calculations.totalSteelUsed = Number((
      this.calculations.steelUsedForPieces +
      this.calculations.endPieceUsed +
      this.calculations.scrapUsed
    ).toFixed(3));

    this.calculations.totalPieces = this.targetPieces;
    this.calculations.totalWaste = Number((
      this.calculations.endPieceUsed +
      this.calculations.scrapUsed
    ).toFixed(3));

    next();
  } catch (error) {
    next(error);
  }
});

cuttingSchema.index({ stockId: 1, date: -1 });
cuttingSchema.index({ cuttingType: 1, date: -1 });
cuttingSchema.index({ date: -1 });

export default mongoose.model('Cutting', cuttingSchema);
