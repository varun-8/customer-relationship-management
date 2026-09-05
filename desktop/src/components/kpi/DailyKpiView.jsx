import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  Target,
  PhoneCall,
  Receipt,
  IndianRupee,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileCheck,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { ConnectionErrorState } from '../common/ConnectionErrorState';
import { useTestingMode } from '../../context/TestingModeContext';

export const DailyKpiView = () => {
  const { isLowDesignMode } = useTestingMode();
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
  const [staffList, setStaffList] = useState([]);

  // Filters
  const [staffFilter, setStaffFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));

  // Fetch all live showroom staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const [usersRes, customersRes] = await Promise.all([
          api.getUsers(),
          api.getCustomers(),
        ]);

        const userNames = (usersRes && usersRes.success && Array.isArray(usersRes.data))
          ? usersRes.data.filter((u) => u.active !== false).map((u) => u.name)
          : [];

        const customerSalespeople = (customersRes && customersRes.success && Array.isArray(customersRes.data))
          ? customersRes.data.map((c) => {
              const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
              return d.salesperson;
            }).filter(Boolean)
          : [];

        const combined = Array.from(new Set([...userNames, ...customerSalespeople])).filter(Boolean);
        setStaffList(combined);
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

  // Day specific variables
  const dayKpi = dayData?.kpi || {};
  const dayCustomers = dayData?.customers || [];

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

  // Calculate Monthly Performance Summary Stats
  const monthlyMetrics = useMemo(() => {
    if (!dailyTrends || dailyTrends.length === 0) {
      return { totalRevenue: 0, activeDaysCount: 0, bestDay: null, totalOrders: 0 };
    }
    const totalRevenue = dailyTrends.reduce((acc, t) => acc + (Number(t.salesValue) || 0), 0);
    const totalOrders = dailyTrends.reduce((acc, t) => acc + (Number(t.ordersCount) || 0), 0);
    const activeDays = dailyTrends.filter((t) => Number(t.salesValue) > 0 || Number(t.ordersCount) > 0);
    const bestDay = [...dailyTrends].sort((a, b) => (Number(b.salesValue) || 0) - (Number(a.salesValue) || 0))[0];

    return {
      totalRevenue,
      activeDaysCount: activeDays.length,
      bestDay: bestDay && Number(bestDay.salesValue) > 0 ? bestDay : null,
      totalOrders,
    };
  }, [dailyTrends]);

  return (
    <div className="daily-kpi-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        {/* Day Stepper Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '4px 6px',
            }}
          >
            <button
              type="button"
              onClick={handlePrevDay}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', display: 'flex' }}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
              <CalendarDays size={16} color="#2563EB" />
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '800', color: '#0F172A', outline: 'none' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>({formattedDayTitle})</span>
              {isToday && (
                <span style={{ fontSize: '10.5px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '4px' }}>
                  TODAY
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', display: 'flex' }}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDay(todayStr)}
              style={{ backgroundColor: '#F1F5F9', border: 'none', color: '#0F172A', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Staff Filter */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
          >
            <option value="all">All Sales Staff</option>
            {staffList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
          />

          <button
            type="button"
            onClick={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: '#475569' }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading || dayLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && !summaryData ? (
        <ConnectionErrorState
          title="Unable to Load KPI Performance Data"
          message={error}
          onRetry={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
          isRetrying={loading}
        />
      ) : (
        <>
          {/* 2. Top Metric Cards (4 Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {/* Walk-ins */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: isLowDesignMode ? '4px' : '18px', border: isLowDesignMode ? '1px solid #D1D5DB' : '1px solid #E2E8F0', padding: '16px 20px', boxShadow: isLowDesignMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SHOWROOM FOOTFALL
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: isLowDesignMode ? '4px' : '10px', backgroundColor: isLowDesignMode ? '#F3F4F6' : '#EFF6FF', color: isLowDesignMode ? '#000000' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: isLowDesignMode ? '#000000' : '#0F172A', marginTop: '6px' }}>
                {dayKpi.walkins?.visits ?? 0} <span style={{ fontSize: '13px', fontWeight: '600', color: isLowDesignMode ? '#000000' : '#64748B' }}>walk-ins</span>
              </div>
              <div style={{ fontSize: '12px', color: isLowDesignMode ? '#000000' : '#64748B', marginTop: '4px' }}>
                {isToday ? "Today's showroom visitors" : `Visits on ${selectedDay}`}
              </div>
            </div>

            {/* Quotes Given */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: isLowDesignMode ? '4px' : '18px', border: isLowDesignMode ? '1px solid #D1D5DB' : '1px solid #E2E8F0', padding: '16px 20px', boxShadow: isLowDesignMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  QUOTATIONS SHARED
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: isLowDesignMode ? '4px' : '10px', backgroundColor: isLowDesignMode ? '#F3F4F6' : '#F5F3FF', color: isLowDesignMode ? '#000000' : '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: isLowDesignMode ? '#000000' : '#7C3AED', marginTop: '6px' }}>
                {dayKpi.walkins?.quotes ?? 0} <span style={{ fontSize: '13px', fontWeight: '600', color: isLowDesignMode ? '#000000' : '#64748B' }}>quotes ({dayKpi.quoteRate || 0}%)</span>
              </div>
              <div style={{ fontSize: '12px', color: isLowDesignMode ? '#000000' : '#64748B', marginTop: '4px' }}>
                Formal price estimates created
              </div>
            </div>

            {/* Closed Revenue */}
            <div style={{ backgroundColor: isLowDesignMode ? '#FFFFFF' : '#ECFDF5', borderRadius: isLowDesignMode ? '4px' : '18px', border: isLowDesignMode ? '1px solid #D1D5DB' : '1.5px solid #A7F3D0', padding: '16px 20px', boxShadow: isLowDesignMode ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CLOSED REVENUE & DEALS
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: isLowDesignMode ? '4px' : '10px', backgroundColor: isLowDesignMode ? '#F3F4F6' : '#FFFFFF', color: isLowDesignMode ? '#000000' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLowDesignMode ? 'none' : '0 2px 6px rgba(0,0,0,0.05)' }}>
                  <IndianRupee size={16} />
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: isLowDesignMode ? '#000000' : '#059669', marginTop: '6px' }}>
                ₹{(dayKpi.salesValue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#047857', marginTop: '4px' }}>
                🎉 {dayKpi.ordersCount || 0} {dayKpi.ordersCount === 1 ? 'deal' : 'deals'} confirmed ({dayKpi.conversionRate || 0}% conv.)
              </div>
            </div>

            {/* Follow-ups */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: isLowDesignMode ? '4px' : '18px', border: isLowDesignMode ? '1px solid #D1D5DB' : '1px solid #E2E8F0', padding: '16px 20px', boxShadow: isLowDesignMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  FOLLOW-UPS LOGGED
                </span>
                <div style={{ width: '34px', height: '34px', borderRadius: isLowDesignMode ? '4px' : '10px', backgroundColor: isLowDesignMode ? '#F3F4F6' : '#F0F9FF', color: isLowDesignMode ? '#000000' : '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: isLowDesignMode ? '#000000' : '#0284C7', marginTop: '6px' }}>
                {dayKpi.followUpsCount || 0} <span style={{ fontSize: '13px', fontWeight: '600', color: isLowDesignMode ? '#000000' : '#64748B' }}>calls/visits</span>
              </div>
              <div style={{ fontSize: '12px', color: isLowDesignMode ? '#000000' : '#64748B', marginTop: '4px' }}>
                Active pipeline nurture
              </div>
            </div>
          </div>

          {/* 3. Executive View: Sales Staff Leaderboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', alignItems: 'start' }}>
            {/* Sales Staff Performance Leaderboard */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: isLowDesignMode ? '4px' : '20px', border: isLowDesignMode ? '1px solid #D1D5DB' : '1px solid #E2E8F0', padding: '20px', boxShadow: isLowDesignMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color={isLowDesignMode ? '#000000' : '#D97706'} />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#0F172A' }}>
                    Sales Executive Performance
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: isLowDesignMode ? '#F3F4F6' : '#FEF3C7', color: isLowDesignMode ? '#000000' : '#B45309', padding: '2px 8px', borderRadius: isLowDesignMode ? '4px' : '8px', border: isLowDesignMode ? '1px solid #D1D5DB' : 'none' }}>
                  {formattedDayTitle}
                </span>
              </div>

              {todayStaffPerformance.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: isLowDesignMode ? '#000000' : '#64748B', fontSize: '13px' }}>
                  No staff activity recorded for this date.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {todayStaffPerformance.map((s, idx) => {
                    const rankBadge = idx === 0 ? '👑 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
                    const rankBg = isLowDesignMode ? '#F3F4F6' : (idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : idx === 2 ? '#FFEDD5' : '#F1F5F9');
                    const rankColor = isLowDesignMode ? '#000000' : (idx === 0 ? '#B45309' : idx === 1 ? '#475569' : idx === 2 ? '#C2410C' : '#64748B');

                    return (
                      <div
                        key={s.staffName}
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: isLowDesignMode ? '4px' : '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: isLowDesignMode ? '1px solid #D1D5DB' : '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: rankBg, color: rankColor, padding: '3px 8px', borderRadius: isLowDesignMode ? '4px' : '6px', border: isLowDesignMode ? '1px solid #D1D5DB' : 'none' }}>
                            {rankBadge}
                          </span>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: isLowDesignMode ? '#000000' : '#0F172A' }}>
                              {s.staffName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: isLowDesignMode ? '#000000' : '#64748B', marginTop: '1px' }}>
                              {s.visits} visits • {s.quotes} quotes
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14.5px', fontWeight: '900', color: isLowDesignMode ? '#000000' : (s.salesValue > 0 ? '#059669' : '#0F172A') }}>
                            ₹{(s.salesValue || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: isLowDesignMode ? '#000000' : '#2563EB', marginTop: '1px' }}>
                            {s.ordersCount} deals ({s.conversionRate}% conv.)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Streamlined 5-Column High-Density Transaction Table */}
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
                <FileCheck size={16} color="#059669" />
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                  Showroom Transactions on {formattedDayTitle}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '8px' }}>
                  {dayCustomers.length} Records
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Automatic live CRM day log
              </span>
            </div>

            {dayCustomers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                  No transactions recorded on {formattedDayTitle}
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '360px', margin: '4px auto 0' }}>
                  Leads registered, quoted, or confirmed on this date automatically populate here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        1. Customer Lead
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        2. Status & Source
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        3. Material Specifications
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        4. Sales Executive
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                        5. Deal Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayCustomers.map((c, idx) => {
                      const isClosed = c.status === 'Order Confirmed';
                      const isQuote = c.status === 'Quotation' || c.status === 'Negotiation';

                      return (
                        <tr
                          key={c._id || c.customerId}
                          style={{
                            borderBottom: idx < dayCustomers.length - 1 ? '1px solid #F1F5F9' : 'none',
                            backgroundColor: isClosed ? '#F0FDF4' : '#FFFFFF',
                          }}
                        >
                          {/* Column 1: Customer Lead */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                              {c.customerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                              <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#EFF6FF', padding: '1px 6px', borderRadius: '4px' }}>
                                #{c.customerId}
                              </span>
                              {c.phone && (
                                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                                  📞 {c.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Column 2: Status & Source */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span
                              style={{
                                fontSize: '11.5px',
                                fontWeight: '800',
                                padding: '3px 9px',
                                borderRadius: '10px',
                                display: 'inline-block',
                                backgroundColor: isClosed ? '#DCFCE7' : isQuote ? '#FEF3C7' : '#EFF6FF',
                                color: isClosed ? '#15803D' : isQuote ? '#B45309' : '#1D4ED8',
                                border: `1px solid ${isClosed ? '#86EFAC' : isQuote ? '#FDE68A' : '#BFDBFE'}`,
                              }}
                            >
                              {isClosed ? '🎉 Order Confirmed' : isQuote ? `📄 ${c.status}` : `💬 ${c.status}`}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', fontWeight: '600' }}>
                              Source: {c.leadSource || 'Direct Walk-in'}
                            </div>
                          </td>

                          {/* Column 3: Material Specs */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                              {c.requirement || 'Tiles & Sanitary'}
                            </div>
                            {c.approxQuantity && (
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                Quantity: {c.approxQuantity}
                              </div>
                            )}
                          </td>

                          {/* Column 4: Sales Executive */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                              {c.salesperson || 'Showroom Staff'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              {c.customerType || 'Building Owner'}
                            </div>
                          </td>

                          {/* Column 5: Deal Value */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: isClosed ? '#059669' : '#0F172A' }}>
                              ₹{(c.orderValue || c.quotationValue || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11px', color: isClosed ? '#059669' : '#64748B', fontWeight: '600', marginTop: '2px' }}>
                              {isClosed ? 'Billed Order' : 'Quotation Estimate'}
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
        </>
      )}
    </div>
  );
};
