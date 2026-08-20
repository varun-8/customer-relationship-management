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
  ChevronDown,
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
import { ConnectionErrorState } from '../common/ConnectionErrorState';

export const DailyKpiView = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Selected Day for deep-dive performance analysis
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [dayData, setDayData] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [staffSectionExpanded, setStaffSectionExpanded] = useState(false);
  const [expandedStaffMember, setExpandedStaffMember] = useState(null);

  // Overall data
  const [summaryData, setSummaryData] = useState(null);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // Filters
  const [staffFilter, setStaffFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));

  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Fetch live staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.getUsers();
        if (res && res.success && Array.isArray(res.data)) {
          const emps = res.data.filter((u) => u.role !== 'owner' && u.active !== false);
          setStaffList(emps.map((u) => u.name));
        }
      } catch (e) {
        console.warn('Staff fetch error in DailyKpiView:', e);
      }
    };
    fetchStaff();
  }, []);

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
  const monthlyLeaderboard = summaryData?.staffLeaderboard || [];

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

  // Calculate Sales Staff Performance based on today's / selected day's live customer metrics
  const todayStaffPerformance = useMemo(() => {
    const staffMap = {};
    
    staffList.forEach((name) => {
      staffMap[name] = {
        staffName: name,
        visits: 0,
        quotes: 0,
        ordersCount: 0,
        salesValue: 0,
      };
    });

    dayCustomers.forEach((c) => {
      const staff = c.salesperson || 'Showroom Staff';
      if (!staffMap[staff]) {
        staffMap[staff] = {
          staffName: staff,
          visits: 0,
          quotes: 0,
          ordersCount: 0,
          salesValue: 0,
        };
      }
      staffMap[staff].visits += 1;
      if (c.status === 'Quotation' || c.status === 'Negotiation' || Number(c.quotationValue) > 0) {
        staffMap[staff].quotes += 1;
      }
      if (c.status === 'Order Confirmed') {
        staffMap[staff].ordersCount += 1;
        staffMap[staff].salesValue += (Number(c.orderValue) || Number(c.quotationValue) || 0);
      }
    });

    return Object.values(staffMap)
      .map((s) => ({
        ...s,
        conversionRate: s.visits > 0 ? Number(((s.ordersCount / s.visits) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.salesValue - a.salesValue || b.ordersCount - a.ordersCount || b.visits - a.visits);
  }, [dayCustomers, staffList]);

  return (
    <div className="kpi-view-container">
      {/* 1. Ultra-Clean Minimalist Header Toolbar */}
      <div className="kpi-header-toolbar">
        <div className="kpi-toolbar-left-group">
          {/* Day Stepper Navigator */}
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
              <CalendarDays size={16} className="text-primary" />
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
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
            >
              Today
            </button>
          )}
        </div>

        {/* Right Filter & Action Controls */}
        <div className="kpi-toolbar-right-group">
          {/* Staff Filter */}
          <div className="kpi-filter-box">
            <span className="kpi-filter-label">Rep:</span>
            <select
              className="form-select form-select-sm"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              style={{ minWidth: '135px', borderRadius: '8px', fontSize: '12.5px' }}
            >
              <option value="all">All Sales Staff</option>
              {staffList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
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
              style={{ borderRadius: '8px', fontSize: '12.5px' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
            title="Refresh Live Metrics"
            style={{ borderRadius: '8px', padding: '6px 10px' }}
          >
            <RefreshCw size={13} className={loading || dayLoading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            title="Export Monthly KPI Report"
            style={{ borderRadius: '8px', padding: '6px 12px', gap: '6px' }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Connection Error Banner */}
      {error && !summaryData ? (
        <ConnectionErrorState
          title="Unable to Load KPI Performance Data"
          message={error}
          onRetry={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
          isRetrying={loading}
        />
      ) : (
        <>
          {/* 2. Modern Minimalist Metric Scorecard Grid */}
          <div className="kpi-scorecard-grid">
        {/* Footfall / Inquiries */}
        <div className="kpi-stat-card">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">Footfall & Inquiries</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-stat-value">
            {dayKpi.walkins?.visits ?? 0}
            <span className="kpi-stat-unit">walk-ins</span>
          </div>
          <div className="kpi-stat-footer">
            <span className="kpi-pill-sub">{isToday ? "Today's showroom inquiries" : `Inquiries on ${selectedDay}`}</span>
          </div>
        </div>

        {/* Quotations Given */}
        <div className="kpi-stat-card">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">Quotations Shared</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div className="kpi-stat-value">
            {dayKpi.walkins?.quotes ?? 0}
            <span className="kpi-stat-unit">quotes ({dayKpi.quoteRate || 0}%)</span>
          </div>
          <div className="kpi-stat-footer">
            <span className="kpi-pill-sub">Formal price quotes presented</span>
          </div>
        </div>

        {/* Closed Orders & Revenue (Highlight Card) */}
        <div className="kpi-stat-card kpi-stat-card-highlight">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title" style={{ color: '#047857' }}>Closed Revenue & Bills</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#ECFDF5', color: '#059669' }}>
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#059669' }}>
            ₹{(dayKpi.salesValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-stat-footer">
            <span style={{ color: '#047857', fontWeight: '800' }}>
              🎉 {dayKpi.ordersCount || 0} {dayKpi.ordersCount === 1 ? 'deal' : 'deals'} ({dayKpi.conversionRate || 0}% conv.)
            </span>
          </div>
        </div>

        {/* Follow-ups Completed */}
        <div className="kpi-stat-card">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">Follow-ups Logged</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#F0F9FF', color: '#0284C7' }}>
              <PhoneCall size={16} />
            </div>
          </div>
          <div className="kpi-stat-value">
            {dayKpi.followUpsCount || 0}
            <span className="kpi-stat-unit">calls</span>
          </div>
          <div className="kpi-stat-footer">
            <span className="kpi-pill-sub">Active pipeline touchpoints</span>
          </div>
        </div>

        {/* Cross-Sell & VIP Outreach */}
        <div className="kpi-stat-card">
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">Cross-Sell & VIPs</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Layers size={16} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ fontSize: '17px', fontWeight: '800' }}>
            {dayKpi.crossSell ? (
              <span style={{ color: '#059669' }}>
                ✓ Cross-Sell ({(dayKpi.crossSellItems || []).length || 1})
              </span>
            ) : (
              <span style={{ color: '#64748B' }}>Standard Deals</span>
            )}
          </div>
          <div className="kpi-stat-footer" style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
            <span>Repeat: <strong>{dayKpi.oldCustomers ? '✓ Yes' : '—'}</strong></span>
            <span>•</span>
            <span>Engineers: <strong>{dayKpi.engineerCalls ? '✓ Yes' : '—'}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Sleek Collapsible Monthly Performance Timeline */}
      <div className="kpi-calendar-strip-card">
        <div
          className="kpi-calendar-strip-header"
          style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 16px' }}
          onClick={() => setCalendarExpanded(!calendarExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#2563EB" />
            <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>
              Monthly Performance Calendar ({selectedMonth})
            </span>
            <span className="kpi-minimal-badge">
              {calendarExpanded ? 'Active' : 'Click to View Days'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
              {calendarExpanded ? 'Hide Days' : 'Expand 31-day overview'}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px' }}
              onClick={(e) => {
                e.stopPropagation();
                setCalendarExpanded(!calendarExpanded);
              }}
            >
              {calendarExpanded ? '⌃' : '⌄'}
            </button>
          </div>
        </div>

        {calendarExpanded && (
          <div className="kpi-calendar-strip-scroll" style={{ padding: '10px 16px 14px' }}>
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
                      {t.ordersCount} {t.ordersCount === 1 ? 'deal' : 'deals'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Sales Staff Performance Strip (Styled like Monthly Performance Calendar) */}
      {todayStaffPerformance.length > 0 && (
        <div className="kpi-calendar-strip-card">
          <div
            className="kpi-calendar-strip-header"
            style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 16px' }}
            onClick={() => setStaffSectionExpanded(!staffSectionExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} color="#D97706" />
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>
                Sales Staff Performance ({formattedDayTitle})
              </span>
              {isToday && (
                <span className="badge" style={{ fontSize: '10px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: '800' }}>
                  LIVE TODAY
                </span>
              )}
              <span className="kpi-minimal-badge">
                {staffSectionExpanded ? `${todayStaffPerformance.length} Active Staff` : 'Click to View Staff'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                {staffSectionExpanded ? 'Hide Staff Details' : 'Expand Staff Performance'}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setStaffSectionExpanded(!staffSectionExpanded);
                }}
              >
                {staffSectionExpanded ? '⌃' : '⌄'}
              </button>
            </div>
          </div>

          {staffSectionExpanded && (
            <div className="kpi-calendar-strip-scroll" style={{ padding: '10px 16px 14px' }}>
              {todayStaffPerformance.map((s, idx) => {
                const isSelected = expandedStaffMember === s.staffName;
                const hasOrders = s.ordersCount > 0;
                const rankBadge = idx === 0 ? '👑 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
                const rankColor = idx === 0 ? '#D97706' : idx === 1 ? '#475569' : idx === 2 ? '#B45309' : '#64748B';

                return (
                  <button
                    key={s.staffName}
                    type="button"
                    className={`kpi-calendar-pill ${isSelected ? 'kpi-calendar-pill-selected' : ''} ${hasOrders ? 'kpi-calendar-pill-active' : ''}`}
                    style={{
                      minWidth: '140px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => setExpandedStaffMember(isSelected ? null : s.staffName)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: rankColor, background: `${rankColor}15`, padding: '1px 6px', borderRadius: '4px' }}>
                        {rankBadge}
                      </span>
                      {hasOrders && <span className="kpi-pill-today-dot" style={{ background: '#10B981' }} />}
                    </div>

                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '125px' }}>
                      {s.staffName}
                    </div>

                    <div className="kpi-pill-sales" style={{ fontSize: '14px', fontWeight: '900', color: s.salesValue > 0 ? '#059669' : '#64748B' }}>
                      {s.salesValue > 0 ? `₹${Math.round(s.salesValue / 1000)}k` : '₹0'}
                    </div>

                    <div className="kpi-pill-orders-badge" style={{ marginTop: '2px' }}>
                      {s.ordersCount} {s.ordersCount === 1 ? 'deal' : 'deals'} • {s.conversionRate}% conv.
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Minimalist Customer Activity Table for the Selected Date */}
      <div className="kpi-table-card">
        <div className="kpi-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={16} color="#059669" />
            <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
              Customer Transactions on {formattedDayTitle}
            </span>
            <span className="kpi-count-badge">{dayCustomers.length} records</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Automatic CRM day log
          </span>
        </div>

        {dayCustomers.length === 0 ? (
          <div className="kpi-empty-state">
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>📅</div>
            <div className="kpi-empty-title">
              No transactions recorded on {formattedDayTitle}
            </div>
            <div className="kpi-empty-sub">
              Leads registered, quoted, or billed on this date automatically appear here.
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
                  <th>Pipeline Status</th>
                  <th>Quotation / Order Value</th>
                  <th>Material Specifications</th>
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
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
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
                      <td style={{ color: '#475569', fontWeight: '600', fontSize: '12px' }}>
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
                      <td style={{ fontWeight: '800', fontSize: '13px', color: isClosed ? '#059669' : '#0F172A' }}>
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
        </>
      )}
    </div>
  );
};
