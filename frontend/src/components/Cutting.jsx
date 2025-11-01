import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Cutting.css';

const API_URL = 'http://localhost:5000/api';

function Cutting() {
  const [activeTab, setActiveTab] = useState('sharing');
  const [stocks, setStocks] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDiaBreakdown, setShowDiaBreakdown] = useState(false);
  const [selectedMaterialForBreakdown, setSelectedMaterialForBreakdown] = useState(null);
  const [editingCutting, setEditingCutting] = useState(null);

  const [formData, setFormData] = useState({
    stockId: '',
    cuttingType: 'SHARING',
    date: new Date().toISOString().split('T')[0],
    partName: '',
    dia: '',
    material: '',
    colorCode: '',
    targetPieces: '2000',
    cuttingWeightMin: '0.495',
    cuttingWeightMax: '0.505',
    totalCutWeight: '0.520',
    endPieceWeight: '0.010',
    bhukiWeight: '0.010'
  });

  useEffect(() => {
    fetchStocks();
    fetchCuttings();
  }, [activeTab]);

  useEffect(() => {
    const handleTriggerAdd = () => {
      setShowForm(true);
    };

    window.addEventListener('triggerAddNew', handleTriggerAdd);
    return () => window.removeEventListener('triggerAddNew', handleTriggerAdd);
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/incoming-stock`);
      const availableStocks = (response.data.data || []).filter(s => s.quantity > 0);
      setStocks(availableStocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchCuttings = async () => {
    try {
      const response = await axios.get(`${API_URL}/cutting/type/${activeTab.toUpperCase()}`);
      setCuttings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching cuttings:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowForm(false);
    setCalculation(null);
    setEditingCutting(null);
    setFormData({
      ...formData,
      cuttingType: tab.toUpperCase()
    });
  };

  const handleStockSelect = (e) => {
    const stockId = e.target.value;
    const stock = stocks.find(s => s._id === stockId);

    if (stock) {
      setSelectedStock(stock);
      setFormData({
        ...formData,
        stockId: stockId,
        material: stock.material,
        colorCode: stock.colorCode,
        partName: stock.partName,
        dia: stock.dia
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/cutting/calculate`, {
        cuttingType: formData.cuttingType,
        targetPieces: parseInt(formData.targetPieces),
        cuttingWeightMin: parseFloat(formData.cuttingWeightMin),
        cuttingWeightMax: parseFloat(formData.cuttingWeightMax),
        totalCutWeight: parseFloat(formData.totalCutWeight),
        endPieceWeight: parseFloat(formData.endPieceWeight),
        bhukiWeight: parseFloat(formData.bhukiWeight)
      });

      setCalculation(response.data.data);
      setLoading(false);
    } catch (error) {
      alert('Error calculating: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.stockId) {
      alert('Please select incoming stock!');
      return;
    }

    if (!calculation && !editingCutting) {
      alert('Please calculate first!');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        stockId: formData.stockId,
        cuttingType: formData.cuttingType,
        date: formData.date,
        partName: formData.partName,
        dia: parseFloat(formData.dia),
        targetPieces: parseInt(formData.targetPieces),
        cuttingWeightMin: parseFloat(formData.cuttingWeightMin),
        cuttingWeightMax: parseFloat(formData.cuttingWeightMax),
        totalCutWeight: parseFloat(formData.totalCutWeight),
        endPieceWeight: parseFloat(formData.endPieceWeight)
      };

      if (formData.cuttingType === 'CIRCULAR') {
        payload.bhukiWeight = parseFloat(formData.bhukiWeight);
      }

      if (editingCutting) {
        await axios.put(`${API_URL}/cutting/${editingCutting._id}`, payload);
        alert('✅ Cutting record updated successfully!');
      } else {
        await axios.post(`${API_URL}/cutting`, payload);
        alert('✅ Cutting record created successfully!');
      }

      setShowForm(false);
      setCalculation(null);
      setEditingCutting(null);
      setSelectedStock(null);
      setFormData({
        stockId: '',
        cuttingType: activeTab.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        partName: '',
        dia: '',
        material: '',
        colorCode: '',
        targetPieces: '2000',
        cuttingWeightMin: '0.495',
        cuttingWeightMax: '0.505',
        totalCutWeight: '0.520',
        endPieceWeight: '0.010',
        bhukiWeight: '0.010'
      });
      fetchCuttings();
      fetchStocks();
      setLoading(false);
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.join('\n');
        alert('❌ Validation Errors:\n\n' + errorMessages);
      } else {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
      setLoading(false);
    }
  };

  const handleEditCutting = (cutting) => {
    setEditingCutting(cutting);
    setFormData({
      stockId: cutting.stockId,
      cuttingType: cutting.cuttingType,
      date: cutting.date,
      partName: cutting.partName,
      dia: cutting.dia.toString(),
      material: cutting.material,
      colorCode: cutting.colorCode,
      targetPieces: cutting.targetPieces.toString(),
      cuttingWeightMin: cutting.cuttingWeightMin.toString(),
      cuttingWeightMax: cutting.cuttingWeightMax.toString(),
      totalCutWeight: cutting.totalCutWeight.toString(),
      endPieceWeight: cutting.endPieceWeight.toString(),
      bhukiWeight: cutting.bhukiWeight?.toString() || '0.010'
    });

    const stock = stocks.find(s => s._id === cutting.stockId);
    setSelectedStock(stock || null);
    setShowForm(true);
    setCalculation(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCutting = async (cuttingId) => {
    if (window.confirm('Are you sure you want to delete this cutting record? The steel will be returned to stock.')) {
      try {
        await axios.delete(`${API_URL}/cutting/${cuttingId}`);
        alert('✅ Cutting record deleted successfully!');
        fetchCuttings();
        fetchStocks();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getTotalStats = () => {
    const totalPieces = cuttings.reduce((sum, c) => sum + (c.calculations?.totalPieces || 0), 0);
    const totalSteelUsed = cuttings.reduce((sum, c) => sum + (c.calculations?.totalSteelUsed || 0), 0);
    const totalEndPiece = cuttings.reduce((sum, c) => sum + (c.calculations?.endPieceUsed || 0), 0);
    const totalBhuki = cuttings.reduce((sum, c) => sum + (c.calculations?.totalBhuki || 0), 0);
    const totalWaste = cuttings.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
    return { totalPieces, totalSteelUsed, totalEndPiece, totalBhuki, totalWaste };
  };

  const getStockWiseCuttingBreakdown = () => {
    const cuttingBreakdown = cuttings.reduce((acc, cutting) => {
      const key = cutting.stockId;
      if (!acc[key]) {
        const stock = stocks.find(s => s._id === key);
        acc[key] = {
          stockId: key,
          material: cutting.material,
          colorCode: cutting.colorCode,
          dia: cutting.dia,
          totalCutWeight: cutting.totalCutWeight,
          totalPieces: 0,
          totalSteelUsed: 0,
          totalEndPiece: 0,
          totalWaste: 0,
          operations: 0,
          stockQuantity: stock?.quantity || 0,
          partName: stock?.partName || cutting.partName,
          totalCutWeightSum: 0
        };
      }
      acc[key].totalPieces += cutting.calculations?.totalPieces || 0;
      acc[key].totalSteelUsed += cutting.calculations?.totalSteelUsed || 0;
      acc[key].totalEndPiece += cutting.calculations?.endPieceUsed || 0;
      acc[key].totalWaste += cutting.calculations?.totalWaste || 0;
      acc[key].totalCutWeightSum += (cutting.totalCutWeight || 0);
      acc[key].operations += 1;
      return acc;
    }, {});

    stocks.forEach(stock => {
      const key = stock._id;
      if (!cuttingBreakdown[key]) {
        cuttingBreakdown[key] = {
          stockId: key,
          material: stock.material,
          colorCode: stock.colorCode,
          dia: stock.dia,
          totalCutWeight: 0,
          totalPieces: 0,
          totalSteelUsed: 0,
          totalEndPiece: 0,
          totalWaste: 0,
          operations: 0,
          stockQuantity: stock.quantity,
          partName: stock.partName,
          totalCutWeightSum: 0
        };
      }
    });

    return Object.values(cuttingBreakdown)
      .map(stock => ({
        ...stock,
        avgCutWeight: stock.operations > 0 ? (stock.totalCutWeightSum / stock.operations).toFixed(3) : 0
      }))
      .sort((a, b) => a.material.localeCompare(b.material));
  };

  const handleDeleteStock = async (stockId) => {
    if (window.confirm('Are you sure you want to delete all cutting operations for this stock? This will return the steel to inventory.')) {
      try {
        const stockCuttings = cuttings.filter(c => c.stockId === stockId);
        for (const cutting of stockCuttings) {
          await axios.delete(`${API_URL}/cutting/${cutting._id}`);
        }
        alert('✅ All cutting operations deleted successfully!');
        fetchCuttings();
        fetchStocks();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStockCuttingDetails = () => {
    if (!selectedMaterialForBreakdown) return [];

    return cuttings.filter(cutting => cutting.stockId === selectedMaterialForBreakdown.stockId)
      .map(cutting => ({
        partName: cutting.partName,
        targetPieces: cutting.targetPieces,
        totalPieces: cutting.calculations?.totalPieces || 0,
        totalSteelUsed: cutting.calculations?.totalSteelUsed || 0,
        endPieceUsed: cutting.calculations?.endPieceUsed || 0,
        totalWaste: cutting.calculations?.totalWaste || 0,
        totalBhuki: cutting.calculations?.totalBhuki || 0,
        date: cutting.date,
        cuttingType: cutting.cuttingType
      }));
  };

  const handleStockCardClick = (stock) => {
    setSelectedMaterialForBreakdown(stock);
    setShowDiaBreakdown(true);
  };

  const stats = getTotalStats();
  const stockWiseBreakdown = getStockWiseCuttingBreakdown();

  const getColorStyle = (colorCode) => {
    const colorMap = {
      'GREEN': '#10b981',
      'ORANGE': '#f97316',
      'PURPLE': '#a855f7',
      'COFFEE': '#92400e',
      'GRAY': '#6b7280',
      'YELLOW': '#eab308',
      'BLACK': '#1f2937',
      'WHITE': '#f3f4f6'
    };
    return colorMap[colorCode] || '#6b7280';
  };

  return (
    <div className="cutting-modern">
      {/* Stock Cutting Details Modal */}
      {showDiaBreakdown && selectedMaterialForBreakdown && (
        <div className="modal-overlay" onClick={() => setShowDiaBreakdown(false)}>
          <div className="diameter-breakdown-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span
                  className="material-dot-large"
                  style={{ backgroundColor: getColorStyle(selectedMaterialForBreakdown.colorCode) }}
                ></span>
                {selectedMaterialForBreakdown.material} - {selectedMaterialForBreakdown.dia}mm
              </h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowDiaBreakdown(false)}
              >
                ✖
              </button>
            </div>

            <div className="modal-body">
              {getStockCuttingDetails().length === 0 ? (
                <div className="empty-breakdown">
                  <p>No cutting operations for this stock</p>
                </div>
              ) : (
                <div className="breakdown-list">
                  {getStockCuttingDetails().map((item, idx) => (
                    <div key={idx} className="breakdown-item">
                      <div className="breakdown-item-header">
                        <div className="breakdown-info">
                          <span className="breakdown-icon">✂️</span>
                          <div>
                            <span className="breakdown-title">{item.partName}</span>
                            <span className="breakdown-subtitle">{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="breakdown-metrics">
                        <div className="metric-box">
                          <span className="metric-icon">🎯</span>
                          <div>
                            <p className="metric-label">Target</p>
                            <p className="metric-value">{item.targetPieces} pcs</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">🔢</span>
                          <div>
                            <p className="metric-label">Actual</p>
                            <p className="metric-value">{item.totalPieces} pcs</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">⚖️</span>
                          <div>
                            <p className="metric-label">Steel</p>
                            <p className="metric-value">{item.totalSteelUsed.toFixed(2)} kg</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">📏</span>
                          <div>
                            <p className="metric-label">End Piece</p>
                            <p className="metric-value">{item.endPieceUsed.toFixed(3)} kg</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">⚠️</span>
                          <div>
                            <p className="metric-label">Waste</p>
                            <p className="metric-value">{item.totalWaste.toFixed(3)} kg</p>
                          </div>
                        </div>
                        {item.totalBhuki > 0 && (
                          <div className="metric-box">
                            <span className="metric-icon">🔥</span>
                            <div>
                              <p className="metric-label">Bhuki</p>
                              <p className="metric-value">{item.totalBhuki.toFixed(3)} kg</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-footer">
                <div className="total-summary">
                  <span>Total Operations:</span>
                  <strong>{getStockCuttingDetails().length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="cutting-header">
        <div className="title-group">
          <h1>✂️ Cutting Operations</h1>
          <p className="subtitle">Manage sharing and circular cutting processes</p>
        </div>
        <button
          className={`add-btn ${showForm ? 'cancel' : ''}`}
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingCutting(null);
              setCalculation(null);
              setSelectedStock(null);
            } else {
              setShowForm(true);
              setEditingCutting(null);
            }
          }}
        >
          {showForm ? (
            <>
              <span>✖</span>
              <span>Cancel</span>
            </>
          ) : (
            <>
              <span>+</span>
              <span>New Cutting</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-modern">
        <button
          className={`tab-modern ${activeTab === 'sharing' ? 'active' : ''}`}
          onClick={() => handleTabChange('sharing')}
        >
          <span className="tab-icon">🔧</span>
          <div className="tab-content">
            <span className="tab-title">Sharing</span>
            <span className="tab-count">{cuttings.length} ops</span>
          </div>
        </button>
        <button
          className={`tab-modern ${activeTab === 'circular' ? 'active' : ''}`}
          onClick={() => handleTabChange('circular')}
        >
          <span className="tab-icon">⭕</span>
          <div className="tab-content">
            <span className="tab-title">Circular</span>
            <span className="tab-count">{cuttings.length} ops</span>
          </div>
        </button>
      </div>

      {/* Stock-wise Cutting Summary */}
      {stocks.length > 0 && (
        <div className="material-cutting-breakdown">
          <h2>📦 Stock-wise Cutting Summary</h2>
          <div className="material-cutting-grid">
            {getStockWiseCuttingBreakdown().map((stock) => (
              <div
                key={stock.stockId}
                className={`material-cutting-card ${stock.operations > 0 ? 'clickable' : 'disabled'}`}
                onClick={() => stock.operations > 0 && handleStockCardClick(stock)}
                style={{ cursor: stock.operations > 0 ? 'pointer' : 'default' }}
              >
                {/* Card Header with Delete Button */}
                <div className="card-top-actions">
                  <div
                    className="material-cutting-header"
                    style={{ borderColor: getColorStyle(stock.colorCode) }}
                  >
                    <span
                      className="material-dot-cutting"
                      style={{ backgroundColor: getColorStyle(stock.colorCode) }}
                    ></span>
                    <div className="material-header-info">
                      <h3>{stock.material}</h3>
                      <div className="stock-badge-group">
                        <span className="diameter-badge">{stock.dia} mm</span>
                        {stock.avgCutWeight > 0 && (
                          <span className="cutweight-badge">{stock.avgCutWeight} kg/pc</span>
                        )}
                        {stock.stockQuantity > 0 && (
                          <span className="available-badge">{stock.stockQuantity} kg</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {stock.operations > 0 && (
                    <button
                      className="delete-stock-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStock(stock.stockId);
                      }}
                      title="Delete all operations for this stock"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="material-cutting-stats">
                  <div className="cutting-stat-item">
                    <span className="stat-icon-small">🔢</span>
                    <div>
                      <p className="stat-value-small">{stock.totalPieces}</p>
                      <p className="stat-label-small">Pieces Cut</p>
                    </div>
                  </div>
                  <div className="cutting-stat-item">
                    <span className="stat-icon-small">⚖️</span>
                    <div>
                      <p className="stat-value-small">{stock.totalSteelUsed.toFixed(2)} kg</p>
                      <p className="stat-label-small">Steel Used</p>
                    </div>
                  </div>
                  <div className="cutting-stat-item">
                    <span className="stat-icon-small">⚠️</span>
                    <div>
                      <p className="stat-value-small">{stock.totalWaste.toFixed(2)} kg</p>
                      <p className="stat-label-small">Total Waste</p>
                    </div>
                  </div>
                </div>

                {stock.operations > 0 && (
                  <div className="card-hint">👆 Click to see details</div>
                )}
                {stock.operations === 0 && (
                  <div className="card-no-ops">No operations yet</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="cutting-stats">
        <div className="cutting-stat-card">
          <div className="stat-icon-modern">🔢</div>
          <div className="stat-info-modern">
            <h3>{stats.totalPieces}</h3>
            <p>Total Pieces</p>
          </div>
        </div>
        <div className="cutting-stat-card">
          <div className="stat-icon-modern">🏭</div>
          <div className="stat-info-modern">
            <h3>{stats.totalSteelUsed.toFixed(2)}</h3>
            <p>Steel Used (kg)</p>
          </div>
        </div>
        <div className="cutting-stat-card">
          <div className="stat-icon-modern">📏</div>
          <div className="stat-info-modern">
            <h3>{stats.totalEndPiece.toFixed(2)}</h3>
            <p>End Piece (kg)</p>
          </div>
        </div>
        {activeTab === 'circular' && (
          <div className="cutting-stat-card">
            <div className="stat-icon-modern">🔥</div>
            <div className="stat-info-modern">
              <h3>{stats.totalBhuki.toFixed(2)}</h3>
              <p>Bhuki (kg)</p>
            </div>
          </div>
        )}
        <div className="cutting-stat-card">
          <div className="stat-icon-modern">⚠️</div>
          <div className="stat-info-modern">
            <h3>{stats.totalWaste.toFixed(2)}</h3>
            <p>Total Waste (kg)</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-card-cutting">
          <div className="form-header-modern">
            <h2>✂️ {editingCutting ? 'Edit' : 'New'} {activeTab === 'sharing' ? 'Sharing' : 'Circular'} Operation</h2>
            <p className="form-subtitle">
              {editingCutting ? 'Update cutting parameters' : 'Select stock and specify cutting parameters'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Stock Selection */}
            <div className="stock-select-section">
              <label>Select Stock Material *</label>
              <select
                name="stockId"
                value={formData.stockId}
                onChange={handleStockSelect}
                required
                className="select-modern"
                disabled={editingCutting}
              >
                <option value="">-- Select Stock --</option>
                {stocks.map((stock) => (
                  <option key={stock._id} value={stock._id}>
                    {stock.material} ({stock.colorCode}) |
                    Dia: {stock.dia}mm |
                    Available: {stock.quantity.toFixed(2)} kg |
                    {stock.partName}
                  </option>
                ))}
              </select>

              {selectedStock && (
                <div className="selected-stock-card">
                  <h4>✅ Selected Stock</h4>
                  <div className="stock-info-grid">
                    <div className="info-item">
                      <span>Material:</span>
                      <strong>
                        <span
                          className="color-dot-inline"
                          style={{ backgroundColor: getColorStyle(selectedStock.colorCode) }}
                        ></span>
                        {selectedStock.material}
                      </strong>
                    </div>
                    <div className="info-item">
                      <span>Available:</span>
                      <strong className="text-green">{selectedStock.quantity.toFixed(2)} kg</strong>
                    </div>
                    <div className="info-item">
                      <span>Diameter:</span>
                      <strong>{selectedStock.dia} mm</strong>
                    </div>
                    <div className="info-item">
                      <span>Part:</span>
                      <strong>{selectedStock.partName}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="form-grid-cutting">
              <div className="input-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Part Name *</label>
                <input
                  type="text"
                  name="partName"
                  value={formData.partName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Target Pieces to Cut *</label>
                <input
                  type="number"
                  name="targetPieces"
                  value={formData.targetPieces}
                  onChange={handleInputChange}
                  placeholder="2000"
                  required
                  min="1"
                />
                <small className="help-text">How many pieces you want to cut</small>
              </div>

              <div className="input-group">
                <label>Cut Weight Min (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="cuttingWeightMin"
                  value={formData.cuttingWeightMin}
                  onChange={handleInputChange}
                  placeholder="0.495"
                  required
                />
              </div>

              <div className="input-group">
                <label>Cut Weight Max (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="cuttingWeightMax"
                  value={formData.cuttingWeightMax}
                  onChange={handleInputChange}
                  placeholder="0.505"
                  required
                />
              </div>

              <div className="input-group">
                <label>Total Cut Weight (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="totalCutWeight"
                  value={formData.totalCutWeight}
                  onChange={handleInputChange}
                  placeholder="0.520"
                  required
                />
                <small className="help-text">Weight per piece including losses</small>
              </div>

              <div className="input-group">
                <label>End Piece Weight (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="endPieceWeight"
                  value={formData.endPieceWeight}
                  onChange={handleInputChange}
                  placeholder="0.010"
                  required
                />
              </div>

              {activeTab === 'circular' && (
                <div className="input-group">
                  <label>Bhuki Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.001"
                    name="bhukiWeight"
                    value={formData.bhukiWeight}
                    onChange={handleInputChange}
                    placeholder="0.010"
                    required
                  />
                  <small className="help-text">Only for Circular cutting</small>
                </div>
              )}
            </div>

            {/* Calculate Button - Only show if not editing */}
            {!editingCutting && (
              <button
                type="button"
                className="calculate-btn"
                onClick={handleCalculate}
                disabled={!formData.stockId || !formData.targetPieces || loading}
              >
                {loading ? '⏳ Calculating...' : '🧮 Calculate Steel Required'}
              </button>
            )}

            {/* Results */}
            {calculation && (
              <div className="result-card">
                <h3>📊 Calculation Results</h3>
                <div className="calculation-breakdown">
                  <div className="calc-section">
                    <h4>Steel Usage Breakdown</h4>
                    <div className="calc-items">
                      <div className="calc-item">
                        <span className="calc-label">Target Pieces:</span>
                        <strong className="calc-value big">{calculation.targetPieces} pcs</strong>
                      </div>
                      <div className="calc-item">
                        <span className="calc-label">Cutting Weight Range:</span>
                        <strong className="calc-value">
                          {formData.cuttingWeightMin} - {formData.cuttingWeightMax} kg
                        </strong>
                      </div>
                      <div className="calc-item">
                        <span className="calc-label">Average Cut Weight:</span>
                        <strong className="calc-value">{calculation.avgCutWeight} kg/pc</strong>
                      </div>
                    </div>
                  </div>

                  <div className="calc-section">
                    <h4>Material Required</h4>
                    <div className="calc-items">
                      <div className="calc-item">
                        <span className="calc-label">Steel for Pieces:</span>
                        <strong className="calc-value highlight-blue">
                          {calculation.steelUsedForPieces} kg
                        </strong>
                      </div>
                      <div className="calc-item">
                        <span className="calc-label">End Piece Used:</span>
                        <strong className="calc-value highlight-orange">
                          {calculation.endPieceUsed} kg
                        </strong>
                      </div>
                      {activeTab === 'circular' && (
                        <div className="calc-item">
                          <span className="calc-label">Bhuki/Scrap:</span>
                          <strong className="calc-value highlight-red">
                            {calculation.scrapUsed} kg
                          </strong>
                        </div>
                      )}
                      <div className="calc-item total">
                        <span className="calc-label">Total Steel Required:</span>
                        <strong className="calc-value highlight-green">
                          {calculation.totalSteelUsed} kg
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="calc-section">
                    <h4>Waste Analysis</h4>
                    <div className="calc-items">
                      <div className="calc-item">
                        <span className="calc-label">Total Waste:</span>
                        <strong className="calc-value text-red">{calculation.totalWaste} kg</strong>
                      </div>
                      {activeTab === 'circular' && (
                        <div className="calc-item">
                          <span className="calc-label">Total Bhuki:</span>
                          <strong className="calc-value text-orange">{calculation.totalBhuki} kg</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedStock && calculation.totalSteelUsed > selectedStock.quantity && (
                    <div className="warning-box">
                      ⚠️ Insufficient stock! Required: {calculation.totalSteelUsed} kg,
                      Available: {selectedStock.quantity.toFixed(2)} kg
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="submit-btn-cutting"
              disabled={editingCutting ? loading : (!calculation || loading || (selectedStock && calculation && calculation.totalSteelUsed > selectedStock.quantity))}
            >
              <span>{editingCutting ? '✏️' : '✅'}</span>
              <span>{editingCutting ? 'Update Cutting Record' : 'Save Cutting Record'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Cutting Records */}
      <div className="records-section">
        <h2>📋 {activeTab === 'sharing' ? 'Sharing' : 'Circular'} Records</h2>
        <div className="cutting-cards-grid">
          {cuttings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✂️</div>
              <h3>No {activeTab} records found</h3>
              <p>Start by creating your first {activeTab} cutting operation</p>
            </div>
          ) : (
            cuttings.map((cutting) => (
              <div key={cutting._id} className="cutting-record-card">
                {/* Card Header with Actions */}
                <div className="cutting-card-header">
                  <div className="header-info">
                    <h3>{cutting.partName}</h3>
                    <span
                      className="type-badge"
                      style={{ backgroundColor: getColorStyle(cutting.colorCode) }}
                    >
                      {cutting.material}
                    </span>
                  </div>
                  <div className="card-actions">
                    <button
                      className="edit-btn-cutting"
                      onClick={() => handleEditCutting(cutting)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn-cutting"
                      onClick={() => handleDeleteCutting(cutting._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Stock & Diameter Info */}
                <div className="stock-info-badge">
                  <span className="badge-item">
                    <span className="badge-icon">📏</span>
                    <span className="badge-text">Dia: {cutting.dia} mm</span>
                  </span>
                  {cutting.totalCutWeight && (
                    <span className="badge-item">
                      <span className="badge-icon">⚖️</span>
                      <span className="badge-text">Cut: {cutting.totalCutWeight} kg/pc</span>
                    </span>
                  )}
                </div>

                {/* Cutting Info */}
                <div className="cutting-info">
                  <div className="info-row">
                    <span>🎯 Target Pieces:</span>
                    <strong className="highlight-blue">{cutting.targetPieces || cutting.calculations?.totalPieces || 0}</strong>
                  </div>
                  <div className="info-row">
                    <span>🏭 Steel Used:</span>
                    <strong>{cutting.calculations?.totalSteelUsed?.toFixed(2) || 0} kg</strong>
                  </div>
                  <div className="info-row">
                    <span>📏 End Piece:</span>
                    <strong className="highlight-orange">{cutting.calculations?.endPieceUsed?.toFixed(3) || 0} kg</strong>
                  </div>
                  {cutting.cuttingType === 'CIRCULAR' && (
                    <div className="info-row">
                      <span>🔥 Bhuki:</span>
                      <strong className="highlight-purple">{cutting.calculations?.totalBhuki?.toFixed(3) || 0} kg</strong>
                    </div>
                  )}
                  <div className="info-row">
                    <span>⚠️ Total Waste:</span>
                    <strong className="highlight-red">{cutting.calculations?.totalWaste?.toFixed(3) || 0} kg</strong>
                  </div>
                </div>

                {/* Footer */}
                <div className="cutting-card-footer">
                  <span className="date-text">
                    📅 {new Date(cutting.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Cutting;
