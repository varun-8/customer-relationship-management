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
import { useToneDown } from '../../context/ToneDownContext';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const FollowupSheetView = ({ onEditCustomer }) => {
  const { isToneDown } = useToneDown();
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
  const [selectedRecord, setSelectedRecord] = useState(null);
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

      {/* 2. Professional Executive Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
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
        {/* Left: Search Box & Record Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search by customer name, phone, requirement..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '280px',
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '12.5px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  color: '#0F172A',
                  fontWeight: '500',
                }}
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchFollowups(); }}
                style={{ backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
              >
                Clear
              </button>
            )}
          </form>

          <span
            style={{
              fontSize: '12px',
              color: '#64748B',
              fontWeight: '700',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '6px 12px',
              borderRadius: '10px',
            }}
          >
            Records: <strong style={{ color: '#0F172A' }}>{followups.length}</strong>
          </span>
        </div>

        {/* Right: Executive Filters & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Priority Dropdown */}
          <select
            value={temperatureFilter}
            onChange={(e) => setTemperatureFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              paddingRight: '32px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23475569' height='18' viewBox='0 0 24 24' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              appearance: 'none',
              WebkitAppearance: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">☀️ Warm</option>
            <option value="Future">⏳ Future</option>
          </select>

          {/* Salesperson Filter */}
          <select
            value={salespersonFilter}
            onChange={(e) => setSalespersonFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              paddingRight: '32px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23475569' height='18' viewBox='0 0 24 24' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              appearance: 'none',
              WebkitAppearance: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Executives</option>
            {staffList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchFollowups}
            style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#475569' }}
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>

          {/* Log Activity Primary Button */}
          <button
            type="button"
            onClick={() => setLoggingFollowup({})}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>Log Activity</span>
          </button>
        </div>
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
                    CUSTOMER LEAD
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    REQUIREMENT & VALUE
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    SALES EXEC & TYPE
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    SCHEDULE & PRIORITY
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

                  const formattedReq = Array.isArray(f.requirement)
                    ? f.requirement.join(', ')
                    : typeof f.requirement === 'string'
                    ? f.requirement.replace(/([a-z])([A-Z])/g, '$1, $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1, $2')
                    : f.requirement || 'General Inquiry';

                  return (
                    <tr
                      key={f._id}
                      onClick={() => setLoggingFollowup(f)}
                      style={{
                        borderBottom: idx < followups.length - 1 ? '1px solid #F1F5F9' : 'none',
                        backgroundColor: isOverdue ? '#FFF5F5' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                      className="followup-row-item"
                    >
                      {/* Column 1: Customer Lead */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                            {f.customerName}
                          </div>
                          {f.customerId && (
                            <span style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', padding: '1px 6px', borderRadius: '5px' }}>
                              #{f.customerId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
                          📞 {f.phone ? (f.phone.replace(/\D/g, '').length === 10 ? `${f.phone.substring(0, 5)} ${f.phone.substring(5)}` : f.phone) : 'No phone'}
                        </div>
                      </td>

                      {/* Column 2: Requirement & Value */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#059669', lineHeight: 1.2 }}>
                          ₹{(f.quotationValue || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginTop: '3px', lineHeight: 1.3 }}>
                          {formattedReq}
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

                      {/* Column 4: Schedule & Priority */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              backgroundColor: isOverdue ? '#FEE2E2' : f.bucket === 'today' ? '#EFF6FF' : '#ECFDF5',
                              color: isOverdue ? '#DC2626' : f.bucket === 'today' ? '#2563EB' : '#059669',
                              border: `1px solid ${isOverdue ? '#FECDD3' : f.bucket === 'today' ? '#BFDBFE' : '#A7F3D0'}`,
                            }}
                          >
                            {relativeLabel}
                          </span>

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

                          <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: '4px' }} />
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

      {/* Interactive Action Drawer Modal when a record row is clicked */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              maxWidth: '640px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dark Slate Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                padding: '22px 28px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>
                    {selectedRecord.customerName}
                  </h3>
                  {selectedRecord.customerId && (
                    <span style={{ fontSize: '11px', color: '#93C5FD', fontWeight: '800', fontFamily: 'monospace', backgroundColor: 'rgba(37, 99, 235, 0.3)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(147, 197, 253, 0.3)' }}>
                      #{selectedRecord.customerId}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>📞 {selectedRecord.phone || 'No phone'}</span>
                  <span>•</span>
                  <span>👤 Exec: {selectedRecord.salesperson}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Action Bar & Context Summary */}
            <div style={{ padding: '24px' }}>
              {/* 1. Primary 4 Action Buttons Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {/* Action 1: Log Call */}
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRecord;
                    setSelectedRecord(null);
                    setLoggingFollowup(r);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <PhoneCall size={18} />
                  <span>📞 Log Call & Reschedule</span>
                </button>

                {/* Action 2: Send WhatsApp */}
                <a
                  href={getWhatsAppUrl(selectedRecord.phone, selectedRecord)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)',
                    textDecoration: 'none',
                  }}
                >
                  <MessageSquare size={18} />
                  <span>💬 WhatsApp Offer Copy</span>
                </a>

                {/* Action 3: Edit Customer Lead */}
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRecord;
                    setSelectedRecord(null);
                    if (onEditCustomer) onEditCustomer(r);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1.5px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Edit3 size={16} />
                  <span>Edit Lead Details</span>
                </button>

                {/* Action 4: Mark Lost */}
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRecord;
                    setSelectedRecord(null);
                    setMarkingLostLead(r);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1.5px solid #FECDD3',
                    background: '#FEF2F2',
                    color: '#991B1B',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <FileX size={16} />
                  <span>Mark Deal as Lost</span>
                </button>
              </div>

              {/* 2. Customer Lead Context Details Card */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '18px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📋 Lead Summary & Context
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Quotation Value:</span>{' '}
                    <strong style={{ color: '#059669', fontSize: '14px' }}>₹{(selectedRecord.quotationValue || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Customer Type:</span>{' '}
                    <strong style={{ color: '#0F172A' }}>{selectedRecord.customerType || 'Direct Client'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Requirement:</span>{' '}
                    <strong style={{ color: '#334155' }}>
                      {Array.isArray(selectedRecord.requirement) ? selectedRecord.requirement.join(', ') : selectedRecord.requirement || 'Tiles'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Quantity:</span>{' '}
                    <strong style={{ color: '#334155' }}>{selectedRecord.approxQuantity || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Scheduled Date:</span>{' '}
                    <strong style={{ color: selectedRecord.bucket === 'overdue' ? '#DC2626' : '#2563EB' }}>{selectedRecord.nextFollowUp || 'Not set'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Priority Stage:</span>{' '}
                    <strong style={{ color: '#D97706' }}>{selectedRecord.leadTemperature || 'Warm'}</strong>
                  </div>
                </div>

                {(selectedRecord.lastReason || selectedRecord.notes) && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', fontSize: '12.5px', color: '#475569' }}>
                    <strong style={{ color: '#0F172A' }}>Last Discussion / Reason:</strong>
                    <div style={{ marginTop: '3px', fontStyle: 'italic', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      "{selectedRecord.lastReason || selectedRecord.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
