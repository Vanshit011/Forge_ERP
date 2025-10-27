import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const API_URL = 'http://localhost:5000/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    totalQuantity: 0,
    totalSharings: 0,
    totalCirculars: 0,
    totalPieces: 0,
    totalWaste: 0,
    sharingWaste: 0,
    circularWaste: 0,
    totalBhuki: 0,
    totalForgings: 0,
    totalOkPieces: 0,
    totalScrap: 0,
    totalRejection: 0,
    totalBabari: 0,
    avgEfficiency: 0
  });
  const [recentStocks, setRecentStocks] = useState([]);
  const [recentCuttings, setRecentCuttings] = useState([]);
  const [recentForgings, setRecentForgings] = useState([]);
  const [monthlyStockStats, setMonthlyStockStats] = useState([]);
  const [monthlyCuttingStats, setMonthlyCuttingStats] = useState([]);
  const [monthlyForgingStats, setMonthlyForgingStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    { value: 'all', label: 'All Time' },
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
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stocks based on month filter
      let stocksResponse;
      if (selectedMonth === 'all') {
        stocksResponse = await axios.get(`${API_URL}/incoming-stock`);
      } else {
        stocksResponse = await axios.get(`${API_URL}/incoming-stock/month/${selectedYear}/${selectedMonth}`);
      }
      const stocks = stocksResponse.data.data || [];
      
      // Fetch cuttings based on month filter
      let cuttingsResponse;
      if (selectedMonth === 'all') {
        cuttingsResponse = await axios.get(`${API_URL}/cutting`);
      } else {
        cuttingsResponse = await axios.get(`${API_URL}/cutting/month/${selectedYear}/${selectedMonth}`);
      }
      const cuttings = cuttingsResponse.data.data || [];

      // Fetch forgings based on month filter
      let forgingsResponse;
      if (selectedMonth === 'all') {
        forgingsResponse = await axios.get(`${API_URL}/forging`);
      } else {
        forgingsResponse = await axios.get(`${API_URL}/forging/month/${selectedYear}/${selectedMonth}`);
      }
      const forgings = forgingsResponse.data.data || [];

      // Fetch monthly statistics
      const stockStatsResponse = await axios.get(`${API_URL}/incoming-stock/stats/monthly`);
      setMonthlyStockStats(stockStatsResponse.data.data || []);

      const cuttingStatsResponse = await axios.get(`${API_URL}/cutting/stats/monthly`);
      setMonthlyCuttingStats(cuttingStatsResponse.data.data || []);

      const forgingStatsResponse = await axios.get(`${API_URL}/forging/stats/monthly`);
      setMonthlyForgingStats(forgingStatsResponse.data.data || []);

      // Calculate stats
      const totalQuantity = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
      
      // Cutting stats
      const sharings = cuttings.filter(c => c.cuttingType === 'SHARING');
      const circulars = cuttings.filter(c => c.cuttingType === 'CIRCULAR');
      const sharingWaste = sharings.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
      const circularWaste = circulars.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
      const totalBhuki = circulars.reduce((sum, c) => sum + (c.calculations?.totalBhuki || 0), 0);
      const totalPieces = cuttings.reduce((sum, c) => sum + (c.calculations?.totalPieces || 0), 0);
      const totalWaste = sharingWaste + circularWaste;

      // Forging stats
      const totalOkPieces = forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0);
      const totalScrap = forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0);
      const totalRejection = forgings.reduce((sum, f) => sum + (f.forgingResults?.rejectionPieces || 0), 0);
      const totalBabari = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalBabari || 0), 0);
      const avgEfficiency = forgings.length > 0 
        ? forgings.reduce((sum, f) => sum + (f.forgingResults?.efficiency || 0), 0) / forgings.length 
        : 0;

      setStats({
        totalStock: stocks.length,
        totalQuantity: totalQuantity,
        totalSharings: sharings.length,
        totalCirculars: circulars.length,
        totalPieces: totalPieces,
        totalWaste: totalWaste,
        sharingWaste: sharingWaste,
        circularWaste: circularWaste,
        totalBhuki: totalBhuki,
        totalForgings: forgings.length,
        totalOkPieces: totalOkPieces,
        totalScrap: totalScrap,
        totalRejection: totalRejection,
        totalBabari: totalBabari,
        avgEfficiency: avgEfficiency
      });

      // Recent records
      setRecentStocks(stocks.slice(0, 5));
      setRecentCuttings(cuttings.slice(0, 5));
      setRecentForgings(forgings.slice(0, 5));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🏭 Forge ERP Dashboard</h1>
          <p className="dashboard-subtitle">Manufacturing Operations Management System</p>
        </div>
        <button className="btn-refresh" onClick={fetchDashboardData}>
          🔄 Refresh
        </button>
      </div>

      {/* Month Filter */}
      <div className="filter-container">
        <div className="filter-group">
          <label>📅 View Data for:</label>
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
          
          {selectedMonth !== 'all' && (
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
          )}
        </div>
        <div className="filter-info">
          {selectedMonth === 'all' ? (
            <span className="period-badge all">Showing All Time Data</span>
          ) : (
            <span className="period-badge month">
              Showing {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📦</div>
          </div>
          <div className="stat-content">
            <h3>Total Stock Items</h3>
            <p className="stat-number">{stats.totalStock}</p>
            <span className="stat-label">Materials in inventory</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">⚖️</div>
          </div>
          <div className="stat-content">
            <h3>Total Quantity</h3>
            <p className="stat-number">{stats.totalQuantity.toFixed(2)}</p>
            <span className="stat-label">Kilograms</span>
          </div>
        </div>

        <div className="stat-card sharing">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">🔧</div>
          </div>
          <div className="stat-content">
            <h3>Sharing Operations</h3>
            <p className="stat-number">{stats.totalSharings}</p>
            <span className="stat-label">Total operations</span>
          </div>
        </div>

        <div className="stat-card circular">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">⭕</div>
          </div>
          <div className="stat-content">
            <h3>Circular Operations</h3>
            <p className="stat-number">{stats.totalCirculars}</p>
            <span className="stat-label">Total operations</span>
          </div>
        </div>

        <div className="stat-card production">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📊</div>
          </div>
          <div className="stat-content">
            <h3>Cut Pieces</h3>
            <p className="stat-number">{stats.totalPieces}</p>
            <span className="stat-label">From cutting</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">⚠️</div>
          </div>
          <div className="stat-content">
            <h3>Cutting Waste</h3>
            <p className="stat-number">{stats.totalWaste.toFixed(3)}</p>
            <span className="stat-label">Kilograms</span>
          </div>
        </div>

        <div className="stat-card forging">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">🔨</div>
          </div>
          <div className="stat-content">
            <h3>Forging Operations</h3>
            <p className="stat-number">{stats.totalForgings}</p>
            <span className="stat-label">Total forgings</span>
          </div>
        </div>

        <div className="stat-card forging-ok">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">✅</div>
          </div>
          <div className="stat-content">
            <h3>Final OK Pieces</h3>
            <p className="stat-number">{stats.totalOkPieces}</p>
            <span className="stat-label">Forged successfully</span>
          </div>
        </div>

        <div className="stat-card efficiency">
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📈</div>
          </div>
          <div className="stat-content">
            <h3>Avg Efficiency</h3>
            <p className="stat-number">{stats.avgEfficiency.toFixed(1)}%</p>
            <span className="stat-label">Forging success rate</span>
          </div>
        </div>
      </div>

      {/* Forging Performance Section */}
      <div className="forging-performance">
        <h2>🔨 Forging Performance</h2>
        <div className="performance-cards">
          <div className="performance-card ok">
            <div className="performance-icon">✅</div>
            <div className="performance-content">
              <h3>Final OK Pieces</h3>
              <p className="performance-number">{stats.totalOkPieces}</p>
              <span className="performance-label">Successfully forged</span>
            </div>
          </div>

          <div className="performance-card scrap">
            <div className="performance-icon">🗑️</div>
            <div className="performance-content">
              <h3>Scrap Pieces</h3>
              <p className="performance-number">{stats.totalScrap}</p>
              <span className="performance-label">Damaged during forging</span>
            </div>
          </div>

          <div className="performance-card rejection">
            <div className="performance-icon">❌</div>
            <div className="performance-content">
              <h3>Rejection Pieces</h3>
              <p className="performance-number">{stats.totalRejection}</p>
              <span className="performance-label">Quality failures</span>
            </div>
          </div>

          <div className="performance-card babari">
            <div className="performance-icon">🔥</div>
            <div className="performance-content">
              <h3>Total Babari</h3>
              <p className="performance-number">{stats.totalBabari.toFixed(3)}</p>
              <span className="performance-label">Kilograms (Flash/Excess)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Waste Breakdown Section */}
      <div className="waste-breakdown">
        <h2>🗑️ Waste Analysis</h2>
        <div className="waste-cards">
          <div className="waste-card sharing-waste">
            <div className="waste-header">
              <span className="waste-icon">🔧</span>
              <h3>Sharing Waste</h3>
            </div>
            <div className="waste-amount">
              <span className="waste-number">{stats.sharingWaste.toFixed(3)}</span>
              <span className="waste-unit">kg</span>
            </div>
            <div className="waste-details">
              <div className="waste-item">
                <span>Operations:</span>
                <strong>{stats.totalSharings}</strong>
              </div>
              <div className="waste-item">
                <span>Avg per operation:</span>
                <strong>
                  {stats.totalSharings > 0 ? (stats.sharingWaste / stats.totalSharings).toFixed(4) : '0.000'} kg
                </strong>
              </div>
            </div>
          </div>

          <div className="waste-card circular-waste">
            <div className="waste-header">
              <span className="waste-icon">⭕</span>
              <h3>Circular Waste</h3>
            </div>
            <div className="waste-amount">
              <span className="waste-number">{stats.circularWaste.toFixed(3)}</span>
              <span className="waste-unit">kg</span>
            </div>
            <div className="waste-details">
              <div className="waste-item">
                <span>Operations:</span>
                <strong>{stats.totalCirculars}</strong>
              </div>
              <div className="waste-item">
                <span>Avg per operation:</span>
                <strong>
                  {stats.totalCirculars > 0 ? (stats.circularWaste / stats.totalCirculars).toFixed(4) : '0.000'} kg
                </strong>
              </div>
            </div>
          </div>

          <div className="waste-card bhuki-waste">
            <div className="waste-header">
              <span className="waste-icon">🔥</span>
              <h3>Bhuki (Blend Waste)</h3>
            </div>
            <div className="waste-amount">
              <span className="waste-number">{stats.totalBhuki.toFixed(3)}</span>
              <span className="waste-unit">kg</span>
            </div>
            <div className="waste-details">
              <div className="waste-item">
                <span>From Circular:</span>
                <strong>{stats.totalCirculars} ops</strong>
              </div>
              <div className="waste-item">
                <span>Percentage of total:</span>
                <strong>
                  {stats.totalWaste > 0 ? ((stats.totalBhuki / stats.totalWaste) * 100).toFixed(1) : '0.0'}%
                </strong>
              </div>
            </div>
          </div>

          <div className="waste-card total-waste">
            <div className="waste-header">
              <span className="waste-icon">📊</span>
              <h3>Total Cutting Waste</h3>
            </div>
            <div className="waste-amount">
              <span className="waste-number">{stats.totalWaste.toFixed(3)}</span>
              <span className="waste-unit">kg</span>
            </div>
            <div className="waste-breakdown-chart">
              <div className="chart-bar">
                <div 
                  className="chart-segment sharing" 
                  style={{ width: `${stats.totalWaste > 0 ? (stats.sharingWaste / stats.totalWaste) * 100 : 0}%` }}
                  title={`Sharing: ${stats.sharingWaste.toFixed(3)} kg`}
                >
                  {stats.totalWaste > 0 && ((stats.sharingWaste / stats.totalWaste) * 100).toFixed(0)}%
                </div>
                <div 
                  className="chart-segment circular" 
                  style={{ width: `${stats.totalWaste > 0 ? (stats.circularWaste / stats.totalWaste) * 100 : 0}%` }}
                  title={`Circular: ${stats.circularWaste.toFixed(3)} kg`}
                >
                  {stats.totalWaste > 0 && ((stats.circularWaste / stats.totalWaste) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot sharing"></span> Sharing</span>
                <span className="legend-item"><span className="legend-dot circular"></span> Circular</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Section */}
      <div className="monthly-trends">
        <h2>📈 Monthly Trends</h2>
        <div className="trends-grid-three">
          {/* Stock Trends */}
          <div className="trend-card">
            <h3>📦 Stock by Month</h3>
            <div className="trend-list">
              {monthlyStockStats.slice(0, 4).map((stat) => (
                <div key={`${stat.year}-${stat.month}`} className="trend-item">
                  <div className="trend-month">{stat.monthName} {stat.year}</div>
                  <div className="trend-bars">
                    <div className="trend-bar-container">
                      <div className="trend-bar stock" style={{ width: `${(stat.totalItems / Math.max(...monthlyStockStats.map(s => s.totalItems))) * 100}%` }}>
                        <span className="trend-value">{stat.totalItems}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cutting Trends */}
          <div className="trend-card">
            <h3>✂️ Cutting by Month</h3>
            <div className="trend-list">
              {monthlyCuttingStats.slice(0, 4).map((stat) => (
                <div key={`${stat.year}-${stat.month}`} className="trend-item">
                  <div className="trend-month">{stat.monthName} {stat.year}</div>
                  <div className="trend-bars">
                    <div className="trend-bar-container">
                      <div className="trend-bar cutting" style={{ width: `${(stat.totalOperations / Math.max(...monthlyCuttingStats.map(s => s.totalOperations))) * 100}%` }}>
                        <span className="trend-value">{stat.totalOperations}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forging Trends */}
          <div className="trend-card">
            <h3>🔨 Forging by Month</h3>
            <div className="trend-list">
              {monthlyForgingStats.slice(0, 4).map((stat) => (
                <div key={`${stat.year}-${stat.month}`} className="trend-item">
                  <div className="trend-month">{stat.monthName} {stat.year}</div>
                  <div className="trend-bars">
                    <div className="trend-bar-container">
                      <div className="trend-bar forging" style={{ width: `${(stat.totalOperations / Math.max(...monthlyForgingStats.map(s => s.totalOperations))) * 100}%` }}>
                        <span className="trend-value">{stat.totalOperations}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-card">
          <h2>📦 Recent Stock</h2>
          <div className="activity-list">
            {recentStocks.length === 0 ? (
              <p className="no-data">No stock records yet</p>
            ) : (
              recentStocks.map((stock) => (
                <div key={stock._id} className="activity-item">
                  <div className="activity-icon">📦</div>
                  <div className="activity-content">
                    <p className="activity-title">{stock.partName}</p>
                    <p className="activity-subtitle">
                      {stock.partyName} • {stock.material} • {stock.quantity.toFixed(2)} kg
                    </p>
                  </div>
                  <div className="activity-date">
                    {new Date(stock.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="activity-card">
          <h2>✂️ Recent Cutting</h2>
          <div className="activity-list">
            {recentCuttings.length === 0 ? (
              <p className="no-data">No cutting records yet</p>
            ) : (
              recentCuttings.map((cutting) => (
                <div key={cutting._id} className="activity-item">
                  <div className="activity-icon">
                    {cutting.cuttingType === 'SHARING' ? '🔧' : '⭕'}
                  </div>
                  <div className="activity-content">
                    <p className="activity-title">{cutting.partName}</p>
                    <p className="activity-subtitle">
                      {cutting.cuttingType} • {cutting.calculations?.totalPieces || 0} pieces
                    </p>
                  </div>
                  <div className="activity-date">
                    {new Date(cutting.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="activity-card">
          <h2>🔨 Recent Forging</h2>
          <div className="activity-list">
            {recentForgings.length === 0 ? (
              <p className="no-data">No forging records yet</p>
            ) : (
              recentForgings.map((forging) => (
                <div key={forging._id} className="activity-item">
                  <div className="activity-icon">🔨</div>
                  <div className="activity-content">
                    <p className="activity-title">{forging.partName}</p>
                    <p className="activity-subtitle">
                      OK: {forging.forgingResults?.finalOkPieces || 0} • 
                      Efficiency: {forging.forgingResults?.efficiency?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="activity-date">
                    {new Date(forging.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => window.location.href = '/incoming-stock'}>
            <span className="action-icon">📦</span>
            <div>
              <strong>Add Stock</strong>
              <p>Add new materials</p>
            </div>
          </button>
          
          <button className="action-btn secondary" onClick={() => window.location.href = '/cutting'}>
            <span className="action-icon">✂️</span>
            <div>
              <strong>Cutting</strong>
              <p>New operation</p>
            </div>
          </button>
          
          <button className="action-btn tertiary" onClick={() => window.location.href = '/forging'}>
            <span className="action-icon">🔨</span>
            <div>
              <strong>Forging</strong>
              <p>New operation</p>
            </div>
          </button>

          <button className="action-btn info" onClick={fetchDashboardData}>
            <span className="action-icon">📊</span>
            <div>
              <strong>Refresh</strong>
              <p>Update data</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
