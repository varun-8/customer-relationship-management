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
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '14px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
              Executive Performance Dashboard
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Live showroom revenue, conversion funnel, and team quotas
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
          />

          <button
            type="button"
            onClick={fetchDashboardData}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: '#475569' }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowTargetModal(true)}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Settings size={14} />
            <span>Set Targets</span>
          </button>

          <button
            type="button"
            onClick={handleExportSummaryCSV}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={14} />
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
          {/* 2. Top Executive Revenue & Conversion Hero Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* HERO CARD: Monthly Revenue Goal */}
            <div style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SHOWROOM REVENUE GOAL ({selectedMonth})
                </span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: `${achievementColor}25`, color: achievementColor, border: `1px solid ${achievementColor}40`, padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                  <Zap size={14} />
                  <span>{kpi.achievementPercent || 0}% Achieved</span>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '26px', fontWeight: '900', color: '#FFFFFF' }}>
                ₹{(kpi.actualSales || 0).toLocaleString('en-IN')}{' '}
                <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '600' }}>
                  / ₹{(kpi.salesTarget || 0).toLocaleString('en-IN')} target
                </span>
              </div>

              {/* Progress Meter */}
              <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(kpi.achievementPercent || 0, 100)}%`, backgroundColor: achievementColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#CBD5E1' }}>
                <span>Remaining: <strong style={{ color: '#FFFFFF' }}>₹{Math.max((kpi.salesTarget || 0) - (kpi.actualSales || 0), 0).toLocaleString('en-IN')}</strong></span>
                <span>Run-rate: <strong style={{ color: '#4ADE80' }}>{kpi.orders || 0} deals closed</strong></span>
              </div>
            </div>

            {/* CARD 2: Conversion Funnel */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CONVERSION FUNNEL</span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px', marginTop: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>WALK-INS</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#2563EB' }}>{kpi.totalWalkins || 0}</div>
                </div>
                <span style={{ color: '#CBD5E1' }}>➔</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>QUOTES</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#7C3AED' }}>{kpi.quotations || 0}</div>
                </div>
                <span style={{ color: '#CBD5E1' }}>➔</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>ORDERS</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>{kpi.orders || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontWeight: '600' }}>
                Conversion Rate: <strong style={{ color: '#2563EB' }}>{kpi.conversionRate || 0}%</strong> (Quote Rate: {kpi.quoteRate || 0}%)
              </div>
            </div>

            {/* CARD 3: Follow-up Velocity */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>FOLLOW-UP VELOCITY</span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#FAF5FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={16} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>PENDING</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{kpi.pendingFollowups || 0}</div>
                </div>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800' }}>OVERDUE</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#DC2626' }}>{kpi.overdueFollowups || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: kpi.overdueFollowups > 0 ? '#DC2626' : '#059669', marginTop: '8px', fontWeight: '700' }}>
                {kpi.overdueFollowups > 0 ? `⚠️ ${kpi.overdueFollowups} leads need immediate follow-up!` : '✓ All scheduled follow-ups up to date'}
              </div>
            </div>
          </div>

          {/* 3. Salesperson Performance Matrix */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#2563EB" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                  Sales Executive Performance Matrix ({selectedMonth})
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Individual target achievement & conversion rates
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>1. Sales Staff</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>2. Target (₹)</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>3. Sales Billed</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>4. Target Achievement</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>5. Quotes & Orders</th>
                    <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>6. Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {salespersonPerformance.map((s, idx) => {
                    const achieve = s.achieved || 0;
                    const badgeColor = achieve >= 100 ? '#059669' : achieve >= 70 ? '#2563EB' : achieve >= 40 ? '#D97706' : '#DC2626';

                    return (
                      <tr key={s.staff} style={{ borderBottom: idx < salespersonPerformance.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>{s.staff}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '13px', color: s.targetDisabled ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
                          {s.targetDisabled ? (
                            <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: '700', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>
                              No Target (Off)
                            </span>
                          ) : (
                            `₹${s.target.toLocaleString('en-IN')}`
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '14px', fontWeight: '900', color: '#059669' }}>
                          ₹{s.sales.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', minWidth: '160px' }}>
                          {s.targetDisabled ? (
                            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>
                              — (Quota Exempt)
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(achieve, 100)}%`, backgroundColor: badgeColor, borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '11.5px', fontWeight: '800', backgroundColor: `${badgeColor}15`, color: badgeColor, border: `1px solid ${badgeColor}30`, padding: '2px 7px', borderRadius: '6px' }}>
                                {achieve}%
                              </span>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>
                          📄 {s.quotes} Quotes • 🧾 {s.orders} Orders
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '8px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Left: Urgent Overdue Follow-ups */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} color="#DC2626" />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Urgent Overdue Follow-ups</span>
                </div>
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '6px' }}>
                  {overdueFollowups.length} urgent
                </span>
              </div>

              {overdueFollowups.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#059669', fontSize: '12.5px', fontWeight: '700' }}>
                  ✓ No overdue follow-ups! All active deals contacted on schedule.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {overdueFollowups.map((lead) => {
                    const waUrl = getWhatsAppUrl(lead.phone, lead);
                    return (
                      <div
                        key={lead.customerId}
                        style={{
                          backgroundColor: '#FFF5F5',
                          borderRadius: '12px',
                          border: '1px solid #FECDD3',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
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
                              style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '5px', display: 'flex' }}
                              title="Call Customer"
                            >
                              <Phone size={13} />
                            </a>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', borderRadius: '6px', padding: '5px', display: 'flex' }}
                              title="WhatsApp Sales Outreach"
                            >
                              <MessageSquare size={13} />
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
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Recent Deal Wins</span>
                </div>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
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
                    <div
                      key={deal.customerId + deal.date}
                      style={{
                        backgroundColor: '#F0FDF4',
                        borderRadius: '12px',
                        border: '1px solid #DCFCE7',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '12.5px' }}>
                          🎉 {deal.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Billed by {deal.salesperson} • {deal.date}
                        </div>
                      </div>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: '#059669' }}>
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
