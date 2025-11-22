import mongoose from 'mongoose';
import Forging from '../models/Forging.js';
import Cutting from '../models/Cutting.js';

// @desc    Get all forging records
// @route   GET /api/forging
export const getAllForging = async (req, res) => {
  try {
    const forgings = await Forging.find()
      .populate('cuttingId', 'partName dia material colorCode cuttingType')
      // Sort by Date Descending (-1), then by CreatedAt Descending (-1)
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: forgings.length,
      data: forgings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forging records',
      error: error.message
    });
  }
};

// @desc    Get single forging record
// @route   GET /api/forging/:id
export const getForgingById = async (req, res) => {
  try {
    const forging = await Forging.findById(req.params.id)
      .populate('cuttingId', 'partName dia material colorCode');

    if (!forging) {
      return res.status(404).json({
        success: false,
        message: 'Forging record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: forging
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forging record',
      error: error.message
    });
  }
};

// @desc    Create new forging record
// @route   POST /api/forging
export const createForging = async (req, res) => {
  try {
    const {
      cuttingId,
      date,
      size,
      forgingQty,
      forgingRingWeight,
      rejectionQty,
      forgingResults,
      remarks
    } = req.body;

    // Validate cutting record exists
    const cuttingRecord = await Cutting.findById(cuttingId);
    if (!cuttingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }

    // Check if enough pieces available from cutting
    const totalPiecesFromCutting = cuttingRecord.calculations?.totalPieces || 0;

    // Get already forged pieces from this cutting record
    const existingForgings = await Forging.find({ cuttingId });
    const alreadyForged = existingForgings.reduce((sum, f) => sum + f.forgingQty, 0);
    const availablePieces = totalPiecesFromCutting - alreadyForged;

    if (forgingQty > availablePieces) {
      return res.status(400).json({
        success: false,
        message: `Insufficient pieces. Available: ${availablePieces} pieces`
      });
    }

    // Create forging record
    const forging = new Forging({
      cuttingId,
      date,
      material: cuttingRecord.material,
      colorCode: cuttingRecord.colorCode,
      dia: cuttingRecord.dia,
      partName: cuttingRecord.partName,
      size,
      totalPiecesFromCutting,
      forgingQty,
      forgingRingWeight,
      rejectionQty,
      forgingResults: {
        babariPerPiece: forgingResults?.babariPerPiece || 0,
        scrapPieces: forgingResults?.scrapPieces || 0,
        finalOkPieces: forgingResults?.finalOkPieces || 0
      },
      remarks: remarks || '' // Add remarks (optional)
    });

    await forging.save();

    // Populate and return
    await forging.populate('cuttingId', 'partName dia material colorCode');

    res.status(201).json({
      success: true,
      message: 'Forging record created successfully',
      data: forging
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
      message: 'Error creating forging record',
      error: error.message
    });
  }
};

// @desc    Update forging record
// @route   PUT /api/forging/:id
export const updateForging = async (req, res) => {
  try {
    const forging = await Forging.findById(req.params.id);

    if (!forging) {
      return res.status(404).json({
        success: false,
        message: 'Forging record not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'forgingResults') {
          // Handle nested forgingResults object
          Object.keys(req.body.forgingResults).forEach(subKey => {
            if (req.body.forgingResults[subKey] !== undefined) {
              forging.forgingResults[subKey] = req.body.forgingResults[subKey];
            }
          });
        } else {
          forging[key] = req.body[key];
        }
      }
    });

    await forging.save();

    await forging.populate('cuttingId', 'partName dia material colorCode');

    res.status(200).json({
      success: true,
      message: 'Forging record updated successfully',
      data: forging
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
      message: 'Error updating forging record',
      error: error.message
    });
  }
};

// @desc    Delete forging record
// @route   DELETE /api/forging/:id
export const deleteForging = async (req, res) => {
  try {
    const forging = await Forging.findByIdAndDelete(req.params.id);

    if (!forging) {
      return res.status(404).json({
        success: false,
        message: 'Forging record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Forging record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting forging record',
      error: error.message
    });
  }
};

// @desc    Get forging stock summary (material-wise)
// @route   GET /api/forging/stock/summary
export const getForgingStock = async (req, res) => {
  try {
    const forgingStock = await Forging.aggregate([
      {
        $group: {
          _id: {
            material: '$material',
            dia: '$dia',
            colorCode: '$colorCode'
          },
          totalFinalOkPieces: { $sum: '$forgingResults.finalOkPieces' },
          totalRingWeight: { $sum: '$forgingResults.totalRingWeight' },
          totalRejections: { $sum: '$rejectionQty' },
          totalScrap: { $sum: '$forgingResults.scrapPieces' },
          totalBabari: { $sum: '$forgingResults.totalBabari' },
          avgEfficiency: { $avg: '$forgingResults.efficiency' },
          operations: { $sum: 1 }
        }
      },
      {
        $project: {
          material: '$_id.material',
          dia: '$_id.dia',
          colorCode: '$_id.colorCode',
          totalFinalOkPieces: 1,
          totalRingWeight: { $round: ['$totalRingWeight', 2] },
          totalRejections: 1,
          totalScrap: 1,
          totalBabari: { $round: ['$totalBabari', 2] },
          avgEfficiency: { $round: ['$avgEfficiency', 2] },
          operations: 1,
          _id: 0
        }
      },
      {
        $sort: { material: 1, dia: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: forgingStock.length,
      data: forgingStock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forging stock',
      error: error.message
    });
  }
};

// @desc    Get available cutting records (with remaining pieces)
// @route   GET /api/forging/available/cutting-records
export const getAvailableCuttingRecords = async (req, res) => {
  try {
    const cuttingRecords = await Cutting.find().sort({ date: -1 });

    const availableRecords = await Promise.all(
      cuttingRecords.map(async (cutting) => {
        const totalPieces = cutting.calculations?.totalPieces || 0;

        // Get forged pieces
        const forgings = await Forging.find({ cuttingId: cutting._id });
        const forgedPieces = forgings.reduce((sum, f) => sum + f.forgingQty, 0);

        const availablePieces = totalPieces - forgedPieces;

        return {
          _id: cutting._id,
          date: cutting.date,
          material: cutting.material,
          colorCode: cutting.colorCode,
          dia: cutting.dia,
          partName: cutting.partName,
          cuttingType: cutting.cuttingType,
          totalPieces,
          forgedPieces,
          availablePieces,
          cuttingWeightPerPiece: cutting.totalCutWeight || 0,
          remarks: cutting.remarks || '' // Include cutting remarks
        };
      })
    );

    // Filter only records with available pieces
    const filtered = availableRecords.filter(r => r.availablePieces > 0);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available cutting records',
      error: error.message
    });
  }
};

// @desc    Get forging records by month
// @route   GET /api/forging/month/:year/:month
export const getForgingByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const forgings = await Forging.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('cuttingId', 'partName dia material colorCode')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: forgings.length,
      data: forgings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly forging records',
      error: error.message
    });
  }
};

// @desc    Get forging statistics by month
// @route   GET /api/forging/stats/monthly
export const getMonthlyForgingStats = async (req, res) => {
  try {
    const stats = await Forging.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalOperations: { $sum: 1 },
          totalForgingQty: { $sum: '$forgingQty' },
          totalFinalOkPieces: { $sum: '$forgingResults.finalOkPieces' },
          totalRingWeight: { $sum: '$forgingResults.totalRingWeight' },
          totalRejections: { $sum: '$rejectionQty' },
          totalScrap: { $sum: '$forgingResults.scrapPieces' },
          totalBabari: { $sum: '$forgingResults.totalBabari' },
          avgEfficiency: { $avg: '$forgingResults.efficiency' }
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
          totalForgingQty: 1,
          totalFinalOkPieces: 1,
          totalRingWeight: { $round: ['$totalRingWeight', 2] },
          totalRejections: 1,
          totalScrap: 1,
          totalBabari: { $round: ['$totalBabari', 2] },
          avgEfficiency: { $round: ['$avgEfficiency', 2] }
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
      message: 'Error fetching monthly forging statistics',
      error: error.message
    });
  }
};


export default {
  getAllForging,
  getForgingById,
  createForging,
  updateForging,
  deleteForging,
  getForgingStock,
  getAvailableCuttingRecords,
  getForgingByMonth,
  getMonthlyForgingStats
};
