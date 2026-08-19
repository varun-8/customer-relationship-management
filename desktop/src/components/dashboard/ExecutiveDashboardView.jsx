import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  IndianRupee,
  TrendingUp,
  Users,
  Receipt,
  PhoneCall,
  Clock,
  Flame,
  Layers,
  Award,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
  CheckCircle,
  ArrowUpRight,
  ArrowRight,
  Settings,
  Phone,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { SalesTargetModal } from './SalesTargetModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';

export const ExecutiveDashboardView = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));

  const [showTargetModal, setShowTargetModal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardMetrics({ month: selectedMonth });
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message || 'Failed to load executive dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const kpi = metrics?.kpi || {};
  const salespersonPerformance = metrics?.salespersonPerformance || [];
  const overdueFollowups = metrics?.overdueFollowupsList || [];
  const recentDeals = metrics?.recentDealWins || [];

  // Achievement status color
  const achievement = kpi.achievementPercent || 0;
  const achievementColor = achievement >= 100 ? '#059669' : achievement >= 70 ? '#2563EB' : achievement >= 40 ? '#D97706' : '#DC2626';

  const handleExportSummaryCSV = () => {
    if (!metrics) return;

    const headers = ['KPI Metric', 'Value'];
    const rows = [
      ['Month', selectedMonth],
      ['Sales Target (INR)', kpi.salesTarget || 0],
      ['Actual Sales (INR)', kpi.actualSales || 0],
      ['Achievement %', `${kpi.achievementPercent || 0}%`],
      ['Total Walk-ins', kpi.totalWalkins || 0],
      ['Quotations', kpi.quotations || 0],
      ['Orders Closed', kpi.orders || 0],
      ['Conversion Rate %', `${kpi.conversionRate || 0}%`],
      ['Pending Follow-ups', kpi.pendingFollowups || 0],
      ['Overdue Follow-ups', kpi.overdueFollowups || 0],
      ['Total Pipeline Value (INR)', kpi.totalPipelineValue || 0],
      ['Hot Pipeline Value (INR)', kpi.hotPipelineValue || 0],
      ['Average Bill Value (INR)', kpi.averageBillValue || 0],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Executive_Dashboard_Summary_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="kpi-view-container dashboard-container">
      {/* 1. Header Toolbar */}
      <div className="kpi-header-toolbar">
        <div className="kpi-toolbar-left-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="dash-brand-icon">
              <TrendingUp size={18} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>
                Executive Performance Dashboard
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                Live showroom revenue, conversion funnel & staff quota achievement
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-toolbar-right-group">
          {/* Month Selector */}
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
            onClick={fetchDashboardData}
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowTargetModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Settings size={13} />
            <span>Set Targets</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportSummaryCSV}
            title="Export Dashboard CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Connection Error Banner / Card */}
      {error && !metrics ? (
        <ConnectionErrorState
          title="Unable to Load Dashboard Metrics"
          message={error}
          onRetry={fetchDashboardData}
          isRetrying={loading}
        />
      ) : (
        <>
          {/* 2. Top Executive KPI Grid (11 Dimensions strictly from handwritten notes) */}
          <div className="dash-kpi-grid">
        {/* HERO CARD: 1. Sales Target, 2. Actual Sales, 3. Achievement */}
        <div className="dash-hero-target-card">
          <div className="dash-hero-header">
            <div>
              <span className="dash-hero-sub">SHOWROOM REVENUE GOAL ({selectedMonth})</span>
              <div className="dash-hero-sales">
                ₹{(kpi.actualSales || 0).toLocaleString('en-IN')}
                <span className="dash-hero-target-label">
                  / ₹{(kpi.salesTarget || 0).toLocaleString('en-IN')} target
                </span>
              </div>
            </div>
            <div className="dash-achievement-badge" style={{ backgroundColor: `${achievementColor}15`, color: achievementColor, borderColor: `${achievementColor}40` }}>
              <Zap size={14} />
              <span>{kpi.achievementPercent || 0}% Achieved</span>
            </div>
          </div>

          {/* Minimalist Progress Meter */}
          <div className="dash-progress-track">
            <div
              className="dash-progress-fill"
              style={{
                width: `${Math.min(kpi.achievementPercent || 0, 100)}%`,
                backgroundColor: achievementColor,
              }}
            />
          </div>

          <div className="dash-hero-footer">
            <span>
              Remaining to Target: <strong>₹{Math.max((kpi.salesTarget || 0) - (kpi.actualSales || 0), 0).toLocaleString('en-IN')}</strong>
            </span>
            <span>
              Run-rate: <strong>{kpi.orders || 0} bills closed</strong>
            </span>
          </div>
        </div>

        {/* CARD B: 4. Total Walk-ins, 5. Quotations, 6. Orders, 7. Conversion % */}
        <div className="kpi-stat-card kpi-stat-card-blue">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">SHOWROOM CONVERSION FUNNEL</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} />
            </div>
          </div>

          {/* Clean Visual Funnel Micro-Meter */}
          <div className="dash-funnel-steps-box">
            <div className="dash-funnel-step">
              <span className="dash-funnel-step-label">4. Walk-ins</span>
              <span className="dash-funnel-step-num" style={{ color: '#2563EB' }}>{kpi.totalWalkins || 0}</span>
            </div>
            <div className="dash-funnel-arrow">➔</div>
            <div className="dash-funnel-step">
              <span className="dash-funnel-step-label">5. Quotes</span>
              <span className="dash-funnel-step-num" style={{ color: '#0F172A' }}>{kpi.quotations || 0}</span>
            </div>
            <div className="dash-funnel-arrow">➔</div>
            <div className="dash-funnel-step">
              <span className="dash-funnel-step-label">6. Orders</span>
              <span className="dash-funnel-step-num" style={{ color: '#059669' }}>{kpi.orders || 0}</span>
            </div>
          </div>

          <div className="kpi-stat-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>7. Conversion Rate: <strong style={{ color: '#2563EB' }}>{kpi.conversionRate || 0}%</strong></span>
            <span>Quote Rate: <strong>{kpi.quoteRate || 0}%</strong></span>
          </div>
        </div>

        {/* CARD C: 8. Pending Follow-ups, 9. Overdue Follow-ups */}
        <div className="kpi-stat-card kpi-stat-card-purple">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">FOLLOW-UP HEALTH & VELOCITY</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
              <PhoneCall size={18} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '2px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>8. PENDING</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A' }}>
                {kpi.pendingFollowups || 0}
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800' }}>9. OVERDUE</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#DC2626' }}>
                {kpi.overdueFollowups || 0}
              </div>
            </div>
          </div>

          <div className="kpi-stat-footer">
            {kpi.overdueFollowups > 0 ? (
              <span style={{ color: '#DC2626', fontWeight: '700' }}>
                ⚠️ {kpi.overdueFollowups} leads need immediate follow-up!
              </span>
            ) : (
              <span style={{ color: '#059669', fontWeight: '700' }}>
                ✓ All scheduled follow-ups are up to date
              </span>
            )}
          </div>
        </div>

        {/* CARD D: 10. Pipeline & Hot Pipeline, 11. Average Bill Value */}
        <div className="kpi-stat-card kpi-stat-card-amber">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">PIPELINE & DEAL SIZE</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Flame size={18} />
            </div>
          </div>

          <div className="kpi-stat-value" style={{ fontSize: '20px', color: '#0F172A' }}>
            ₹{(kpi.totalPipelineValue || 0).toLocaleString('en-IN')}
          </div>

          <div className="kpi-stat-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🔥 Hot: <strong>₹{(kpi.hotPipelineValue || 0).toLocaleString('en-IN')}</strong></span>
            <span>11. AOV: <strong>₹{(kpi.averageBillValue || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: 7-Column Salesperson Performance Matrix */}
      <div className="kpi-table-card">
        <div className="kpi-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={16} color="#2563EB" />
            <span style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>
              Salesperson Performance Matrix ({selectedMonth})
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Individual target achievement & conversion rates
          </span>
        </div>

        <div className="table-responsive">
          <table className="kpi-table">
            <thead>
              <tr>
                <th>1. Staff</th>
                <th>2. Target (₹)</th>
                <th>3. Sales (₹)</th>
                <th>4. % Achieved</th>
                <th>5. Quotes</th>
                <th>6. Orders</th>
                <th>7. Conversion %</th>
              </tr>
            </thead>
            <tbody>
              {salespersonPerformance.map((s, idx) => {
                const achieve = s.achieved || 0;
                const badgeColor = achieve >= 100 ? '#059669' : achieve >= 70 ? '#2563EB' : achieve >= 40 ? '#D97706' : '#DC2626';

                return (
                  <tr key={s.staff}>
                    {/* 1. Staff */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="dash-staff-rank">
                          #{idx + 1}
                        </div>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
                          {s.staff}
                        </div>
                      </div>
                    </td>

                    {/* 2. Target */}
                    <td style={{ fontWeight: '700', color: '#64748B' }}>
                      ₹{s.target.toLocaleString('en-IN')}
                    </td>

                    {/* 3. Sales */}
                    <td style={{ fontWeight: '900', color: '#059669', fontSize: '13.5px' }}>
                      ₹{s.sales.toLocaleString('en-IN')}
                    </td>

                    {/* 4. % Achieved */}
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="dash-matrix-bar-track">
                          <div
                            className="dash-matrix-bar-fill"
                            style={{
                              width: `${Math.min(achieve, 100)}%`,
                              backgroundColor: badgeColor,
                            }}
                          />
                        </div>
                        <span
                          className="dash-achieve-pill"
                          style={{
                            backgroundColor: `${badgeColor}15`,
                            color: badgeColor,
                            borderColor: `${badgeColor}30`,
                          }}
                        >
                          {achieve}%
                        </span>
                      </div>
                    </td>

                    {/* 5. Quotes */}
                    <td style={{ fontWeight: '700', color: '#334155' }}>
                      📄 {s.quotes}
                    </td>

                    {/* 6. Orders */}
                    <td style={{ fontWeight: '800', color: '#0F172A' }}>
                      🧾 {s.orders}
                    </td>

                    {/* 7. Conversion */}
                    <td>
                      <span className="dash-conversion-badge">
                        {s.conversion}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Actionable Feeds: Urgent Overdue Follow-ups & Recent Deal Wins */}
      <div className="dash-split-grid">
        {/* Left: Urgent Overdue Follow-ups */}
        <div className="lost-panel-card">
          <div className="lost-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} color="#DC2626" />
              <span className="lost-panel-title">Urgent Overdue Follow-ups</span>
            </div>
            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800' }}>
              {overdueFollowups.length} urgent
            </span>
          </div>

          {overdueFollowups.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#059669', fontSize: '12.5px', fontWeight: '700' }}>
              ✓ No overdue follow-ups! All active deals contacted on schedule.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {overdueFollowups.map((lead) => (
                <div key={lead.customerId} className="dash-overdue-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '12.5px' }}>
                        {lead.customerName}
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#DC2626', background: '#FEE2E2', padding: '1px 5px', borderRadius: '4px' }}>
                        {lead.daysOverdue}d overdue
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Rep: {lead.salesperson} • ₹{(lead.quotationValue || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {lead.phone && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <a
                        href={`tel:${lead.phone}`}
                        className="btn-icon"
                        title="Call Customer"
                        style={{ background: '#EFF6FF', color: '#2563EB', padding: '5px' }}
                      >
                        <Phone size={13} />
                      </a>
                      <a
                        href={`https://wa.me/${String(lead.phone).replace(/[^0-9]/g, '').length === 10 ? '91' + String(lead.phone).replace(/[^0-9]/g, '') : String(lead.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.customerName}, following up regarding your tiles & sanitary quotation from Vasantham Tiles.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="WhatsApp Follow-up"
                        style={{ background: '#ECFDF5', color: '#059669', padding: '5px' }}
                      >
                        <MessageSquare size={13} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Deal Wins */}
        <div className="lost-panel-card">
          <div className="lost-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="#059669" />
              <span className="lost-panel-title">Recent Deal Wins</span>
            </div>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>
              Confirmed Orders
            </span>
          </div>

          {recentDeals.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '12.5px' }}>
              No deals closed yet this month.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentDeals.map((deal) => (
                <div key={deal.customerId + deal.date} className="dash-win-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '12.5px' }}>
                      🎉 {deal.customerName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Billed by {deal.salesperson} • {deal.date}
                    </div>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '13.5px', color: '#059669' }}>
                    ₹{Number(deal.orderValue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Target Config Modal */}
      {showTargetModal && (
        <SalesTargetModal
          month={selectedMonth}
          currentMetrics={metrics}
          onClose={() => setShowTargetModal(false)}
          onSaved={fetchDashboardData}
        />
      )}
    </div>
  );
};
