import mongoose from 'mongoose';
import Cutting from '../models/Cutting.js';
import IncomingStock from '../models/IncomingStock.js';

// @desc    Calculate cutting before saving
// @route   POST /api/cutting/calculate
export const calculateCutting = async (req, res) => {
  try {
    const {
      cuttingType,
      targetPieces,
      cuttingWeightMin,
      cuttingWeightMax,
      totalCutWeight,
      endPieceWeight,
      bhukiWeight
    } = req.body;

    const avgCutWeight = (cuttingWeightMin + cuttingWeightMax) / 2;

    // Steel used for cutting pieces
    const steelUsedForPieces = Number((targetPieces * avgCutWeight).toFixed(3));

    // End piece used
    const endPieceUsed = Number((targetPieces * endPieceWeight).toFixed(3));

    // Scrap/Bhuki used (only for CIRCULAR)
    let scrapUsed = 0;
    let totalBhuki = 0;
    if (cuttingType === 'CIRCULAR') {
      scrapUsed = Number((targetPieces * bhukiWeight).toFixed(3));
      totalBhuki = scrapUsed;
    }

    // Total steel used
    const totalSteelUsed = Number((steelUsedForPieces + endPieceUsed + scrapUsed).toFixed(3));

    // Total waste
    const totalWaste = Number((endPieceUsed + scrapUsed).toFixed(3));

    res.status(200).json({
      success: true,
      data: {
        targetPieces,
        steelUsedForPieces,
        endPieceUsed,
        scrapUsed,
        totalSteelUsed,
        totalPieces: targetPieces,
        totalWaste,
        totalBhuki,
        avgCutWeight: Number(avgCutWeight.toFixed(3))
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error calculating cutting',
      error: error.message
    });
  }
};

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

// @desc    Get cutting by type
// @route   GET /api/cutting/type/:type
export const getCuttingByType = async (req, res) => {
  try {
    const { type } = req.params;
    const cuttings = await Cutting.find({ cuttingType: type.toUpperCase() })
      .populate('stockId')
      // Sort by Date Descending (-1), then by CreatedAt Descending (-1)
      .sort({ date: -1, createdAt: -1 });

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

// @desc    Create new cutting record
// @route   POST /api/cutting
export const createCutting = async (req, res) => {
  try {
    const {
      stockId,
      targetPieces,
      cuttingType,
      cuttingWeightMin,
      cuttingWeightMax,
      endPieceWeight,
      bhukiWeight,
      remarks
    } = req.body;

    // 1. Verify Stock
    const stock = await IncomingStock.findById(stockId);
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });

    // 2. STRICT CALCULATIONS (The Fix)

    // Step A: Calculate Net Weight (Average of Min/Max) -> 0.500
    const netAvgWeight = (Number(cuttingWeightMin) + Number(cuttingWeightMax)) / 2;

    // Step B: Calculate Waste per piece -> 0.010
    let wastePerPiece = Number(endPieceWeight);
    if (cuttingType === 'CIRCULAR') {
      wastePerPiece += Number(bhukiWeight);
    }

    // Step C: Calculate Final Gross Weight (Net + Waste) -> 0.510
    const finalGrossWeight = netAvgWeight + wastePerPiece;

    // Step D: Calculate Total Steel -> 2000 * 0.510 = 1020
    const totalSteelUsed = Number((targetPieces * finalGrossWeight).toFixed(3));

    // 3. Verify Stock Availability
    if (stock.quantity < totalSteelUsed) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${stock.quantity} kg, Required: ${totalSteelUsed} kg`
      });
    }

    // 4. Prepare Data for Model
    // We manually calculate the breakdown so the Model doesn't have to guess
    const steelUsedForPieces = Number((targetPieces * netAvgWeight).toFixed(3)); // 1000 kg
    const endPieceUsed = Number((targetPieces * endPieceWeight).toFixed(3));     // 20 kg
    const scrapUsed = cuttingType === 'CIRCULAR' ? Number((targetPieces * bhukiWeight).toFixed(3)) : 0;
    const totalWaste = Number((endPieceUsed + scrapUsed).toFixed(3));            // 20 kg

    const cutting = await Cutting.create({
      ...req.body,
      material: stock.material,
      colorCode: stock.colorCode,

      // CRITICAL FIX: We save the NET weight (0.50) as avgCutWeight
      // And we save 0.510 as totalCutWeight if you want to see the Gross value
      avgCutWeight: Number(netAvgWeight.toFixed(3)),
      totalCutWeight: Number(finalGrossWeight.toFixed(3)), // 0.510

      // Pass explicit calculations to override any Schema defaults
      calculations: {
        steelUsedForPieces, // 1000
        endPieceUsed,       // 20
        scrapUsed,
        totalBhuki: scrapUsed,
        totalWaste,         // 20
        totalSteelUsed,     // 1020
        totalPieces: targetPieces
      },
      remarks
    });

    // 5. Update Stock
    stock.quantity = Number((stock.quantity - totalSteelUsed).toFixed(3));
    await stock.save();

    await cutting.populate('stockId');

    res.status(201).json({
      success: true,
      message: 'Cutting record created successfully',
      data: cutting
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get cutting by month
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

    res.status(200).json({
      success: true,
      count: cuttings.length,
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
            month: { $month: '$date' }
          },
          totalOperations: { $sum: 1 },
          totalPieces: { $sum: '$calculations.totalPieces' },
          totalSteelUsed: { $sum: '$calculations.totalSteelUsed' },
          totalWaste: { $sum: '$calculations.totalWaste' },
          totalBhuki: { $sum: '$calculations.totalBhuki' }
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
          totalSteelUsed: { $round: ['$totalSteelUsed', 3] },
          totalWaste: { $round: ['$totalWaste', 3] },
          totalBhuki: { $round: ['$totalBhuki', 3] }
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

// @desc    Delete cutting record
// @route   DELETE /api/cutting/:id
export const deleteCutting = async (req, res) => {
  try {
    const cutting = await Cutting.findById(req.params.id);

    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }

    // Return steel to stock
    const stock = await IncomingStock.findById(cutting.stockId);
    if (stock) {
      stock.quantity = Number((stock.quantity + cutting.calculations.totalSteelUsed).toFixed(3));
      await stock.save();
    }

    await cutting.deleteOne();

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


export default {
  calculateCutting,
  getAllCutting,
  getCuttingByType,
  createCutting,
  getCuttingByMonth,
  getMonthlyCuttingStats,
  deleteCutting
};
