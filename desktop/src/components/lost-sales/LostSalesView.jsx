import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  BarChart3,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { LostSaleModal } from './LostSaleModal';
import { LostSaleDetailModal } from './LostSaleDetailModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';

// Format date nicely (e.g. 12 Sep 2026)
const formatDateLabel = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

export const LostSalesView = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  // State
  const [lostSales, setLostSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(todayStr.substring(0, 7));
  const [productFilter, setProductFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [staffList, setStaffList] = useState([]);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [reopeningRecord, setReopeningRecord] = useState(null);
  const [winBackNotes, setWinBackNotes] = useState('');

  // Summary calculations for table metrics
  const totalLostValue = lostSales.reduce((acc, curr) => acc + (Number(curr.quoteValue) || 0), 0);
  const winBackCount = lostSales.filter((s) => s.status === 'win_back').length;
  const itemsWithGap = lostSales.filter((s) => Number(s.priceDifference) > 0);
  const totalGap = itemsWithGap.reduce((acc, curr) => acc + Number(curr.priceDifference), 0);
  const avgGap = itemsWithGap.length > 0 ? Math.round(totalGap / itemsWithGap.length) : 0;


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
        console.warn('Error loading staff for LostSalesView:', e);
      }
    };
    fetchStaff();
  }, []);

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
  }, [selectedMonth, productFilter, staffFilter]);

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
    link.setAttribute('download', `Lost_Sales_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topReason = analytics?.reasonsBreakdown?.[0];
  const topCompetitor = analytics?.competitorLeaderboard?.[0];
  const productBreakdown = analytics?.productBreakdown || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'tabFadeInUp 0.3s ease' }}>
      {/* 1. Minimalist Executive Metric Scorecards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Total Lost Value */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', lineHeight: 1.1 }}>
              ₹{(analytics?.totalLostValue || 0).toLocaleString('en-IN')}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Lost Revenue ({selectedMonth})
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              <strong>{analytics?.totalLostDeals || 0}</strong> deals logged
            </div>
          </div>
        </div>

        {/* Card 2: Top Winning Showroom */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="metric-value" style={{ fontSize: '15.5px', fontWeight: '900', color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topCompetitor ? topCompetitor.competitor : 'None'}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Top Competitor Loss
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              {topCompetitor ? `Captured ${topCompetitor.count} deals` : 'No losses logged'}
            </div>
          </div>
        </div>

        {/* Card 3: Primary Cause */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="metric-value" style={{ fontSize: '15.5px', fontWeight: '900', color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topReason ? topReason.reason : 'No Data'}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Primary Root Cause
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              {topReason ? `${topReason.percentage}% of lost deals` : 'Record reasons to track'}
            </div>
          </div>
        </div>

        {/* Card 4: Avg Price Gap */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', lineHeight: 1.1 }}>
              ₹{(analytics?.averagePriceDifference || 0).toLocaleString('en-IN')}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Avg Pricing Gap
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              Competitor discount margin
            </div>
          </div>
        </div>
      </div>

      {/* 2. Optional Minimalist Analytics Drawer Toggle */}
      {analytics && analytics.totalLostDeals > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              width: '100%',
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '800',
              color: '#0F172A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} color="#2563EB" />
              <span>Lost Sales Root Cause & Competitor Intelligence Analysis</span>
              <span style={{ fontSize: '11.5px', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                {analytics.totalLostDeals} deals analyzed
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '12px', fontWeight: '600' }}>
              <span>{showAnalytics ? 'Hide Analytics' : 'View Breakdown'}</span>
              {showAnalytics ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {showAnalytics && (
            <div
              style={{
                padding: '16px 18px 20px',
                borderTop: '1px solid #F1F5F9',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                background: '#FAFAFA',
              }}
            >
              {/* Breakdown 1: Root Causes */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Root Cause Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(analytics.reasonsBreakdown || []).slice(0, 4).map((r) => (
                    <div key={r.reason}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{r.reason}</span>
                        <span style={{ color: '#64748B' }}>{r.percentage}% ({r.count})</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${r.percentage}%`, height: '100%', background: '#DC2626', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown 2: Top Competitors */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Competing Showrooms
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(analytics.competitorLeaderboard || []).slice(0, 4).map((c, i) => (
                    <div key={c.competitor} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '6px 8px', background: '#F8FAFC', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>
                          {i + 1}
                        </span>
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{c.competitor}</span>
                      </div>
                      <span style={{ fontWeight: '800', color: '#DC2626' }}>₹{c.totalValue.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown 3: Product Leakage */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Category Revenue Loss
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['Tile', 'Sanitary', 'CP', 'Adhesive'].map((pName) => {
                    const pData = productBreakdown.find((p) => p.product === pName) || { count: 0, value: 0 };
                    return (
                      <div key={pName} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{pName}</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>₹{pData.value.toLocaleString('en-IN')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Aesthetic Executive Control Toolbar */}
      <div
        className="control-bar-container"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Left Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '270px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search lost deals, competitors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: search ? '30px' : '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchData(); }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Product Category Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '3px',
              backgroundColor: '#F1F5F9',
              padding: '3px 4px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
            }}
          >
            {[
              { id: 'all', label: 'All', icon: '📊' },
              { id: 'Tile', label: 'Tiles', icon: '🧱' },
              { id: 'Sanitary', label: 'Sanitary', icon: '🚿' },
              { id: 'CP', label: 'CP Fittings', icon: '🚰' },
              { id: 'Adhesive', label: 'Adhesives', icon: '🧪' },
            ].map((p) => {
              const isSelected = productFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductFilter(p.id)}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#2563EB' : '#64748B',
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '11px' }}>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Record Counter Pill */}
          <span
            style={{
              fontSize: '12px',
              color: '#64748B',
              fontWeight: '700',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '6px 12px',
              borderRadius: '9px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Records: <strong style={{ color: '#0F172A' }}>{lostSales.length}</strong>
          </span>
        </div>

        {/* Right Filter & Action Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sales Staff Select */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            style={{
              padding: '8px 30px 8px 12px',
              borderRadius: '9px',
              border: '1.5px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23475569' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              appearance: 'none',
              WebkitAppearance: 'none',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '150px',
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
              padding: '7px 11px',
              borderRadius: '9px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '12.5px',
              color: '#0F172A',
              fontWeight: '700',
              outline: 'none',
              cursor: 'pointer',
            }}
          />

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchData}
            title="Refresh Intelligence Data"
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export CSV"
            style={{
              padding: '8px 13px',
              borderRadius: '9px',
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>


          {/* Primary Action Button: Log Lost Sale */}
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setShowModal(true);
            }}
            style={{
              padding: '8.5px 16px',
              borderRadius: '9px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} />
            <span>Log Lost Sale</span>
          </button>
        </div>
      </div>

      {/* 4. Lost Sales Ledger Table Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAFB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileX size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>
                  Lost Quotations Ledger
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    background: '#EEF2F6',
                    color: '#475569',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '700',
                  }}
                >
                  {lostSales.length} {lostSales.length === 1 ? 'deal' : 'deals'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                Detailed breakdown of lost quotes, showroom competitors, price gaps, and win-back prospects
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                fontSize: '12px',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <span style={{ color: '#94A3B8' }}>Total Value:</span>
              <strong style={{ color: '#0F172A', fontWeight: '800' }}>₹{totalLostValue.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {error && lostSales.length === 0 ? (
          <div style={{ padding: '24px' }}>
            <ConnectionErrorState
              title="Unable to Load Lost Sales Intelligence"
              message={error}
              onRetry={fetchData}
              isRetrying={loading}
            />
          </div>
        ) : lostSales.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileX size={28} />
            </div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#0F172A' }}>No lost sales logged for {selectedMonth}</div>
            <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '400px', margin: 0, lineHeight: 1.5 }}>
              Record lost customer quotes to track competitor showroom pricing, identify price sensitivities, and reactivate win-back deals.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                marginTop: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
              }}
            >
              <Plus size={15} />
              <span>Record Lost Sale</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lost To</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quote Value</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lostSales.map((s, idx) => {
                  const isWinBack = s.status === 'win_back';
                  const initial = (s.customerName || 'C').charAt(0).toUpperCase();
                  const custType = s.customerType || s.customerRef?.customerType || 'Direct Client';

                  return (
                    <tr
                      key={s._id}
                      onClick={() => setDetailRecord(s)}
                      title="Click to view full lost deal intelligence & details"
                      style={{
                        borderBottom: idx < lostSales.length - 1 ? '1px solid #F1F5F9' : 'none',
                        transition: 'background-color 0.12s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Date */}
                      <td style={{ padding: '13px 18px', color: '#64748B', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span style={{ fontWeight: '600' }}>{formatDateLabel(s.dateString)}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12.5px',
                              fontWeight: '800',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                              {s.customerName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              {s.customerId && (
                                <span style={{ color: '#475569', fontFamily: 'monospace', fontWeight: '700' }}>
                                  #{s.customerId}
                                </span>
                              )}
                              <span>•</span>
                              <span>{custType}</span>
                              {s.salesperson && (
                                <>
                                  <span>•</span>
                                  <span>Rep: {s.salesperson}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lost To */}
                      <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={13} color="#94A3B8" />
                          <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '13px' }}>
                            {s.competitor || 'Local Dealer'}
                          </span>
                        </div>
                      </td>

                      {/* Quote Value */}
                      <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{(s.quoteValue || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                        {isWinBack ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: '#047857',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                            Win-Back
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#475569',
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                            Lost
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailRecord(s);
                            }}
                            title="View Deal Intelligence"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#0F172A',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F1F5F9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFFFFF';
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          {!isWinBack && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReopeningRecord(s);
                              }}
                              title="Reopen as Win-Back opportunity"
                              style={{
                                padding: '4px 9px',
                                borderRadius: '6px',
                                border: '1px solid #A7F3D0',
                                background: '#ECFDF5',
                                color: '#047857',
                                fontSize: '11px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#047857';
                                e.currentTarget.style.color = '#FFFFFF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ECFDF5';
                                e.currentTarget.style.color = '#047857';
                              }}
                            >
                              ⚡ Win-Back
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRecord(s);
                              setShowModal(true);
                            }}
                            title="Edit Record"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#64748B',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F1F5F9';
                              e.currentTarget.style.color = '#0F172A';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFFFFF';
                              e.currentTarget.style.color = '#64748B';
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s._id, s.customerName);
                            }}
                            title="Delete Record"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #FEE2E2',
                              background: '#FFFFFF',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#FEF2F2';
                              e.currentTarget.style.borderColor = '#FCA5A5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFFFFF';
                              e.currentTarget.style.borderColor = '#FEE2E2';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Summary Footer Bar */}
            <div
              style={{
                padding: '12px 20px',
                background: '#F8FAFC',
                borderTop: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748B' }}>
                <span>
                  Showing <strong style={{ color: '#0F172A' }}>{lostSales.length}</strong> quotations
                </span>
                <span>•</span>
                <span>
                  Win-Backs: <strong style={{ color: '#047857' }}>{winBackCount}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Total Lost Pipeline:</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                  ₹{totalLostValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Lost Sale Detail Intelligence Modal */}
      {detailRecord && (
        <LostSaleDetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={(rec) => {
            setDetailRecord(null);
            setEditingRecord(rec);
            setShowModal(true);
          }}
          onReopen={(rec) => {
            setDetailRecord(null);
            setReopeningRecord(rec);
          }}
        />
      )}

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
        <div className="modal-backdrop" onClick={() => setReopeningRecord(null)} style={{ zIndex: 9999 }}>
          <div
            className="modal-card"
            style={{ maxWidth: '440px', background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', background: '#ECFDF5', borderBottom: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={18} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#065F46' }}>
                Reopen as Win-Back Opportunity
              </h3>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Move <strong>{reopeningRecord.customerName}</strong> (₹{reopeningRecord.quoteValue.toLocaleString('en-IN')}) back to active showroom negotiation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                  Win-Back Strategy / Special Offer Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Matched competitor price with 5% discount + free transport..."
                  value={winBackNotes}
                  onChange={(e) => setWinBackNotes(e.target.value)}
                  style={{ borderRadius: '8px', padding: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                />
              </div>
            </div>
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReopeningRecord(null)}
                style={{ borderRadius: '8px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopenSubmit}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                ✓ Reopen & Win-Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

