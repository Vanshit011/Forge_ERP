import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/IncomingStock.css';

const API_URL = 'https://forge-erp.vercel.app/api';

function IncomingStock() {
  const [stocks, setStocks] = useState([]);
  const [materialsInfo, setMaterialsInfo] = useState([]);
  const [materialSummary, setMaterialSummary] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // NEW: States for diameter breakdown modal
  const [showDiaBreakdown, setShowDiaBreakdown] = useState(false);
  const [selectedMaterialForBreakdown, setSelectedMaterialForBreakdown] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    dia: '',
    material: '',
    quantity: '',
    tcReport: '',
    partName: '',
    heatNo: ''
  });

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleTriggerAdd = () => {
      setShowForm(true);
      setEditingStock(null);
    };

    window.addEventListener('triggerAddNew', handleTriggerAdd);
    return () => window.removeEventListener('triggerAddNew', handleTriggerAdd);
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchMaterialsInfo();
    fetchMaterialSummary();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/incoming-stock`);
      setStocks(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setLoading(false);
    }
  };

  const fetchMaterialsInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/incoming-stock/materials`);
      setMaterialsInfo(response.data.data || []);
    } catch (error) {
      console.error('Error fetching materials info:', error);
    }
  };

  const fetchMaterialSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/incoming-stock/summary`);
      setMaterialSummary(response.data.data || []);
    } catch (error) {
      console.error('Error fetching material summary:', error);
    }
  };

  const handleMaterialClick = (materialInfo) => {
    setSelectedMaterialInfo(materialInfo);
    setFormData({
      ...formData,
      material: materialInfo.material,
      dia: ''
    });
    setShowMaterialSelector(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setShowForm(true);

    const matInfo = materialsInfo.find(m => m.material === stock.material);
    setSelectedMaterialInfo(matInfo);

    setFormData({
      date: stock.date.split('T')[0],
      partyName: stock.partyName,
      dia: stock.dia.toString(),
      material: stock.material,
      quantity: stock.quantity.toString(),
      tcReport: stock.tcReport || '',
      partName: stock.partName,
      heatNo: stock.heatNo || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dia: parseFloat(formData.dia),
        quantity: parseFloat(formData.quantity)
      };

      if (editingStock) {
        await axios.put(`${API_URL}/incoming-stock/${editingStock._id}`, payload);
        alert('✅ Stock updated successfully!');
      } else {
        await axios.post(`${API_URL}/incoming-stock`, payload);
        alert('✅ Stock added successfully!');
      }

      setShowForm(false);
      setEditingStock(null);
      setSelectedMaterialInfo(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        partyName: '',
        dia: '',
        material: '',
        quantity: '',
        tcReport: '',
        partName: '',
        heatNo: ''
      });
      fetchStocks();
      fetchMaterialSummary();
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
        fetchMaterialSummary();
      } catch (error) {
        alert('❌ Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // NEW: Handle material bar click to show diameter breakdown
  const handleMaterialBarClick = (materialName) => {
    setSelectedMaterialForBreakdown(materialName);
    setShowDiaBreakdown(true);
  };

  // NEW: Get diameter breakdown for selected material
  const getDiameterBreakdown = () => {
    if (!selectedMaterialForBreakdown) return [];

    const materialItems = materialSummary.filter(
      item => item.material === selectedMaterialForBreakdown
    );

    return materialItems.sort((a, b) => a.dia - b.dia);
  };

  const filteredStocks = stocks.filter(stock =>
    stock.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.material?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuantity = filteredStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

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
  const maxQuantity = Math.max(...materialData.map(m => m.totalQuantity), 1);

  const diameterBreakdown = getDiameterBreakdown();
  const selectedMaterialColor = materialData.find(
    m => m.material === selectedMaterialForBreakdown
  )?.colorCode;

  const totalForSelectedMaterial = diameterBreakdown.reduce(
    (sum, item) => sum + item.totalQuantity, 0
  );

  return (
    <div className="incoming-stock-modern">
      {/* Diameter Breakdown Modal */}
      {showDiaBreakdown && (
        <div className="modal-overlay" onClick={() => setShowDiaBreakdown(false)}>
          <div className="diameter-breakdown-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span 
                  className="material-dot-large"
                  style={{ backgroundColor: getColorStyle(selectedMaterialColor) }}
                ></span>
                {selectedMaterialForBreakdown} - Diameter Breakdown
              </h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowDiaBreakdown(false)}
              >
                ✖
              </button>
            </div>

            <div className="modal-body">
              {diameterBreakdown.length === 0 ? (
                <div className="empty-breakdown">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="diameter-breakdown-list">
                  {diameterBreakdown.map((item) => (
                    <div key={`${item.dia}`} className="diameter-item">
                      <div className="diameter-item-header">
                        <div className="diameter-info">
                          <span className="diameter-icon">📏</span>
                          <span className="diameter-value">{item.dia} mm</span>
                        </div>
                        <div className="quantity-badge">
                          {item.totalQuantity.toFixed(2)} kg
                        </div>
                      </div>
                      <div className="diameter-item-meta">
                        <span className="meta-item">
                          <strong>{item.count}</strong> items
                        </span>
                        <span className="meta-item">
                          Avg: <strong>{(item.avgQuantity || 0).toFixed(2)}</strong> kg/item
                        </span>
                      </div>
                      <div className="diameter-progress-bar-mini">
                        <div 
                          className="diameter-progress-fill-mini"
                          style={{ 
                            width: `${totalForSelectedMaterial > 0 ? (item.totalQuantity / totalForSelectedMaterial) * 100 : 0}%`,
                            backgroundColor: getColorStyle(selectedMaterialColor)
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-footer">
                <div className="total-summary">
                  <span>Total for {selectedMaterialForBreakdown}:</span>
                  <strong>
                    {totalForSelectedMaterial.toFixed(2)} kg
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="stock-header">
        <div className="header-left">
          <div className="title-group">
            <h1>📦 Incoming Stock</h1>
            <p className="subtitle">Manage your raw materials inventory</p>
          </div>
        </div>
        <button
          className={`add-btn ${showForm ? 'cancel' : ''}`}
          onClick={() => {
            setShowForm(!showForm);
            setEditingStock(null);
            setSelectedMaterialInfo(null);
            setFormData({
              date: new Date().toISOString().split('T')[0],
              partyName: '',
              dia: '',
              material: '',
              quantity: '',
              tcReport: '',
              partName: '',
              heatNo: ''
            });
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
              <span>Add Stock</span>
            </>
          )}
        </button>
      </div>

      {/* Material Breakdown Chart */}
      <div className="material-breakdown-section">
        <h2>📊 Material Stock Breakdown</h2>
        <p className="breakdown-hint">💡 Click on any material to see diameter-wise breakdown</p>
        <div className="material-chart">
          {materialData.length === 0 ? (
            <div className="empty-chart">
              <p>No materials in stock</p>
            </div>
          ) : (
            materialData.map((mat) => (
              <div 
                key={mat.material} 
                className="material-bar-item clickable"
                onClick={() => handleMaterialBarClick(mat.material)}
              >
                <div className="material-bar-label">
                  <div className="material-info-left">
                    <span
                      className="material-color-dot"
                      style={{ backgroundColor: getColorStyle(mat.colorCode) }}
                    ></span>
                    <span className="material-name">{mat.material}</span>
                  </div>
                  <span className="material-quantity">{mat.totalQuantity.toFixed(0)} kg</span>
                </div>
                <div className="material-bar-container">
                  <div
                    className="material-bar-fill"
                    style={{
                      width: `${(mat.totalQuantity / maxQuantity) * 100}%`,
                      backgroundColor: getColorStyle(mat.colorCode)
                    }}
                  >
                    <span className="material-bar-percentage">
                      {((mat.totalQuantity / totalQuantity) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="material-bar-meta">
                  <span>{mat.items} items</span>
                  <span className="click-hint">👆 Click for details</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stock-stats">
        <div className="stat-card-mini">
          <div className="stat-mini-icon">📊</div>
          <div className="stat-mini-info">
            <h3>{filteredStocks.length}</h3>
            <p>Total Items</p>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-mini-icon">⚖️</div>
          <div className="stat-mini-info">
            <h3>{totalQuantity.toFixed(0)}</h3>
            <p>Total Quantity (kg)</p>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-mini-icon">🏭</div>
          <div className="stat-mini-info">
            <h3>{materialData.length}</h3>
            <p>Materials</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-card-header">
            <h2>{editingStock ? '✏️ Edit Stock' : '➕ Add New Stock'}</h2>
            <p>{editingStock ? 'Update stock information' : 'Select material and fill in the details'}</p>
          </div>
          <form onSubmit={handleSubmit} className="modern-form">
            {/* Material Selection */}
            <div className="material-selection-section">
              <label>Select Material by Color *</label>
              <button
                type="button"
                className="material-selector-btn"
                onClick={() => setShowMaterialSelector(!showMaterialSelector)}
              >
                {selectedMaterialInfo ? (
                  <div className="selected-material-display">
                    <div
                      className="material-color-dot"
                      style={{ backgroundColor: selectedMaterialInfo.colorHex }}
                    ></div>
                    <span>{selectedMaterialInfo.material}</span>
                    <span className="material-color-name">({selectedMaterialInfo.color})</span>
                  </div>
                ) : (
                  <span>Click to select material</span>
                )}
              </button>

              {showMaterialSelector && (
                <div className="material-selector-dropdown">
                  <div className="material-grid">
                    {materialsInfo.map((mat) => (
                      <div
                        key={mat.material}
                        className="material-option"
                        onClick={() => handleMaterialClick(mat)}
                      >
                        <div
                          className="material-color-box"
                          style={{ backgroundColor: mat.colorHex }}
                        >
                          <span className="material-color-label">{mat.color}</span>
                        </div>
                        <div className="material-info">
                          <strong>{mat.material}</strong>
                          <span className="dia-info">
                            Dia: {mat.diameters.join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMaterialInfo && (
                <div className="selected-material-details">
                  <h4>✅ Available Diameters for {selectedMaterialInfo.material}</h4>
                  <div className="diameter-chips">
                    {selectedMaterialInfo.diameters.map((dia) => (
                      <span
                        key={dia}
                        className={`diameter-chip ${formData.dia == dia ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, dia: dia.toString() })}
                        style={{
                          borderColor: formData.dia == dia ? selectedMaterialInfo.colorHex : '#e2e8f0',
                          backgroundColor: formData.dia == dia ? selectedMaterialInfo.colorHex + '20' : 'white'
                        }}
                      >
                        {dia} mm
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-grid-modern">
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
                <label>Party Name</label>
                <input
                  type="text"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  placeholder="Enter party name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Diameter (mm)</label>
                <input
                  type="number"
                  step="0.01"
                  name="dia"
                  value={formData.dia}
                  onChange={handleInputChange}
                  placeholder="Select from chips above"
                  required
                  disabled={!selectedMaterialInfo}
                />
              </div>

              <div className="input-group">
                <label>Quantity (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="10150"
                  required
                  min="0"
                />
              </div>

              <div className="input-group">
                <label>TC Report</label>
                <input
                  type="text"
                  name="tcReport"
                  value={formData.tcReport}
                  onChange={handleInputChange}
                  placeholder="TC-2025-001"
                />
              </div>

              <div className="input-group">
                <label>Part Name</label>
                <input
                  type="text"
                  name="partName"
                  value={formData.partName}
                  onChange={handleInputChange}
                  placeholder="Chain Link"
                  required
                />
              </div>

              <div className="input-group">
                <label>Heat Number</label>
                <input
                  type="text"
                  name="heatNo"
                  value={formData.heatNo}
                  onChange={handleInputChange}
                  placeholder="HT-2025-001"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn-modern" disabled={!selectedMaterialInfo}>
              <span>{editingStock ? '💾' : '✅'}</span>
              <span>{editingStock ? 'Update Stock' : 'Add to Inventory'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by part name, party, or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading stocks...</p>
        </div>
      ) : (
        <div className="stock-grid">
          {filteredStocks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No stocks found</h3>
              <p>Add your first stock item to get started</p>
            </div>
          ) : (
            filteredStocks.map((stock) => (
              <div key={stock._id} className="stock-card">
                <div className="stock-card-header">
                  <div
                    className="stock-badge"
                    style={{
                      backgroundColor: getColorStyle(stock.colorCode),
                      color: 'white'
                    }}
                  >
                    {stock.material}
                  </div>
                  <div className="stock-actions">
                    <button
                      className="edit-btn-mini"
                      onClick={() => handleEdit(stock)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn-mini"
                      onClick={() => handleDelete(stock._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="stock-title">{stock.partName}</h3>
                <p className="stock-party">{stock.partyName}</p>

                <div className="stock-details">
                  <div className="detail-row">
                    <span className="detail-label">Diameter:</span>
                    <span className="detail-value">{stock.dia} mm</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value highlight">{stock.quantity?.toFixed(2)} kg</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Color:</span>
                    <span
                      className="color-indicator"
                      style={{
                        backgroundColor: getColorStyle(stock.colorCode),
                        color: 'white'
                      }}
                    >
                      {stock.colorCode}
                    </span>
                  </div>
                  {stock.heatNo && (
                    <div className="detail-row">
                      <span className="detail-label">Heat No:</span>
                      <span className="detail-value">{stock.heatNo}</span>
                    </div>
                  )}
                </div>

                <div className="stock-footer">
                  <span className="date-badge">
                    📅 {new Date(stock.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default IncomingStock;
