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
  CheckCircle2,
  BarChart3,
  Zap,
  User,
  FileText,
  Phone,
  Clock,
  Home,
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
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'confirmed' | 'quote'

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

  // Live Auto-Sync with Mobile CRM entries (polls silently every 6 seconds when tab is visible)
  useEffect(() => {
    const liveTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchKpiData();
        fetchDayPerformance(selectedDay);
      }
    }, 6000);
    return () => clearInterval(liveTimer);
  }, [selectedDay, staffFilter, selectedMonth]);


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

  const totalDayBilled = useMemo(() => {
    return dayCustomers
      .filter((c) => c.status === 'Order Confirmed')
      .reduce((sum, c) => sum + (Number(c.orderValue) || Number(c.quotationValue) || 0), 0);
  }, [dayCustomers]);

  const totalDayQuotes = useMemo(() => {
    return dayCustomers
      .filter((c) => c.status !== 'Order Confirmed')
      .reduce((sum, c) => sum + (Number(c.quotationValue) || Number(c.orderValue) || 0), 0);
  }, [dayCustomers]);

  const closedCount = useMemo(() => {
    return dayCustomers.filter((c) => c.status === 'Order Confirmed').length;
  }, [dayCustomers]);

  const quoteCount = useMemo(() => {
    return dayCustomers.filter((c) => c.status === 'Quotation' || c.status === 'Negotiation').length;
  }, [dayCustomers]);

  const filteredDayCustomers = useMemo(() => {
    if (txFilter === 'confirmed') return dayCustomers.filter((c) => c.status === 'Order Confirmed');
    if (txFilter === 'quote') return dayCustomers.filter((c) => c.status === 'Quotation' || c.status === 'Negotiation');
    return dayCustomers;
  }, [dayCustomers, txFilter]);

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

  // Synchronize month when day changes
  const handleDateChange = (newDate) => {
    setSelectedDay(newDate);
    const m = newDate.substring(0, 7);
    if (m !== selectedMonth) {
      setSelectedMonth(m);
    }
  };

  // Synchronize day when month changes
  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    if (!selectedDay.startsWith(newMonth)) {
      if (todayStr.startsWith(newMonth)) {
        setSelectedDay(todayStr);
      } else {
        setSelectedDay(`${newMonth}-01`);
      }
    }
  };

  // Month Stepper Navigation
  const navigateMonth = (direction) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + direction, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newMonthStr = `${newY}-${newM}`;
    handleMonthChange(newMonthStr);
  };

  // Formatted Month Title (e.g. September 2026)
  const formattedMonthTitle = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // First day of month offset for accurate 7-column calendar alignment (0 = Sun, 1 = Mon ... 6 = Sat)
  const monthFirstDayOfWeek = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      return new Date(y, m - 1, 1).getDay();
    } catch {
      return 0;
    }
  }, [selectedMonth]);

  // Horizontal Calendar Scroll Controls
  const calendarScrollRef = React.useRef(null);

  const scrollCalendar = (direction) => {
    if (calendarScrollRef.current) {
      const scrollAmt = direction === 'left' ? -360 : 360;
      calendarScrollRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  // Auto-scroll horizontal timeline to selected day or current day
  useEffect(() => {
    if (calendarScrollRef.current) {
      const selectedTile = calendarScrollRef.current.querySelector('[data-selected="true"]');
      if (selectedTile) {
        selectedTile.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDay, selectedMonth]);

  // Navigate Days
  const handlePrevDay = () => {
    const prev = new Date(new Date(selectedDay).getTime() - 86400000).toISOString().split('T')[0];
    handleDateChange(prev);
  };

  const handleNextDay = () => {
    const next = new Date(new Date(selectedDay).getTime() + 86400000).toISOString().split('T')[0];
    handleDateChange(next);
  };

  const handleSetYesterday = () => {
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    handleDateChange(yest);
  };

  return (
    <div className="daily-kpi-root" style={{ display: 'flex', flexDirection: 'column', gap: isToneDown ? '12px' : '20px' }}>
      {/* 1. Header Toolbar: Executive Command & Filter Bar */}
      <div
        className="kpi-toolbar-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: isToneDown ? '8px' : '18px',
          border: '1px solid #CBD5E1',
          padding: isToneDown ? '10px 14px' : '16px 20px',
          boxShadow: isToneDown ? 'none' : '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Row 1: Primary Date Navigator & Presets */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          {/* Left: Date Stepper & Calendar Hub */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: isToneDown ? '#FFFFFF' : '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: isToneDown ? '6px' : '12px',
                padding: isToneDown ? '3px 6px' : '4px 8px',
                boxShadow: isToneDown ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <button
                type="button"
                onClick={handlePrevDay}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease',
                }}
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
                <CalendarDays size={16} color={isToneDown ? '#0F172A' : '#2563EB'} />
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    color: '#0F172A',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: '700', color: isToneDown ? '#0F172A' : '#475569' }}>
                  ({formattedDayTitle})
                </span>
                {isToday && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF',
                      color: isToneDown ? '#0F172A' : '#2563EB',
                      border: isToneDown ? '1px solid #CBD5E1' : '1px solid #BFDBFE',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    TODAY
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease',
                }}
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick Date Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleDateChange(todayStr)}
                style={{
                  backgroundColor: isToday ? (isToneDown ? '#0F172A' : '#2563EB') : '#FFFFFF',
                  color: isToday ? '#FFFFFF' : '#475569',
                  border: isToday ? 'none' : '1px solid #CBD5E1',
                  borderRadius: isToneDown ? '6px' : '9px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isToday ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                }}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleSetYesterday}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: isToneDown ? '6px' : '9px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Right: Live Sync Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#15803D',
              }}
              title="Real-time silent auto-syncing with mobile phone entries every 6 seconds"
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#16A34A',
                  display: 'inline-block',
                  boxShadow: '0 0 6px #16A34A',
                }}
              />
              <span>Live Sync Active</span>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Filter Controls & Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Left: Filter Group (Sales Staff) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Sales Staff Filter */}
            <select
              className="form-select"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              style={{
                minWidth: '200px',
                height: isToneDown ? '34px' : '38px',
                fontSize: '12.5px',
                fontWeight: '700',
              }}
              title="Filter performance by Sales Executive"
            >
              <option value="all">👥 All Sales Executives</option>
              {staffList.map((name) => (
                <option key={name} value={name}>
                  👤 {name}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Actions Group (CSV Export & Manual Refresh) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: isToneDown ? '6px' : '10px',
                padding: '7px 13px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              title="Download Monthly Performance CSV"
            >
              <Download size={14} color="#475569" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => { fetchKpiData(); fetchDayPerformance(selectedDay); }}
              style={{
                backgroundColor: isToneDown ? '#F8FAFC' : '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: isToneDown ? '6px' : '10px',
                padding: '7px 13px',
                cursor: 'pointer',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: isToneDown ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              title="Force Refresh Data"
            >
              <RefreshCw size={13} className={loading || dayLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
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
                borderRadius: isToneDown ? '8px' : '16px',
                border: '1px solid #E2E8F0',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SHOWROOM FOOTFALL
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                borderRadius: isToneDown ? '8px' : '16px',
                border: '1px solid #E2E8F0',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  QUOTATIONS SHARED
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
                {dayKpi.walkins?.quotes ?? 0} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>quotes</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
                Quote Rate: {dayKpi.quoteRate || 0}% of walk-ins
              </div>
            </div>

            {/* Closed Revenue */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '16px',
                border: '1px solid #CBD5E1',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CLOSED REVENUE & DEALS
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
                ₹{(dayKpi.salesValue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '4px' }}>
                {dayKpi.ordersCount || 0} {dayKpi.ordersCount === 1 ? 'deal' : 'deals'} confirmed ({dayKpi.conversionRate || 0}% conv.)
              </div>
            </div>

            {/* Follow-ups */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '16px',
                border: '1px solid #E2E8F0',
                padding: isToneDown ? '12px 14px' : '18px 20px',
                boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  FOLLOW-UPS LOGGED
                </span>
                <div style={{ width: isToneDown ? '28px' : '36px', height: isToneDown ? '28px' : '36px', borderRadius: isToneDown ? '6px' : '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={isToneDown ? 14 : 18} />
                </div>
              </div>
              <div style={{ fontSize: isToneDown ? '20px' : '26px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
                {dayKpi.followUpsCount || 0} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>calls/visits</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>
                Active pipeline nurture actions
              </div>
            </div>
          </div>

          {/* Executive Showroom Analytics & Conversion Intelligence Bar */}
          {(() => {
            const avgDealSize = dayKpi.ordersCount > 0 ? Math.round(dayKpi.salesValue / dayKpi.ordersCount) : 0;
            const walkinToQuotePct = dayKpi.walkins?.visits > 0
              ? Math.round(((dayKpi.walkins?.quotes || 0) / dayKpi.walkins.visits) * 100)
              : 0;
            const quoteToClosePct = (dayKpi.walkins?.quotes || 0) > 0
              ? Math.round(((dayKpi.ordersCount || 0) / dayKpi.walkins.quotes) * 100)
              : 0;

            return (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: isToneDown ? '8px' : '16px',
                  border: '1px solid #E2E8F0',
                  padding: isToneDown ? '12px 14px' : '16px 20px',
                  boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.03)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                {/* 1. Avg Deal Size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      AVG DEAL VALUE
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                      ₹{avgDealSize.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* 2. Walk-in to Quote Rate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      WALK-IN → QUOTE RATE
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                      {walkinToQuotePct}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>
                      ({dayKpi.walkins?.quotes || 0}/{dayKpi.walkins?.visits || 0})
                    </span>
                  </div>
                </div>

                {/* 3. Quote to Won Deal Conversion */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      QUOTE → WON CONVERSION
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                      {quoteToClosePct}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>
                      ({dayKpi.ordersCount || 0} won)
                    </span>
                  </div>
                </div>

                {/* 4. Active Floor Staff */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      ACTIVE SALES STAFF
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                      {todayStaffPerformance.length} on floor
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. Full-Width Horizontal Monthly Performance Calendar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: isToneDown ? '8px' : '20px',
              border: '1px solid #CBD5E1',
              padding: isToneDown ? '14px 16px' : '20px 24px',
              boxShadow: isToneDown ? 'none' : '0 4px 20px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header: Title + Dedicated Month Stepper + Executive Month Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                paddingBottom: '14px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              {/* Left: Title & Subtitle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: isToneDown ? '30px' : '40px',
                    height: isToneDown ? '30px' : '40px',
                    borderRadius: isToneDown ? '8px' : '12px',
                    backgroundColor: isToneDown ? '#F1F5F9' : '#EFF6FF',
                    color: isToneDown ? '#0F172A' : '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarDays size={isToneDown ? 16 : 20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: isToneDown ? '14px' : '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Monthly Performance Calendar
                    </h2>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      HORIZONTAL VIEW
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0', fontWeight: '500' }}>
                    Day-by-day showroom revenue tracking & daily drill-down selector
                  </p>
                </div>
              </div>

              {/* Center: Month Stepper & Quick Return */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: isToneDown ? '6px' : '11px',
                    padding: '3px 8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      borderRadius: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div style={{ padding: '0 12px', fontSize: '13.5px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {formattedMonthTitle}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      borderRadius: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {selectedMonth !== todayStr.substring(0, 7) && (
                  <button
                    type="button"
                    onClick={() => handleMonthChange(todayStr.substring(0, 7))}
                    style={{
                      backgroundColor: '#EFF6FF',
                      border: '1.5px solid #BFDBFE',
                      borderRadius: isToneDown ? '6px' : '10px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#2563EB',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    This Month
                  </button>
                )}
              </div>

              {/* Right: High-Level Metric Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>TOTAL:</span>
                  <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#059669' }}>
                    ₹{monthlyMetrics.totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>WON:</span>
                  <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#0F172A' }}>
                    {monthlyMetrics.totalOrders} Deals
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>PEAK:</span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: '#0F172A' }}>
                    {monthlyMetrics.bestDay ? `Day ${monthlyMetrics.bestDay.dayNumber} (₹${Math.round(monthlyMetrics.bestDay.salesValue / 1000)}k)` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Horizontal Timeline Ribbon with Scroll Controls */}
            <div style={{ position: 'relative' }}>
              {/* Left Scroll Overlay Button */}
              <button
                type="button"
                onClick={() => scrollCalendar('left')}
                style={{
                  position: 'absolute',
                  left: '-10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#334155',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                title="Scroll Days Left"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Horizontal Days Strip */}
              <div
                ref={calendarScrollRef}
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '8px 4px 12px',
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 transparent',
                }}
              >
                {dailyTrends.map((t) => {
                  const isSelected = t.date === selectedDay;
                  const isCurrentDay = t.date === todayStr;
                  const hasSales = Number(t.salesValue) > 0;
                  const isWeekend = t.dayOfWeek === 'Sun' || t.dayOfWeek === 'Sat';

                  return (
                    <button
                      key={t.date}
                      type="button"
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={() => handleDateChange(t.date)}
                      style={{
                        flex: '0 0 78px',
                        minWidth: '78px',
                        height: '106px',
                        borderRadius: isToneDown ? '6px' : '12px',
                        border: isSelected
                          ? '2px solid #0F172A'
                          : isToneDown
                          ? '1px solid #CBD5E1'
                          : hasSales
                          ? '1.5px solid #CBD5E1'
                          : '1px solid #E2E8F0',
                        backgroundColor: isSelected
                          ? '#0F172A'
                          : isCurrentDay
                          ? '#F8FAFC'
                          : isWeekend
                          ? '#F8FAFC'
                          : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#0F172A',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 4px 8px',
                        position: 'relative',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isSelected
                          ? '0 4px 14px rgba(15, 23, 42, 0.25)'
                          : '0 1px 3px rgba(15, 23, 42, 0.03)',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                      title={`${t.date}: ₹${(t.salesValue || 0).toLocaleString('en-IN')} (${t.ordersCount || 0} orders, ${t.visits || 0} visits)`}
                    >
                      {/* Top: Day of Week & Today Marker */}
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            color: isSelected ? '#94A3B8' : isWeekend ? '#94A3B8' : '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {t.dayOfWeek}
                        </span>
                        {isCurrentDay && !isSelected && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-2px',
                              right: '2px',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#0F172A',
                            }}
                            title="Today"
                          />
                        )}
                      </div>

                      {/* Center: Large Day Number */}
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: '900',
                          color: isSelected ? '#FFFFFF' : '#0F172A',
                          lineHeight: 1,
                        }}
                      >
                        {t.dayNumber}
                      </div>

                      {/* Bottom: Sales Revenue Badge */}
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        {hasSales ? (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: '800',
                              color: isSelected ? '#34D399' : '#059669',
                              backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : '#F1F5F9',
                              border: isSelected ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #E2E8F0',
                              padding: '1.5px 5px',
                              borderRadius: '5px',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.1,
                            }}
                          >
                            ₹{Math.round(t.salesValue / 1000)}k
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: isSelected ? '#64748B' : '#CBD5E1', fontWeight: '500' }}>—</span>
                        )}

                        {Number(t.ordersCount) > 0 && (
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: '700',
                              color: isSelected ? '#CBD5E1' : '#64748B',
                              lineHeight: 1,
                            }}
                          >
                            {t.ordersCount} won
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Overlay Button */}
              <button
                type="button"
                onClick={() => scrollCalendar('right')}
                style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#334155',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                title="Scroll Days Right"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Bottom Legend Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid #F1F5F9',
                fontSize: '11.5px',
                color: '#64748B',
                fontWeight: '600',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#059669' }} /> Sales Day
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#0F172A' }} /> Selected Day
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#94A3B8' }} /> Non-Active Day
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Tip: Click any day tile to inspect live sales breakdown & staff activity below
              </span>
            </div>
          </div>

          {/* 4. Selected Day Deep-Dive: Staff Leaderboard & Live Transactions Split */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: isToneDown ? '12px' : '20px',
              alignItems: 'start',
            }}
          >
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
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: '500' }}>
                  No staff activity recorded for {formattedDayTitle}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isToneDown ? '6px' : '10px' }}>
                  {todayStaffPerformance.map((s, idx) => {
                    const rankBadge = `RANK #${idx + 1}`;
                    const rankBg = isToneDown ? '#F1F5F9' : (idx === 0 ? '#F8FAFC' : '#FFFFFF');
                    const rankColor = isToneDown ? '#0F172A' : '#334155';

                    return (
                      <div
                        key={s.staffName}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: isToneDown ? '6px' : '10px',
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
                              border: '1px solid #E2E8F0',
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
                          <div style={{ fontSize: isToneDown ? '13px' : '15px', fontWeight: '900', color: s.salesValue > 0 ? '#059669' : '#0F172A' }}>
                            ₹{(s.salesValue || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginTop: '1px' }}>
                            {s.ordersCount} deals ({s.conversionRate}% conv.)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Executive Showroom Transactions Card Stream */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: isToneDown ? '8px' : '20px',
                border: '1px solid #CBD5E1',
                boxShadow: isToneDown ? 'none' : '0 4px 18px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header Bar: Title, Live Billed Pill, and Quick Filter Tabs */}
              <div
                style={{
                  padding: isToneDown ? '12px 14px' : '16px 20px',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Left: Icon, Title & Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: isToneDown ? '28px' : '36px',
                      height: isToneDown ? '28px' : '36px',
                      borderRadius: isToneDown ? '6px' : '10px',
                      backgroundColor: isToneDown ? '#F1F5F9' : '#ECFDF5',
                      color: isToneDown ? '#0F172A' : '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Receipt size={isToneDown ? 15 : 18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: isToneDown ? '13px' : '15px', fontWeight: '800', color: '#0F172A' }}>
                        Showroom Transactions
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          padding: '1.5px 7px',
                          borderRadius: '6px',
                        }}
                      >
                        {filteredDayCustomers.length} Records
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500', marginTop: '1px' }}>
                      {formattedDayTitle}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Filter Tabs & Billed Value Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Billed Total Badge */}
                  {totalDayBilled > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '4px 10px',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>
                        BILLED:
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#065F46' }}>
                        ₹{totalDayBilled.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* Filter Pills */}
                  <div
                    style={{
                      display: 'flex',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '2px',
                    }}
                  >
                    {[
                      { id: 'all', label: `All (${dayCustomers.length})` },
                      { id: 'confirmed', label: `Won (${closedCount})` },
                      { id: 'quote', label: `Quotes (${quoteCount})` },
                    ].map((tab) => {
                      const active = txFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTxFilter(tab.id)}
                          style={{
                            background: active ? '#EFF6FF' : 'transparent',
                            color: active ? '#1D4ED8' : '#64748B',
                            fontWeight: active ? '800' : '600',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 9px',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              {dayCustomers.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                    No transactions recorded on {formattedDayTitle}
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '380px', margin: '6px auto 0', lineHeight: 1.5 }}>
                    Client footfalls, quotations, and confirmed billing recorded for this date automatically populate here in real time.
                  </p>
                </div>
              ) : filteredDayCustomers.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                    No transactions match the "{txFilter === 'confirmed' ? 'Won' : 'Quotes'}" filter.
                  </div>
                  <button
                    type="button"
                    onClick={() => setTxFilter('all')}
                    style={{
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    View All {dayCustomers.length} Records
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: '460px',
                    overflowY: 'auto',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {filteredDayCustomers.map((c) => {
                    const isClosed = c.status === 'Order Confirmed';
                    const isQuote = c.status === 'Quotation' || c.status === 'Negotiation';
                    const val = Number(c.orderValue || c.quotationValue || 0);
                    const initial = (c.customerName || c.name || 'C').charAt(0).toUpperCase();

                    return (
                      <div
                        key={c._id || c.customerId}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: isToneDown ? '6px' : '12px',
                          border: '1px solid #E2E8F0',
                          borderLeftWidth: '3.5px',
                          borderLeftColor: isClosed ? '#059669' : isQuote ? '#475569' : '#CBD5E1',
                          padding: '12px 16px',
                          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Top Row: Customer Identity & Value */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: isClosed ? '#F0FDF4' : '#F8FAFC',
                                border: isClosed ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                color: isClosed ? '#059669' : '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: '900',
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                                  {c.customerName || c.name || 'Unnamed Client'}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#64748B',
                                    backgroundColor: '#F1F5F9',
                                    padding: '1.5px 6px',
                                    borderRadius: '5px',
                                  }}
                                >
                                  #{c.customerId}
                                </span>
                              </div>
                              {c.phone && (
                                <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Phone size={11} color="#64748B" />
                                  <span>{c.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Status Pill & Deal Value */}
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2.5px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isClosed ? '#F0FDF4' : '#F8FAFC',
                                  color: isClosed ? '#059669' : '#334155',
                                  border: isClosed ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                }}
                              >
                                {isClosed && <CheckCircle2 size={12} />}
                                {isQuote && <FileText size={12} />}
                                {!isClosed && !isQuote && <Clock size={12} />}
                                <span>{c.status || 'Active Lead'}</span>
                              </span>

                              <span style={{ fontSize: '15.5px', fontWeight: '900', color: isClosed ? '#059669' : '#0F172A' }}>
                                ₹{val.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', color: isClosed ? '#059669' : '#64748B', fontWeight: '600' }}>
                              {isClosed ? 'Confirmed Billed Order' : 'Quotation Estimate'}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Row: Context Badges & Sales Executive */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '6px',
                            paddingTop: '6px',
                            borderTop: '1px dashed #E2E8F0',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#334155',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                fontWeight: '600',
                              }}
                            >
                              <Layers size={11} color="#64748B" />
                              <span>{c.requirement || c.houseStage || 'General Materials'}</span>
                            </span>

                            {c.approxQuantity && (
                              <span
                                style={{
                                  color: '#475569',
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  fontWeight: '600',
                                }}
                              >
                                📐 {c.approxQuantity} sq.ft
                              </span>
                            )}

                            {c.customerType && (
                              <span
                                style={{
                                  color: '#475569',
                                  backgroundColor: '#F1F5F9',
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  fontWeight: '600',
                                }}
                              >
                                🏢 {c.customerType}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#334155',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: '700',
                              }}
                            >
                              <User size={11} color="#64748B" />
                              <span>{c.salesperson || 'Showroom Staff'}</span>
                            </span>

                            {c.leadSource && (
                              <span style={{ color: '#94A3B8', fontSize: '10.5px' }}>
                                via {c.leadSource}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
