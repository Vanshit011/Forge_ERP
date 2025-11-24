import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import '../styles/Dispatch.css'; // We can reuse forging styles or create Dispatch.css

const API_URL = import.meta.env.VITE_API_URL;

function Dispatch() {
  const [dispatches, setDispatches] = useState([]);
  const [availableStock, setAvailableStock] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const [formData, setFormData] = useState({
    forgingId: '',
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    challanNo: '',
    dispatchQty: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDispatches();
    fetchAvailableStock();
  }, []);

  const fetchDispatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/dispatch`);
      setDispatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching dispatches:', error);
    }
  };

  const fetchAvailableStock = async () => {
    try {
      const response = await axios.get(`${API_URL}/dispatch/available-stock`);
      setAvailableStock(response.data.data || []);
    } catch (error) {
      console.error('Error fetching available stock:', error);
    }
  };

  const handleStockSelect = (e) => {
    const stockId = e.target.value;
    const stock = availableStock.find(s => s._id === stockId);
    setSelectedStock(stock || null);
    setFormData(prev => ({ ...prev, forgingId: stockId }));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStock) return alert('Please select stock');
    
    // Validation
    const qty = parseInt(formData.dispatchQty);
    if (qty > selectedStock.availableQty) {
      return alert(`Cannot dispatch more than available! Max: ${selectedStock.availableQty}`);
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/dispatch`, formData);
      alert('✅ Dispatch successful!');
      
      // Reset and Refresh
      setFormData({
        forgingId: '',
        date: new Date().toISOString().split('T')[0],
        partyName: '',
        challanNo: '',
        dispatchQty: '',
        remarks: ''
      });
      setSelectedStock(null);
      setShowForm(false);
      fetchDispatches();
      fetchAvailableStock();
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this dispatch record? Stock will be restored.')) {
      try {
        await axios.delete(`${API_URL}/dispatch/${id}`);
        fetchDispatches();
        fetchAvailableStock();
      } catch (error) {
        alert('Error deleting');
      }
    }
  };

  // Calculate Summary Stats
  const totalDispatched = dispatches.reduce((sum, d) => sum + d.dispatchQty, 0);
  const totalReadyToDispatch = availableStock.reduce((sum, s) => sum + s.availableQty, 0);

  const getColorStyle = (colorCode) => {
    const colorMap = {
      'GREEN': '#10b981', 'ORANGE': '#f97316', 'PURPLE': '#a855f7',
      'COFFEE': '#92400e', 'GRAY': '#6b7280', 'YELLOW': '#eab308',
      'BLACK': '#1f2937', 'WHITE': '#f3f4f6'
    };
    return colorMap[colorCode] || '#6b7280';
  };

  return (
    <div className="forging-modern"> {/* Reusing forging CSS class for layout */}
      
      {/* Header */}
      <div className="forging-header">
        <div className="title-group">
          <h1>🚚 Dispatch Operations</h1>
          <p className="subtitle">Manage outgoing material and challans</p>
        </div>
        <button className={`add-btn ${showForm ? 'cancel' : ''}`} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Cancel' : '+ New Dispatch'}
        </button>
      </div>

      {/* Stats */}
      <div className="forging-stats">
        <div className="forging-stat-card">
          <div className="stat-icon-modern">📦</div>
          <div className="stat-info-modern">
            <h3>{totalReadyToDispatch}</h3>
            <p>Ready to Dispatch (pcs)</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">🚚</div>
          <div className="stat-info-modern">
            <h3>{totalDispatched}</h3>
            <p>Total Dispatched (pcs)</p>
          </div>
        </div>
        <div className="forging-stat-card">
          <div className="stat-icon-modern">📄</div>
          <div className="stat-info-modern">
            <h3>{dispatches.length}</h3>
            <p>Total Challans</p>
          </div>
        </div>
      </div>

      {/* Stock Ready for Dispatch Summary */}
      {availableStock.length > 0 && (
        <div className="forging-stock-section">
          <h2>🏁 Stock Ready for Dispatch</h2>
          <div className="forging-stock-grid">
            {availableStock.map((stock) => (
              <div key={stock._id} className="forging-stock-card" style={{ cursor: 'default', borderLeft: `4px solid ${getColorStyle(stock.colorCode)}` }}>
                <div className="stock-card-header">
                  <div className="stock-header-info">
                    <h3>{stock.partName}</h3>
                    <span className="dia-badge">{stock.size}</span>
                    <span style={{fontSize:'0.8rem', color:'#666'}}>({stock.material})</span>
                  </div>
                </div>
                <div className="stock-metrics">
                  <div className="metric">
                    <span>✅</span>
                    <div><strong>{stock.producedQty}</strong><span>Produced</span></div>
                  </div>
                  <div className="metric">
                    <span>🚚</span>
                    <div><strong>{stock.dispatchedQty}</strong><span>Sent</span></div>
                  </div>
                  <div className="metric">
                    <span>📦</span>
                    <div><strong style={{color: '#10b981'}}>{stock.availableQty}</strong><span>Available</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="form-card-forging">
          <div className="form-header-modern">
            <h2>🚚 Create Dispatch Challan</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-forging">
              <div className="input-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              
              <div className="input-group">
                <label>Select Forging Lot</label>
                <select name="forgingId" value={formData.forgingId} onChange={handleStockSelect} required className="select-modern">
                  <option value="">-- Select Stock --</option>
                  {availableStock.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.partName} | {s.size} | {s.material} | Avail: {s.availableQty}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStock && (
                <div className="input-group" style={{gridColumn: '1 / -1', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '5px'}}>
                  <strong>Selected:</strong> {selectedStock.partName} ({selectedStock.size})
                  <br/>
                  <strong>Available Qty:</strong> {selectedStock.availableQty} pieces
                </div>
              )}

              <div className="input-group">
                <label>Party Name</label>
                <input type="text" name="partyName" value={formData.partyName} onChange={handleInputChange} placeholder="Customer Name" required />
              </div>

              <div className="input-group">
                <label>Challan No</label>
                <input type="text" name="challanNo" value={formData.challanNo} onChange={handleInputChange} placeholder="CH-001" required />
              </div>

              <div className="input-group">
                <label>Dispatch Qty (Pieces)</label>
                <input type="number" name="dispatchQty" value={formData.dispatchQty} onChange={handleInputChange} required min="1" max={selectedStock?.availableQty} />
              </div>

              <div className="input-group">
                <label>Remarks</label>
                <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Optional" />
              </div>
            </div>
            <button type="submit" className="submit-btn-forging" disabled={loading}>
              {loading ? 'Saving...' : 'Create Dispatch'}
            </button>
          </form>
        </div>
      )}

      {/* Dispatch History List */}
      <div className="records-section">
        <h2>📄 Dispatch History</h2>
        <div className="forging-cards-grid">
          {dispatches.length === 0 ? (
            <div className="empty-state">No dispatch records</div>
          ) : (
            dispatches.map((d) => (
              <div key={d._id} className="forging-record-card">
                <div className="forging-card-header">
                  <div className="header-info">
                    <h3>{d.partyName}</h3>
                    <span className="type-badge" style={{backgroundColor: '#3b82f6'}}>Challan: {d.challanNo}</span>
                  </div>
                  <button className="delete-btn-forging" onClick={() => handleDelete(d._id)}>🗑️</button>
                </div>
                
                <div className="forging-info">
                  <div className="info-row"><span>📦 Part:</span><strong>{d.forgingId?.partName || 'Unknown'}</strong></div>
                  <div className="info-row"><span>📏 Size:</span><strong>{d.forgingId?.size}</strong></div>
                  <div className="info-row"><span>🚚 Qty:</span><strong style={{fontSize:'1.2rem'}}>{d.dispatchQty}</strong></div>
                  <div className="info-row"><span>📝 Note:</span><strong>{d.remarks || '-'}</strong></div>
                </div>

                <div className="forging-card-footer">
                  <span className="date-text">📅 {new Date(d.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default Dispatch;