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
    babariPerPiece: '',
    scrapPieces: '0',
    rejectionPieces: '0',
    finalOkPieces: '',
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

  const fetchCuttings = async () => {
    try {
      const response = await axios.get(`${API_URL}/cutting`);
      setCuttings(response.data.data || []);
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
        finalOkPieces: cutting.calculations?.totalPieces || ''
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cuttingId) {
      alert('Please select a cutting record!');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/forging`, {
        cuttingId: formData.cuttingId,
        date: formData.date,
        size: formData.size,
        forgingResults: {
          babariPerPiece: parseFloat(formData.babariPerPiece),
          scrapPieces: parseInt(formData.scrapPieces),
          rejectionPieces: parseInt(formData.rejectionPieces),
          finalOkPieces: parseInt(formData.finalOkPieces)
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
        babariPerPiece: '',
        scrapPieces: '0',
        rejectionPieces: '0',
        finalOkPieces: '',
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

  return (
    <div className="forging-operations">
      <div className="page-header">
        <div>
          <h1>🔨 Forging Operations</h1>
          <p className="page-subtitle">Track forging process from cutting to final products</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✖ Cancel' : '+ New Forging'}
        </button>
      </div>

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

      {/* Monthly Statistics */}
      {monthlyStats.length > 0 && (
        <div className="monthly-stats-container">
          <h3>📊 Monthly Forging Statistics</h3>
          <div className="monthly-stats-grid">
            {monthlyStats.slice(0, 6).map((stat) => (
              <div key={`${stat.year}-${stat.month}`} className="monthly-stat-card forging">
                <div className="stat-month">{stat.monthName} {stat.year}</div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span>Operations:</span>
                    <strong>{stat.totalOperations}</strong>
                  </div>
                  <div className="stat-item">
                    <span>OK Pieces:</span>
                    <strong className="text-success">{stat.totalOkPieces}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Scrap:</span>
                    <strong className="text-danger">{stat.totalScrap}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Rejection:</span>
                    <strong className="text-warning">{stat.totalRejection}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Babari:</span>
                    <strong>{stat.totalBabari} kg</strong>
                  </div>
                  <div className="stat-item">
                    <span>Efficiency:</span>
                    <strong>{stat.avgEfficiency}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="form-container">
          <h2>🔨 New Forging Operation</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Cutting Selection */}
            <div className="cutting-selection-section">
              <h3>✂️ Select Cutting Record</h3>
              <div className="form-group full-width">
                <label>Cutting Operation *</label>
                <select
                  name="cuttingId"
                  value={formData.cuttingId}
                  onChange={handleCuttingSelect}
                  required
                  className="cutting-select"
                >
                  <option value="">-- Select Cutting Record --</option>
                  {cuttings.map((cutting) => (
                    <option key={cutting._id} value={cutting._id}>
                      {new Date(cutting.date).toLocaleDateString()} | 
                      {cutting.partName} | 
                      {cutting.cuttingType} | 
                      Dia: {cutting.dia}mm | 
                      Pieces: {cutting.calculations?.totalPieces || 0} | 
                      Weight: {cutting.calculations?.finalCutWeight?.toFixed(3) || 0} kg
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Selected Cutting */}
              {selectedCutting && (
                <div className="selected-cutting-info">
                  <h4>✅ Selected Cutting Details</h4>
                  <div className="cutting-details-grid">
                    <div className="detail-item">
                      <span>Part Name:</span>
                      <strong>{selectedCutting.partName}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Type:</span>
                      <strong>{selectedCutting.cuttingType}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Diameter:</span>
                      <strong>{selectedCutting.dia} mm</strong>
                    </div>
                    <div className="detail-item">
                      <span>Material:</span>
                      <strong>{selectedCutting.material}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Total Pieces:</span>
                      <strong className="text-success">
                        {selectedCutting.calculations?.totalPieces || 0}
                      </strong>
                    </div>
                    <div className="detail-item">
                      <span>Final Cut Weight:</span>
                      <strong>
                        {selectedCutting.calculations?.finalCutWeight?.toFixed(3) || 0} kg
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Forging Details */}
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
                <label>Size Specification</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., 50x30mm"
                />
              </div>

              <div className="form-group">
                <label>Babari per Piece (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="babariPerPiece"
                  value={formData.babariPerPiece}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.050"
                  required
                  min="0"
                />
                <small className="help-text">Flash/Excess material per piece</small>
              </div>

              <div className="form-group">
                <label>Scrap Pieces *</label>
                <input
                  type="number"
                  name="scrapPieces"
                  value={formData.scrapPieces}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                  min="0"
                />
                <small className="help-text">Damaged during forging</small>
              </div>

              <div className="form-group">
                <label>Rejection Pieces *</label>
                <input
                  type="number"
                  name="rejectionPieces"
                  value={formData.rejectionPieces}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                  min="0"
                />
                <small className="help-text">Quality failures</small>
              </div>

              <div className="form-group">
                <label>Final OK Pieces *</label>
                <input
                  type="number"
                  name="finalOkPieces"
                  value={formData.finalOkPieces}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                  min="0"
                  max={selectedCutting?.calculations?.totalPieces || 9999}
                />
                {selectedCutting && (
                  <small className="help-text">
                    Max available: {selectedCutting.calculations?.totalPieces || 0} pieces
                  </small>
                )}
              </div>

              <div className="form-group full-width">
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
            {selectedCutting && formData.babariPerPiece && (
              <div className="calculation-preview">
                <h3>📊 Forging Preview</h3>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span>Total Pieces from Cutting:</span>
                    <strong>{selectedCutting.calculations?.totalPieces || 0}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Total Babari Weight:</span>
                    <strong>
                      {((selectedCutting.calculations?.totalPieces || 0) * parseFloat(formData.babariPerPiece || 0)).toFixed(3)} kg
                    </strong>
                  </div>
                  <div className="preview-item">
                    <span>Expected Efficiency:</span>
                    <strong>
                      {selectedCutting.calculations?.totalPieces > 0 
                        ? ((parseInt(formData.finalOkPieces || 0) / selectedCutting.calculations.totalPieces) * 100).toFixed(2)
                        : 0}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading}
            >
              {loading ? '⏳ Saving...' : '✅ Save Forging Record'}
            </button>
          </form>
        </div>
      )}

      {/* Forging Records Table */}
      <div className="table-container">
        <div className="table-header">
          <h2>📋 Forging Records</h2>
          <div className="table-stats">
            <span className="stat-badge">Total: {forgings.length}</span>
            <span className="stat-badge success">
              OK: {forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0)}
            </span>
            <span className="stat-badge danger">
              Scrap: {forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0)}
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="forging-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Part Name</th>
                <th>Dia (mm)</th>
                <th>Size</th>
                <th>Cut Pieces</th>
                <th>Final OK</th>
                <th>Scrap</th>
                <th>Rejection</th>
                <th>Babari (kg)</th>
                <th>Efficiency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forgings.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    🔨 No forging records found. Add your first forging operation!
                  </td>
                </tr>
              ) : (
                forgings.map((forging) => (
                  <tr key={forging._id}>
                    <td>{new Date(forging.date).toLocaleDateString()}</td>
                    <td className="font-bold">{forging.partName}</td>
                    <td>{forging.dia}</td>
                    <td>{forging.size || '-'}</td>
                    <td>{forging.totalPiecesFromCutting}</td>
                    <td className="ok-cell">{forging.forgingResults?.finalOkPieces || 0}</td>
                    <td className="scrap-cell">{forging.forgingResults?.scrapPieces || 0}</td>
                    <td className="rejection-cell">{forging.forgingResults?.rejectionPieces || 0}</td>
                    <td>{forging.forgingResults?.totalBabari?.toFixed(3) || 0}</td>
                    <td>
                      <span className={`efficiency-badge ${
                        forging.forgingResults?.efficiency >= 90 ? 'excellent' :
                        forging.forgingResults?.efficiency >= 75 ? 'good' :
                        forging.forgingResults?.efficiency >= 50 ? 'average' : 'poor'
                      }`}>
                        {forging.forgingResults?.efficiency?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(forging._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Forging;
