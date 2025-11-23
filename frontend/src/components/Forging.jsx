import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Forging.css';

const API_URL = import.meta.env.LIVE_API_URL;

function Forging() {
  const [forgings, setForgings] = useState([]);
  const [cuttingRecords, setCuttingRecords] = useState([]);
  const [forgingStock, setForgingStock] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCutting, setSelectedCutting] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockForBreakdown, setSelectedStockForBreakdown] = useState(null);
  const [editingForging, setEditingForging] = useState(null);

  const [formData, setFormData] = useState({
    cuttingId: '',
    date: new Date().toISOString().split('T')[0],
    size: '',
    forgingQty: '',
    forgingRingWeight: '',
    rejectionQty: '0',
    remarks: '', // <--- ADD THIS
    forgingResults: {
      babariPerPiece: '0.010',
      scrapPieces: '0',
      finalOkPieces: ''
    }
  });

  useEffect(() => {
    fetchForgings();
    fetchAvailableCuttingRecords();
    fetchForgingStock();
  }, []);

  const fetchForgings = async () => {
    try {
      const response = await axios.get(`${API_URL}/forging`);
      const rawData = response.data.data || [];

      // SORTING LOGIC: Date (Newest first) -> Created Time (Newest first)
      const sortedData = rawData.sort((a, b) => {
        // 1. Compare Dates
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB - dateA !== 0) {
          return dateB - dateA;
        }
        // 2. If Dates are equal, sort by ID (newest created first)
        return b._id.localeCompare(a._id);
      });

      setForgings(sortedData);
    } catch (error) {
      console.error('Error fetching forgings:', error);
    }
  };

  // ➕ ADD THIS FUNCTION:
  // PASTE THIS FUNCTION 👇
  const handleEditForging = (forging) => {
    setEditingForging(forging);

    const cuttingIdVal = forging.cuttingId?._id || forging.cuttingId;

    // Logic to handle missing dropdown items (if stock is 0)
    let cutting = cuttingRecords.find(c => c._id === cuttingIdVal);
    if (!cutting && forging.cuttingId && typeof forging.cuttingId === 'object') {
      cutting = {
        _id: forging.cuttingId._id,
        material: forging.cuttingId.material,
        dia: forging.cuttingId.dia,
        partName: forging.cuttingId.partName,
        colorCode: forging.cuttingId.colorCode,
        cuttingWeightPerPiece: 'N/A',
        availablePieces: 0
      };
    }
    setSelectedCutting(cutting || null);

    setFormData({
      cuttingId: cuttingIdVal,
      date: forging.date.split('T')[0],
      size: forging.size,
      forgingQty: forging.forgingQty.toString(),
      forgingRingWeight: forging.forgingRingWeight.toString(),
      rejectionQty: forging.rejectionQty.toString(),
      remarks: forging.remarks || '',
      forgingResults: {
        babariPerPiece: forging.forgingResults?.babariPerPiece?.toString() || '0.010',
        scrapPieces: forging.forgingResults?.scrapPieces?.toString() || '0',
        finalOkPieces: forging.forgingResults?.finalOkPieces?.toString() || ''
      }
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchAvailableCuttingRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/forging/available/cutting-records`);

      // UPDATED: Filter out records where availablePieces is 0
      const allRecords = response.data.data || [];
      const availableOnly = allRecords.filter(record => record.availablePieces > 0);

      setCuttingRecords(availableOnly);
    } catch (error) {
      console.error('Error fetching cutting records:', error);
    }
  };

  const fetchForgingStock = async () => {
    try {
      const response = await axios.get(`${API_URL}/forging/stock/summary`);
      setForgingStock(response.data.data || []);
    } catch (error) {
      console.error('Error fetching forging stock:', error);
    }
  };

  const handleCuttingSelect = (e) => {
    const recordId = e.target.value;
    const cutting = cuttingRecords.find(c => c._id === recordId);

    if (cutting) {
      setSelectedCutting(cutting);
      setFormData({
        ...formData,
        cuttingId: recordId,
        size: `${cutting.dia}mm`
      });
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('forgingResults.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        forgingResults: {
          ...formData.forgingResults,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Auto-calculate finalOkPieces
    if (name === 'forgingQty' || name === 'rejectionQty' || name === 'forgingResults.scrapPieces') {
      const qty = name === 'forgingQty' ? parseInt(value) || 0 : parseInt(formData.forgingQty) || 0;
      const rejection = name === 'rejectionQty' ? parseInt(value) || 0 : parseInt(formData.rejectionQty) || 0;
      const scrap = name === 'forgingResults.scrapPieces' ? parseInt(value) || 0 : parseInt(formData.forgingResults.scrapPieces) || 0;

      const finalOk = qty - rejection - scrap;

      setFormData(prev => ({
        ...prev,
        forgingQty: name === 'forgingQty' ? value : prev.forgingQty,
        rejectionQty: name === 'rejectionQty' ? value : prev.rejectionQty,
        forgingResults: {
          ...prev.forgingResults,
          scrapPieces: name === 'forgingResults.scrapPieces' ? value : prev.forgingResults.scrapPieces,
          finalOkPieces: Math.max(0, finalOk).toString()
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        cuttingId: formData.cuttingId,
        date: formData.date,
        size: formData.size,
        forgingQty: parseInt(formData.forgingQty),
        forgingRingWeight: parseFloat(formData.forgingRingWeight),
        rejectionQty: parseInt(formData.rejectionQty),
        remarks: formData.remarks, // <--- ADD THIS
        forgingResults: {
          babariPerPiece: parseFloat(formData.forgingResults.babariPerPiece),
          scrapPieces: parseInt(formData.forgingResults.scrapPieces),
          finalOkPieces: parseInt(formData.forgingResults.finalOkPieces)
        }
      };

      // REPLACE THE AXIOS CALLS WITH THIS 👇
      if (editingForging) {
        await axios.put(`${API_URL}/forging/${editingForging._id}`, payload);
        alert('✅ Forging record updated successfully!');
      } else {
        await axios.post(`${API_URL}/forging`, payload);
        alert('✅ Forging record created successfully!');
      }

      alert('✅ Forging record created successfully!');
      resetForm();
      fetchForgings();
      fetchAvailableCuttingRecords();
      fetchForgingStock();
      setLoading(false);
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this forging record?')) {
      try {
        await axios.delete(`${API_URL}/forging/${id}`);
        alert('✅ Forging record deleted successfully!');
        fetchForgings();
        fetchAvailableCuttingRecords();
        fetchForgingStock();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleStockCardClick = (stock) => {
    setSelectedStockForBreakdown(stock);
    setShowStockModal(true);
  };

  const getStockBreakdown = () => {
    if (!selectedStockForBreakdown) return [];

    return forgings.filter(
      f => f.material === selectedStockForBreakdown.material &&
        f.dia === selectedStockForBreakdown.dia
    );
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingForging(null); // ➕ ADD THIS LINE
    setSelectedCutting(null);
    setFormData({
      cuttingId: '',
      date: new Date().toISOString().split('T')[0],
      size: '',
      forgingQty: '',
      forgingRingWeight: '',
      rejectionQty: '0',
      remarks: '', // <--- ADD THIS
      forgingResults: {
        babariPerPiece: '0.010',
        scrapPieces: '0',
        finalOkPieces: ''
      }
    });
  };

  const getTotalStats = () => {
    const totalOkPieces = forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0);
    const totalRingWeight = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalRingWeight || 0), 0);
    const totalRejections = forgings.reduce((sum, f) => sum + (f.rejectionQty || 0), 0);
    const totalScrap = forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0);
    const totalBabari = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalBabari || 0), 0);
    const avgEfficiency = forgings.length > 0
      ? forgings.reduce((sum, f) => sum + (f.forgingResults?.efficiency || 0), 0) / forgings.length
      : 0;

    return { totalOkPieces, totalRingWeight, totalRejections, totalScrap, totalBabari, avgEfficiency };
  };

  const stats = getTotalStats();

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
    <div className="forging-modern">
      {/* Stock Breakdown Modal */}
      {showStockModal && selectedStockForBreakdown && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="forging-breakdown-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span
                  className="material-dot-large"
                  style={{ backgroundColor: getColorStyle(selectedStockForBreakdown.colorCode) }}
                ></span>
                {selectedStockForBreakdown.material} - {selectedStockForBreakdown.dia}mm
              </h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowStockModal(false)}
              >
                ✖
              </button>
            </div>

            <div className="modal-body">
              {getStockBreakdown().length === 0 ? (
                <div className="empty-breakdown">
                  <p>No forging operations for this material-diameter combination</p>
                </div>
              ) : (
                <div className="breakdown-list">
                  {getStockBreakdown().map((item, idx) => (
                    <div key={idx} className="breakdown-item">
                      <div className="breakdown-item-header">
                        <div className="breakdown-info">
                          <span className="breakdown-icon">🔨</span>
                          <div>
                            <span className="breakdown-title">{item.partName}</span>
                            <span className="breakdown-subtitle">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className="efficiency-badge">
                          {item.forgingResults?.efficiency?.toFixed(1)}% Efficiency
                        </span>
                      </div>

                      <div className="breakdown-metrics">
                        <div className="metric-box">
                          <span className="metric-icon">🔨</span>
                          <div>
                            <p className="metric-label">Forged</p>
                            <p className="metric-value">{item.forgingQty} pcs</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">✅</span>
                          <div>
                            <p className="metric-label">OK Pieces</p>
                            <p className="metric-value">{item.forgingResults?.finalOkPieces} pcs</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">⚖️</span>
                          <div>
                            <p className="metric-label">Ring Wt/Pc</p>
                            <p className="metric-value">{item.forgingRingWeight?.toFixed(3)} kg</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">📦</span>
                          <div>
                            <p className="metric-label">Total Ring Wt</p>
                            <p className="metric-value">{item.forgingResults?.totalRingWeight?.toFixed(2)} kg</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">❌</span>
                          <div>
                            <p className="metric-label">Rejections</p>
                            <p className="metric-value">{item.rejectionQty} pcs</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">⚠️</span>
                          <div>
                            <p className="metric-label">Scrap</p>
                            <p className="metric-value">{item.forgingResults?.scrapPieces} pcs</p>
                          </div>
                        </div>
                        <div className="metric-box">
                          <span className="metric-icon">♻️</span>
                          <div>
                            <p className="metric-label">Babari/Pc</p>
                            <p className="metric-value">{item.forgingResults?.babariPerPiece?.toFixed(3)} kg</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="modal-footer">
                <div className="total-summary">
                  <span>Total Operations:</span>
                  <strong>{getStockBreakdown().length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="forging-header">
        <div className="title-group">
          <h1>🔨 Forging Operations</h1>
          <p className="subtitle">Manage forging process and track production</p>
        </div>
        <button
          className={`add-btn ${showForm ? 'cancel' : ''}`}
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
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
              <span>New Forging</span>
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="forging-stats">
        <div className="forging-stat-card">
          <div className="stat-icon-modern">✅</div>
          <div className="stat-info-modern">
            <h3>{stats.totalOkPieces}</h3>
            <p>OK Pieces</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">⚖️</div>
          <div className="stat-info-modern">
            <h3>{stats.totalRingWeight.toFixed(2)}</h3>
            <p>Total Ring Weight (kg)</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">❌</div>
          <div className="stat-info-modern">
            <h3>{stats.totalRejections}</h3>
            <p>Rejections</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">⚠️</div>
          <div className="stat-info-modern">
            <h3>{stats.totalScrap}</h3>
            <p>Scrap Pieces</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">♻️</div>
          <div className="stat-info-modern">
            <h3>{stats.totalBabari.toFixed(2)}</h3>
            <p>Total Babari (kg)</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">📊</div>
          <div className="stat-info-modern">
            <h3>{stats.avgEfficiency.toFixed(1)}%</h3>
            <p>Avg Efficiency</p>
          </div>
        </div>
      </div>


      {/* Forging Stock Summary */}
      {forgingStock.length > 0 && (
        <div className="forging-stock-section">
          <h2>📦 Forging Stock Available</h2>
          <div className="forging-stock-grid">
            {forgingStock.map((stock, idx) => (
              <div
                key={idx}
                className="forging-stock-card clickable"
                onClick={() => handleStockCardClick(stock)}
                style={{ cursor: 'pointer' }}
              >
                <div className="stock-card-header">
                  <span
                    className="material-dot"
                    style={{ backgroundColor: getColorStyle(stock.colorCode) }}
                  ></span>
                  <div className="stock-header-info">
                    <h3>{stock.material}</h3>
                    <span className="dia-badge">{stock.dia} mm</span>
                  </div>
                </div>
                <div className="stock-metrics">
                  <div className="metric">
                    <span className="metric-icon">📦</span>
                    <div>
                      <strong>{stock.totalFinalOkPieces} pcs</strong>
                      <span>Available Stock</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">⚖️</span>
                    <div>
                      <strong>{stock.totalRingWeight} kg</strong>
                      <span>Total Weight</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">📊</span>
                    <div>
                      <strong>{stock.avgEfficiency}%</strong>
                      <span>Efficiency</span>
                    </div>
                  </div>
                </div>
                <div className="card-hint">👆 Click to see operations</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="form-card-forging">
          <div className="form-header-modern">
            <h2>🔨 New Forging Operation</h2>
            <p className="form-subtitle">Select cutting record and enter forging details</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Cutting Record Selection */}
            <div className="cutting-select-section">
              <label>Select Cutting Record *</label>
              <select
                name="cuttingId"
                value={formData.cuttingId}
                onChange={handleCuttingSelect}
                required
                className="select-modern"
                disabled={!!editingForging}  // 👈 ADD THIS
                style={{
                  backgroundColor: editingForging ? '#f3f4f6' : 'white', // 👈 ADD THIS
                  cursor: editingForging ? 'not-allowed' : 'pointer'     // 👈 ADD THIS
                }}
              >
                <option value="">-- Select Cutting Record --</option>
                {cuttingRecords.map((record) => (
                  <option key={record._id} value={record._id}>
                    {record.material} - {record.dia}mm |
                    {record.partName} |
                    Cut Wt: {record.cuttingWeightPerPiece} kg/pc |
                    Available: {record.availablePieces} pcs |
                    {new Date(record.date).toLocaleDateString()}
                  </option>
                ))}
              </select>


              {selectedCutting && (
                <div className="selected-cutting-card">
                  <h4>✅ Selected Cutting Record</h4>
                  <div className="cutting-info-grid-extended">
                    <div className="info-item">
                      <span>Material:</span>
                      <strong>
                        <span
                          className="color-dot-inline"
                          style={{ backgroundColor: getColorStyle(selectedCutting.colorCode) }}
                        ></span>
                        {selectedCutting.material}
                      </strong>
                    </div>
                    <div className="info-item">
                      <span>Diameter:</span>
                      <strong>{selectedCutting.dia} mm</strong>
                    </div>
                    <div className="info-item">
                      <span>Part Name:</span>
                      <strong>{selectedCutting.partName}</strong>
                    </div>
                    <div className="info-item">
                      <span>Cutting Weight/Pc:</span>
                      <strong className="text-blue">
                        {selectedCutting.cuttingWeightPerPiece} kg
                      </strong>
                    </div>
                    <div className="info-item">
                      <span>Available Pieces:</span>
                      <strong className="text-green">{selectedCutting.availablePieces} pcs</strong>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Form Fields */}
            <div className="form-grid-forging">
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
                <label>Size *</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="40mm"
                  required
                />
              </div>

              <div className="input-group">
                <label>Forging Quantity (pieces) *</label>
                <input
                  type="number"
                  name="forgingQty"
                  value={formData.forgingQty}
                  onChange={handleInputChange}
                  placeholder="1000"
                  required
                  min="1"
                  max={selectedCutting?.availablePieces || 99999}
                />
                <small className="help-text">
                  Max: {selectedCutting?.availablePieces || 0} pieces
                </small>
              </div>

              <div className="input-group">
                <label>Ring Weight Per Piece (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="forgingRingWeight"
                  value={formData.forgingRingWeight}
                  onChange={handleInputChange}
                  placeholder="0.450"
                  required
                />
              </div>

              <div className="input-group">
                <label>Babari Per Piece (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="forgingResults.babariPerPiece"
                  value={formData.forgingResults.babariPerPiece}
                  onChange={handleInputChange}
                  placeholder="0.010"
                  required
                />
                <small className="help-text">Flash/Waste per piece</small>
              </div>

              <div className="input-group">
                <label>Rejection Quantity *</label>
                <input
                  type="number"
                  name="rejectionQty"
                  value={formData.rejectionQty}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                  min="0"
                />
              </div>

              <div className="input-group">
                <label>Scrap Pieces *</label>
                <input
                  type="number"
                  name="forgingResults.scrapPieces"
                  value={formData.forgingResults.scrapPieces}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                  min="0"
                />
                <small className="help-text">Damaged during forging</small>
              </div>

              <div className="input-group">
                <label>Final OK Pieces *</label>
                <input
                  type="number"
                  name="forgingResults.finalOkPieces"
                  value={formData.forgingResults.finalOkPieces}
                  onChange={handleInputChange}
                  placeholder="Auto-calculated"
                  required
                  min="0"
                  readOnly
                  className="readonly-input"
                />
                <small className="help-text">Auto-calculated</small>
              </div>

              <div className="input-group">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Add remarks (optional)"
                  rows="3"
                  className="input-field" // Make sure to use your CSS class
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn-forging"
              disabled={loading || !selectedCutting}
            >
              {/* <span>✅</span> */}
              <span>{editingForging ? '✏️' : '✅'}</span>
              <span>{editingForging ? 'Update Record' : 'Save Record'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Forging Records */}
      <div className="records-section">
        <h2>📋 Forging Records</h2>
        <div className="forging-cards-grid">
          {forgings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔨</div>
              <h3>No forging records found</h3>
              <p>Start by creating your first forging operation</p>
            </div>
          ) : (
            forgings.map((forging) => (
              <div key={forging._id} className="forging-record-card">
                <div className="forging-card-header">
                  <div className="header-info">
                    <h3>{forging.partName}</h3>
                    <span
                      className="type-badge"
                      style={{ backgroundColor: getColorStyle(forging.colorCode) }}
                    >
                      {forging.material}
                    </span>
                  </div>
                  <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                    {/* ADD THIS BUTTON 👇 */}
                    <button className="edit-btn-forging" onClick={() => handleEditForging(forging)} title="Edit">✏️</button>

                    <button className="delete-btn-forging" onClick={() => handleDelete(forging._id)} title="Delete">🗑️</button>
                  </div>
                </div>

                <div className="efficiency-indicator">
                  <div className="efficiency-bar-container">
                    <div
                      className="efficiency-bar"
                      style={{
                        width: `${forging.forgingResults?.efficiency || 0}%`,
                        backgroundColor: forging.forgingResults?.efficiency >= 90 ? '#10b981' :
                          forging.forgingResults?.efficiency >= 75 ? '#f59e0b' : '#ef4444'
                      }}
                    ></div>
                  </div>
                  <span className="efficiency-text">
                    {forging.forgingResults?.efficiency?.toFixed(1)}% Efficiency
                  </span>
                </div>

                <div className="forging-info">
                  <div className="info-row">
                    <span>📏 Size:</span>
                    <strong>{forging.size}</strong>
                  </div>
                  <div className="info-row">
                    <span>🔨 Forged Qty:</span>
                    <strong>{forging.forgingQty} pcs</strong>
                  </div>
                  <div className="info-row">
                    <span>✅ OK Pieces:</span>
                    <strong className="text-green">
                      {forging.forgingResults?.finalOkPieces} pcs
                    </strong>
                  </div>
                  <div className="info-row">
                    <span>⚖️ Ring Weight/Pc:</span>
                    <strong>{forging.forgingRingWeight?.toFixed(3)} kg</strong>
                  </div>
                  <div className="info-row">
                    <span>📊 Total Ring Weight:</span>
                    <strong>{forging.forgingResults?.totalRingWeight?.toFixed(2)} kg</strong>
                  </div>
                  <div className="info-row">
                    <span>❌ Rejections:</span>
                    <strong className="text-red">{forging.rejectionQty} pcs</strong>
                  </div>
                  <div className="info-row">
                    <span>⚠️ Scrap:</span>
                    <strong className="text-orange">{forging.forgingResults?.scrapPieces} pcs</strong>
                  </div>
                  <div className="info-row">
                    <span>♻️ Babari/Pc:</span>
                    <strong>{forging.forgingResults?.babariPerPiece?.toFixed(3)} kg</strong>
                  </div>
                  {/* ADD THIS ROW */}
                  <div className="info-row">
                    <span>📝 Remarks:</span>
                    <strong style={{ color: '#333' }}>{forging.remarks || 'No remarks'}</strong>
                  </div>
                </div>


                <div className="forging-card-footer">
                  <span className="date-text">
                    📅 {new Date(forging.date).toLocaleDateString()}
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

export default Forging;
