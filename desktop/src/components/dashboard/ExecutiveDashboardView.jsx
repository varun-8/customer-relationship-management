import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Receipt,
  PhoneCall,
  IndianRupee,
  Flame,
  Award,
  AlertTriangle,
  RefreshCw,
  Download,
  CheckCircle,
  Settings,
  Phone,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { SalesTargetModal } from './SalesTargetModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';
import { useToneDown } from '../../context/ToneDownContext';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const ExecutiveDashboardView = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const { isToneDown } = useToneDown();

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
      ['Total Walk-ins', kpi.totalWalkins || 0],
      ['Quotations Count', kpi.quotations || 0],
      ['Orders Confirmed', kpi.orders || 0],
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
    <div className="executive-dashboard-root" style={{ display: 'flex', flexDirection: 'column', gap: isToneDown ? '12px' : '20px' }}>
      {/* 1. Header Toolbar */}
      <div
        className="dash-toolbar-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: isToneDown ? '8px' : '20px',
          border: '1px solid #CBD5E1',
          padding: isToneDown ? '10px 14px' : '14px 20px',
          boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: isToneDown ? '30px' : '40px', height: isToneDown ? '30px' : '40px', borderRadius: isToneDown ? '6px' : '12px', backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF', color: isToneDown ? '#0F172A' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={isToneDown ? 16 : 20} />
          </div>
          <div>
            <div style={{ fontSize: isToneDown ? '14px' : '16px', fontWeight: '800', color: '#0F172A' }}>
              Executive Performance Dashboard
            </div>
            {!isToneDown && (
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Live showroom revenue, conversion funnel, and team quotas
              </div>
            )}
          </div>
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
          />

          <button
            type="button"
            onClick={fetchDashboardData}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#0F172A' }}
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowTargetModal(true)}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Settings size={13} />
            <span>Set Targets</span>
          </button>

          <button
            type="button"
            onClick={handleExportSummaryCSV}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && !metrics ? (
        <ConnectionErrorState
          title="Unable to Load Dashboard Metrics"
          message={error}
          onRetry={fetchDashboardData}
          isRetrying={loading}
        />
      ) : (
        <>
          {/* 2. Top Executive Revenue Goal Target & Conversion Cards in Single Horizontal Row */}
          <div style={{ display: 'grid', gridTemplateColumns: isToneDown ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isToneDown ? '10px' : '16px' }}>
            {/* HERO CARD: Monthly Revenue Goal */}
            {!isToneDown && (
              <div style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      SHOWROOM REVENUE GOAL ({selectedMonth})
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: `${achievementColor}25`, color: achievementColor, border: `1px solid ${achievementColor}40`, padding: '3px 8px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800' }}>
                      <Zap size={13} />
                      <span>{kpi.achievementPercent || 0}% Achieved</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '22px', fontWeight: '900', color: '#FFFFFF' }}>
                    ₹{(kpi.actualSales || 0).toLocaleString('en-IN')}{' '}
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
                      / ₹{(kpi.salesTarget || 0).toLocaleString('en-IN')} target
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div style={{ height: '7px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(kpi.achievementPercent || 0, 100)}%`, backgroundColor: achievementColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11.5px', color: '#CBD5E1' }}>
                  <span>Rem: <strong style={{ color: '#FFFFFF' }}>₹{Math.max((kpi.salesTarget || 0) - (kpi.actualSales || 0), 0).toLocaleString('en-IN')}</strong></span>
                  <span>Orders: <strong style={{ color: '#4ADE80' }}>{kpi.orders || 0} closed</strong></span>
                </div>
              </div>
            )}

            {/* CARD 2: Conversion Funnel */}
            <div className="dash-kpi-card" style={{ backgroundColor: '#FFFFFF', borderRadius: isToneDown ? '8px' : '20px', border: '1px solid #CBD5E1', padding: isToneDown ? '12px 14px' : '20px', boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CONVERSION FUNNEL</span>
                <div style={{ width: isToneDown ? '26px' : '34px', height: isToneDown ? '26px' : '34px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF', color: isToneDown ? '#0F172A' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={isToneDown ? 14 : 16} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isToneDown ? '#F8FAFC' : '#F8FAFC', borderRadius: isToneDown ? '6px' : '12px', padding: isToneDown ? '8px 10px' : '12px', marginTop: isToneDown ? '8px' : '10px', border: isToneDown ? '1px solid #E2E8F0' : 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>WALK-INS</div>
                  <div style={{ fontSize: isToneDown ? '14px' : '16px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#2563EB' }}>{kpi.totalWalkins || 0}</div>
                </div>
                <span style={{ color: '#CBD5E1', fontSize: '12px' }}>➔</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>QUOTES</div>
                  <div style={{ fontSize: isToneDown ? '14px' : '16px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#7C3AED' }}>{kpi.quotations || 0}</div>
                </div>
                <span style={{ color: '#CBD5E1', fontSize: '12px' }}>➔</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>ORDERS</div>
                  <div style={{ fontSize: isToneDown ? '14px' : '16px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#059669' }}>{kpi.orders || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: isToneDown ? '#334155' : '#64748B', marginTop: isToneDown ? '8px' : '10px', fontWeight: '600' }}>
                Conversion Rate: <strong style={{ color: '#0F172A' }}>{kpi.conversionRate || 0}%</strong> (Quote Rate: {kpi.quoteRate || 0}%)
              </div>
            </div>

            {/* CARD 3: Follow-up Velocity */}
            <div className="dash-kpi-card" style={{ backgroundColor: '#FFFFFF', borderRadius: isToneDown ? '8px' : '20px', border: '1px solid #CBD5E1', padding: isToneDown ? '12px 14px' : '20px', boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>FOLLOW-UP VELOCITY</span>
                <div style={{ width: isToneDown ? '26px' : '34px', height: isToneDown ? '26px' : '34px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: isToneDown ? '#F1F5F9' : '#FAF5FF', color: isToneDown ? '#0F172A' : '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={isToneDown ? 14 : 16} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginTop: isToneDown ? '8px' : '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>PENDING</div>
                  <div style={{ fontSize: isToneDown ? '16px' : '20px', fontWeight: '900', color: '#0F172A' }}>{kpi.pendingFollowups || 0}</div>
                </div>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1' }} />
                <div>
                  <div style={{ fontSize: '10px', color: isToneDown ? '#0F172A' : '#DC2626', fontWeight: '800' }}>OVERDUE</div>
                  <div style={{ fontSize: isToneDown ? '16px' : '20px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#DC2626' }}>{kpi.overdueFollowups || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: isToneDown ? (kpi.overdueFollowups > 0 ? '#0F172A' : '#475569') : (kpi.overdueFollowups > 0 ? '#DC2626' : '#059669'), marginTop: '6px', fontWeight: '700' }}>
                {kpi.overdueFollowups > 0 ? `• ${kpi.overdueFollowups} leads need immediate follow-up` : '✓ Follow-ups up to date'}
              </div>
            </div>
          </div>

          {/* 3. Salesperson Performance Matrix */}
          <div
            className="dash-table-card"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: isToneDown ? '8px' : '20px',
              border: '1px solid #CBD5E1',
              boxShadow: isToneDown ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.03)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: isToneDown ? '10px 14px' : '16px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={isToneDown ? 15 : 18} color={isToneDown ? '#0F172A' : '#2563EB'} />
                <span style={{ fontSize: isToneDown ? '13px' : '14px', fontWeight: '800', color: '#0F172A' }}>
                  Sales Executive Performance Matrix ({selectedMonth})
                </span>
              </div>
              {!isToneDown && (
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Individual target achievement & conversion rates
                </span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Staff</th>
                    <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target (₹)</th>
                    <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sales Billed</th>
                    <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Achievement</th>
                    <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activity</th>
                    <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Conv. %</th>
                  </tr>
                </thead>
                <tbody>
                  {salespersonPerformance.map((s, idx) => {
                    const achieve = s.achieved || 0;
                    const badgeColor = isToneDown ? '#0F172A' : (achieve >= 100 ? '#059669' : achieve >= 70 ? '#2563EB' : achieve >= 40 ? '#D97706' : '#DC2626');

                    return (
                      <tr key={s.staff} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#0F172A', padding: '1px 5px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{s.staff}</span>
                          </div>
                        </td>

                        <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle', fontSize: '12.5px', color: '#0F172A', fontWeight: '600' }}>
                          {s.targetDisabled ? (
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                              No Target
                            </span>
                          ) : (
                            `₹${s.target.toLocaleString('en-IN')}`
                          )}
                        </td>

                        <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle', fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                          ₹{s.sales.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle', minWidth: isToneDown ? '120px' : '160px' }}>
                          {s.targetDisabled ? (
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                              —
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {!isToneDown && (
                                <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(achieve, 100)}%`, backgroundColor: badgeColor, borderRadius: '3px' }} />
                                </div>
                              )}
                              <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: isToneDown ? '#F1F5F9' : `${badgeColor}15`, color: isToneDown ? '#0F172A' : badgeColor, border: isToneDown ? '1px solid #CBD5E1' : `1px solid ${badgeColor}30`, padding: '1px 6px', borderRadius: '4px' }}>
                                {achieve}%
                              </span>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
                          {s.quotes} Quotes • {s.orders} Orders
                        </td>

                        <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: '800', backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF', color: isToneDown ? '#0F172A' : '#2563EB', border: isToneDown ? '1px solid #CBD5E1' : '1px solid #BFDBFE', padding: '2px 6px', borderRadius: '6px' }}>
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

          {/* 4. Actionable Side-by-Side Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: isToneDown ? '12px' : '20px', alignItems: 'start' }}>
            {/* Left: Urgent Overdue Follow-ups */}
            <div className="dash-side-panel" style={{ backgroundColor: '#FFFFFF', borderRadius: isToneDown ? '8px' : '20px', border: '1px solid #CBD5E1', padding: isToneDown ? '12px 14px' : '20px', boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isToneDown ? '10px' : '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={isToneDown ? 14 : 16} color={isToneDown ? '#0F172A' : '#DC2626'} />
                  <span style={{ fontSize: isToneDown ? '13px' : '14px', fontWeight: '800', color: '#0F172A' }}>Urgent Overdue Follow-ups</span>
                </div>
                <span style={{ fontSize: '11px', color: isToneDown ? '#0F172A' : '#DC2626', fontWeight: '800', backgroundColor: isToneDown ? '#F1F5F9' : '#FEE2E2', border: isToneDown ? '1px solid #CBD5E1' : 'none', padding: '1px 6px', borderRadius: '4px' }}>
                  {overdueFollowups.length} urgent
                </span>
              </div>

              {overdueFollowups.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#0F172A', fontSize: '12px', fontWeight: '600' }}>
                  ✓ No overdue follow-ups! All active deals contacted on schedule.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {overdueFollowups.map((lead) => {
                    const waUrl = getWhatsAppUrl(lead.phone, lead);
                    return (
                      <div
                        key={lead.customerId}
                        style={{
                          backgroundColor: isToneDown ? '#FFFFFF' : '#FFF5F5',
                          borderRadius: isToneDown ? '6px' : '12px',
                          border: isToneDown ? '1px solid #E2E8F0' : '1px solid #FECDD3',
                          padding: isToneDown ? '8px 10px' : '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '12px' }}>
                              {lead.customerName}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#DC2626', background: isToneDown ? '#F1F5F9' : '#FEE2E2', border: isToneDown ? '1px solid #CBD5E1' : 'none', padding: '1px 4px', borderRadius: '4px' }}>
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
                              style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '4px', display: 'flex' }}
                              title="Call Customer"
                            >
                              <Phone size={12} />
                            </a>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '4px', display: 'flex' }}
                              title="WhatsApp Sales Outreach"
                            >
                              <MessageSquare size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Recent Deal Wins */}
            <div className="dash-side-panel" style={{ backgroundColor: '#FFFFFF', borderRadius: isToneDown ? '8px' : '20px', border: '1px solid #CBD5E1', padding: isToneDown ? '12px 14px' : '20px', boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isToneDown ? '10px' : '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={isToneDown ? 14 : 16} color={isToneDown ? '#0F172A' : '#059669'} />
                  <span style={{ fontSize: isToneDown ? '13px' : '14px', fontWeight: '800', color: '#0F172A' }}>Recent Deal Wins</span>
                </div>
                <span style={{ fontSize: '11px', color: isToneDown ? '#0F172A' : '#059669', fontWeight: '800', backgroundColor: isToneDown ? '#F1F5F9' : '#DCFCE7', border: isToneDown ? '1px solid #CBD5E1' : 'none', padding: '1px 6px', borderRadius: '4px' }}>
                  Confirmed Orders
                </span>
              </div>

              {recentDeals.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                  No deals closed yet this month.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentDeals.map((deal) => (
                    <div
                      key={deal.customerId + deal.date}
                      style={{
                        backgroundColor: isToneDown ? '#FFFFFF' : '#F0FDF4',
                        borderRadius: isToneDown ? '6px' : '12px',
                        border: isToneDown ? '1px solid #E2E8F0' : '1px solid #DCFCE7',
                        padding: isToneDown ? '8px 10px' : '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '12px' }}>
                          ✓ {deal.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Billed by {deal.salesperson} • {deal.date}
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: isToneDown ? '12.5px' : '14px', color: '#0F172A' }}>
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
