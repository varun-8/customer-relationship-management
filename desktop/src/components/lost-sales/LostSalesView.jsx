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
    <div className="kpi-view-container lost-sales-container" style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Minimalist Scorecard Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Total Lost Revenue */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #FEE2E2',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(220, 38, 38, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: '800', textTransform: 'uppercase' }}>
              Total Lost Revenue ({selectedMonth})
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#DC2626', marginTop: '2px' }}>
              ₹{(analytics?.totalLostValue || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              <strong>{analytics?.totalLostDeals || 0}</strong> deals • Avg: ₹{(analytics?.avgLostDealValue || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Card 2: Top Winning Competitor */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #FFEDD5',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: '#C2410C', fontWeight: '800', textTransform: 'uppercase' }}>
              Top Competing Showroom
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topCompetitor ? topCompetitor.competitor : 'None'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              {topCompetitor ? `Captured ₹${topCompetitor.totalValue.toLocaleString('en-IN')} (${topCompetitor.count} deals)` : 'Zero competitor losses'}
            </div>
          </div>
        </div>

        {/* Card 3: Primary Root Cause */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #FEF3C7',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(217, 119, 6, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: '#B45309', fontWeight: '800', textTransform: 'uppercase' }}>
              Primary Root Cause
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topReason ? topReason.reason : 'No Data'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              {topReason ? `${topReason.percentage}% of lost inquiries` : 'Record reasons to track'}
            </div>
          </div>
        </div>

        {/* Card 4: Price Gap Analysis */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #BFDBFE',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#1D4ED8', fontWeight: '800', textTransform: 'uppercase' }}>
              Avg Pricing Gap
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#2563EB', marginTop: '2px' }}>
              ₹{(analytics?.averagePriceDifference || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              Competitor discount variance
            </div>
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
                style={{ width: '220px', paddingLeft: '28px', borderRadius: '8px', fontSize: '12.5px' }}
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
                style={{ borderRadius: '8px', padding: '5px 8px' }}
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
              style={{ minWidth: '135px', borderRadius: '8px', fontSize: '12.5px' }}
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
              style={{ borderRadius: '8px', fontSize: '12.5px' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchData}
            title="Refresh records"
            style={{ borderRadius: '8px', padding: '6px 10px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            title="Export CSV"
            style={{ borderRadius: '8px', padding: '6px 12px', gap: '6px' }}
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
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '8px', fontWeight: '800' }}
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
            <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
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
              style={{ marginTop: '14px', backgroundColor: '#DC2626', borderColor: '#DC2626', borderRadius: '8px' }}
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
                  const initial = (s.customerName || 'C').charAt(0).toUpperCase();

                  return (
                    <tr key={s._id}>
                      {/* Date */}
                      <td style={{ fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {s.dateString}
                      </td>

                      {/* Customer */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                            {initial}
                          </div>
                          <div>
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
                          </div>
                        </div>
                      </td>

                      {/* Quote Value */}
                      <td style={{ fontWeight: '800', color: '#DC2626', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
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
                      <td style={{ fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', fontSize: '12.5px' }}>
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
                              style={{ fontSize: '11px', padding: '4px 8px', color: '#059669', borderColor: '#A7F3D0', borderRadius: '6px' }}
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
