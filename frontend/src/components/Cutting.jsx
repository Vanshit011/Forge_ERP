import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Cutting.css';

const API_URL = 'http://localhost:5000/api';

function Cutting() {
  const [activeTab, setActiveTab] = useState('sharing');
  const [stocks, setStocks] = useState([]);
  const [cuttings, setCuttings] = useState([]);

  // --- FIX START: Added missing state ---
  const [availableForForging, setAvailableForForging] = useState([]);
  // --- FIX END ---

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDiaBreakdown, setShowDiaBreakdown] = useState(false);
  const [selectedMaterialForBreakdown, setSelectedMaterialForBreakdown] = useState(null);
  const [editingCutting, setEditingCutting] = useState(null);

  const [availablePieces, setAvailablePieces] = useState(0);
  const [requiredSteelForTarget, setRequiredSteelForTarget] = useState(0);

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
    bhukiWeight: '0.010',
    remarks: ''
  });

  useEffect(() => {
    fetchStocks();
    fetchCuttings();
    // --- FIX START: Fetch the data ---
    fetchAvailableForForging();
    // --- FIX END ---
  }, [activeTab]);

  useEffect(() => {
    const handleTriggerAdd = () => {
      setShowForm(true);
    };

    window.addEventListener('triggerAddNew', handleTriggerAdd);
    return () => window.removeEventListener('triggerAddNew', handleTriggerAdd);
  }, []);

  // Derived values for Steel Calculation
  useEffect(() => {
    const totalCutWeight = parseFloat(formData.totalCutWeight) || 0;
    const targetPieces = parseInt(formData.targetPieces, 10) || 0;

    if (selectedStock && totalCutWeight > 0) {
      const pieces = Math.floor(selectedStock.quantity / totalCutWeight);
      setAvailablePieces(pieces);
    } else {
      setAvailablePieces(0);
    }

    const required = +(targetPieces * totalCutWeight).toFixed(3);
    setRequiredSteelForTarget(required);
  }, [selectedStock, formData.totalCutWeight, formData.targetPieces]);

  // Auto-calculate Bhuki
  useEffect(() => {
    if (formData.cuttingType === 'CIRCULAR' && formData.dia) {
      const diameter = parseFloat(formData.dia);

      if (!isNaN(diameter) && diameter > 0) {
        const calculatedBhuki = (diameter * diameter * 2 * 0.00000618).toFixed(3);

        setFormData(prev => {
          if (prev.bhukiWeight !== calculatedBhuki) {
            return { ...prev, bhukiWeight: calculatedBhuki };
          }
          return prev;
        });
      }
    }
  }, [formData.cuttingType, formData.dia]);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/incoming-stock`);
      // Sorting Logic
      const rawData = (response.data.data || []).filter(s => s.quantity > 0.1);
      const sortedData = rawData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB - dateA !== 0) return dateB - dateA;
        return b._id.localeCompare(a._id);
      });
      setStocks(sortedData);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchCuttings = async () => {
    try {
      const response = await axios.get(`${API_URL}/cutting/type/${activeTab.toUpperCase()}`);
      const rawData = response.data.data || [];

      // Sorting Logic
      const sortedData = rawData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB - dateA !== 0) return dateB - dateA;
        return b._id.localeCompare(a._id);
      });

      setCuttings(sortedData);
    } catch (error) {
      console.error('Error fetching cuttings:', error);
    }
  };

  // --- FIX START: Add the fetch function definition ---
  const fetchAvailableForForging = async () => {
    try {
      const response = await axios.get(`${API_URL}/forging/available/cutting-records`);
      setAvailableForForging(response.data.data || []);
    } catch (error) {
      console.error('Error fetching available for forging:', error);
    }
  };
  // --- FIX END ---

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowForm(false);
    setCalculation(null);
    setEditingCutting(null);
    setFormData(prev => ({
      ...prev,
      cuttingType: tab.toUpperCase()
    }));
  };

  const handleStockSelect = (e) => {
    const stockId = e.target.value;
    const stock = stocks.find(s => s._id === stockId);

    if (stock) {
      setSelectedStock(stock);
      setFormData(prev => ({
        ...prev,
        stockId: stockId,
        material: stock.material,
        colorCode: stock.colorCode,
        partName: stock.partName,
        dia: stock.dia
      }));
    } else {
      setSelectedStock(null);
      setFormData(prev => ({ ...prev, stockId: '', material: '', colorCode: '', partName: '', dia: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const computeTotalCutWeightFromParts = () => {
    const min = parseFloat(formData.cuttingWeightMin) || 0;
    const max = parseFloat(formData.cuttingWeightMax) || 0;
    const avgCut = (min + max) / 2;
    const endPiece = parseFloat(formData.endPieceWeight) || 0;
    const bhuki = activeTab === 'circular' ? (parseFloat(formData.bhukiWeight) || 0) : 0;
    const computed = +(avgCut + endPiece + bhuki).toFixed(3);
    setFormData(prev => ({ ...prev, totalCutWeight: computed.toString() }));
    return computed;
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/cutting/calculate`, {
        cuttingType: formData.cuttingType,
        targetPieces: parseInt(formData.targetPieces, 10),
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
        dia: parseFloat(formData.dia) || undefined,
        targetPieces: parseInt(formData.targetPieces, 10),
        cuttingWeightMin: parseFloat(formData.cuttingWeightMin),
        cuttingWeightMax: parseFloat(formData.cuttingWeightMax),
        totalCutWeight: parseFloat(formData.totalCutWeight),
        endPieceWeight: parseFloat(formData.endPieceWeight),
        remarks: formData.remarks
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
        bhukiWeight: '0.010',
        remarks: ''
      });
      fetchCuttings();
      fetchStocks();
      fetchAvailableForForging(); // Refresh counts
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
      dia: cutting.dia?.toString() || '',
      material: cutting.material,
      colorCode: cutting.colorCode,
      targetPieces: cutting.targetPieces?.toString() || '0',
      cuttingWeightMin: cutting.cuttingWeightMin?.toString() || '0',
      cuttingWeightMax: cutting.cuttingWeightMax?.toString() || '0',
      totalCutWeight: cutting.totalCutWeight?.toString() || '0',
      endPieceWeight: cutting.endPieceWeight?.toString() || '0',
      bhukiWeight: cutting.bhukiWeight?.toString() || '0.010',
      remarks: cutting.remarks || ''
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
        fetchAvailableForForging(); // Refresh counts
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
          totalPieces: 0,
          totalSteelUsed: 0,
          totalEndPiece: 0,
          totalWaste: 0,
          operations: 0,
          stockQuantity: stock?.quantity || 0,
          partName: stock?.partName || cutting.partName,
          uniqueWeights: []
        };
      }
      acc[key].totalPieces += cutting.calculations?.totalPieces || 0;
      acc[key].totalSteelUsed += cutting.calculations?.totalSteelUsed || 0;
      acc[key].totalEndPiece += cutting.calculations?.endPieceUsed || 0;
      acc[key].totalWaste += cutting.calculations?.totalWaste || 0;
      acc[key].operations += 1;

      const weight = cutting.totalCutWeight;
      if (weight && !acc[key].uniqueWeights.includes(weight)) {
        acc[key].uniqueWeights.push(weight);
      }

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
          totalPieces: 0,
          totalSteelUsed: 0,
          totalEndPiece: 0,
          totalWaste: 0,
          operations: 0,
          stockQuantity: stock.quantity,
          partName: stock.partName,
          uniqueWeights: []
        };
      }
    });

    return Object.values(cuttingBreakdown)
      .map(stock => {
        const readyPieces = availableForForging
          .filter(record => record.stockId === stock.stockId)
          .reduce((sum, record) => sum + (record.availablePieces || 0), 0);

        return {
          ...stock,
          readyForForging: readyPieces,
          uniqueWeights: stock.uniqueWeights.sort((a, b) => a - b)
        };
      })
      .sort((a, b) => {
        const aRunning = a.operations > 0;
        const bRunning = b.operations > 0;
        if (aRunning && !bRunning) return -1;
        if (!aRunning && bRunning) return 1;
        return a.material.localeCompare(b.material);
      });
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
        fetchAvailableForForging();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStockCuttingDetails = () => {
    if (!selectedMaterialForBreakdown) return [];

    return cuttings.filter(cutting => cutting.stockId === selectedMaterialForBreakdown.stockId)
      .map(cutting => ({
        // Add ID for React keys
        _id: cutting._id,
        partName: cutting.partName,
        targetPieces: cutting.targetPieces,

        // 🚨 CRITICAL ADDITION: Pass the specific cut weight for this record
        totalCutWeight: cutting.totalCutWeight,

        totalPieces: cutting.calculations?.totalPieces || 0,
        totalSteelUsed: cutting.calculations?.totalSteelUsed || 0,
        endPieceUsed: cutting.calculations?.endPieceUsed || 0,
        totalWaste: cutting.calculations?.totalWaste || 0,
        totalBhuki: cutting.calculations?.totalBhuki || 0,
        date: cutting.date,
        cuttingType: cutting.cuttingType,
        remarks: cutting.remarks || ''
      }))
      // Sort by Date (Newest first)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
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
                    <div key={item._id || idx} className="breakdown-item">

                      {/* HEADER ROW */}
                      <div className="breakdown-item-header">
                        <div className="breakdown-info">
                          <span className="breakdown-icon">✂️</span>
                          <div>
                            <span className="breakdown-title">{item.partName}</span>
                            <span className="breakdown-subtitle">{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* 🚨 NEW: DISTINCT CUT WEIGHT BADGE */}
                        {/* This shows exactly which weight was used for this batch */}
                        <div style={{ textAlign: 'right' }}>
                          <span
                            className="cutweight-badge"
                            style={{
                              fontSize: '0.85rem',
                              padding: '4px 8px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}
                          >
                            ⚖️ {item.totalCutWeight} kg
                          </span>
                        </div>
                      </div>

                      {/* METRICS ROW */}
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

                      {/* REMARKS ROW (Optional) */}
                      {item.remarks && (
                        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666', paddingLeft: '4px' }}>
                          📝 {item.remarks}
                        </div>
                      )}
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
            <span className="tab-count">{cuttings.filter(c => c.cuttingType === 'SHARING').length} ops</span>
          </div>
        </button>
        <button
          className={`tab-modern ${activeTab === 'circular' ? 'active' : ''}`}
          onClick={() => handleTabChange('circular')}
        >
          <span className="tab-icon">⭕</span>
          <div className="tab-content">
            <span className="tab-title">Circular</span>
            <span className="tab-count">{cuttings.filter(c => c.cuttingType === 'CIRCULAR').length} ops</span>
          </div>
        </button>
      </div>

      {/* Stock-wise Cutting Summary */}
      {stocks.length > 0 && (
        <div className="material-cutting-breakdown">
          <h2>📦 Stock-wise Cutting Summary</h2>
          <div className="material-cutting-grid">
            {stockWiseBreakdown.map((stock) => (
              <div
                key={stock.stockId}
                className={`material-cutting-card ${stock.operations > 0 ? 'clickable running' : 'disabled'}`}
                onClick={() => stock.operations > 0 && handleStockCardClick(stock)}
                style={{
                  cursor: stock.operations > 0 ? 'pointer' : 'default',
                  border: stock.operations > 0 ? '1px solid #cbd5e1' : '1px dashed #e2e8f0',
                  opacity: stock.operations > 0 ? 1 : 0.7
                }}
              >
                {/* Card Header */}
                <div className="material-cutting-header" style={{ borderColor: getColorStyle(stock.colorCode) }}>
                  <span className="material-dot-cutting" style={{ backgroundColor: getColorStyle(stock.colorCode) }}></span>
                  <div className="material-header-info">
                    <h3>{stock.material}</h3>
                    <span className="diameter-badge">{stock.dia} mm</span>

                    {/* DISTINCT CUT WEIGHTS */}
                    {stock.uniqueWeights.length > 0 && (
                      <div className="cut-weights-list">
                        {stock.uniqueWeights.map((wt, i) => (
                          <span key={i} className="cutweight-badge" style={{ marginRight: '4px', marginBottom: '4px' }}>
                            {wt} kg
                          </span>
                        ))}
                      </div>
                    )}

                    {stock.stockQuantity > 0 && (
                      <span className="available-badge">{stock.stockQuantity} kg</span>
                    )}
                  </div>
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
                    <span className="stat-icon-small">⚠️</span>
                    <div>
                      <p className="stat-value-small text-blue">{stock.totalWaste}</p>
                      <p className="stat-label-small">totalWaste (Kg)</p>
                    </div>
                  </div>

                  <div className="cutting-stat-item">
                    <span className="stat-icon-small">⚖️</span>
                    <div>
                      <p className="stat-value-small">{stock.totalSteelUsed.toFixed(2)} kg</p>
                      <p className="stat-label-small">Used</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {stock.operations > 0 && <div className="card-hint">👆 Click to see details</div>}
                {stock.operations === 0 && <div className="card-no-ops">No operations yet</div>}
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

                    {/* NEW: show how many pieces you can cut from this stock using current Total Cut Weight */}
                    <div className="info-item">
                      <span>Can Cut (approx):</span>
                      <strong>{availablePieces.toLocaleString()} pcs</strong>
                    </div>

                    {/* NEW: show required steel for the entered target pieces */}
                    <div className="info-item">
                      <span>Steel needed for target:</span>
                      <strong>{requiredSteelForTarget.toFixed(3)} kg</strong>
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
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.001"
                    name="totalCutWeight"
                    value={formData.totalCutWeight}
                    onChange={handleInputChange}
                    placeholder="0.520"
                    required
                    style={{ flex: 1 }}
                  />
                  {/* NEW: quick compute button */}

                </div>

                <small className="help-text">Weight per piece including end piece and bhuki (if circular)</small>
                <button
                  type="button"
                  className="small-btn"
                  title="Compute from min/max + end + bhuki"
                  onClick={() => computeTotalCutWeightFromParts()}
                >
                  ⚙️ Compute
                </button>
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
                  <small className="help-text">Auto-calculated from Diameter</small>
                </div>
              )}
              <div className="input-group">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Add remarks (optional)"
                  rows="3"
                  className="input-field"
                />
              </div>
            </div>

            {/* Inline immediate stock warning (before calculation) */}
            {selectedStock && requiredSteelForTarget > (selectedStock.quantity || 0) && (
              <div className="warning-box">
                ⚠️ Insufficient stock for the current target! Required: {requiredSteelForTarget.toFixed(3)} kg,
                Available: {selectedStock.quantity.toFixed(2)} kg
              </div>
            )}

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

                  {/* Calculation-based warning */}
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
                  <div className="info-row">
                    <span>Remarks: </span>
                    <strong className="highlight-black">{cutting.remarks || 'No remarks'}</strong>
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