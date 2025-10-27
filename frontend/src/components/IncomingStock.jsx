import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/IncomingStock.css';

const API_URL = 'http://localhost:5000/api';

function IncomingStock() {
  const [stocks, setStocks] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    dia: '',
    material: '',
    colorCode: '',
    quantity: '',
    tcReport: '',
    partName: '',
    heatNo: ''
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
    fetchMonthlyStats();
  }, [selectedMonth, selectedYear]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      let response;
      
      if (selectedMonth === 'all') {
        response = await axios.get(`${API_URL}/incoming-stock`);
      } else {
        response = await axios.get(`${API_URL}/incoming-stock/month/${selectedYear}/${selectedMonth}`);
      }
      
      setStocks(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/incoming-stock/stats/monthly`);
      setMonthlyStats(response.data.data || []);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
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
    try {
      await axios.post(`${API_URL}/incoming-stock`, {
        ...formData,
        dia: parseFloat(formData.dia),
        quantity: parseFloat(formData.quantity)
      });

      alert('✅ Stock added successfully!');
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        partyName: '',
        dia: '',
        material: '',
        colorCode: '',
        quantity: '',
        tcReport: '',
        partName: '',
        heatNo: ''
      });
      fetchStocks();
      fetchMonthlyStats();
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock?')) {
      try {
        await axios.delete(`${API_URL}/incoming-stock/${id}`);
        alert('✅ Stock deleted successfully!');
        fetchStocks();
        fetchMonthlyStats();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading stocks...</div>
      </div>
    );
  }

  return (
    <div className="incoming-stock">
      <div className="page-header">
        <div>
          <h1>📦 Incoming Stock Management</h1>
          <p className="page-subtitle">Manage raw materials and inventory</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✖ Cancel' : '+ Add New Stock'}
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

      {/* Monthly Statistics Summary */}
      {monthlyStats.length > 0 && (
        <div className="monthly-stats-container">
          <h3>📊 Monthly Statistics</h3>
          <div className="monthly-stats-grid">
            {monthlyStats.slice(0, 6).map((stat) => (
              <div key={`${stat.year}-${stat.month}`} className="monthly-stat-card">
                <div className="stat-month">{stat.monthName} {stat.year}</div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span>Items:</span>
                    <strong>{stat.totalItems}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Quantity:</span>
                    <strong>{stat.totalQuantity} kg</strong>
                  </div>
                  <div className="stat-item">
                    <span>Materials:</span>
                    <strong>{stat.uniqueMaterials}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <h2>📝 Add New Incoming Stock</h2>
          <form onSubmit={handleSubmit}>
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
                <label>Party Name *</label>
                <input
                  type="text"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  placeholder="e.g., Kratti Forging"
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
                  placeholder="e.g., 10"
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Material *</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  placeholder="e.g., SAE-1018"
                  required
                />
              </div>

              <div className="form-group">
                <label>Color Code *</label>
                <input
                  type="text"
                  name="colorCode"
                  value={formData.colorCode}
                  onChange={handleInputChange}
                  placeholder="e.g., BLACK or #000000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g., 10150"
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>TC Report</label>
                <input
                  type="text"
                  name="tcReport"
                  value={formData.tcReport}
                  onChange={handleInputChange}
                  placeholder="e.g., TC-2025-001"
                />
              </div>

              <div className="form-group">
                <label>Part Name *</label>
                <input
                  type="text"
                  name="partName"
                  value={formData.partName}
                  onChange={handleInputChange}
                  placeholder="e.g., Chain Link"
                  required
                />
              </div>

              <div className="form-group">
                <label>Heat Number</label>
                <input
                  type="text"
                  name="heatNo"
                  value={formData.heatNo}
                  onChange={handleInputChange}
                  placeholder="e.g., HT-2025-001"
                />
              </div>
            </div>

            <button type="submit" className="btn-submit">
              ✅ Add Stock
            </button>
          </form>
        </div>
      )}

      <div className="stock-table-container">
        <div className="table-header">
          <h2>📋 Stock Inventory</h2>
          <div className="table-stats">
            <span className="stat-badge">Total: {stocks.length}</span>
            <span className="stat-badge success">
              Total Quantity: {stocks.reduce((sum, s) => sum + (s.quantity || 0), 0).toFixed(2)} kg
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Party Name</th>
                <th>Dia (mm)</th>
                <th>Material</th>
                <th>Color Code</th>
                <th>Quantity (kg)</th>
                <th>Part Name</th>
                <th>TC Report</th>
                <th>Heat No</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    📦 No stock records found. Add your first stock!
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock._id}>
                    <td>{new Date(stock.date).toLocaleDateString()}</td>
                    <td className="font-bold">{stock.partyName}</td>
                    <td className="dia-cell">{stock.dia}</td>
                    <td>
                      <span className="material-badge">{stock.material}</span>
                    </td>
                    <td>
                      <span 
                        className="color-badge" 
                        style={{
                          backgroundColor: stock.colorCode.startsWith('#') 
                            ? stock.colorCode 
                            : stock.colorCode.toLowerCase(),
                          color: 'white'
                        }}
                      >
                        {stock.colorCode}
                      </span>
                    </td>
                    <td className="quantity-cell">{stock.quantity?.toFixed(2)}</td>
                    <td>{stock.partName}</td>
                    <td>{stock.tcReport || '-'}</td>
                    <td>{stock.heatNo || '-'}</td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(stock._id)}
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

export default IncomingStock;
