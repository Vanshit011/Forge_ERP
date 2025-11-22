import mongoose from 'mongoose';

const cuttingSchema = new mongoose.Schema({
  stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomingStock', required: true },
  cuttingType: { type: String, enum: ['SHARING', 'CIRCULAR'], required: true },
  date: { type: Date, default: Date.now },
  partName: { type: String, required: true },
  material: String,
  colorCode: String,
  dia: { type: Number, required: true },
  targetPieces: { type: Number, required: true },
  cuttingWeightMin: Number,
  cuttingWeightMax: Number,
  
  // Store both weights to avoid confusion
  avgCutWeight: Number,   // Net (0.50)
  totalCutWeight: Number, // Gross (0.51) - This is what user calls "Final Cut Weight"

  endPieceWeight: Number,
  bhukiWeight: Number,
  remarks: String,

  calculations: {
    steelUsedForPieces: Number,
    endPieceUsed: Number,
    scrapUsed: Number,
    totalSteelUsed: Number,
    totalPieces: Number,
    totalWaste: Number,
    totalBhuki: Number
  }
}, { timestamps: true });

cuttingSchema.pre('save', function (next) {
  // Only run calculation logic if the Controller didn't already provide it
  if (!this.calculations || !this.calculations.totalSteelUsed) {
    this.calculations = this.calculations || {};
    
    // Use avgCutWeight (0.50) for piece calculation, NOT totalCutWeight (0.51)
    // If avgCutWeight is missing, calculate it from min/max
    const netWeight = this.avgCutWeight || ((this.cuttingWeightMin + this.cuttingWeightMax) / 2);
    
    this.calculations.steelUsedForPieces = Number((this.targetPieces * netWeight).toFixed(3));
    this.calculations.endPieceUsed = Number((this.targetPieces * this.endPieceWeight).toFixed(3));
    
    if (this.cuttingType === 'CIRCULAR') {
      this.calculations.scrapUsed = Number((this.targetPieces * this.bhukiWeight).toFixed(3));
    } else {
      this.calculations.scrapUsed = 0;
    }

    this.calculations.totalWaste = this.calculations.endPieceUsed + this.calculations.scrapUsed;
    
    // Total = Piece Steel + Waste
    this.calculations.totalSteelUsed = Number((this.calculations.steelUsedForPieces + this.calculations.totalWaste).toFixed(3));
    this.calculations.totalPieces = this.targetPieces;
  }
  next();
});

export default mongoose.model('Cutting', cuttingSchema);