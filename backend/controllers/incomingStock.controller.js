import IncomingStock from '../models/IncomingStock.js';

// Get material color and diameter mapping
const getMaterialInfo = () => {
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

// @desc    Get all incoming stock
// @route   GET /api/incoming-stock
export const getAllStock = async (req, res) => {
  try {
    const stocks = await IncomingStock.find()
      // Sort by Date Descending (-1), then by CreatedAt Descending (-1)
      .sort({ date: -1, createdAt: -1 });

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

// @desc    Get single stock
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

// @desc    Create new stock
// @route   POST /api/incoming-stock
export const createStock = async (req, res) => {
  try {
    const materialInfo = getMaterialInfo();
    const { material, dia } = req.body;

    // Validate material
    if (!materialInfo[material]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid material type'
      });
    }

    // Validate diameter for the material
    const validDiameters = materialInfo[material].diameters;
    if (!validDiameters.includes(parseFloat(dia))) {
      return res.status(400).json({
        success: false,
        message: `Invalid diameter for ${material}. Valid diameters: ${validDiameters.join(', ')}`
      });
    }

    // Auto-set color code based on material
    req.body.colorCode = materialInfo[material].color;
    req.body.availableDiameters = validDiameters;

    const stock = await IncomingStock.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Stock created successfully',
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
      message: 'Error creating stock',
      error: error.message
    });
  }
};

// @desc    Update stock
// @route   PUT /api/incoming-stock/:id
export const updateStock = async (req, res) => {
  try {
    const materialInfo = getMaterialInfo();
    const { material, dia } = req.body;

    // If material is being updated, validate and update color
    if (material) {
      if (!materialInfo[material]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid material type'
        });
      }

      // Validate diameter
      const validDiameters = materialInfo[material].diameters;
      if (dia && !validDiameters.includes(parseFloat(dia))) {
        return res.status(400).json({
          success: false,
          message: `Invalid diameter for ${material}. Valid diameters: ${validDiameters.join(', ')}`
        });
      }

      req.body.colorCode = materialInfo[material].color;
      req.body.availableDiameters = validDiameters;
    }

    const stock = await IncomingStock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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

// @desc    Get stock by month
// @route   GET /api/incoming-stock/month/:year/:month
export const getStockByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stocks = await IncomingStock.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    // Calculate totals
    const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0);
    const uniqueMaterials = [...new Set(stocks.map(s => s.material))].length;
    const uniqueParties = [...new Set(stocks.map(s => s.partyName))].length;

    res.status(200).json({
      success: true,
      month: `${year}-${String(month).padStart(2, '0')}`,
      count: stocks.length,
      summary: {
        totalQuantity: parseFloat(totalQuantity.toFixed(3)),
        uniqueMaterials,
        uniqueParties
      },
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly stocks',
      error: error.message
    });
  }
};

// @desc    Get stock statistics by month
// @route   GET /api/incoming-stock/stats/monthly
export const getMonthlyStockStats = async (req, res) => {
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
          uniqueMaterials: { $addToSet: '$material' },
          uniqueParties: { $addToSet: '$partyName' }
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
          totalQuantity: { $round: ['$totalQuantity', 3] },
          uniqueMaterials: { $size: '$uniqueMaterials' },
          uniqueParties: { $size: '$uniqueParties' }
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
      message: 'Error fetching monthly stock statistics',
      error: error.message
    });
  }
};

// @desc    Get available materials and their info
// @route   GET /api/incoming-stock/materials
export const getMaterialsInfo = async (req, res) => {
  try {
    const materialInfo = getMaterialInfo();

    const formattedInfo = Object.entries(materialInfo).map(([material, info]) => ({
      material,
      color: info.color,
      diameters: info.diameters,
      colorHex: getColorHex(info.color)
    }));

    res.status(200).json({
      success: true,
      data: formattedInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching materials info',
      error: error.message
    });
  }
};

// @desc    Get stocks by material
// @route   GET /api/incoming-stock/material/:material
export const getStockByMaterial = async (req, res) => {
  try {
    const { material } = req.params;

    const stocks = await IncomingStock.find({
      material: material.toUpperCase()
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stocks by material',
      error: error.message
    });
  }
};

// @desc    Get stocks by color code
// @route   GET /api/incoming-stock/color/:color
export const getStockByColor = async (req, res) => {
  try {
    const { color } = req.params;

    const stocks = await IncomingStock.find({
      colorCode: color.toUpperCase()
    }).sort({ date: -1 });

    // Group by diameter
    const stocksByDia = stocks.reduce((acc, stock) => {
      if (!acc[stock.dia]) {
        acc[stock.dia] = [];
      }
      acc[stock.dia].push(stock);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: stocks.length,
      color: color.toUpperCase(),
      stocksByDiameter: stocksByDia,
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stocks by color',
      error: error.message
    });
  }
};

// Helper function to get hex color codes
const getColorHex = (color) => {
  const colorMap = {
    'GREEN': '#10b981',
    'ORANGE': '#f97316',
    'PURPLE': '#a855f7',
    'COFFEE': '#92400e',
    'GRAY': '#6b7280',
    'YELLOW': '#eab308',
    'BLACK': '#1f2937',
    'WHITE': '#f9fafb'
  };
  return colorMap[color] || '#6b7280';
};

// @desc    Get stock summary
// @route   GET /api/incoming-stock/summary
export const getStockSummary = async (req, res) => {
  try {
    const summary = await IncomingStock.aggregate([
      {
        $group: {
          _id: {
            material: '$material',
            colorCode: '$colorCode',
            dia: '$dia'
          },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
          avgQuantity: { $avg: '$quantity' }
        }
      },
      {
        $sort: { '_id.material': 1, '_id.dia': 1 }
      },
      {
        $project: {
          _id: 0,
          material: '$_id.material',
          colorCode: '$_id.colorCode',
          dia: '$_id.dia',
          totalQuantity: { $round: ['$totalQuantity', 3] },
          count: 1,
          avgQuantity: { $round: ['$avgQuantity', 3] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock summary',
      error: error.message
    });
  }
};

export default {
  getAllStock,
  getStockById,
  createStock,
  updateStock,
  deleteStock,
  getStockByMonth,
  getMonthlyStockStats,
  getMaterialsInfo,
  getStockByMaterial,
  getStockByColor,
  getStockSummary
};
