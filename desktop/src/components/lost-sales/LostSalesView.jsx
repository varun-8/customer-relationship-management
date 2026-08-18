import React, { useState, useEffect, useMemo } from 'react';
import {
  FileX,
  Plus,
  IndianRupee,
  TrendingDown,
  Building2,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle,
  RotateCcw,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Award,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { LostSaleModal } from './LostSaleModal';

export const LostSalesView = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  // State
  const [lostSales, setLostSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));
  const [productFilter, setProductFilter] = useState('all');
  const [competitorFilter, setCompetitorFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [reopeningRecord, setReopeningRecord] = useState(null);
  const [winBackNotes, setWinBackNotes] = useState('');

  // Fetch lost sales list & analytics
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        month: selectedMonth,
      };
      if (search.trim()) params.search = search.trim();
      if (productFilter !== 'all') params.product = productFilter;
      if (competitorFilter !== 'all') params.competitor = competitorFilter;
      if (staffFilter !== 'all') params.salesperson = staffFilter;

      const [listRes, analyticsRes] = await Promise.all([
        api.getLostSalesList(params),
        api.getLostSalesAnalytics({ month: selectedMonth, salesperson: staffFilter }),
      ]);

      if (listRes.success) setLostSales(listRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error('Error fetching lost sales:', err);
      setError(err.message || 'Failed to load lost sales intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, productFilter, competitorFilter, staffFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete lost sale record for ${name}?`)) return;
    try {
      await api.deleteLostSale(id);
      fetchData();
    } catch (e) {
      alert(e.message || 'Failed to delete record');
    }
  };

  const handleReopenSubmit = async () => {
    if (!reopeningRecord) return;
    try {
      await api.reopenLostSale(reopeningRecord._id, winBackNotes);
      setReopeningRecord(null);
      setWinBackNotes('');
      fetchData();
    } catch (e) {
      alert(e.message || 'Failed to reopen deal');
    }
  };

  const handleExportCSV = () => {
    if (lostSales.length === 0) {
      alert('No lost sales records to export');
      return;
    }

    const headers = [
      'Date',
      'Customer ID',
      'Customer Name',
      'Phone',
      'Quote Value (INR)',
      'Product Categories',
      'Salesperson',
      'Lost Reason',
      'Winning Competitor',
      'Price Difference (INR)',
      'Price Gap %',
      'Status',
      'Notes',
    ];

    const rows = lostSales.map((s) => [
      s.dateString,
      `"${s.customerId || ''}"`,
      `"${s.customerName}"`,
      `"${s.phone || ''}"`,
      s.quoteValue || 0,
      `"${(s.products || []).join(', ')}"`,
      `"${s.salesperson}"`,
      `"${s.lostReason}"`,
      `"${s.competitor}"`,
      s.priceDifference || 0,
      `${s.priceDiffPercentage || 0}%`,
      s.status,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lost_Sales_Analysis_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topReason = analytics?.reasonsBreakdown?.[0];
  const topCompetitor = analytics?.competitorLeaderboard?.[0];
  const productBreakdown = analytics?.productBreakdown || [];

  return (
    <div className="kpi-view-container lost-sales-container">
      {/* 1. Executive Intelligence Stat Cards */}
      <div className="kpi-stats-grid">
        {/* Card 1: Total Lost Revenue */}
        <div className="kpi-stat-card lost-stat-card-red">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">TOTAL LOST REVENUE ({selectedMonth})</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#DC2626' }}>
            ₹{(analytics?.totalLostValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-stat-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Lost Deals: <strong>{analytics?.totalLostDeals || 0} quotations</strong></span>
            <span>Avg: <strong>₹{(analytics?.avgLostDealValue || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Card 2: Top Winning Competitor */}
        <div className="kpi-stat-card lost-stat-card-orange">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">TOP COMPETING SHOWROOM</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FFEDD5', color: '#EA580C' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ fontSize: '20px', color: '#0F172A' }}>
            {topCompetitor ? topCompetitor.competitor : 'No Data Yet'}
          </div>
          <div className="kpi-stat-footer">
            {topCompetitor ? (
              <span>Captured <strong>₹{topCompetitor.totalValue.toLocaleString('en-IN')}</strong> ({topCompetitor.count} deals)</span>
            ) : (
              <span>No competitor losses logged this month</span>
            )}
          </div>
        </div>

        {/* Card 3: Primary Root Cause */}
        <div className="kpi-stat-card lost-stat-card-amber">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">PRIMARY ROOT CAUSE</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ fontSize: '17px', color: '#B45309', lineHeight: 1.3 }}>
            {topReason ? topReason.reason : 'No Data Yet'}
          </div>
          <div className="kpi-stat-footer">
            {topReason ? (
              <span>Represents <strong>{topReason.percentage}%</strong> of all lost deals</span>
            ) : (
              <span>Add lost reasons to see distribution</span>
            )}
          </div>
        </div>

        {/* Card 4: Price Gap Analysis */}
        <div className="kpi-stat-card lost-stat-card-blue">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">AVERAGE PRICING GAP</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#2563EB' }}>
            ₹{(analytics?.averagePriceDifference || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-stat-footer">
            <span>Average competitor discount vs our quote</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Intelligence Panels: Reasons & Competitor Landscape */}
      {analytics && analytics.totalLostDeals > 0 && (
        <div className="lost-charts-grid">
          {/* Panel A: Root Cause Distribution */}
          <div className="lost-panel-card">
            <div className="lost-panel-header">
              <span className="lost-panel-title">📊 Root Cause Distribution</span>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>By deal volume</span>
            </div>
            <div className="lost-reasons-list">
              {(analytics.reasonsBreakdown || []).slice(0, 5).map((r) => (
                <div key={r.reason} className="lost-reason-item">
                  <div className="lost-reason-label-row">
                    <span className="lost-reason-name">{r.reason}</span>
                    <span className="lost-reason-val">
                      {r.count} deals ({r.percentage}%) • ₹{r.totalValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="lost-bar-track">
                    <div
                      className="lost-bar-fill"
                      style={{ width: `${Math.min(r.percentage, 100)}%`, backgroundColor: '#DC2626' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel B: Competitor Market Share Loss */}
          <div className="lost-panel-card">
            <div className="lost-panel-header">
              <span className="lost-panel-title">🏆 Competitor Loss Leaderboard</span>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Showrooms winning quotes</span>
            </div>
            <div className="lost-competitors-list">
              {(analytics.competitorLeaderboard || []).slice(0, 5).map((c, idx) => (
                <div key={c.competitor} className="lost-competitor-item">
                  <div className="lost-comp-rank">#{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>
                      {c.competitor}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {c.count} {c.count === 1 ? 'deal' : 'deals'} captured
                    </div>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '13.5px', color: '#DC2626' }}>
                    ₹{c.totalValue.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel C: Product Lines Impact */}
          <div className="lost-panel-card">
            <div className="lost-panel-header">
              <span className="lost-panel-title">📦 Product Line Impact</span>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Category leakage</span>
            </div>
            <div className="lost-product-leakage-grid">
              {['Tile', 'Sanitary', 'CP', 'Adhesive'].map((pName) => {
                const pData = productBreakdown.find((p) => p.product === pName) || { count: 0, value: 0 };
                return (
                  <div key={pName} className="lost-prod-impact-card">
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569' }}>
                      {pName}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#991B1B', margin: '4px 0' }}>
                      ₹{pData.value.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {pData.count} {pData.count === 1 ? 'quote' : 'quotes'} lost
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter & Action Toolbar */}
      <div className="kpi-header-toolbar">
        <div className="kpi-toolbar-left-group">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="Search by customer, competitor, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '220px', paddingLeft: '28px' }}
              />
              <Search
                size={13}
                style={{ position: 'absolute', left: '9px', top: '9px', color: '#94A3B8' }}
              />
            </div>
            {search && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setSearch(''); fetchData(); }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Product Pill Filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'Tile', 'Sanitary', 'CP', 'Adhesive'].map((p) => (
              <button
                key={p}
                type="button"
                className={`lost-pill-filter ${productFilter === p ? 'lost-pill-filter-active' : ''}`}
                onClick={() => setProductFilter(p)}
              >
                {p === 'all' ? 'All Products' : p}
              </button>
            ))}
          </div>
        </div>

        <div className="kpi-toolbar-right-group">
          {/* Staff Filter */}
          <div className="kpi-filter-box">
            <span className="kpi-filter-label">Staff:</span>
            <select
              className="form-select form-select-sm"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="all">All Sales Staff</option>
              <option value="Karthik Raja">Karthik Raja</option>
              <option value="Senthil Kumar">Senthil Kumar</option>
              <option value="Priya Dharshini">Priya Dharshini</option>
              <option value="Manoj Kumar">Manoj Kumar</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="kpi-filter-box">
            <span className="kpi-filter-label">Month:</span>
            <input
              type="month"
              className="form-input form-input-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchData}
            title="Refresh records"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingRecord(null);
              setShowModal(true);
            }}
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} />
            <span>Record Lost Sale</span>
          </button>
        </div>
      </div>

      {/* 4. Lost Sales Deals Table */}
      <div className="kpi-table-card">
        <div className="kpi-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileX size={16} color="#DC2626" />
            <span style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>
              Lost Sales Intelligence Ledger ({lostSales.length} records)
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Root causes, competitor prices & win-back tracking
          </span>
        </div>

        {lostSales.length === 0 ? (
          <div className="kpi-empty-state">
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏷️</div>
            <div className="kpi-empty-title">No lost sales logged for {selectedMonth}</div>
            <div className="kpi-empty-sub">
              Record lost quotations to uncover competitor discounts, popular competing showrooms, and pricing gaps.
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowModal(true)}
              style={{ marginTop: '14px', backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              + Record Lost Sale
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Quote Value</th>
                  <th>Products</th>
                  <th>Salesperson</th>
                  <th>Lost Reason</th>
                  <th>Competitor</th>
                  <th>Price Gap</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lostSales.map((s) => {
                  const isWinBack = s.status === 'win_back';

                  return (
                    <tr key={s._id}>
                      {/* Date */}
                      <td style={{ fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {s.dateString}
                      </td>

                      {/* Customer */}
                      <td>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
                          {s.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', gap: '6px' }}>
                          {s.customerId && (
                            <span style={{ color: '#2563EB', fontWeight: '700', fontFamily: 'monospace' }}>
                              #{s.customerId}
                            </span>
                          )}
                          {s.phone && <span>📞 {s.phone}</span>}
                        </div>
                      </td>

                      {/* Quote Value */}
                      <td style={{ fontWeight: '900', color: '#DC2626', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                        ₹{(s.quoteValue || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Products */}
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(s.products || ['Tile']).map((p) => (
                            <span key={p} className="lost-prod-tag">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Salesperson */}
                      <td style={{ fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                        {s.salesperson}
                      </td>

                      {/* Lost Reason */}
                      <td>
                        <span className="lost-reason-pill" title={s.notes || s.lostReason}>
                          {s.lostReason}
                        </span>
                      </td>

                      {/* Competitor */}
                      <td>
                        <span className="lost-competitor-tag">
                          🏢 {s.competitor}
                        </span>
                      </td>

                      {/* Price Difference */}
                      <td>
                        {s.priceDifference > 0 ? (
                          <span className="lost-gap-badge">
                            -₹{s.priceDifference.toLocaleString('en-IN')}
                            {s.priceDiffPercentage > 0 ? ` (${s.priceDiffPercentage}%)` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '11.5px' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {isWinBack ? (
                          <span className="kpi-status-badge kpi-status-closed">
                            ⚡ Win-Back
                          </span>
                        ) : (
                          <span className="kpi-status-badge" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECDD3' }}>
                            Lost
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {!isWinBack && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '11px', padding: '3px 7px', color: '#059669', borderColor: '#A7F3D0' }}
                              title="Reopen deal as Win-Back opportunity"
                              onClick={() => setReopeningRecord(s)}
                            >
                              <RotateCcw size={12} style={{ marginRight: '3px' }} />
                              <span>Win-Back</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit Lost Sale"
                            onClick={() => {
                              setEditingRecord(s);
                              setShowModal(true);
                            }}
                          >
                            <Edit2 size={13} color="#2563EB" />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Delete"
                            onClick={() => handleDelete(s._id, s.customerName)}
                          >
                            <Trash2 size={13} color="#DC2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record / Edit Lost Sale Modal */}
      {showModal && (
        <LostSaleModal
          initialData={editingRecord}
          onClose={() => {
            setShowModal(false);
            setEditingRecord(null);
          }}
          onSaved={fetchData}
        />
      )}

      {/* Win-Back Reopen Confirmation Dialog */}
      {reopeningRecord && (
        <div className="modal-overlay" onClick={() => setReopeningRecord(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#065F46' }}>
                ⚡ Reopen Deal as Win-Back Opportunity
              </h3>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                Marking <strong>{reopeningRecord.customerName}</strong> (₹{reopeningRecord.quoteValue.toLocaleString('en-IN')}) as a Win-Back opportunity.
                This will move the lead back to active negotiation in the CRM.
              </p>
              <label className="form-label" style={{ marginTop: '10px' }}>
                Win-Back Strategy / Special Offer Notes:
              </label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="e.g. Matched competitor price with 5% discount + free transport..."
                value={winBackNotes}
                onChange={(e) => setWinBackNotes(e.target.value)}
              />
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReopeningRecord(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: '800' }}
                onClick={handleReopenSubmit}
              >
                ✓ Reopen & Win-Back Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
