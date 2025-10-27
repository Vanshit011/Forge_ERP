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
    cuttingWeightMin: '0.490',
    cuttingWeightMax: '0.500',
    weightVariance: '0.010',
    endPieceWeight: '0.010',
    totalStockWeightUsed: ''
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

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/incoming-stock`);
      setStocks(response.data.data || []);
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
        // Filter by type
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
        partName: stock.partName
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
        dia: parseFloat(formData.dia),
        cuttingWeightMin: parseFloat(formData.cuttingWeightMin),
        cuttingWeightMax: parseFloat(formData.cuttingWeightMax),
        weightVariance: parseFloat(formData.weightVariance),
        endPieceWeight: parseFloat(formData.endPieceWeight),
        totalStockWeightUsed: parseFloat(formData.totalStockWeightUsed)
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
      await axios.post(`${API_URL}/cutting`, {
        stockId: formData.stockId,
        cuttingType: formData.cuttingType,
        date: formData.date,
        partName: formData.partName,
        dia: parseFloat(formData.dia),
        cuttingWeightMin: parseFloat(formData.cuttingWeightMin),
        cuttingWeightMax: parseFloat(formData.cuttingWeightMax),
        weightVariance: parseFloat(formData.weightVariance),
        endPieceWeight: parseFloat(formData.endPieceWeight),
        totalStockWeightUsed: parseFloat(formData.totalStockWeightUsed)
      });

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
        cuttingWeightMin: '0.490',
        cuttingWeightMax: '0.500',
        weightVariance: '0.010',
        endPieceWeight: '0.010',
        totalStockWeightUsed: ''
      });
      fetchCuttings();
      fetchStocks();
      fetchMonthlyStats();
      setLoading(false);
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  return (
    <div className="cutting-operations">
      <div className="page-header">
        <div>
          <h1>✂️ Cutting Operations</h1>
          <p className="page-subtitle">Manage Sharing and Circular cutting processes</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✖ Cancel' : '+ New Cutting'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'sharing' ? 'active' : ''}`}
            onClick={() => handleTabChange('sharing')}
          >
            <span className="tab-icon">🔧</span>
            Sharing Operations
          </button>
          <button
            className={`tab-button ${activeTab === 'circular' ? 'active' : ''}`}
            onClick={() => handleTabChange('circular')}
          >
            <span className="tab-icon">⭕</span>
            Circular Operations
          </button>
        </div>

        <div className="tabs-content">
          {/* Month Filter */}
          <div className="filter-container">
            <div className="filter-group">
              <label>📅 Filter by Month:</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-select"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="year-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Statistics Summary */}
          {monthlyStats.length > 0 && (
            <div className="monthly-stats-container">
              <h3>📊 Monthly Cutting Statistics</h3>
              <div className="monthly-stats-grid">
                {monthlyStats.slice(0, 6).map((stat) => (
                  <div key={`${stat.year}-${stat.month}`} className="monthly-stat-card cutting">
                    <div className="stat-month">{stat.monthName} {stat.year}</div>
                    <div className="stat-details">
                      <div className="stat-item">
                        <span>Operations:</span>
                        <strong>{stat.totalOperations}</strong>
                      </div>
                      <div className="stat-item">
                        <span>Total Pieces:</span>
                        <strong>{stat.totalPieces}</strong>
                      </div>
                      <div className="stat-item">
                        <span>Total Waste:</span>
                        <strong>{stat.totalWaste} kg</strong>
                      </div>
                      {stat.totalBhuki > 0 && (
                        <div className="stat-item">
                          <span>Total Bhuki:</span>
                          <strong>{stat.totalBhuki} kg</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="form-container">
              <h2>📝 New {activeTab === 'sharing' ? 'Sharing' : 'Circular'} Operation</h2>

              <form onSubmit={handleSubmit}>
                {/* Stock Selection */}
                <div className="stock-selection-section">
                  <h3>📦 Select Incoming Stock</h3>
                  <div className="form-group full-width">
                    <label>Stock Material *</label>
                    <select
                      name="stockId"
                      value={formData.stockId}
                      onChange={handleStockSelect}
                      required
                      className="stock-select"
                    >
                      <option value="">-- Select Stock --</option>
                      {stocks.map((stock) => (
                        <option key={stock._id} value={stock._id}>
                          {stock.partyName} | {stock.material} | Dia: {stock.dia}mm | {stock.colorCode} |
                          Part: {stock.partName} | Available: {stock.quantity} kg
                          {stock.heatNo && ` | Heat: ${stock.heatNo}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Display Selected Stock */}
                  {selectedStock && (
                    <div className="selected-stock-info">
                      <h4>✅ Selected Stock Details</h4>
                      <div className="stock-details-grid">
                        <div className="detail-item">
                          <span>Party Name:</span>
                          <strong>{selectedStock.partyName}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Material:</span>
                          <strong>{selectedStock.material}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Color:</span>
                          <strong style={{
                            backgroundColor: selectedStock.colorCode,
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '6px'
                          }}>
                            {selectedStock.colorCode}
                          </strong>
                        </div>
                        <div className="detail-item">
                          <span>Available:</span>
                          <strong className="text-success">{selectedStock.quantity} kg</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cutting Details */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Part Name *</label>
                    <input
                      type="text"
                      name="partName"
                      value={formData.partName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Diameter (mm) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="dia"
                      value={formData.dia}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Material (Auto-filled)</label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      readOnly
                      className="readonly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Color Code (Auto-filled)</label>
                    <input
                      type="text"
                      name="colorCode"
                      value={formData.colorCode}
                      readOnly
                      className="readonly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Stock Weight Used (kg) *</label>
                    <input
                      type="number"
                      step="0.001"
                      name="totalStockWeightUsed"
                      value={formData.totalStockWeightUsed}
                      onChange={handleInputChange}
                      required
                      max={selectedStock?.quantity || 9999}
                    />
                    {selectedStock && (
                      <small className="help-text">
                        Max available: {selectedStock.quantity} kg
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Cutting Weight Min (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="cuttingWeightMin"
                      value={formData.cuttingWeightMin}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cutting Weight Max (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="cuttingWeightMax"
                      value={formData.cuttingWeightMax}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Weight Variance (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="weightVariance"
                      value={formData.weightVariance}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Piece Weight (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="endPieceWeight"
                      value={formData.endPieceWeight}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Calculate Button */}
                <button
                  type="button"
                  className="btn-calculate"
                  onClick={handleCalculate}
                  disabled={!formData.stockId || !formData.dia || !formData.totalStockWeightUsed || loading}
                >
                  {loading ? '⏳ Calculating...' : '🧮 Calculate'}
                </button>

                {/* Calculation Results */}
                {calculation && (
                  <div className="calculation-result">
                    <h3>🎯 Calculation Results</h3>
                    <div className="result-grid">
                      <div className="result-item">
                        <span>Avg Cutting Weight:</span>
                        <strong>{calculation.avgCuttingWeight} kg</strong>
                      </div>
                      <div className="result-item">
                        <span>Final Cut Weight:</span>
                        <strong>{calculation.finalCutWeight} kg</strong>
                      </div>
                      <div className="result-item">
                        <span>Total Pieces:</span>
                        <strong className="highlight">{calculation.totalPieces}</strong>
                      </div>
                      <div className="result-item">
                        <span>Weight Used:</span>
                        <strong>{calculation.weightUsedForCutting} kg</strong>
                      </div>
                      {activeTab === 'circular' && (
                        <>
                          <div className="result-item">
                            <span>Blend Weight:</span>
                            <strong>{calculation.blendWeight} kg</strong>
                          </div>
                          <div className="result-item bhuki">
                            <span>Bhuki (Blend Waste):</span>
                            <strong>{calculation.totalBhuki} kg</strong>
                          </div>
                        </>
                      )}
                      <div className="result-item waste">
                        <span>Total Waste:</span>
                        <strong>{calculation.totalWaste} kg</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!calculation || loading}
                >
                  {loading ? '⏳ Saving...' : '✅ Save Cutting Record'}
                </button>
              </form>
            </div>
          )}

          {/* Records Table */}
          <div className="table-container">
            <h2>📋 {activeTab === 'sharing' ? 'Sharing' : 'Circular'} Records</h2>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Part Name</th>
                    <th>Dia (mm)</th>
                    <th>Material</th>
                    <th>Color</th>
                    <th>Stock Used (kg)</th>
                    <th>Total Pieces</th>
                    {activeTab === 'circular' && <th>Bhuki (kg)</th>}
                    <th>Waste (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {cuttings.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'circular' ? 9 : 8} className="no-data">
                        No {activeTab} records found
                      </td>
                    </tr>
                  ) : (
                    cuttings.map((cutting) => (
                      <tr key={cutting._id}>
                        <td>{new Date(cutting.date).toLocaleDateString()}</td>
                        <td className="font-bold">{cutting.partName}</td>
                        <td>{cutting.dia}</td>
                        <td>
                          <span className="material-badge">{cutting.material}</span>
                        </td>
                        <td>
                          <span
                            className="color-badge"
                            style={{
                              backgroundColor: cutting.colorCode,
                              color: 'white'
                            }}
                          >
                            {cutting.colorCode}
                          </span>
                        </td>
                        <td>{cutting.totalStockWeightUsed?.toFixed(3)}</td>
                        <td className="highlight">{cutting.calculations?.totalPieces || 0}</td>
                        {activeTab === 'circular' && (
                          <td className="bhuki-cell">
                            {cutting.calculations?.totalBhuki?.toFixed(6) || 0}
                          </td>
                        )}
                        <td className="waste-cell">
                          {cutting.calculations?.totalWaste?.toFixed(6) || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cutting;
