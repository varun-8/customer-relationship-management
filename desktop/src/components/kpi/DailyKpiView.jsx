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
import { useToneDown } from '../../context/ToneDownContext';

export const DailyKpiView = () => {
  const { isToneDown } = useToneDown();
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
    <div className="daily-kpi-root" style={{ display: 'flex', flexDirection: 'column', gap: isToneDown ? '12px' : '20px' }}>
      {/* 1. Header Toolbar */}
      <div
        className="kpi-toolbar-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: isToneDown ? '8px' : '20px',
          border: '1px solid #CBD5E1',
          padding: isToneDown ? '10px 14px' : '16px 22px',
          boxShadow: isToneDown ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isToneDown ? '10px' : '14px',
        }}
      >
        {/* Day Stepper Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isToneDown ? '#FFFFFF' : '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: isToneDown ? '6px' : '12px',
              padding: isToneDown ? '3px 6px' : '5px 8px',
              boxShadow: isToneDown ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <button
              type="button"
              onClick={handlePrevDay}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px' }}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
              <CalendarDays size={16} color={isToneDown ? '#0F172A' : '#2563EB'} />
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '800', color: '#0F172A', outline: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '700', color: isToneDown ? '#0F172A' : '#475569' }}>({formattedDayTitle})</span>
              {isToday && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF',
                    color: isToneDown ? '#0F172A' : '#2563EB',
                    border: isToneDown ? '1px solid #CBD5E1' : '1px solid #BFDBFE',
                    padding: '1px 7px',
                    borderRadius: '6px',
                    letterSpacing: '0.02em',
                  }}
                >
                  TODAY
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px' }}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDay(todayStr)}
              style={{
                backgroundColor: isToneDown ? '#F1F5F9' : '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: isToneDown ? '#0F172A' : '#2563EB',
                borderRadius: isToneDown ? '6px' : '10px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: isToneDown ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
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
            style={{
              padding: isToneDown ? '5px 10px' : '7px 14px',
              borderRadius: isToneDown ? '6px' : '10px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
            }}
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
            style={{
              padding: isToneDown ? '5px 10px' : '7px 12px',
              borderRadius: isToneDown ? '6px' : '10px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
          </input>

          <button
            type="button"
            onClick={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
            style={{
              backgroundColor: isToneDown ? '#F8FAFC' : '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: isToneDown ? '6px' : '10px',
              padding: isToneDown ? '5px 8px' : '7px 12px',
              cursor: 'pointer',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isToneDown ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: isToneDown ? '10px' : '16px' }}>
            {/* Walk-ins */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '18px',
                border: '1px solid #CBD5E1',
                borderTop: !isToneDown ? '4px solid #3B82F6' : '1px solid #CBD5E1',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SHOWROOM FOOTFALL
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF', color: isToneDown ? '#0F172A' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
                {dayKpi.walkins?.visits ?? 0} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>walk-ins</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>
                {isToday ? "Today's registered visitors" : `Visits on ${selectedDay}`}
              </div>
            </div>

            {/* Quotes Given */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '18px',
                border: '1px solid #CBD5E1',
                borderTop: !isToneDown ? '4px solid #8B5CF6' : '1px solid #CBD5E1',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  QUOTATIONS SHARED
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: isToneDown ? '#F1F5F9' : '#F5F3FF', color: isToneDown ? '#0F172A' : '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#7C3AED', marginTop: '6px' }}>
                {dayKpi.walkins?.quotes ?? 0} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>quotes</span>
              </div>
              <div style={{ fontSize: '12px', color: isToneDown ? '#475569' : '#7C3AED', marginTop: '4px', fontWeight: '700' }}>
                Quote Rate: {dayKpi.quoteRate || 0}% of walk-ins
              </div>
            </div>

            {/* Closed Revenue */}
            <div
              style={{
                background: isToneDown ? '#FFFFFF' : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                borderRadius: isToneDown ? '8px' : '18px',
                border: isToneDown ? '1px solid #CBD5E1' : '1.5px solid #6EE7B7',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 4px 18px rgba(16, 185, 129, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CLOSED REVENUE & DEALS
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: '#FFFFFF', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <IndianRupee size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#047857', marginTop: '6px' }}>
                ₹{(dayKpi.salesValue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#065F46', marginTop: '4px' }}>
                🎉 {dayKpi.ordersCount || 0} {dayKpi.ordersCount === 1 ? 'deal' : 'deals'} confirmed ({dayKpi.conversionRate || 0}% conv.)
              </div>
            </div>

            {/* Follow-ups */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '18px',
                border: '1px solid #CBD5E1',
                borderTop: !isToneDown ? '4px solid #0284C7' : '1px solid #CBD5E1',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 4px 15px rgba(2, 132, 199, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: isToneDown ? '#0F172A' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  FOLLOW-UPS LOGGED
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: isToneDown ? '#F1F5F9' : '#F0F9FF', color: isToneDown ? '#0F172A' : '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#0284C7', marginTop: '6px' }}>
                {dayKpi.followUpsCount || 0} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>calls/visits</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>
                Active pipeline nurture actions
              </div>
            </div>
          </div>

          {/* 3. Executive Split View: Side-by-Side Leaderboard & Monthly Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: isToneDown ? '12px' : '20px', alignItems: 'start' }}>
            {/* Sales Staff Performance Leaderboard */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '20px',
                border: '1px solid #CBD5E1',
                padding: isToneDown ? '12px 14px' : '22px',
                boxShadow: isToneDown ? 'none' : '0 4px 18px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isToneDown ? '10px' : '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={isToneDown ? 15 : 20} color={isToneDown ? '#0F172A' : '#D97706'} />
                  <span style={{ fontSize: isToneDown ? '13px' : '15px', fontWeight: '800', color: '#0F172A' }}>
                    Sales Executive Performance
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: isToneDown ? '#F1F5F9' : '#FEF3C7',
                    color: isToneDown ? '#0F172A' : '#B45309',
                    border: isToneDown ? '1px solid #CBD5E1' : '1px solid #FDE68A',
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {formattedDayTitle}
                </span>
              </div>

              {todayStaffPerformance.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: '500' }}>
                  No staff activity recorded for this date.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isToneDown ? '6px' : '10px' }}>
                  {todayStaffPerformance.map((s, idx) => {
                    const rankBadge = idx === 0 ? '👑 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
                    const rankBg = isToneDown ? '#F1F5F9' : (idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : idx === 2 ? '#FFEDD5' : '#F8FAFC');
                    const rankColor = isToneDown ? '#0F172A' : (idx === 0 ? '#B45309' : idx === 1 ? '#475569' : idx === 2 ? '#C2410C' : '#64748B');

                    return (
                      <div
                        key={s.staffName}
                        style={{
                          backgroundColor: isToneDown ? '#FFFFFF' : '#F8FAFC',
                          borderRadius: isToneDown ? '6px' : '12px',
                          padding: isToneDown ? '8px 10px' : '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #E2E8F0',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              backgroundColor: rankBg,
                              color: rankColor,
                              border: isToneDown ? '1px solid #CBD5E1' : 'none',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {rankBadge}
                          </span>
                          <div>
                            <div style={{ fontSize: isToneDown ? '13px' : '14px', fontWeight: '800', color: '#0F172A' }}>
                              {s.staffName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                              {s.visits} visits • {s.quotes} quotes
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: isToneDown ? '13px' : '15px', fontWeight: '900', color: s.salesValue > 0 ? (isToneDown ? '#0F172A' : '#059669') : '#0F172A' }}>
                            ₹{(s.salesValue || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: isToneDown ? '#475569' : '#2563EB', marginTop: '1px' }}>
                            {s.ordersCount} deals ({s.conversionRate}% conv.)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monthly Day-by-Day Performance Calendar & Overview */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '20px',
                border: '1px solid #CBD5E1',
                padding: isToneDown ? '12px 14px' : '22px',
                boxShadow: isToneDown ? 'none' : '0 4px 18px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: isToneDown ? '10px' : '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: isToneDown ? '26px' : '34px', height: isToneDown ? '26px' : '34px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF', color: isToneDown ? '#0F172A' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={isToneDown ? 14 : 18} />
                  </div>
                  <div>
                    <div style={{ fontSize: isToneDown ? '13px' : '14.5px', fontWeight: '800', color: '#0F172A' }}>
                      Monthly Performance Calendar
                    </div>
                    {!isToneDown && (
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                        {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: isToneDown ? '#F1F5F9' : '#ECFDF5',
                      color: isToneDown ? '#0F172A' : '#047857',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: isToneDown ? '1px solid #CBD5E1' : '1px solid #A7F3D0',
                    }}
                  >
                    {monthlyMetrics.activeDaysCount} Active Days
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF',
                      color: isToneDown ? '#0F172A' : '#1D4ED8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: isToneDown ? '1px solid #CBD5E1' : '1px solid #BFDBFE',
                    }}
                  >
                    ₹{monthlyMetrics.totalRevenue.toLocaleString('en-IN')} Total
                  </span>
                </div>
              </div>

              {/* Day Tiles Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '2px' }}>
                {dailyTrends.map((t) => {
                  const isSelected = t.date === selectedDay;
                  const isCurrentDay = t.date === todayStr;
                  const hasSales = Number(t.salesValue) > 0;
                  const isHighSales = Number(t.salesValue) >= 50000;

                  return (
                    <button
                      key={t.date}
                      type="button"
                      onClick={() => setSelectedDay(t.date)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: isToneDown ? '6px' : '12px',
                        border: isSelected
                          ? (isToneDown ? '2px solid #0F172A' : '2px solid #2563EB')
                          : isToneDown
                          ? '1px solid #CBD5E1'
                          : isHighSales
                          ? '1px solid #6EE7B7'
                          : hasSales
                          ? '1px solid #A7F3D0'
                          : '1px solid #E2E8F0',
                        backgroundColor: isToneDown
                          ? (isSelected ? '#F1F5F9' : '#FFFFFF')
                          : isSelected
                          ? '#EFF6FF'
                          : isHighSales
                          ? '#D1FAE5'
                          : hasSales
                          ? '#ECFDF5'
                          : isCurrentDay
                          ? '#FEF3C7'
                          : '#F8FAFC',
                        color: isSelected ? (isToneDown ? '#0F172A' : '#1D4ED8') : '#0F172A',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected && !isToneDown ? '0 0 0 3px rgba(37, 99, 235, 0.18)' : 'none',
                      }}
                      title={`${t.date}: ₹${(t.salesValue || 0).toLocaleString('en-IN')} (${t.ordersCount || 0} orders, ${t.visits || 0} visits)`}
                    >
                      {isCurrentDay && (
                        <span style={{ position: 'absolute', top: '2px', right: '3px', fontSize: '7px', fontWeight: '900', color: isToneDown ? '#0F172A' : '#D97706' }}>
                          ●
                        </span>
                      )}
                      <span style={{ fontSize: '9.5px', fontWeight: '700', color: isSelected ? (isToneDown ? '#0F172A' : '#2563EB') : '#64748B', textTransform: 'uppercase' }}>
                        {t.dayOfWeek}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: isSelected ? (isToneDown ? '#0F172A' : '#1E40AF') : '#0F172A' }}>
                        {t.dayNumber}
                      </span>
                      {hasSales ? (
                        <span style={{ fontSize: '9.5px', fontWeight: '800', color: isToneDown ? '#0F172A' : (isHighSales ? '#047857' : '#059669') }}>
                          ₹{Math.round(t.salesValue / 1000)}k
                        </span>
                      ) : (
                        <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>—</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9', fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isToneDown ? '#0F172A' : '#059669' }} /> Sales Day
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isToneDown ? '#64748B' : '#D97706' }} /> Today
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} /> No Sales
                  </span>
                </div>
                <span>Click tile for day breakdown</span>
              </div>
            </div>
          </div>

          {/* 4. Streamlined 5-Column High-Density Transaction Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: isToneDown ? '8px' : '20px',
              border: '1px solid #CBD5E1',
              boxShadow: isToneDown ? 'none' : '0 4px 18px rgba(0, 0, 0, 0.03)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: isToneDown ? '10px 14px' : '16px 22px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={isToneDown ? 15 : 18} color={isToneDown ? '#0F172A' : '#059669'} />
                <span style={{ fontSize: isToneDown ? '13px' : '14.5px', fontWeight: '800', color: '#0F172A' }}>
                  Showroom Transactions on {formattedDayTitle}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF',
                    color: isToneDown ? '#0F172A' : '#2563EB',
                    border: isToneDown ? '1px solid #CBD5E1' : '1px solid #BFDBFE',
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {dayCustomers.length} Records
                </span>
              </div>
              {!isToneDown && (
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                  Automatic CRM live log
                </span>
              )}
            </div>

            {dayCustomers.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748B' }}>
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
                    <tr style={{ backgroundColor: isToneDown ? '#F1F5F9' : '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                      <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        1. Customer Lead
                      </th>
                      <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        2. Status & Source
                      </th>
                      <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        3. Material Specifications
                      </th>
                      <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        4. Sales Executive
                      </th>
                      <th style={{ padding: isToneDown ? '8px 12px' : '14px 18px', fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
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
                            borderBottom: idx < dayCustomers.length - 1 ? '1px solid #E2E8F0' : 'none',
                            backgroundColor: isToneDown ? '#FFFFFF' : (isClosed ? '#F0FDF4' : '#FFFFFF'),
                          }}
                        >
                          {/* Column 1: Customer Lead */}
                          <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                              {c.customerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                              <span style={{ fontSize: '11px', color: isToneDown ? '#0F172A' : '#2563EB', fontWeight: '800', fontFamily: 'monospace', backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF', border: isToneDown ? '1px solid #CBD5E1' : 'none', padding: '1px 6px', borderRadius: '4px' }}>
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
                          <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle' }}>
                            <span
                              style={{
                                fontSize: '11.5px',
                                fontWeight: '800',
                                padding: '3px 9px',
                                borderRadius: isToneDown ? '4px' : '10px',
                                display: 'inline-block',
                                backgroundColor: isToneDown ? '#F1F5F9' : (isClosed ? '#DCFCE7' : isQuote ? '#FEF3C7' : '#EFF6FF'),
                                color: isToneDown ? '#0F172A' : (isClosed ? '#15803D' : isQuote ? '#B45309' : '#1D4ED8'),
                                border: `1px solid ${isToneDown ? '#CBD5E1' : (isClosed ? '#86EFAC' : isQuote ? '#FDE68A' : '#BFDBFE')}`,
                              }}
                            >
                              {isClosed ? '🎉 Order Confirmed' : isQuote ? `📄 ${c.status}` : `💬 ${c.status}`}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', fontWeight: '600' }}>
                              Source: {c.leadSource || 'Direct Walk-in'}
                            </div>
                          </td>

                          {/* Column 3: Material Specs */}
                          <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle' }}>
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
                          <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                              {c.salesperson || 'Showroom Staff'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              {c.customerType || 'Building Owner'}
                            </div>
                          </td>

                          {/* Column 5: Deal Value */}
                          <td style={{ padding: isToneDown ? '8px 12px' : '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: isToneDown ? '#0F172A' : (isClosed ? '#059669' : '#0F172A') }}>
                              ₹{(c.orderValue || c.quotationValue || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11px', color: isToneDown ? '#475569' : (isClosed ? '#059669' : '#64748B'), fontWeight: '600', marginTop: '2px' }}>
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
