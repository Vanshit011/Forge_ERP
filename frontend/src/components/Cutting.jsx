import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Cutting.css';

const API_URL = 'http://localhost:5000/api';

function Cutting() {
  const [activeTab, setActiveTab] = useState('sharing');
  const [stocks, setStocks] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    fetchStocks();
    fetchCuttings();
    fetchMonthlyStats();
  }, [activeTab, selectedMonth, selectedYear]);

  // Add this useEffect in the Cutting component
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
      // Only show stocks with quantity > 0
      const availableStocks = (response.data.data || []).filter(s => s.quantity > 0);
      setStocks(availableStocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const fetchCuttings = async () => {
    try {
      let response;

      if (selectedMonth === 'all') {
        response = await axios.get(`${API_URL}/cutting/type/${activeTab.toUpperCase()}`);
      } else {
        response = await axios.get(`${API_URL}/cutting/month/${selectedYear}/${selectedMonth}`);
        const allData = response.data.data || [];
        response.data.data = allData.filter(c => c.cuttingType === activeTab.toUpperCase());
      }

      setCuttings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching cuttings:', error);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/cutting/stats/monthly`);
      setMonthlyStats(response.data.data || []);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowForm(false);
    setCalculation(null);
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

    if (!calculation) {
      alert('Please calculate first!');
      return;
    }

    try {
      setLoading(true);

      // Prepare the payload
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

      // Only add bhukiWeight for CIRCULAR cutting
      if (formData.cuttingType === 'CIRCULAR') {
        payload.bhukiWeight = parseFloat(formData.bhukiWeight);
      }

      console.log('Sending payload:', payload);

      const response = await axios.post(`${API_URL}/cutting`, payload);

      alert('✅ Cutting record created successfully!');
      setShowForm(false);
      setCalculation(null);
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
      fetchMonthlyStats();
      setLoading(false);
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data);
      console.error('Error array:', error.response?.data?.errors); // ADD THIS LINE

      // Show all validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.join('\n');
        alert('❌ Validation Errors:\n\n' + errorMessages);
      } else {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
      setLoading(false);
    }

  };


  const getTotalStats = () => {
    const totalPieces = cuttings.reduce((sum, c) => sum + (c.calculations?.totalPieces || 0), 0);
    const totalSteelUsed = cuttings.reduce((sum, c) => sum + (c.calculations?.totalSteelUsed || 0), 0);
    const totalWaste = cuttings.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
    const totalBhuki = cuttings.reduce((sum, c) => sum + (c.calculations?.totalBhuki || 0), 0);
    return { totalPieces, totalSteelUsed, totalWaste, totalBhuki };
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
    <div className="cutting-modern">
      {/* Header */}
      <div className="cutting-header">
        <div className="title-group">
          <h1>✂️ Cutting Operations</h1>
          <p className="subtitle">Manage sharing and circular cutting processes</p>
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

      {/* Month Filter */}
      <div className="month-filter-section">
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
              <span className="period-badge monthly">
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
              <div key={`${stat.year}-${stat.month}`} className="monthly-card cutting">
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
                    <span className="stat-label">Pieces</span>
                    <span className="stat-value">{stat.totalPieces}</span>
                  </div>
                  <div className="monthly-stat">
                    <span className="stat-label">Steel Used</span>
                    <span className="stat-value">{stat.totalSteelUsed} kg</span>
                  </div>
                  <div className="monthly-stat">
                    <span className="stat-label">Waste</span>
                    <span className="stat-value">{stat.totalWaste} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="cutting-stats">
        <div className="cutting-stat-card">
          <div className="stat-icon-modern">📊</div>
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
          <div className="stat-icon-modern">⚠️</div>
          <div className="stat-info-modern">
            <h3>{stats.totalWaste.toFixed(3)}</h3>
            <p>Total Waste (kg)</p>
          </div>
        </div>
        {activeTab === 'circular' && (
          <div className="cutting-stat-card">
            <div className="stat-icon-modern">🔥</div>
            <div className="stat-info-modern">
              <h3>{stats.totalBhuki.toFixed(3)}</h3>
              <p>Total Bhuki (kg)</p>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-card-cutting">
          <div className="form-header-modern">
            <h2>✂️ New {activeTab === 'sharing' ? 'Sharing' : 'Circular'} Operation</h2>
            <p className="form-subtitle">Cut 2000 pieces with specified weight range</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Stock Selection */}
            <div className="stock-select-section">
              <label>Select Stock Material</label>
              <select
                name="stockId"
                value={formData.stockId}
                onChange={handleStockSelect}
                required
                className="select-modern"
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
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Part Name</label>
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

            {/* Calculate Button */}
            <button
              type="button"
              className="calculate-btn"
              onClick={handleCalculate}
              disabled={!formData.stockId || !formData.targetPieces || loading}
            >
              {loading ? '⏳ Calculating...' : '🧮 Calculate Steel Required'}
            </button>

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
              disabled={!calculation || loading || (selectedStock && calculation && calculation.totalSteelUsed > selectedStock.quantity)}
            >
              <span>✅</span>
              <span>Save Cutting Record</span>
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
              <p>
                {selectedMonth === 'all'
                  ? `Start by creating your first ${activeTab} cutting operation`
                  : `No ${activeTab} operations found for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                }
              </p>
            </div>
          ) : (
            cuttings.map((cutting) => (
              <div key={cutting._id} className="cutting-record-card">
                <div className="cutting-card-header">
                  <h3>{cutting.partName}</h3>
                  <span
                    className="type-badge"
                    style={{ backgroundColor: getColorStyle(cutting.colorCode) }}
                  >
                    {cutting.material}
                  </span>
                </div>

                <div className="cutting-info">
                  <div className="info-row">
                    <span>📏 Diameter:</span>
                    <strong>{cutting.dia} mm</strong>
                  </div>
                  <div className="info-row">
                    <span>🎯 Target Pieces:</span>
                    <strong className="highlight-blue">{cutting.targetPieces || cutting.calculations?.totalPieces || 0}</strong>
                  </div>
                  <div className="info-row">
                    <span>🔢 Total Pieces:</span>
                    <strong className="highlight-green">{cutting.calculations?.totalPieces || 0}</strong>
                  </div>
                  <div className="info-row">
                    <span>🏭 Steel Used:</span>
                    <strong>{cutting.calculations?.totalSteelUsed?.toFixed(3) || 0} kg</strong>
                  </div>
                  <div className="info-row">
                    <span>⚠️ Waste:</span>
                    <strong className="highlight-red">{cutting.calculations?.totalWaste?.toFixed(3) || 0} kg</strong>
                  </div>
                  {cutting.cuttingType === 'CIRCULAR' && (
                    <div className="info-row">
                      <span>🔥 Bhuki:</span>
                      <strong className="highlight-orange">{cutting.calculations?.totalBhuki?.toFixed(3) || 0} kg</strong>
                    </div>
                  )}
                </div>

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
