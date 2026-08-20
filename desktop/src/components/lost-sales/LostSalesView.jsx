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
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { api } from '../../services/api';
import { LostSaleModal } from './LostSaleModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';

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
  const [reopeningRecord, setReopeningRecord] = useState(null);
  const [winBackNotes, setWinBackNotes] = useState('');

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
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#DC2626', lineHeight: 1.1 }}>
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
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#2563EB', lineHeight: 1.1 }}>
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

      {/* 3. Streamlined Minimalist Control Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search lost deals, competitors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: '32px',
                paddingRight: search ? '28px' : '10px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '12.5px',
                width: '240px',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchData(); }}
                style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Product Category Segmented Pills */}
          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            {['all', 'Tile', 'Sanitary', 'CP', 'Adhesive'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProductFilter(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: productFilter === p ? '#FFFFFF' : 'transparent',
                  color: productFilter === p ? '#0F172A' : '#64748B',
                  fontWeight: productFilter === p ? '800' : '600',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  boxShadow: productFilter === p ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {p === 'all' ? 'All Products' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Right Filter & Action Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sales Staff Select */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            style={{
              height: '34px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '12px',
              padding: '0 10px',
              color: '#334155',
              fontWeight: '600',
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
              height: '34px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '12px',
              padding: '0 8px',
              color: '#334155',
              fontWeight: '600',
            }}
          />

          <button
            type="button"
            onClick={fetchData}
            title="Refresh"
            style={{
              height: '34px',
              width: '34px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setShowModal(true);
            }}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Plus size={15} />
            <span>Record Lost Sale</span>
          </button>
        </div>
      </div>

      {/* 4. Minimalist Lost Sales Ledger Table Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileX size={16} color="#DC2626" />
            <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
              Lost Quotations Ledger
            </span>
            <span style={{ fontSize: '11.5px', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
              {lostSales.length} {lostSales.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
            Price gaps & win-back opportunities
          </span>
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
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileX size={24} />
            </div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A' }}>No lost sales logged for {selectedMonth}</div>
            <p style={{ fontSize: '12px', color: '#64748B', maxWidth: '380px', margin: 0 }}>
              Record lost customer quotes to uncover competitor discounts and winning showrooms.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                marginTop: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              + Record Lost Sale
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '800' }}>
                  <th style={{ padding: '10px 16px' }}>Date</th>
                  <th style={{ padding: '10px 16px' }}>Customer</th>
                  <th style={{ padding: '10px 16px' }}>Quote Value</th>
                  <th style={{ padding: '10px 16px' }}>Lost Reason & Competitor</th>
                  <th style={{ padding: '10px 16px' }}>Price Gap</th>
                  <th style={{ padding: '10px 16px' }}>Salesperson</th>
                  <th style={{ padding: '10px 16px' }}>Status</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lostSales.map((s, idx) => {
                  const isWinBack = s.status === 'win_back';
                  const initial = (s.customerName || 'C').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={s._id}
                      style={{
                        borderBottom: idx < lostSales.length - 1 ? '1px solid #F1F5F9' : 'none',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Date */}
                      <td style={{ padding: '10px 16px', color: '#64748B', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {s.dateString}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
                              {s.customerName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', gap: '6px' }}>
                              {s.customerId && <span style={{ color: '#2563EB', fontFamily: 'monospace' }}>#{s.customerId}</span>}
                              {s.phone && <span>{s.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Quote Value */}
                      <td style={{ padding: '10px 16px', fontWeight: '800', color: '#DC2626', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        ₹{(s.quoteValue || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Lost Reason & Competitor */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '12px' }}>
                            {s.lostReason}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            via <strong style={{ color: '#C2410C' }}>{s.competitor}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Price Difference */}
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        {s.priceDifference > 0 ? (
                          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#DC2626', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px' }}>
                            -₹{s.priceDifference.toLocaleString('en-IN')} {s.priceDiffPercentage > 0 ? `(${s.priceDiffPercentage}%)` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#CBD5E1' }}>—</span>
                        )}
                      </td>

                      {/* Salesperson */}
                      <td style={{ padding: '10px 16px', color: '#475569', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {s.salesperson}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        {isWinBack ? (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '12px' }}>
                            ⚡ Win-Back
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#991B1B', background: '#FEF2F2', padding: '2px 8px', borderRadius: '12px' }}>
                            Lost
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          {!isWinBack && (
                            <button
                              type="button"
                              onClick={() => setReopeningRecord(s)}
                              title="Reopen as Win-Back"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #A7F3D0',
                                background: '#ECFDF5',
                                color: '#059669',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              ⚡ Win-Back
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(s);
                              setShowModal(true);
                            }}
                            title="Edit"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: '#64748B',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s._id, s.customerName)}
                            title="Delete"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
        <div className="modal-backdrop" onClick={() => setReopeningRecord(null)} style={{ zIndex: 9999 }}>
          <div
            className="modal-card"
            style={{ maxWidth: '440px', background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', background: '#ECFDF5', borderBottom: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#059669" />
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

