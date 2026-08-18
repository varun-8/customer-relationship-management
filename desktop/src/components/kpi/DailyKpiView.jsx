import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  Target,
  PhoneCall,
  Receipt,
  IndianRupee,
  ShoppingBag,
  HardHat,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  FileCheck,
  Check,
  PieChart,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';

export const DailyKpiView = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Selected Day for deep-dive performance analysis
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [dayData, setDayData] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);

  // Overall data
  const [summaryData, setSummaryData] = useState(null);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [staffFilter, setStaffFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));

  // Fetch Day-by-Day performance breakdown automatically from CRM
  const fetchDayPerformance = async (dateToFetch = selectedDay) => {
    setDayLoading(true);
    try {
      const res = await api.getDayPerformance({ date: dateToFetch, staffName: staffFilter });
      if (res.success && res.data) {
        setDayData(res.data);
      }
    } catch (err) {
      console.warn('Error fetching day performance:', err);
    } finally {
      setDayLoading(false);
    }
  };

  // Fetch overall KPI summary & monthly trends automatically from CRM
  const fetchKpiData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { month: selectedMonth };
      if (staffFilter !== 'all') params.staffName = staffFilter;

      const [summaryRes, trendsRes] = await Promise.all([
        api.getKPISummary(params),
        api.getDailyTrends(params),
      ]);

      if (summaryRes.success) setSummaryData(summaryRes.data || null);
      if (trendsRes.success && trendsRes.data) setDailyTrends(trendsRes.data.trends || []);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err.message || 'Failed to load KPI metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiData();
  }, [staffFilter, selectedMonth]);

  useEffect(() => {
    fetchDayPerformance(selectedDay);
  }, [selectedDay, staffFilter]);

  // Navigate Days
  const handlePrevDay = () => {
    const prev = new Date(new Date(selectedDay).getTime() - 86400000).toISOString().split('T')[0];
    setSelectedDay(prev);
  };

  const handleNextDay = () => {
    const next = new Date(new Date(selectedDay).getTime() + 86400000).toISOString().split('T')[0];
    setSelectedDay(next);
  };

  const handleExportCSV = () => {
    if (dailyTrends.length === 0) {
      alert('No KPI records to export');
      return;
    }

    const headers = [
      'Date',
      'Day',
      'Sales Value (INR)',
      'Bills Closed',
      'Walk-in Visits',
      'Quotes Given',
      'Follow-ups Count',
      'Conversion Rate %',
    ];

    const rows = dailyTrends.map((t) => [
      t.date,
      t.dayOfWeek,
      t.salesValue || 0,
      t.ordersCount || 0,
      t.visits || 0,
      t.quotes || 0,
      t.followUps || 0,
      `${t.conversionRate || 0}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_KPI_Performance_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = summaryData?.summary || {};
  const today = summaryData?.today || {};
  const leaderboard = summaryData?.staffLeaderboard || [];

  // Day specific variables
  const dayKpi = dayData?.kpi || {};
  const dayCustomers = dayData?.customers || [];
  const dayComp = dayData?.comparison || {};

  const isToday = selectedDay === todayStr;
  const formattedDayTitle = new Date(selectedDay).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="kpi-view-container">
      {/* 1. Clutter-Free Header & Date Navigation Bar */}
      <div className="kpi-header-toolbar">
        <div className="kpi-toolbar-left-group">
          {/* Day Navigator */}
          <div className="kpi-day-stepper">
            <button
              type="button"
              className="kpi-stepper-btn"
              onClick={handlePrevDay}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="kpi-stepper-display">
              <CalendarDays size={16} color="#0F766E" />
              <input
                type="date"
                className="kpi-date-input-stepper"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              />
              <span className="kpi-stepper-text">{formattedDayTitle}</span>
              {isToday && <span className="kpi-today-tag">TODAY</span>}
            </div>

            <button
              type="button"
              className="kpi-stepper-btn"
              onClick={handleNextDay}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDay(todayStr)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* Right Filter Controls */}
        <div className="kpi-toolbar-right-group">
          {/* Staff Filter */}
          <div className="kpi-filter-box">
            <span className="kpi-filter-label">Staff:</span>
            <select
              className="form-select form-select-sm"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              style={{ minWidth: '135px' }}
            >
              <option value="all">All Sales Staff</option>
              <option value="Karthik Raja">Karthik Raja</option>
              <option value="Senthil Kumar">Senthil Kumar</option>
              <option value="Priya Dharshini">Priya Dharshini</option>
              <option value="Manoj Kumar">Manoj Kumar</option>
            </select>
          </div>

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
            onClick={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
            title="Refresh live CRM calculations"
          >
            <RefreshCw size={13} className={loading || dayLoading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            title="Export Monthly KPI CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Insightful Performance Cards for the Selected Day */}
      <div className="kpi-stats-grid">
        {/* Card A: Day's Revenue */}
        <div className="kpi-stat-card kpi-stat-card-emerald">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">DAY'S SALES REVENUE</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#ECFDF5', color: '#059669' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#059669' }}>
            ₹{(dayKpi.salesValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-stat-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {dayComp.salesGrowthPercent >= 0 ? (
                <span style={{ color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ArrowUpRight size={14} /> +{dayComp.salesGrowthPercent}% vs prev day
                </span>
              ) : (
                <span style={{ color: '#E11D48', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ArrowDownRight size={14} /> {dayComp.salesGrowthPercent}% vs prev day
                </span>
              )}
            </span>
            <span style={{ color: '#64748B' }}>
              Month: <strong>₹{(summary.totalSalesValue || 0).toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Card B: Funnel & Conversion */}
        <div className="kpi-stat-card kpi-stat-card-blue">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">SHOWROOM FUNNEL & CONVERSION</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ color: '#2563EB' }}>{dayKpi.conversionRate || 0}%</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
              ({dayKpi.walkins?.orders || 0} orders from {dayKpi.walkins?.visits || 0} visits)
            </span>
          </div>
          <div className="kpi-stat-footer">
            <span>Quotes Given: <strong>{dayKpi.walkins?.quotes || 0}</strong> ({dayKpi.quoteRate || 0}% quote rate)</span>
          </div>
        </div>

        {/* Card C: Orders Closed & Follow-ups */}
        <div className="kpi-stat-card kpi-stat-card-purple">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">DEALS CLOSED & FOLLOW-UPS</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="kpi-stat-value">
            {dayKpi.ordersCount || 0} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>Bills Invoiced</span>
          </div>
          <div className="kpi-stat-footer">
            <span>Follow-up Calls/Chats: <strong>{dayKpi.followUpsCount || 0}</strong> completed</span>
          </div>
        </div>

        {/* Card D: Strategic Attachments */}
        <div className="kpi-stat-card kpi-stat-card-amber">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">SPECIAL CLIENTS & CROSS-SELL</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ fontSize: '18px', fontWeight: '800' }}>
            {dayKpi.crossSell ? (
              <span style={{ color: '#059669' }}>
                ✓ Cross-Sell ({(dayKpi.crossSellItems || []).length || 1} items)
              </span>
            ) : (
              <span style={{ color: '#64748B' }}>No Cross-sell today</span>
            )}
          </div>
          <div className="kpi-stat-footer" style={{ display: 'flex', gap: '12px' }}>
            <span>Repeat Clients: <strong>{dayKpi.oldCustomers ? `✓ ${dayKpi.oldCustomersCount || 1}` : '✕ None'}</strong></span>
            <span>•</span>
            <span>Engineers: <strong>{dayKpi.engineerCalls ? `✓ ${dayKpi.engineerCallsCount || 1}` : '✕ None'}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Monthly Calendar Timeline (Click Any Day to View) */}
      <div className="kpi-calendar-strip-card">
        <div className="kpi-calendar-strip-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#2563EB" />
            <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
              Monthly Performance Calendar ({selectedMonth})
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Click any day to inspect its full revenue and customer deals
          </span>
        </div>

        <div className="kpi-calendar-strip-scroll">
          {dailyTrends.map((t) => {
            const isSelected = t.date === selectedDay;
            const isCurrentDay = t.date === todayStr;

            return (
              <button
                key={t.date}
                type="button"
                className={`kpi-calendar-pill ${isSelected ? 'kpi-calendar-pill-selected' : ''} ${t.hasActivity ? 'kpi-calendar-pill-active' : ''}`}
                onClick={() => setSelectedDay(t.date)}
              >
                <div className="kpi-pill-day-header">
                  <span className="kpi-pill-day-wk">{t.dayOfWeek}</span>
                  {isCurrentDay && <span className="kpi-pill-today-dot" />}
                </div>

                <div className="kpi-pill-day-num">{t.dayNumber}</div>

                <div className="kpi-pill-sales">
                  {t.salesValue > 0 ? `₹${Math.round(t.salesValue / 1000)}k` : '—'}
                </div>

                {t.ordersCount > 0 && (
                  <div className="kpi-pill-orders-badge">
                    {t.ordersCount} {t.ordersCount === 1 ? 'bill' : 'bills'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CRM Customer Activity Table for the Selected Date */}
      <div className="kpi-table-card">
        <div className="kpi-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={16} color="#059669" />
            <span style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>
              Customer Activity on {formattedDayTitle}
            </span>
            <span className="kpi-count-badge">{dayCustomers.length} records</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Live records automatically linked to this day's KPI
          </span>
        </div>

        {dayCustomers.length === 0 ? (
          <div className="kpi-empty-state" style={{ padding: '36px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>📅</div>
            <div className="kpi-empty-title" style={{ fontSize: '15px' }}>
              No customer transactions recorded on {formattedDayTitle}
            </div>
            <div className="kpi-empty-sub" style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Any customer created, quoted, or billed on this date automatically populates here.
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name & Contact</th>
                  <th>Customer Type</th>
                  <th>Lead Source</th>
                  <th>Status Stage</th>
                  <th>Deal / Quotation Value</th>
                  <th>Requirements & Cross-Sell</th>
                  <th>Salesperson</th>
                </tr>
              </thead>
              <tbody>
                {dayCustomers.map((c) => {
                  const isClosed = c.status === 'Order Confirmed';
                  const isQuote = c.status === 'Quotation' || c.status === 'Negotiation';

                  return (
                    <tr key={c._id || c.customerId}>
                      {/* Customer ID */}
                      <td style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'monospace', fontSize: '12.5px' }}>
                        #{c.customerId}
                      </td>

                      {/* Customer Name */}
                      <td>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                          {c.customerName}
                        </div>
                        {c.phone ? (
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            📞 {c.phone}
                          </div>
                        ) : null}
                      </td>

                      {/* Type */}
                      <td>
                        <span className="type-capsule" style={{ fontSize: '10.5px' }}>
                          {c.customerType}
                        </span>
                      </td>

                      {/* Lead Source */}
                      <td style={{ color: '#475569', fontWeight: '600', fontSize: '12.5px' }}>
                        {c.leadSource || 'Walk-in'}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`kpi-status-badge ${isClosed ? 'kpi-status-closed' : isQuote ? 'kpi-status-quote' : 'kpi-status-lead'}`}
                        >
                          {isClosed ? '🎉 ' : isQuote ? '📄 ' : '💬 '}{c.status}
                        </span>
                      </td>

                      {/* Quotation / Order Value */}
                      <td style={{ fontWeight: '900', fontSize: '13.5px', color: isClosed ? '#059669' : '#0F172A' }}>
                        ₹{(c.orderValue || c.quotationValue || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Requirements & Cross-Sell */}
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                          {c.requirement ? `🏷️ ${c.requirement}` : '—'}
                          {c.approxQuantity ? ` (${c.approxQuantity} sq.ft)` : ''}
                        </div>
                        {c.crossSell ? (
                          <div style={{ fontSize: '11px', color: '#7C3AED', fontWeight: '700', marginTop: '2px' }}>
                            + {c.crossSell}
                          </div>
                        ) : null}
                      </td>

                      {/* Salesperson */}
                      <td style={{ color: '#334155', fontWeight: '700', fontSize: '12px' }}>
                        {c.salesperson || 'Showroom Staff'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Monthly Staff Performance Comparison Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="kpi-leaderboard-card">
          <div className="kpi-leaderboard-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={17} color="#D97706" />
              <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                Sales Staff Performance ({selectedMonth})
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Automatically ranked by total closed revenue
            </span>
          </div>

          <div className="kpi-leaderboard-grid">
            {leaderboard.map((s, idx) => (
              <div key={s.staffName} className="kpi-leaderboard-item">
                <div className="kpi-leaderboard-rank">
                  #{idx + 1}
                </div>
                <div className="kpi-leaderboard-info">
                  <div className="kpi-leaderboard-name">{s.staffName}</div>
                  <div className="kpi-leaderboard-sub">
                    {s.ordersCount} {s.ordersCount === 1 ? 'bill' : 'bills'} closed • {s.conversionRate}% conversion ({s.walkinOrders}/{s.visits} visits)
                  </div>
                </div>
                <div className="kpi-leaderboard-revenue">
                  ₹{s.salesValue.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
