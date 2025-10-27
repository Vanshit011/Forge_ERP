import Cutting from '../models/Cutting.js';
import IncomingStock from '../models/IncomingStock.js';

// @desc    Get all cutting records
// @route   GET /api/cutting
export const getAllCutting = async (req, res) => {
  try {
    const cuttings = await Cutting.find()
      .populate('stockId')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: cuttings.length,
      data: cuttings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cutting records',
      error: error.message
    });
  }
};

// @desc    Get single cutting record
// @route   GET /api/cutting/:id
export const getCuttingById = async (req, res) => {
  try {
    const cutting = await Cutting.findById(req.params.id).populate('stockId');

    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cutting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cutting record',
      error: error.message
    });
  }
};

// @desc    Calculate cutting values
// @route   POST /api/cutting/calculate
export const calculateCutting = async (req, res) => {
  try {
    const {
      cuttingType,
      dia,
      cuttingWeightMin,
      cuttingWeightMax,
      weightVariance,
      endPieceWeight,
      totalStockWeightUsed
    } = req.body;

    // 1. Average cutting weight
    const avgCuttingWeight = (parseFloat(cuttingWeightMin) + parseFloat(cuttingWeightMax)) / 2;

    // 2. Calculate blend weight (BHUKI - only for CIRCULAR)
    let blendWeight = 0;
    if (cuttingType === 'CIRCULAR') {
      blendWeight = parseFloat(dia) * parseFloat(dia) * 2 * 0.00000618;
    }

    // 3. Final cut weight per piece
    const finalCutWeight = avgCuttingWeight 
      + parseFloat(weightVariance) 
      + parseFloat(endPieceWeight) 
      + blendWeight;

    // 4. Total number of pieces
    const totalPieces = Math.floor(parseFloat(totalStockWeightUsed) / finalCutWeight);

    // 5. Total bhuki (only for CIRCULAR)
    const totalBhuki = cuttingType === 'CIRCULAR' ? totalPieces * blendWeight : 0;

    // 6. Weight used for cutting
    const weightUsedForCutting = totalPieces * finalCutWeight;

    // 7. ACTUAL waste (leftover material only)
    const totalWaste = parseFloat(totalStockWeightUsed) - weightUsedForCutting;

    res.status(200).json({
      success: true,
      data: {
        avgCuttingWeight: parseFloat(avgCuttingWeight.toFixed(6)),
        blendWeight: parseFloat(blendWeight.toFixed(6)),
        finalCutWeight: parseFloat(finalCutWeight.toFixed(6)),
        totalPieces,
        totalBhuki: parseFloat(totalBhuki.toFixed(6)),
        weightUsedForCutting: parseFloat(weightUsedForCutting.toFixed(3)),
        totalWaste: parseFloat(totalWaste.toFixed(6)),
        breakdown: {
          totalStockUsed: parseFloat(totalStockWeightUsed),
          usedForCutting: parseFloat(weightUsedForCutting.toFixed(3)),
          waste: parseFloat(totalWaste.toFixed(6)),
          bhuki: parseFloat(totalBhuki.toFixed(6))
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error calculating cutting values',
      error: error.message
    });
  }
};

// @desc    Create new cutting record
// @route   POST /api/cutting
export const createCutting = async (req, res) => {
  try {
    const { stockId, totalStockWeightUsed } = req.body;

    // Verify stock exists
    const stock = await IncomingStock.findById(stockId);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    // Check if enough stock is available
    if (parseFloat(totalStockWeightUsed) > stock.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${stock.quantity} kg available`
      });
    }

    // Auto-fill material and colorCode from stock
    req.body.material = stock.material;
    req.body.colorCode = stock.colorCode;

    // Create cutting record (calculations happen in pre-save hook)
    const cutting = await Cutting.create(req.body);

    // Update stock quantity
    stock.quantity -= parseFloat(totalStockWeightUsed);
    await stock.save();

    // Populate and return
    await cutting.populate('stockId');

    res.status(201).json({
      success: true,
      message: 'Cutting record created successfully',
      data: cutting
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error creating cutting record',
      error: error.message
    });
  }
};

// @desc    Update cutting record
// @route   PUT /api/cutting/:id
export const updateCutting = async (req, res) => {
  try {
    const cutting = await Cutting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('stockId');

    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cutting record updated successfully',
      data: cutting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating cutting record',
      error: error.message
    });
  }
};

// @desc    Delete cutting record
// @route   DELETE /api/cutting/:id
export const deleteCutting = async (req, res) => {
  try {
    const cutting = await Cutting.findByIdAndDelete(req.params.id);

    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cutting record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting cutting record',
      error: error.message
    });
  }
};

// @desc    Get cutting records by type
// @route   GET /api/cutting/type/:type
export const getCuttingByType = async (req, res) => {
  try {
    const cuttingType = req.params.type.toUpperCase();

    if (!['SHARING', 'CIRCULAR'].includes(cuttingType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cutting type. Use SHARING or CIRCULAR'
      });
    }

    const cuttings = await Cutting.find({ cuttingType })
      .populate('stockId')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: cuttings.length,
      data: cuttings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cutting records',
      error: error.message
    });
  }
};

// Add these new controller functions

// @desc    Get cutting records by month
// @route   GET /api/cutting/month/:year/:month
export const getCuttingByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const cuttings = await Cutting.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('stockId')
    .sort({ date: -1 });

    // Calculate month totals
    const totalPieces = cuttings.reduce((sum, c) => sum + (c.calculations?.totalPieces || 0), 0);
    const totalWaste = cuttings.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
    const totalBhuki = cuttings.reduce((sum, c) => sum + (c.calculations?.totalBhuki || 0), 0);

    res.status(200).json({
      success: true,
      month: `${year}-${String(month).padStart(2, '0')}`,
      count: cuttings.length,
      summary: {
        totalPieces,
        totalWaste: parseFloat(totalWaste.toFixed(3)),
        totalBhuki: parseFloat(totalBhuki.toFixed(3)),
        sharingOperations: cuttings.filter(c => c.cuttingType === 'SHARING').length,
        circularOperations: cuttings.filter(c => c.cuttingType === 'CIRCULAR').length
      },
      data: cuttings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly cutting records',
      error: error.message
    });
  }
};

// @desc    Get cutting statistics by month
// @route   GET /api/cutting/stats/monthly
export const getMonthlyCuttingStats = async (req, res) => {
  try {
    const stats = await Cutting.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$cuttingType'
          },
          totalOperations: { $sum: 1 },
          totalPieces: { $sum: '$calculations.totalPieces' },
          totalWaste: { $sum: '$calculations.totalWaste' },
          totalBhuki: { $sum: '$calculations.totalBhuki' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          operations: {
            $push: {
              type: '$_id.type',
              count: '$totalOperations',
              pieces: '$totalPieces',
              waste: '$totalWaste',
              bhuki: '$totalBhuki'
            }
          },
          totalOperations: { $sum: '$totalOperations' },
          totalPieces: { $sum: '$totalPieces' },
          totalWaste: { $sum: '$totalWaste' },
          totalBhuki: { $sum: '$totalBhuki' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $arrayElemAt: [
              ['', 'January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December'],
              '$_id.month'
            ]
          },
          totalOperations: 1,
          totalPieces: 1,
          totalWaste: { $round: ['$totalWaste', 3] },
          totalBhuki: { $round: ['$totalBhuki', 3] },
          operations: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly cutting statistics',
      error: error.message
    });
  }
};
