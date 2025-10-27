import IncomingStock from '../models/IncomingStock.js';

// @desc    Get all incoming stock
// @route   GET /api/incoming-stock
export const getAllStock = async (req, res) => {
  try {
    const stocks = await IncomingStock.find().sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stocks',
      error: error.message
    });
  }
};

// @desc    Get single stock by ID
// @route   GET /api/incoming-stock/:id
export const getStockById = async (req, res) => {
  try {
    const stock = await IncomingStock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: stock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock',
      error: error.message
    });
  }
};

// @desc    Create new incoming stock
// @route   POST /api/incoming-stock
export const createStock = async (req, res) => {
  try {
    const stock = await IncomingStock.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: stock
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate heat number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Heat number already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error creating stock',
      error: error.message
    });
  }
};

// @desc    Update stock
// @route   PUT /api/incoming-stock/:id
export const updateStock = async (req, res) => {
  try {
    const stock = await IncomingStock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: stock
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
      message: 'Error updating stock',
      error: error.message
    });
  }
};

// @desc    Delete stock
// @route   DELETE /api/incoming-stock/:id
export const deleteStock = async (req, res) => {
  try {
    const stock = await IncomingStock.findByIdAndDelete(req.params.id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Stock deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting stock',
      error: error.message
    });
  }
};

// @desc    Search stock
// @route   GET /api/incoming-stock/search?partyName=xyz&material=SAE-1018
export const searchStock = async (req, res) => {
  try {
    const { partyName, material, heatNo, partName } = req.query;
    const query = {};

    if (partyName) {
      query.partyName = new RegExp(partyName, 'i');
    }
    if (material) {
      query.material = material.toUpperCase();
    }
    if (heatNo) {
      query.heatNo = heatNo.toUpperCase();
    }
    if (partName) {
      query.partName = new RegExp(partName, 'i');
    }

    const stocks = await IncomingStock.find(query).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching stock',
      error: error.message
    });
  }
};

// Add this new controller function

// @desc    Get stock by month
// @route   GET /api/incoming-stock/month/:year/:month
export const getStockByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stocks = await IncomingStock.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    // Calculate month totals
    const totalQuantity = stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    const totalItems = stocks.length;

    res.status(200).json({
      success: true,
      month: `${year}-${String(month).padStart(2, '0')}`,
      count: totalItems,
      totalQuantity: totalQuantity,
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly stock',
      error: error.message
    });
  }
};

// @desc    Get stock statistics by month
// @route   GET /api/incoming-stock/stats/monthly
export const getMonthlyStats = async (req, res) => {
  try {
    const stats = await IncomingStock.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          materials: { $addToSet: '$material' }
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
          totalItems: 1,
          totalQuantity: { $round: ['$totalQuantity', 2] },
          uniqueMaterials: { $size: '$materials' }
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
      message: 'Error fetching monthly statistics',
      error: error.message
    });
  }
};
