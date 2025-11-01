import mongoose from 'mongoose';

const incomingStockSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },

  partyName: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true
  },

  dia: {
    type: Number,
    required: [true, 'Diameter is required'],
    min: [0, 'Diameter cannot be negative']
  },

  material: {
    type: String,
    required: [true, 'Material is required'],
    uppercase: true,
    enum: ['SAE52100', 'SAE8620', '16MNCR5', 'EN352', 'EN353', '20MNCR5', '27MNCR5', 'SAE1018', 'EN8'],
    trim: true
  },

  colorCode: {
    type: String,
    required: [true, 'Color code is required'],
    uppercase: true,
    enum: ['GREEN', 'ORANGE', 'PURPLE', 'COFFEE', 'GRAY', 'YELLOW', 'BLACK', 'WHITE'],
    trim: true
  },

  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },

  tcReport: {
    type: String,
    trim: true
  },

  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true
  },

  heatNo: {
    type: String,
    trim: true
  },

  // Available diameters for this material
  availableDiameters: [{
    type: Number
  }]

}, {
  timestamps: true
});

// Material to Color mapping
incomingStockSchema.statics.getMaterialColorMap = function() {
  return {
    'SAE52100': { color: 'GREEN', diameters: [38] },
    'SAE8620': { color: 'ORANGE', diameters: [36, 40, 45, 50, 53, 56, 60] },
    '16MNCR5': { color: 'ORANGE', diameters: [36, 40, 45, 50, 53, 56, 60] },
    'EN352': { color: 'PURPLE', diameters: [36, 40, 45, 50, 53, 56, 60] },
    'EN353': { color: 'COFFEE', diameters: [38] },
    '20MNCR5': { color: 'GRAY', diameters: [36, 40, 45, 50, 53, 56, 60] },
    '27MNCR5': { color: 'YELLOW', diameters: [50, 56, 60] },
    'SAE1018': { color: 'BLACK', diameters: [36, 40, 45, 50, 53, 56, 60] },
    'EN8': { color: 'WHITE', diameters: [32, 36] }
  };
};

// Pre-save to set color code based on material
incomingStockSchema.pre('save', function(next) {
  const materialColorMap = this.constructor.getMaterialColorMap();
  const materialInfo = materialColorMap[this.material];
  
  if (materialInfo) {
    this.colorCode = materialInfo.color;
    this.availableDiameters = materialInfo.diameters;
  }
  
  next();
});

// Indexes
incomingStockSchema.index({ date: -1 });
incomingStockSchema.index({ material: 1 });
incomingStockSchema.index({ colorCode: 1 });
incomingStockSchema.index({ dia: 1 });

export default mongoose.model('IncomingStock', incomingStockSchema);
