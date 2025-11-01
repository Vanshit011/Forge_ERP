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
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyStockStats, setMonthlyStockStats] = useState([]);
  const [monthlyCuttingStats, setMonthlyCuttingStats] = useState([]);
  const [monthlyForgingStats, setMonthlyForgingStats] = useState([]);
  const [materialSummary, setMaterialSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const periodOptions = [
    { value: 'all', label: 'All Time', months: null },
    { value: '1m', label: '1 Month', months: 1 },
    { value: '3m', label: '3 Months', months: 3 },
    { value: '6m', label: '6 Months', months: 6 },
    { value: '1y', label: '1 Year', months: 12 }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const getDateRange = () => {
    const period = periodOptions.find(p => p.value === selectedPeriod);
    if (!period || !period.months) return null;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - period.months);

    return { startDate, endDate };
  };

  const filterByDateRange = (items, dateField = 'date') => {
    const dateRange = getDateRange();
    if (!dateRange) return items;

    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [stocksRes, cuttingsRes, forgingsRes, materialSummaryRes] = await Promise.all([
        axios.get(`${API_URL}/incoming-stock`),
        axios.get(`${API_URL}/cutting`),
        axios.get(`${API_URL}/forging`),
        axios.get(`${API_URL}/incoming-stock/summary`)
      ]);

      // Apply date filtering
      const stocks = filterByDateRange(stocksRes.data.data || []);
      const cuttings = filterByDateRange(cuttingsRes.data.data || []);
      const forgings = filterByDateRange(forgingsRes.data.data || []);

      // Set material summary
      setMaterialSummary(materialSummaryRes.data.data || []);

      // Fetch monthly statistics
      const [stockStatsRes, cuttingStatsRes, forgingStatsRes] = await Promise.all([
        axios.get(`${API_URL}/incoming-stock/stats/monthly`),
        axios.get(`${API_URL}/cutting/stats/monthly`),
        axios.get(`${API_URL}/forging/stats/monthly`)
      ]);

      // Filter monthly stats based on period
      const dateRange = getDateRange();
      const filterMonthlyStats = (stats) => {
        if (!dateRange) return stats;
        
        return stats.filter(stat => {
          const statDate = new Date(stat.year, stat.month - 1);
          return statDate >= dateRange.startDate && statDate <= dateRange.endDate;
        });
      };

      setMonthlyStockStats(filterMonthlyStats(stockStatsRes.data.data || []));
      setMonthlyCuttingStats(filterMonthlyStats(cuttingStatsRes.data.data || []));
      setMonthlyForgingStats(filterMonthlyStats(forgingStatsRes.data.data || []));

      // Calculate stats
      const totalQuantity = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const sharings = cuttings.filter(c => c.cuttingType === 'SHARING');
      const circulars = cuttings.filter(c => c.cuttingType === 'CIRCULAR');
      const sharingWaste = sharings.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
      const circularWaste = circulars.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
      const totalBhuki = circulars.reduce((sum, c) => sum + (c.calculations?.totalBhuki || 0), 0);
      const totalPieces = cuttings.reduce((sum, c) => sum + (c.calculations?.totalPieces || 0), 0);
      const totalOkPieces = forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0);
      const totalScrap = forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0);
      const totalRejection = forgings.reduce((sum, f) => sum + (f.rejectionQty || 0), 0);
      const totalBabari = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalBabari || 0), 0);
      const avgEfficiency = forgings.length > 0 
        ? forgings.reduce((sum, f) => sum + (f.forgingResults?.efficiency || 0), 0) / forgings.length 
        : 0;

      setStats({
        totalStock: stocks.length,
        totalQuantity,
        totalSharings: sharings.length,
        totalCirculars: circulars.length,
        totalPieces,
        totalWaste: sharingWaste + circularWaste,
        sharingWaste,
        circularWaste,
        totalBhuki,
        totalForgings: forgings.length,
        totalOkPieces,
        totalScrap,
        totalRejection,
        totalBabari,
        avgEfficiency
      });

      // Combine recent activities
      const activities = [
        ...stocks.slice(0, 3).map(s => ({
          type: 'stock',
          icon: '📦',
          title: s.partName,
          subtitle: `${s.partyName} • ${s.quantity.toFixed(2)} kg`,
          date: s.date,
          color: '#48bb78'
        })),
        ...cuttings.slice(0, 3).map(c => ({
          type: 'cutting',
          icon: c.cuttingType === 'SHARING' ? '🔧' : '⭕',
          title: c.partName,
          subtitle: `${c.cuttingType} • ${c.calculations?.totalPieces || 0} pieces`,
          date: c.date,
          color: '#ed8936'
        })),
        ...forgings.slice(0, 3).map(f => ({
          type: 'forging',
          icon: '🔨',
          title: f.partName,
          subtitle: `OK: ${f.forgingResults?.finalOkPieces || 0} • ${f.forgingResults?.efficiency?.toFixed(1) || 0}%`,
          date: f.date,
          color: '#9f7aea'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

      setRecentActivities(activities);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Calculate material breakdown
  const materialBreakdown = materialSummary.reduce((acc, item) => {
    if (!acc[item.material]) {
      acc[item.material] = {
        material: item.material,
        colorCode: item.colorCode,
        totalQuantity: 0,
        items: 0
      };
    }
    acc[item.material].totalQuantity += item.totalQuantity;
    acc[item.material].items += item.count;
    return acc;
  }, {});

  const materialData = Object.values(materialBreakdown);
  const totalStock = materialData.reduce((sum, m) => sum + m.totalQuantity, 0);

  return (
    <div className="dashboard-modern">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome Back! 👋
          </h1>
          <p className="hero-subtitle">
            Here's what's happening with your manufacturing operations
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          <span className="refresh-icon">🔄</span>
          Refresh Data
        </button>
      </div>

      {/* Period Filter */}
      <div className="dashboard-filter-section">
        <div className="filter-label">
          <span className="filter-icon">📅</span>
          <span>View Data for:</span>
        </div>
        <div className="period-selector">
          {periodOptions.map(period => (
            <button
              key={period.value}
              className={`period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="quick-stats-grid">
        <div className="stat-box green">
          <div className="stat-icon-box">
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-info">
            <h3>{stats.totalStock}</h3>
            <p>Stock Items</p>
            <span className="stat-badge">{stats.totalQuantity.toFixed(0)} kg</span>
          </div>
        </div>

        <div className="stat-box blue">
          <div className="stat-icon-box">
            <span className="stat-icon">✂️</span>
          </div>
          <div className="stat-info">
            <h3>{stats.totalSharings + stats.totalCirculars}</h3>
            <p>Cutting Ops</p>
            <span className="stat-badge">{stats.totalPieces} pieces</span>
          </div>
        </div>

        <div className="stat-box purple">
          <div className="stat-icon-box">
            <span className="stat-icon">🔨</span>
          </div>
          <div className="stat-info">
            <h3>{stats.totalForgings}</h3>
            <p>Forging Ops</p>
            <span className="stat-badge">{stats.totalOkPieces} OK</span>
          </div>
        </div>

        <div className="stat-box orange">
          <div className="stat-icon-box">
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-info">
            <h3>{stats.avgEfficiency.toFixed(1)}%</h3>
            <p>Efficiency</p>
            <span className="stat-badge">Avg Rate</span>
          </div>
        </div>
      </div>

      {/* Material Stock Breakdown */}
      <div className="material-stock-dashboard">
        <div className="material-stock-header">
          <h2>📊 Material Stock Overview</h2>
          <button 
            className="view-all-btn"
            onClick={() => window.location.href = '/incoming-stock'}
          >
            View All →
          </button>
        </div>
        
        <div className="material-stock-grid">
          {materialData.length === 0 ? (
            <div className="empty-materials">
              <span className="empty-icon">📦</span>
              <p>No materials in stock</p>
            </div>
          ) : (
            materialData.map((mat) => (
              <div key={mat.material} className="material-stock-card">
                <div 
                  className="material-stock-icon"
                  style={{ backgroundColor: getColorStyle(mat.colorCode) }}
                >
                  <span className="material-initial">
                    {mat.material.charAt(0)}
                  </span>
                </div>
                <div className="material-stock-info">
                  <h3>{mat.material}</h3>
                  <div className="material-stock-meta">
                    <span className="stock-quantity">{mat.totalQuantity.toFixed(0)} kg</span>
                    <span className="stock-items">{mat.items} items</span>
                  </div>
                  <div className="material-progress-bar">
                    <div 
                      className="material-progress-fill"
                      style={{ 
                        width: `${totalStock > 0 ? (mat.totalQuantity / totalStock) * 100 : 0}%`,
                        backgroundColor: getColorStyle(mat.colorCode)
                      }}
                    ></div>
                  </div>
                  <span className="stock-percentage">
                    {totalStock > 0 ? ((mat.totalQuantity / totalStock) * 100).toFixed(1) : 0}% of total
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Comparison */}
      {(monthlyStockStats.length > 0 || monthlyCuttingStats.length > 0 || monthlyForgingStats.length > 0) && (
        <div className="monthly-comparison">
          <h2>📊 Monthly Performance Comparison</h2>
          <div className="comparison-grid">
            {/* Stock Comparison */}
            {monthlyStockStats.length > 0 && (
              <div className="comparison-card stock">
                <h3>📦 Stock Additions</h3>
                <div className="comparison-chart">
                  {monthlyStockStats.slice(0, 6).map((stat, index) => (
                    <div key={`${stat.year}-${stat.month}`} className="chart-bar-wrapper">
                      <div className="chart-label">{stat.monthName.slice(0, 3)}</div>
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar stock-bar"
                          style={{ 
                            height: `${(stat.totalItems / Math.max(...monthlyStockStats.map(s => s.totalItems))) * 100}%` 
                          }}
                        >
                          <span className="bar-value">{stat.totalItems}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cutting Comparison */}
            {monthlyCuttingStats.length > 0 && (
              <div className="comparison-card cutting">
                <h3>✂️ Cutting Operations</h3>
                <div className="comparison-chart">
                  {monthlyCuttingStats.slice(0, 6).map((stat) => (
                    <div key={`${stat.year}-${stat.month}`} className="chart-bar-wrapper">
                      <div className="chart-label">{stat.monthName.slice(0, 3)}</div>
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar cutting-bar"
                          style={{ 
                            height: `${(stat.totalOperations / Math.max(...monthlyCuttingStats.map(s => s.totalOperations))) * 100}%` 
                          }}
                        >
                          <span className="bar-value">{stat.totalOperations}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forging Comparison */}
            {monthlyForgingStats.length > 0 && (
              <div className="comparison-card forging">
                <h3>🔨 Forging Operations</h3>
                <div className="comparison-chart">
                  {monthlyForgingStats.slice(0, 6).map((stat) => (
                    <div key={`${stat.year}-${stat.month}`} className="chart-bar-wrapper">
                      <div className="chart-label">{stat.monthName.slice(0, 3)}</div>
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar forging-bar"
                          style={{ 
                            height: `${(stat.totalOperations / Math.max(...monthlyForgingStats.map(s => s.totalOperations))) * 100}%` 
                          }}
                        >
                          <span className="bar-value">{stat.totalOperations}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Production Overview */}
        <div className="dashboard-card production-card">
          <div className="card-header">
            <h2>🏭 Production Overview</h2>
            <span className="card-badge">Live</span>
          </div>
          <div className="production-metrics">
            <div className="metric-item">
              <div className="metric-label">Cut Pieces</div>
              <div className="metric-value">{stats.totalPieces}</div>
              <div className="metric-bar">
                <div className="metric-fill blue" style={{width: '85%'}}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Final OK</div>
              <div className="metric-value">{stats.totalOkPieces}</div>
              <div className="metric-bar">
                <div className="metric-fill green" style={{width: '75%'}}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Scrap</div>
              <div className="metric-value">{stats.totalScrap}</div>
              <div className="metric-bar">
                <div className="metric-fill red" style={{width: '15%'}}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Rejection</div>
              <div className="metric-value">{stats.totalRejection}</div>
              <div className="metric-bar">
                <div className="metric-fill orange" style={{width: '10%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Analysis */}
        <div className="dashboard-card waste-card">
          <div className="card-header">
            <h2>🗑️ Waste Analysis</h2>
          </div>
          <div className="waste-chart">
            <div className="waste-circle">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                <circle 
                  cx="100" 
                  cy="100" 
                  r="80" 
                  fill="none" 
                  stroke="#f56565" 
                  strokeWidth="20"
                  strokeDasharray={`${(stats.totalWaste / (stats.totalQuantity || 1)) * 502} 502`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="waste-center">
                <h3>{stats.totalWaste.toFixed(2)}</h3>
                <p>kg</p>
              </div>
            </div>
            <div className="waste-breakdown">
              <div className="waste-item">
                <span className="waste-dot sharing"></span>
                <span>Sharing: {stats.sharingWaste.toFixed(2)} kg</span>
              </div>
              <div className="waste-item">
                <span className="waste-dot circular"></span>
                <span>Circular: {stats.circularWaste.toFixed(2)} kg</span>
              </div>
              <div className="waste-item">
                <span className="waste-dot bhuki"></span>
                <span>Bhuki: {stats.totalBhuki.toFixed(2)} kg</span>
              </div>
              <div className="waste-item">
                <span className="waste-dot babari"></span>
                <span>Babari: {stats.totalBabari.toFixed(2)} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h2>⚡ Recent Activity</h2>
            <span className="view-all">View All →</span>
          </div>
          <div className="activity-timeline">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon" style={{background: activity.color}}>
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.subtitle}</p>
                  <span className="activity-time">
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-modern">
        <button className="action-card green" onClick={() => window.location.href = '/incoming-stock'}>
          <span className="action-icon">📦</span>
          <span className="action-text">Add Stock</span>
        </button>
        <button className="action-card blue" onClick={() => window.location.href = '/cutting'}>
          <span className="action-icon">✂️</span>
          <span className="action-text">New Cutting</span>
        </button>
        <button className="action-card purple" onClick={() => window.location.href = '/forging'}>
          <span className="action-icon">🔨</span>
          <span className="action-text">New Forging</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
