import React, { useState, useEffect } from 'react';
import {
  Clock,
  Phone,
  PhoneCall,
  MessageSquare,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  Flame,
  Sun,
  Layers,
  CheckCircle,
  FileX,
  Plus,
  ChevronRight,
  Filter,
  UserCheck,
  Building,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { FollowupLogModal } from './FollowupLogModal';
import { LostSaleModal } from '../lost-sales/LostSaleModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const FollowupSheetView = ({ onEditCustomer }) => {
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'upcoming', 'overdue', 'all'
  const [temperatureFilter, setTemperatureFilter] = useState('all'); // 'Hot', 'Warm', 'Future', 'all'
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');

  const [followups, setFollowups] = useState([]);
  const [counts, setCounts] = useState({ today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0, totalPipelineValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [loggingFollowup, setLoggingFollowup] = useState(null);
  const [markingLostLead, setMarkingLostLead] = useState(null);

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
        console.warn('Staff fetch error in follow-up sheet:', e);
      }
    };
    fetchStaff();
  }, []);

  const fetchFollowups = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        tab: activeTab,
      };
      if (temperatureFilter !== 'all') params.temperature = temperatureFilter;
      if (salespersonFilter !== 'all') params.salesperson = salespersonFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.getFollowupsList(params);
      if (res.success) {
        setFollowups(res.data || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError(err.message || 'Failed to load follow-up schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [activeTab, temperatureFilter, salespersonFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFollowups();
  };

  const handleExportCSV = () => {
    if (followups.length === 0) {
      alert('No follow-up records to export');
      return;
    }

    const headers = [
      'Customer ID',
      'Customer Name',
      'Phone',
      'Requirement',
      'Quote Value (INR)',
      'Salesperson',
      'Next Follow-up Date',
      'Lead Temperature',
      'Status',
      'Last Follow-up / Notes',
    ];

    const rows = followups.map((f) => [
      `"${f.customerId || ''}"`,
      `"${f.customerName}"`,
      `"${f.phone || ''}"`,
      `"${f.requirement}"`,
      f.quotationValue || 0,
      `"${f.salesperson}"`,
      f.nextFollowUp || '',
      f.leadTemperature || 'Warm',
      f.status || 'Follow-up',
      `"${(f.lastReason || f.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Followup_Sheet_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Top Executive Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Overdue */}
        <div
          onClick={() => setActiveTab('overdue')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: `1.5px solid ${activeTab === 'overdue' ? '#EF4444' : counts.overdue > 0 ? '#FECDD3' : '#E2E8F0'}`,
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OVERDUE FOLLOW-UPS
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: counts.overdue > 0 ? '#DC2626' : '#0F172A', marginTop: '6px' }}>
            {counts.overdue} Leads
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            Scheduled date has passed
          </div>
        </div>

        {/* Card 2: Today's Schedule */}
        <div
          onClick={() => setActiveTab('today')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: `1.5px solid ${activeTab === 'today' ? '#2563EB' : '#E2E8F0'}`,
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TODAY'S CALL SCHEDULE
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#2563EB', marginTop: '6px' }}>
            {counts.today} Calls
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            Active calls & showroom visits
          </div>
        </div>

        {/* Card 3: Upcoming (7 Days) */}
        <div
          onClick={() => setActiveTab('upcoming')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: `1.5px solid ${activeTab === 'upcoming' ? '#059669' : '#E2E8F0'}`,
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              UPCOMING (NEXT 7 DAYS)
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
            {counts.upcoming} Scheduled
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            Upcoming pipeline nurture
          </div>
        </div>

        {/* Card 4: Hot Conversion Pipeline */}
        <div
          onClick={() => setTemperatureFilter(temperatureFilter === 'Hot' ? 'all' : 'Hot')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: `1.5px solid ${temperatureFilter === 'Hot' ? '#D97706' : '#E2E8F0'}`,
            padding: '16px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HOT PIPELINE VALUE
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#D97706', marginTop: '6px' }}>
            ₹{(counts.totalPipelineValue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            {counts.hot} Hot conversion deals
          </div>
        </div>
      </div>

      {/* 2. Unified Navigation Tab Bar & Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '12px 18px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        {/* Time-Horizon Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'today' ? '#2563EB' : '#F1F5F9',
              color: activeTab === 'today' ? '#FFFFFF' : '#475569',
              fontWeight: activeTab === 'today' ? '800' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={14} />
            <span>Today ({counts.today})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'upcoming' ? '#059669' : '#F1F5F9',
              color: activeTab === 'upcoming' ? '#FFFFFF' : '#475569',
              fontWeight: activeTab === 'upcoming' ? '800' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={14} />
            <span>Upcoming ({counts.upcoming})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'overdue' ? '#DC2626' : '#F1F5F9',
              color: activeTab === 'overdue' ? '#FFFFFF' : '#475569',
              fontWeight: activeTab === 'overdue' ? '800' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            <span>Overdue ({counts.overdue})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'all' ? '#0F172A' : '#F1F5F9',
              color: activeTab === 'all' ? '#FFFFFF' : '#475569',
              fontWeight: activeTab === 'all' ? '800' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            All Open Leads ({counts.total})
          </button>
        </div>

        {/* Right Tools & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Priority Chips */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {['all', 'Hot', 'Warm', 'Future'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemperatureFilter(t)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: temperatureFilter === t ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: temperatureFilter === t ? '#EFF6FF' : '#FFFFFF',
                  color: temperatureFilter === t ? '#2563EB' : '#64748B',
                  fontWeight: temperatureFilter === t ? '800' : '600',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                {t === 'Hot' ? '🔥 Hot' : t === 'Warm' ? '☀️ Warm' : t === 'Future' ? '⏳ Future' : 'All Priority'}
              </button>
            ))}
          </div>

          {/* Salesperson Filter */}
          <select
            value={salespersonFilter}
            onChange={(e) => setSalespersonFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              outline: 'none',
            }}
          >
            <option value="all">All Sales Executives</option>
            {staffList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchFollowups}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: '#475569' }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setLoggingFollowup({})}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Plus size={15} />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by customer name, phone, requirement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '320px',
                paddingLeft: '34px',
                paddingRight: '12px',
                paddingTop: '7px',
                paddingBottom: '7px',
                fontSize: '12.5px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                color: '#0F172A',
              }}
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchFollowups(); }}
              style={{ backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
            >
              Clear
            </button>
          )}
        </form>

        <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
          Showing <strong>{followups.length}</strong> active follow-up records
        </span>
      </div>

      {/* 4. Streamlined 5-Column High-Density Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        {error && followups.length === 0 ? (
          <div style={{ padding: '24px' }}>
            <ConnectionErrorState
              title="Unable to Load Follow-up Schedule"
              message={error}
              onRetry={fetchFollowups}
              isRetrying={loading}
            />
          </div>
        ) : followups.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📞</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
              {activeTab === 'overdue' ? 'No overdue follow-ups!' : 'No follow-up records found'}
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '340px', margin: '4px auto 0' }}>
              {activeTab === 'overdue'
                ? 'Great job! All active customer leads are contacted on schedule.'
                : 'Follow-ups help prevent lead leakage and boost quotation conversions.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Customer Lead & Contact
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    2. Requirement & Value
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    3. Executive & Type
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    4. Scheduled Follow-up
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    5. Priority & Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {followups.map((f, idx) => {
                  const isOverdue = f.bucket === 'overdue';
                  const isHot = f.leadTemperature === 'Hot';
                  const isWarm = f.leadTemperature === 'Warm';

                  let relativeLabel = f.nextFollowUp || 'Not set';
                  if (isOverdue) {
                    relativeLabel = `${f.daysDiff}d overdue`;
                  } else if (f.bucket === 'today') {
                    relativeLabel = 'Today';
                  } else if (f.daysDiff === 1) {
                    relativeLabel = 'Tomorrow';
                  } else if (f.daysDiff > 1) {
                    relativeLabel = `In ${f.daysDiff} days`;
                  }

                  const waUrl = getWhatsAppUrl(f.phone, f);

                  return (
                    <tr
                      key={f._id}
                      style={{
                        borderBottom: idx < followups.length - 1 ? '1px solid #F1F5F9' : 'none',
                        backgroundColor: isOverdue ? '#FFF5F5' : '#FFFFFF',
                        transition: 'backgroundColor 0.15s ease',
                      }}
                    >
                      {/* Column 1: Customer Lead & Contact */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                          {f.customerName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {f.customerId && (
                            <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#EFF6FF', padding: '1px 6px', borderRadius: '4px' }}>
                              #{f.customerId}
                            </span>
                          )}

                          {f.phone && (
                            <a
                              href={`tel:${f.phone}`}
                              style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              📞 {f.phone}
                            </a>
                          )}

                          {f.phone && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '11px', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '1px 7px', borderRadius: '6px', textDecoration: 'none' }}
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Requirement & Value */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#059669', lineHeight: 1.2 }}>
                          ₹{(f.quotationValue || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                          {f.requirement}
                          {f.approxQuantity ? ` (${f.approxQuantity})` : ''}
                        </div>
                      </td>

                      {/* Column 3: Executive & Type */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                          {f.salesperson}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {f.customerType || 'Direct Client'}
                        </div>
                      </td>

                      {/* Column 4: Scheduled Follow-up */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 9px',
                            borderRadius: '10px',
                            display: 'inline-block',
                            backgroundColor: isOverdue ? '#FEE2E2' : f.bucket === 'today' ? '#EFF6FF' : '#ECFDF5',
                            color: isOverdue ? '#DC2626' : f.bucket === 'today' ? '#2563EB' : '#059669',
                            border: `1px solid ${isOverdue ? '#FECDD3' : f.bucket === 'today' ? '#BFDBFE' : '#A7F3D0'}`,
                          }}
                        >
                          {relativeLabel}
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', fontWeight: '600' }}>
                          {f.nextFollowUp || 'No date'}
                        </div>
                      </td>

                      {/* Column 5: Priority & Actions */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {/* Priority Badge */}
                          {isHot ? (
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '8px' }}>
                              🔥 Hot
                            </span>
                          ) : isWarm ? (
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '8px' }}>
                              ☀️ Warm
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '8px' }}>
                              ⏳ Future
                            </span>
                          )}

                          {/* Log Call Action */}
                          <button
                            type="button"
                            onClick={() => setLoggingFollowup(f)}
                            style={{
                              backgroundColor: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Log call discussion"
                          >
                            <PhoneCall size={13} />
                            <span>Log Call</span>
                          </button>

                          {/* Edit Customer Action */}
                          {onEditCustomer && (
                            <button
                              type="button"
                              onClick={() => onEditCustomer(f)}
                              style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                              title="Edit Customer"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {/* Mark Lost Action */}
                          <button
                            type="button"
                            onClick={() => setMarkingLostLead(f)}
                            style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECDD3', color: '#991B1B', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                            title="Mark as Lost Sale"
                          >
                            <FileX size={13} />
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

      {/* Log Activity Modal */}
      {loggingFollowup && (
        <FollowupLogModal
          followUp={loggingFollowup._id ? loggingFollowup : null}
          onClose={() => setLoggingFollowup(null)}
          onSaved={() => fetchFollowups()}
          onOpenLostSale={(lead) => setMarkingLostLead(lead)}
        />
      )}

      {/* Mark Lost Sale Modal */}
      {markingLostLead && (
        <LostSaleModal
          customer={markingLostLead}
          onClose={() => setMarkingLostLead(null)}
          onSaved={() => fetchFollowups()}
        />
      )}
    </div>
  );
};
