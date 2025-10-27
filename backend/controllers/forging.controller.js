import Forging from '../models/Forging.js';
import Cutting from '../models/Cutting.js';

// @desc    Get all forging records
// @route   GET /api/forging
export const getAllForging = async (req, res) => {
  try {
    const forgings = await Forging.find()
      .populate({
        path: 'cuttingId',
        populate: { path: 'stockId' }
      })
      .sort({ date: -1 });

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
      .populate({
        path: 'cuttingId',
        populate: { path: 'stockId' }
      });

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
    const { cuttingId } = req.body;

    // Verify cutting exists
    const cutting = await Cutting.findById(cuttingId);
    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }

    // Auto-fill data from cutting
    req.body.partName = cutting.partName;
    req.body.dia = cutting.dia;
    req.body.finalCutWeight = cutting.calculations.finalCutWeight;
    req.body.totalPiecesFromCutting = cutting.calculations.totalPieces;

    // Create forging record
    const forging = await Forging.create(req.body);

    // Populate and return
    await forging.populate({
      path: 'cuttingId',
      populate: { path: 'stockId' }
    });

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
    const forging = await Forging.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'cuttingId',
      populate: { path: 'stockId' }
    });

    if (!forging) {
      return res.status(404).json({
        success: false,
        message: 'Forging record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Forging record updated successfully',
      data: forging
    });
  } catch (error) {
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
    .populate({
      path: 'cuttingId',
      populate: { path: 'stockId' }
    })
    .sort({ date: -1 });

    // Calculate month totals
    const totalOkPieces = forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0);
    const totalScrap = forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0);
    const totalRejection = forgings.reduce((sum, f) => sum + (f.forgingResults?.rejectionPieces || 0), 0);
    const totalBabari = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalBabari || 0), 0);

    res.status(200).json({
      success: true,
      month: `${year}-${String(month).padStart(2, '0')}`,
      count: forgings.length,
      summary: {
        totalOkPieces,
        totalScrap,
        totalRejection,
        totalBabari: parseFloat(totalBabari.toFixed(3)),
        avgEfficiency: forgings.length > 0 
          ? parseFloat((forgings.reduce((sum, f) => sum + f.forgingResults.efficiency, 0) / forgings.length).toFixed(2))
          : 0
      },
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
          totalOkPieces: { $sum: '$forgingResults.finalOkPieces' },
          totalScrap: { $sum: '$forgingResults.scrapPieces' },
          totalRejection: { $sum: '$forgingResults.rejectionPieces' },
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
          totalOkPieces: 1,
          totalScrap: 1,
          totalRejection: 1,
          totalBabari: { $round: ['$totalBabari', 3] },
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
