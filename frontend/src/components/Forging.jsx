import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Forging.css';

const API_URL = 'http://localhost:5000/api';

function Forging() {
  const [cuttings, setCuttings] = useState([]);
  const [forgings, setForgings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCutting, setSelectedCutting] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    cuttingId: '',
    date: new Date().toISOString().split('T')[0],
    size: '',
    forgingQty: '',
    rejectionQty: '0',
    forgingRingWeight: '',
    forgingResults: {
      babariPerPiece: '',
      scrapPieces: '0'
    },
    remarks: ''
  });

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchCuttings();
    fetchForgings();
    fetchMonthlyStats();
  }, [selectedMonth, selectedYear]);


  // Add this useEffect in the Forging component
  useEffect(() => {
    const handleTriggerAdd = () => {
      setShowForm(true);
    };

    window.addEventListener('triggerAddNew', handleTriggerAdd);
    return () => window.removeEventListener('triggerAddNew', handleTriggerAdd);
  }, []);


  const fetchCuttings = async () => {
    try {
      const response = await axios.get(`${API_URL}/cutting`);
      // Only show cuttings that have pieces available
      const availableCuttings = (response.data.data || []).filter(c =>
        c.calculations?.totalPieces > 0
      );
      setCuttings(availableCuttings);
    } catch (error) {
      console.error('Error fetching cuttings:', error);
    }
  };

  const fetchForgings = async () => {
    try {
      let response;

      if (selectedMonth === 'all') {
        response = await axios.get(`${API_URL}/forging`);
      } else {
        response = await axios.get(`${API_URL}/forging/month/${selectedYear}/${selectedMonth}`);
      }

      setForgings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching forgings:', error);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/forging/stats/monthly`);
      setMonthlyStats(response.data.data || []);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const handleCuttingSelect = (e) => {
    const cuttingId = e.target.value;
    const cutting = cuttings.find(c => c._id === cuttingId);

    if (cutting) {
      setSelectedCutting(cutting);
      setFormData({
        ...formData,
        cuttingId: cuttingId,
        forgingQty: cutting.calculations?.totalPieces || ''
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
  };

  const calculateFinalOk = () => {
    const forging = parseInt(formData.forgingQty) || 0;
    const scrap = parseInt(formData.forgingResults.scrapPieces) || 0;
    const rejection = parseInt(formData.rejectionQty) || 0;
    return Math.max(0, forging - scrap - rejection);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cuttingId) {
      alert('Please select a cutting record!');
      return;
    }

    const finalOkPieces = calculateFinalOk();

    try {
      setLoading(true);
      await axios.post(`${API_URL}/forging`, {
        cuttingId: formData.cuttingId,
        date: formData.date,
        size: formData.size,
        forgingQty: parseInt(formData.forgingQty),
        rejectionQty: parseInt(formData.rejectionQty),
        forgingRingWeight: parseFloat(formData.forgingRingWeight),
        forgingResults: {
          babariPerPiece: parseFloat(formData.forgingResults.babariPerPiece),
          scrapPieces: parseInt(formData.forgingResults.scrapPieces),
          finalOkPieces: finalOkPieces
        },
        remarks: formData.remarks
      });

      alert('✅ Forging record created successfully!');
      setShowForm(false);
      setSelectedCutting(null);
      setFormData({
        cuttingId: '',
        date: new Date().toISOString().split('T')[0],
        size: '',
        forgingQty: '',
        rejectionQty: '0',
        forgingRingWeight: '',
        forgingResults: {
          babariPerPiece: '',
          scrapPieces: '0'
        },
        remarks: ''
      });
      fetchForgings();
      fetchMonthlyStats();
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
        fetchMonthlyStats();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getTotalStats = () => {
    const totalForgingQty = forgings.reduce((sum, f) => sum + (f.forgingQty || 0), 0);
    const totalOk = forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0);
    const totalScrap = forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0);
    const totalRejection = forgings.reduce((sum, f) => sum + (f.rejectionQty || 0), 0);
    const totalBabari = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalBabari || 0), 0);
    const totalRingWeight = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalRingWeight || 0), 0);
    const avgEfficiency = forgings.length > 0
      ? forgings.reduce((sum, f) => sum + (f.forgingResults?.efficiency || 0), 0) / forgings.length
      : 0;
    return { totalForgingQty, totalOk, totalScrap, totalRejection, totalBabari, totalRingWeight, avgEfficiency };
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
      {/* Header */}
      <div className="forging-header">
        <div className="title-group">
          <h1>🔨 Forging Operations</h1>
          <p className="subtitle">Track forging process with complete material traceability</p>
        </div>
        <button
          className={`add-btn ${showForm ? 'cancel' : ''}`}
          onClick={() => setShowForm(!showForm)}
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

      {/* Month Filter */}
      <div className="month-filter-section forging-filter">
        <div className="filter-label">
          <span className="filter-icon">📅</span>
          <span>Filter by Period:</span>
        </div>
        <div className="filter-controls">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="filter-select"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          {selectedMonth !== 'all' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-select"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          <div className="current-period">
            {selectedMonth === 'all' ? (
              <span className="period-badge all-time">📊 All Time Data</span>
            ) : (
              <span className="period-badge monthly forging">
                📆 {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      {monthlyStats.length > 0 && (
        <div className="monthly-overview">
          <h3>📈 Monthly Breakdown</h3>
          <div className="monthly-cards">
            {monthlyStats.slice(0, 6).map((stat) => (
              <div key={`${stat.year}-${stat.month}`} className="monthly-card forging">
                <div className="monthly-card-header">
                  <span className="month-name">{stat.monthName}</span>
                  <span className="month-year">{stat.year}</span>
                </div>
                <div className="monthly-card-body">
                  <div className="monthly-stat">
                    <span className="stat-label">Operations</span>
                    <span className="stat-value">{stat.totalOperations}</span>
                  </div>
                  <div className="monthly-stat">
                    <span className="stat-label">OK Pieces</span>
                    <span className="stat-value">{stat.totalOkPieces}</span>
                  </div>
                  <div className="monthly-stat">
                    <span className="stat-label">Efficiency</span>
                    <span className="stat-value">{stat.avgEfficiency?.toFixed(1)}%</span>
                  </div>
                  <div className="monthly-stat">
                    <span className="stat-label">Ring Weight</span>
                    <span className="stat-value">{stat.totalRingWeight} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="forging-stats-grid">
        <div className="forging-stat-card ok">
          <div className="stat-icon-forging">✅</div>
          <div className="stat-info-forging">
            <h3>{stats.totalOk}</h3>
            <p>OK Pieces</p>
          </div>
        </div>
        <div className="forging-stat-card forging-qty">
          <div className="stat-icon-forging">🎯</div>
          <div className="stat-info-forging">
            <h3>{stats.totalForgingQty}</h3>
            <p>Forging Qty</p>
          </div>
        </div>
        <div className="forging-stat-card scrap">
          <div className="stat-icon-forging">🗑️</div>
          <div className="stat-info-forging">
            <h3>{stats.totalScrap}</h3>
            <p>Scrap</p>
          </div>
        </div>
        <div className="forging-stat-card rejection">
          <div className="stat-icon-forging">❌</div>
          <div className="stat-info-forging">
            <h3>{stats.totalRejection}</h3>
            <p>Rejection</p>
          </div>
        </div>
        <div className="forging-stat-card efficiency">
          <div className="stat-icon-forging">📈</div>
          <div className="stat-info-forging">
            <h3>{stats.avgEfficiency.toFixed(1)}%</h3>
            <p>Avg Efficiency</p>
          </div>
        </div>
        <div className="forging-stat-card ring">
          <div className="stat-icon-forging">💍</div>
          <div className="stat-info-forging">
            <h3>{stats.totalRingWeight.toFixed(2)}</h3>
            <p>Ring Weight (kg)</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-card-forging">
          <div className="form-header-modern">
            <h2>🔨 New Forging Operation</h2>
            <p className="form-subtitle">Select cutting record and enter forging details</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Cutting Selection */}
            <div className="cutting-select-section">
              <label>Select Cutting Record *</label>
              <select
                name="cuttingId"
                value={formData.cuttingId}
                onChange={handleCuttingSelect}
                required
                className="select-modern"
              >
                <option value="">-- Select Cutting --</option>
                {cuttings.map((cutting) => (
                  <option key={cutting._id} value={cutting._id}>
                    {new Date(cutting.date).toLocaleDateString()} |
                    {cutting.partName} |
                    {cutting.material} ({cutting.colorCode}) |
                    Dia: {cutting.dia}mm |
                    {cutting.cuttingType} |
                    Available: {cutting.calculations?.totalPieces || 0} pcs
                  </option>
                ))}
              </select>

              {selectedCutting && (
                <div className="selected-cutting-card">
                  <h4>✅ Selected Cutting Details</h4>
                  <div className="cutting-info-grid">
                    <div className="info-item">
                      <span>Part:</span>
                      <strong>{selectedCutting.partName}</strong>
                    </div>
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
                      <span>Type:</span>
                      <strong>{selectedCutting.cuttingType}</strong>
                    </div>
                    <div className="info-item">
                      <span>Available Pieces:</span>
                      <strong className="text-green">{selectedCutting.calculations?.totalPieces || 0}</strong>
                    </div>
                    <div className="info-item">
                      <span>Cut Weight:</span>
                      <strong>{selectedCutting.calculations?.avgCutWeight?.toFixed(3) || 0} kg/pc</strong>
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
                  placeholder="50x30mm"
                  required
                />
                <small className="help-text">Final forged size specification</small>
              </div>

              <div className="input-group">
                <label>Forging Quantity (pieces) *</label>
                <input
                  type="number"
                  name="forgingQty"
                  value={formData.forgingQty}
                  onChange={handleInputChange}
                  placeholder="2000"
                  required
                  min="0"
                  max={selectedCutting?.calculations?.totalPieces || 9999}
                />
                <small className="help-text">How many pieces to forge</small>
              </div>

              <div className="input-group">
                <label>Forging Ring Weight per Piece (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="forgingRingWeight"
                  value={formData.forgingRingWeight}
                  onChange={handleInputChange}
                  placeholder="0.450"
                  required
                  min="0"
                />
                <small className="help-text">Weight of each forged ring</small>
              </div>

              <div className="input-group">
                <label>Babari per Piece (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="forgingResults.babariPerPiece"
                  value={formData.forgingResults.babariPerPiece}
                  onChange={handleInputChange}
                  placeholder="0.050"
                  required
                  min="0"
                />
                <small className="help-text">Flash/excess material per piece</small>
              </div>

              <div className="input-group">
                <label>Scrap Pieces *</label>
                <input
                  type="number"
                  name="forgingResults.scrapPieces"
                  value={formData.forgingResults.scrapPieces}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
                <small className="help-text">Damaged during forging</small>
              </div>

              <div className="input-group">
                <label>Rejection Quantity *</label>
                <input
                  type="number"
                  name="rejectionQty"
                  value={formData.rejectionQty}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
                <small className="help-text">Quality check failures</small>
              </div>

              <div className="input-group full-width">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  rows="3"
                  maxLength="500"
                ></textarea>
              </div>
            </div>

            {/* Calculation Preview */}
            {formData.forgingQty && (
              <div className="forging-preview">
                <h4>📊 Forging Summary</h4>
                <div className="preview-grid-forging">
                  <div className="preview-item-forging">
                    <span>Forging Qty:</span>
                    <strong>{formData.forgingQty} pcs</strong>
                  </div>
                  <div className="preview-item-forging">
                    <span>Scrap:</span>
                    <strong className="text-red">{formData.forgingResults.scrapPieces} pcs</strong>
                  </div>
                  <div className="preview-item-forging">
                    <span>Rejection:</span>
                    <strong className="text-orange">{formData.rejectionQty} pcs</strong>
                  </div>
                  <div className="preview-item-forging ok">
                    <span>Final OK Pieces:</span>
                    <strong className="text-green">{calculateFinalOk()} pcs</strong>
                  </div>
                  {formData.forgingResults.babariPerPiece && formData.forgingQty && (
                    <div className="preview-item-forging">
                      <span>Total Babari:</span>
                      <strong>{(parseFloat(formData.forgingResults.babariPerPiece) * parseInt(formData.forgingQty)).toFixed(3)} kg</strong>
                    </div>
                  )}
                  {formData.forgingRingWeight && (
                    <div className="preview-item-forging">
                      <span>Total Ring Weight:</span>
                      <strong className="highlight-blue">
                        {(parseFloat(formData.forgingRingWeight) * calculateFinalOk()).toFixed(3)} kg
                      </strong>
                    </div>
                  )}
                  {formData.forgingQty && (
                    <div className="preview-item-forging">
                      <span>Efficiency:</span>
                      <strong className="highlight-purple">
                        {((calculateFinalOk() / parseInt(formData.forgingQty)) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="submit-btn-forging"
              disabled={loading || !selectedCutting}
            >
              <span>✅</span>
              <span>{loading ? 'Saving...' : 'Save Forging Record'}</span>
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
              <p>
                {selectedMonth === 'all'
                  ? 'Start by creating your first forging operation'
                  : `No forging operations found for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                }
              </p>
            </div>
          ) : (
            forgings.map((forging) => (
              <div key={forging._id} className="forging-record-card">
                <div className="forging-card-header">
                  <div className="header-left-info">
                    <h3>{forging.partName}</h3>
                    <span className="material-info">
                      {forging.material} • Dia: {forging.dia}mm • Size: {forging.size}
                    </span>
                  </div>
                  <span className={`efficiency-tag ${forging.forgingResults?.efficiency >= 90 ? 'excellent' :
                      forging.forgingResults?.efficiency >= 75 ? 'good' :
                        forging.forgingResults?.efficiency >= 50 ? 'average' : 'poor'
                    }`}>
                    {forging.forgingResults?.efficiency?.toFixed(1) || 0}% Efficiency
                  </span>
                </div>

                <div className="forging-metrics">
                  <div className="metric-box ok-box">
                    <span className="metric-icon">✅</span>
                    <div>
                      <h4>{forging.forgingResults?.finalOkPieces || 0}</h4>
                      <p>OK Pieces</p>
                    </div>
                  </div>

                  <div className="metric-box qty-box">
                    <span className="metric-icon">🎯</span>
                    <div>
                      <h4>{forging.forgingQty || 0}</h4>
                      <p>Forging Qty</p>
                    </div>
                  </div>

                  <div className="metric-box scrap-box">
                    <span className="metric-icon">🗑️</span>
                    <div>
                      <h4>{forging.forgingResults?.scrapPieces || 0}</h4>
                      <p>Scrap</p>
                    </div>
                  </div>

                  <div className="metric-box rejection-box">
                    <span className="metric-icon">❌</span>
                    <div>
                      <h4>{forging.rejectionQty || 0}</h4>
                      <p>Rejection</p>
                    </div>
                  </div>

                  <div className="metric-box babari-box">
                    <span className="metric-icon">🔥</span>
                    <div>
                      <h4>{forging.forgingResults?.totalBabari?.toFixed(3) || 0}</h4>
                      <p>Babari (kg)</p>
                    </div>
                  </div>

                  <div className="metric-box ring-box">
                    <span className="metric-icon">💍</span>
                    <div>
                      <h4>{forging.forgingResults?.totalRingWeight?.toFixed(3) || 0}</h4>
                      <p>Ring Weight (kg)</p>
                    </div>
                  </div>
                </div>

                <div className="forging-card-footer">
                  <span className="date-text">
                    📅 {new Date(forging.date).toLocaleDateString()}
                  </span>
                  <button
                    className="delete-btn-forging"
                    onClick={() => handleDelete(forging._id)}
                  >
                    🗑️ Delete
                  </button>
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
