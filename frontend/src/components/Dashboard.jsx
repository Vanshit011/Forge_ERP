import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

function Dashboard() {
  const [stats, setStats] = useState({
    // INCOMING STOCK
    totalStock: 0,
    totalQuantity: 0,
    totalItems: 0,
    availableQuantity: 0,

    // CUTTING
    totalCuttingOps: 0,
    totalSharings: 0,
    totalCirculars: 0,
    totalPieces: 0,
    usedQuantity: 0,
    sharingWaste: 0,
    circularWaste: 0,
    endPieceWaste: 0,
    totalBhuki: 0,

    // FORGING
    totalForgings: 0,
    totalForgingQty: 0,
    totalOkPieces: 0,
    totalScrap: 0,
    totalRejection: 0,
    totalBabari: 0,
    avgEfficiency: 0,

    // DISPATCH
    totalDispatchedPieces: 0,
    totalChallans: 0,

    // OVERALL
    totalWaste: 0,
    wastePercentage: 0
  });

  const [incomingStockDetails, setIncomingStockDetails] = useState([]);
  const [cuttingDetails, setCuttingDetails] = useState([]);
  const [forgingDetails, setForgingDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchDetails, setDispatchDetails] = useState([]);


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [stocksRes, cuttingsRes, forgingsRes, dispatchesRes] = await Promise.all([
        axios.get(`${API_URL}/incoming-stock`),
        axios.get(`${API_URL}/cutting`),
        axios.get(`${API_URL}/forging`),
        axios.get(`${API_URL}/dispatch`)
      ]);

      const stocks = stocksRes.data.data || [];
      const cuttings = cuttingsRes.data.data || [];
      const forgings = forgingsRes.data.data || [];
      const dispatches = dispatchesRes.data.data || [];
      console.log("DISPATCH RESPONSE RAW:", dispatchesRes.data);
      console.log("DISPATCH DATA:", dispatches);
      console.log("DISPATCH COUNT:", dispatches.length);



      // INCOMING STOCK CALCULATIONS
      const totalQuantity = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const totalItems = stocks.length;
      const usedInCutting = cuttings.reduce((sum, c) => sum + (c.calculations?.totalSteelUsed || 0), 0);
      const availableQuantity = totalQuantity;

      // CUTTING CALCULATIONS
      const sharings = cuttings.filter(c => c.cuttingType === 'SHARING');
      const circulars = cuttings.filter(c => c.cuttingType === 'CIRCULAR');

      const sharingWaste = sharings.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
      const circularWaste = circulars.reduce((sum, c) => sum + (c.calculations?.totalWaste || 0), 0);
      const endPieceWaste = cuttings.reduce((sum, c) => sum + (c.calculations?.endPieceUsed || 0), 0);
      const totalBhuki = circulars.reduce((sum, c) => sum + (c.calculations?.totalBhuki || 0), 0);
      const totalPieces = cuttings.reduce((sum, c) => sum + (c.calculations?.totalPieces || 0), 0);
      const totalCuttingWaste = sharingWaste + circularWaste;

      // FORGING CALCULATIONS
      const totalForgingQty = forgings.reduce((sum, f) => sum + f.forgingQty, 0);
      const totalOkPieces = forgings.reduce((sum, f) => sum + (f.forgingResults?.finalOkPieces || 0), 0);
      const totalScrap = forgings.reduce((sum, f) => sum + (f.forgingResults?.scrapPieces || 0), 0);
      const totalRejection = forgings.reduce((sum, f) => sum + (f.rejectionQty || 0), 0);
      const totalBabari = forgings.reduce((sum, f) => sum + (f.forgingResults?.totalBabari || 0), 0);
      const avgEfficiency = forgings.length > 0
        ? forgings.reduce((sum, f) => sum + (f.forgingResults?.efficiency || 0), 0) / forgings.length
        : 0;

      const totalWaste = totalCuttingWaste + totalBabari;
      const wastePercentage = totalQuantity > 0 ? (totalWaste / totalQuantity) * 100 : 0;

      const totalDispatchedPieces = dispatches.reduce((sum, d) => sum + (d.quantity || d.qty || d.dispatchQty || 0), 0);
      const totalChallans = dispatches.length;

      setDispatchDetails(dispatches.slice(0, 5));

      setStats({
        totalStock: totalItems,
        totalQuantity,
        totalItems,
        availableQuantity,
        totalCuttingOps: cuttings.length,
        totalSharings: sharings.length,
        totalCirculars: circulars.length,
        totalPieces,
        usedQuantity: usedInCutting,
        sharingWaste,
        circularWaste,
        endPieceWaste,
        totalBhuki,
        totalForgings: forgings.length,
        totalForgingQty,
        totalOkPieces,
        totalScrap,
        totalRejection,
        totalBabari,
        avgEfficiency,
        totalWaste,
        wastePercentage,
        totalDispatchedPieces,
        totalChallans
      });

      // Set detailed data
      setIncomingStockDetails(stocks.slice(0, 5));
      setCuttingDetails(cuttings.slice(0, 5));
      setForgingDetails(forgings.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>🏭 Loading Forge ERP Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="forge-erp-dashboard">
      {/* HEADER */}
      <div className="erp-header">
        <div className="header-content">
          <h1>🏭 FORGE ERP</h1>
          <p>Comprehensive Manufacturing Management System</p>
        </div>
        <button className="refresh-btn" onClick={fetchAllData}>
          🔄 Refresh
        </button>
      </div>

      {/* MAIN OVERVIEW */}
      <div className="overview-cards">
        <div className="overview-card incoming-stock-card">
          <div className="card-header-colored incoming">
            <h3>📥 INCOMING STOCK</h3>
            <span className="card-icon">📦</span>
          </div>
          <div className="card-body">
            <div className="main-stat">
              <div className="stat-number">{stats.totalQuantity.toFixed(2)}</div>
              <div className="stat-unit">kg</div>
            </div>
            <div className="stat-details">
              <div className="detail-item">
                <span className="detail-label">Items Received:</span>
                <span className="detail-value">{stats.totalItems}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Used in Cutting:</span>
                <span className="detail-value">{stats.usedQuantity.toFixed(2)} kg</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Still Available:</span>
                <span className="detail-value success">{stats.availableQuantity.toFixed(2)} kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card cutting-card">
          <div className="card-header-colored cutting">
            <h3>✂️ CUTTING OPERATIONS</h3>
            <span className="card-icon">🔧</span>
          </div>
          <div className="card-body">
            <div className="main-stat">
              <div className="stat-number">{stats.totalPieces}</div>
              <div className="stat-unit">pcs</div>
            </div>
            <div className="stat-details">
              <div className="detail-item">
                <span className="detail-label">Total Operations:</span>
                <span className="detail-value">{stats.totalCuttingOps}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sharing Cuts:</span>
                <span className="detail-value">{stats.totalSharings}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Circular Cuts:</span>
                <span className="detail-value">{stats.totalCirculars}</span>
              </div>
              <div className="detail-item warning">
                <span className="detail-label">⚠️ Total Waste:</span>
                <span className="detail-value">{(stats.sharingWaste).toFixed(2)} kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card forging-card">
          <div className="card-header-colored forging">
            <h3>🔨 FORGING OPERATIONS</h3>
            <span className="card-icon">⚒️</span>
          </div>
          <div className="card-body">
            <div className="main-stat">
              <div className="stat-number">{stats.totalOkPieces}</div>
              <div className="stat-unit">✅ pcs</div>
            </div>
            <div className="stat-details">
              <div className="detail-item">
                <span className="detail-label">Total Operations:</span>
                <span className="detail-value">{stats.totalForgings}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Forged Qty:</span>
                <span className="detail-value">{stats.totalForgingQty} pcs</span>
              </div>
              <div className="detail-item success">
                <span className="detail-label">OK Pieces:</span>
                <span className="detail-value">{stats.totalOkPieces} pcs</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Efficiency:</span>
                <span className="detail-value success">{stats.avgEfficiency.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card dispatch-card">
          <div className="card-header-colored dispatch">
            <h3>🚚 DISPATCH</h3>
            <span className="card-icon">📦</span>
          </div>
          <div className="card-body">
            <div className="main-stat">
              <div className="stat-number">{stats.totalDispatchedPieces}</div>
              <div className="stat-unit">pcs</div>
            </div>
            <div className="stat-details">
              <div className="detail-item">
                <span className="detail-label">Total Dispatches:</span>
                <span className="detail-value">{stats.totalChallans}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Pieces Dispatched:</span>
                <span className="detail-value">{stats.totalDispatchedPieces}</span>
              </div>
            </div>
          </div>
        </div>


        <div className="overview-card waste-card">
          <div className="card-header-colored waste">
            <h3>🗑️ TOTAL WASTE</h3>
            <span className="card-icon">📊</span>
          </div>
          <div className="card-body">
            <div className="main-stat">
              <div className="stat-number error">{stats.totalWaste.toFixed(2)}</div>
              <div className="stat-unit">kg</div>
            </div>
            <div className="stat-details">
              <div className="detail-item">
                <span className="detail-label">Cutting Waste:</span>
                <span className="detail-value">{(stats.sharingWaste + stats.circularWaste).toFixed(2)} kg</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Forging Waste (Babari):</span>
                <span className="detail-value">{stats.totalBabari.toFixed(2)} kg</span>
              </div>
              <div className="detail-item warning">
                <span className="detail-label">% Loss:</span>
                <span className="detail-value">{stats.wastePercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED BREAKDOWN */}
      <div className="detailed-section">
        {/* INCOMING STOCK DETAILS */}
        <div className="details-card">
          <div className="details-header">
            <h2>📥 Recent Incoming Stock</h2>
            <a href="/incoming-stock" className="view-all">View All →</a>
          </div>
          <div className="details-table">
            <div className="table-head">
              <div className="col-part">Part Name</div>
              <div className="col-material">Material</div>
              <div className="col-qty">Quantity</div>
              <div className="col-date">Date</div>
            </div>
            <div className="table-body">
              {incomingStockDetails.length === 0 ? (
                <div className="empty-message">No incoming stock data</div>
              ) : (
                incomingStockDetails.map((item, idx) => (
                  <div key={idx} className="table-row">
                    <div className="col-part">{item.partName}</div>
                    <div className="col-material">{item.material}</div>
                    <div className="col-qty">{item.quantity.toFixed(2)} kg</div>
                    <div className="col-date">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CUTTING DETAILS */}
        <div className="details-card">
          <div className="details-header">
            <h2>✂️ Recent Cutting Operations</h2>
            <a href="/cutting" className="view-all">View All →</a>
          </div>
          <div className="details-table">
            <div className="table-head">
              <div className="col-part">Part</div>
              <div className="col-type">Type</div>
              <div className="col-pieces">Pieces</div>
              <div className="col-waste">Waste</div>
              <div className="col-date">Date</div>
            </div>
            <div className="table-body">
              {cuttingDetails.length === 0 ? (
                <div className="empty-message">No cutting data</div>
              ) : (
                cuttingDetails.map((item, idx) => (
                  <div key={idx} className="table-row">
                    <div className="col-part">{item.partName}</div>
                    <div className="col-type">
                      <span className={`type-badge ${item.cuttingType.toLowerCase()}`}>
                        {item.cuttingType === 'SHARING' ? '🔧' : '⭕'} {item.cuttingType}
                      </span>
                    </div>
                    <div className="col-pieces">{item.calculations?.totalPieces || 0} pcs</div>
                    <div className="col-waste">{(item.calculations?.totalWaste || 0).toFixed(2)} kg</div>
                    <div className="col-date">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FORGING DETAILS */}
        <div className="details-card">
          <div className="details-header">
            <h2>🔨 Recent Forging Operations</h2>
            <a href="/forging" className="view-all">View All →</a>
          </div>
          <div className="details-table">
            <div className="table-head">
              <div className="col-part">Part</div>
              <div className="col-forged">Forged</div>
              <div className="col-ok">✅ OK</div>
              <div className="col-reject">❌ Reject</div>
              <div className="col-eff">Efficiency</div>
            </div>
            <div className="table-body">
              {forgingDetails.length === 0 ? (
                <div className="empty-message">No forging data</div>
              ) : (
                forgingDetails.map((item, idx) => (
                  <div key={idx} className="table-row">
                    <div className="col-part">{item.partName}</div>
                    <div className="col-forged">{item.forgingQty} pcs</div>
                    <div className="col-ok success">{item.forgingResults?.finalOkPieces || 0}</div>
                    <div className="col-reject error">{item.rejectionQty}</div>
                    <div className="col-eff success">{item.forgingResults?.efficiency?.toFixed(1) || 0}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* DISPATCH DETAILS */}
        <div className="details-card">
          <div className="details-header">
            <h2>🚚 Recent Dispatches</h2>
            <a href="/dispatch" className="view-all">View All →</a>
          </div>
          {/* <div className="details-summary">
            <div>Total Dispatched Pieces: {stats.totalDispatchedPieces}</div>
            <div>Total Challans: {stats.totalChallans}</div>
          </div> */}
          <div className="details-table">
            <div className="table-head">
              <div className="col-party">Party Name</div>
              <div className="col-challan">Challan No</div>
              <div className="col-qty">Qty</div>
              <div className="col-date">Date</div>
            </div>
            <div className="table-body">
              {dispatchDetails.length === 0 ? (
                <div className="empty-message">No dispatch records</div>
              ) : (
                dispatchDetails.map((item, idx) => (
                  <div key={idx} className="table-row">
                    <div className="col-party">{item.partyName}</div>
                    <div className="col-challan">{item.challanNo}</div>
                    <div className="col-qty">{item.dispatchQty} pcs</div>
                    <div className="col-date">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* WASTE BREAKDOWN */}
      <div className="waste-breakdown-section">
        <h2>🗑️ Detailed Waste Breakdown</h2>
        <div className="waste-breakdown-grid">
          <div className="waste-item">
            <div className="waste-icon">🔧</div>
            <div className="waste-details">
              <h4>Sharing Waste</h4>
              <p className="waste-value">{stats.sharingWaste.toFixed(2)} kg</p>
              <p className="waste-source">From {stats.totalSharings} sharing cuts</p>
            </div>
          </div>

          <div className="waste-item">
            <div className="waste-icon">⭕</div>
            <div className="waste-details">
              <h4>Circular Waste</h4>
              <p className="waste-value">{stats.circularWaste.toFixed(2)} kg</p>
              <p className="waste-source">From {stats.totalCirculars} circular cuts</p>
            </div>
          </div>

          <div className="waste-item">
            <div className="waste-icon">📏</div>
            <div className="waste-details">
              <h4>End Pieces</h4>
              <p className="waste-value">{stats.endPieceWaste.toFixed(2)} kg</p>
              <p className="waste-source">Leftover from cutting</p>
            </div>
          </div>

          <div className="waste-item">
            <div className="waste-icon">🔥</div>
            <div className="waste-details">
              <h4>Bhuki (Scrap)</h4>
              <p className="waste-value">{stats.totalBhuki.toFixed(2)} kg</p>
              <p className="waste-source">From circular operations</p>
            </div>
          </div>

          <div className="waste-item">
            <div className="waste-icon">💛</div>
            <div className="waste-details">
              <h4>Babari (Flash)</h4>
              <p className="waste-value">{stats.totalBabari.toFixed(2)} kg</p>
              <p className="waste-source">From {stats.totalForgings} forging ops</p>
            </div>
          </div>

          <div className="waste-item highlight">
            <div className="waste-icon">📊</div>
            <div className="waste-details">
              <h4>Total Waste</h4>
              <p className="waste-value error">{stats.totalWaste.toFixed(2)} kg</p>
              <p className="waste-source">{stats.wastePercentage.toFixed(1)}% of total material</p>
            </div>
          </div>
        </div>
      </div>

      {/* PROCESS FLOW DIAGRAM */}
      <div className="process-flow">
        <h2>📊 Material Flow Diagram</h2>
        <div className="flow-container">
          <div className="flow-stage">
            <div className="flow-title">INCOMING</div>
            <div className="flow-box">
              <div className="flow-number">{stats.totalQuantity.toFixed(2)} kg</div>
              <div className="flow-label">Raw Steel</div>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-stage">
            <div className="flow-title">CUTTING</div>
            <div className="flow-box">
              <div className="flow-number">{stats.totalPieces}</div>
              <div className="flow-label">Pieces Cut</div>
              <div className="flow-sub">Waste: {(stats.sharingWaste + stats.circularWaste).toFixed(2)} kg</div>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-stage">
            <div className="flow-title">FORGING</div>
            <div className="flow-box">
              <div className="flow-number">{stats.totalOkPieces}</div>
              <div className="flow-label">✅ Final Pieces</div>
              <div className="flow-sub">Efficiency: {stats.avgEfficiency.toFixed(1)}%</div>
            </div>
          </div>

          <div className="flow-arrow">→</div>


          <div className="flow-stage">
            <div className="flow-title">DISPATCH</div>
            <div className="flow-box dispatch-box">
              <div className="flow-number">{stats.totalDispatchedPieces}</div>
              <div className="flow-label">Dispatched Pieces</div>
            </div>
          </div>

          <div className="flow-arrow">→</div>


          <div className="flow-stage">
            <div className="flow-title">WASTE</div>
            <div className="flow-box waste-box">
              <div className="flow-number">{stats.totalWaste.toFixed(2)} kg</div>
              <div className="flow-label">Scrap & Babari</div>
              <div className="flow-sub">{stats.wastePercentage.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-buttons">
          <button className="action-btn add-stock" onClick={() => window.location.href = '/incoming-stock'}>
            <span className="btn-icon">📦</span>
            <span className="btn-text">Add Incoming Stock</span>
          </button>
          <button className="action-btn new-cutting" onClick={() => window.location.href = '/cutting'}>
            <span className="btn-icon">✂️</span>
            <span className="btn-text">New Cutting</span>
          </button>
          <button className="action-btn new-forging" onClick={() => window.location.href = '/forging'}>
            <span className="btn-icon">🔨</span>
            <span className="btn-text">New Forging</span>
          </button>
          <button className="action-btn new-dispatch" onClick={() => window.location.href = '/dispatch'}>
            <span className="btn-icon">🚚</span>
            <span className="btn-text">New Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
