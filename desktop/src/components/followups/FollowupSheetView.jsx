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
  Send,
} from 'lucide-react';
import { api } from '../../services/api';
import { FollowupLogModal } from './FollowupLogModal';
import { LostSaleModal } from '../lost-sales/LostSaleModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';
import { useToneDown } from '../../context/ToneDownContext';
import { useToast } from '../../context/ToastContext';
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
  const toast = useToast();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loggingFollowup, setLoggingFollowup] = useState(null);
  const [markingLostLead, setMarkingLostLead] = useState(null);
  const [newRemarkText, setNewRemarkText] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  // Parse chronological customer notes & discussion remarks
  const parseRemarks = (record) => {
    if (!record) return [];
    const raw = record.notes || record.lastReason || record.discussionNotes || record.conversationRemarks || '';
    if (!raw.trim()) return [];
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const dateMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const rest = dateMatch[2];
          const outcomeMatch = rest.match(/^(.*?):\s*(.*)$/);
          if (outcomeMatch) {
            return { date: dateStr, outcome: outcomeMatch[1], text: outcomeMatch[2] };
          }
          return { date: dateStr, outcome: null, text: rest };
        }
        return { date: null, outcome: null, text: line };
      });
  };

  // Add conversation remark directly from the log page
  const handleAddRemark = async () => {
    if (!newRemarkText.trim() || !selectedRecord) return;
    setSavingRemark(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const entry = `[${todayStr}] Remark: ${newRemarkText.trim()}`;
      const updatedNotes = selectedRecord.notes ? `${selectedRecord.notes}\n${entry}` : entry;

      const res = await api.updateCustomer(selectedRecord._id, {
        notes: updatedNotes,
        lastReason: entry,
        conversationRemarks: selectedRecord.conversationRemarks
          ? `${selectedRecord.conversationRemarks}\n${entry}`
          : entry,
      });

      if (res && res.success) {
        toast.success('Conversation remark saved to customer notes!');
        setSelectedRecord((prev) => ({
          ...prev,
          notes: updatedNotes,
          lastReason: entry,
          conversationRemarks: prev.conversationRemarks ? `${prev.conversationRemarks}\n${entry}` : entry,
        }));
        setNewRemarkText('');
        fetchFollowups(true);
      } else {
        toast.error(res?.message || 'Failed to save conversation remark');
      }
    } catch (err) {
      toast.error(err.message || 'Error saving conversation remark');
    } finally {
      setSavingRemark(false);
    }
  };

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

  const fetchFollowups = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
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
        const cleanList = (res.data || []).filter((f) => {
          const st = (f.status || '').toLowerCase();
          const isConfirmed = f.status === 'Order Confirmed' || st === 'order confirmed' || st.includes('confirmed') || st.includes('won');
          const isLost = st.includes('lost');
          return !isConfirmed && !isLost && st !== 'archived';
        });
        setFollowups(cleanList);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      if (!isSilent) setError(err.message || 'Failed to load follow-up schedule');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [activeTab, temperatureFilter, salespersonFilter]);

  // Real-time automatic synchronization: silently poll every 5 seconds so mobile updates reflect immediately
  useEffect(() => {
    const liveTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchFollowups(true);
      }
    }, 5000);
    return () => clearInterval(liveTimer);
  }, [activeTab, temperatureFilter, salespersonFilter, search]);

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
            border: `1.5px solid ${activeTab === 'overdue' ? '#0F172A' : '#E2E8F0'}`,
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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: counts.overdue > 0 ? '#FEF2F2' : '#F8FAFC', color: counts.overdue > 0 ? '#DC2626' : '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            border: `1.5px solid ${activeTab === 'today' ? '#0F172A' : '#E2E8F0'}`,
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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
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
            border: `1.5px solid ${activeTab === 'upcoming' ? '#0F172A' : '#E2E8F0'}`,
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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
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
            border: `1.5px solid ${temperatureFilter === 'Hot' ? '#0F172A' : '#E2E8F0'}`,
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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
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

          {/* Log Activity Light Themed Button */}
          <button
            type="button"
            onClick={() => setLoggingFollowup({})}
            style={{
              background: '#EFF6FF',
              color: '#1D4ED8',
              border: '1.5px solid #BFDBFE',
              borderRadius: '10px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} color="#1D4ED8" />
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
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    SCHEDULE & PRIORITY
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    ACTION
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

                  const remarkSnippet = f.lastReason || f.discussionNotes || f.conversationRemarks || f.notes;

                  return (
                    <tr
                      key={f._id}
                      onClick={() => setLoggingFollowup(f)}
                      style={{
                        borderBottom: idx < followups.length - 1 ? '1px solid #F1F5F9' : 'none',
                        backgroundColor: isOverdue ? '#FFFBFB' : '#FFFFFF',
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
                            <span style={{ fontSize: '10.5px', color: '#334155', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 6px', borderRadius: '5px' }}>
                              #{f.customerId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '3px' }}>
                          📞 {f.phone ? (f.phone.replace(/\D/g, '').length === 10 ? `${f.phone.substring(0, 5)} ${f.phone.substring(5)}` : f.phone) : 'No phone'}
                        </div>
                        {remarkSnippet && (
                          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MessageSquare size={12} color="#64748B" style={{ flexShrink: 0 }} />
                            <span style={{ fontStyle: 'italic', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{remarkSnippet}"
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Column 2: Requirement & Value */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#0F172A', lineHeight: 1.2 }}>
                          ₹{(f.quotationValue || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '3px', lineHeight: 1.3 }}>
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
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              backgroundColor: isOverdue ? '#FEF2F2' : '#F8FAFC',
                              color: isOverdue ? '#DC2626' : '#334155',
                              border: `1px solid ${isOverdue ? '#FECDD3' : '#E2E8F0'}`,
                            }}
                          >
                            {relativeLabel}
                          </span>

                          {isHot ? (
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '8px' }}>
                              🔥 Hot
                            </span>
                          ) : isWarm ? (
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '8px' }}>
                              Warm
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '8px' }}>
                              Future
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Action Button (Remarks integrated directly into Logging flow) */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setLoggingFollowup(f)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: '800',
                            borderRadius: '8px',
                            border: '1px solid #99F6E4',
                            backgroundColor: '#F0FDFA',
                            color: '#0F766E',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(15, 118, 110, 0.08)',
                            transition: 'all 0.15s ease',
                          }}
                          title="Log Follow-up Activity & Discussion Notes"
                        >
                          <PhoneCall size={13} color="#0F766E" />
                          <span>Log Activity</span>
                        </button>
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
      {selectedRecord && (() => {
        const remarksList = parseRemarks(selectedRecord);

        return (
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
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
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
                  padding: '20px 26px',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>
                      {selectedRecord.customerName}
                    </h3>
                    {selectedRecord.customerId && (
                      <span style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: '800', fontFamily: 'monospace', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        #{selectedRecord.customerId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>📞 {selectedRecord.phone || 'No phone'}</span>
                    <span>•</span>
                    <span>👤 Exec: {selectedRecord.salesperson}</span>
                    <span>•</span>
                    <span style={{ color: '#F1F5F9', fontWeight: '800' }}>₹{(selectedRecord.quotationValue || 0).toLocaleString('en-IN')}</span>
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

              {/* Modal Scrollable Body */}
              <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. SEPARATE PROMINENT SECTION: Customer Notes & Conversation Remarks */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1.5px solid #CBD5E1',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                          Customer Notes & Conversation Remarks
                        </h4>
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                          Client feedback, discussion notes & negotiation remarks
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px' }}>
                      {remarksList.length} {remarksList.length === 1 ? 'Remark' : 'Remarks'}
                    </span>
                  </div>

                  {/* Conversation Remarks Stream */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '14px', paddingRight: '4px' }}>
                    {remarksList.length === 0 ? (
                      <div style={{ padding: '22px 16px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '12.5px' }}>
                        💬 No remarks recorded yet for {selectedRecord.customerName}. Type your first conversation remark below.
                      </div>
                    ) : (
                      remarksList.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '11px 14px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#334155', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '1.5px 7px', borderRadius: '5px' }}>
                              {r.date || 'Recorded Note'}
                            </span>
                            {r.outcome && (
                              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#059669', backgroundColor: '#ECFDF5', padding: '1.5px 7px', borderRadius: '5px' }}>
                                {r.outcome}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: '500', lineHeight: 1.5, wordBreak: 'break-word' }}>
                            {r.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Add Conversation Remark Form */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Type a new conversation remark or customer request..."
                      value={newRemarkText}
                      onChange={(e) => setNewRemarkText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddRemark();
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        fontSize: '12.5px',
                        fontWeight: '500',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRemark}
                      disabled={savingRemark || !newRemarkText.trim()}
                      style={{
                        padding: '9px 16px',
                        backgroundColor: savingRemark || !newRemarkText.trim() ? '#F1F5F9' : '#0F172A',
                        color: savingRemark || !newRemarkText.trim() ? '#94A3B8' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: savingRemark || !newRemarkText.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Send size={13} />
                      <span>{savingRemark ? 'Saving...' : 'Add Remark'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Customer Lead Context Details Card */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📋 Lead Specifications & Context
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
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
                      <strong style={{ color: selectedRecord.bucket === 'overdue' ? '#DC2626' : '#0F172A' }}>{selectedRecord.nextFollowUp || 'Not set'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Priority Stage:</span>{' '}
                      <strong style={{ color: '#334155' }}>{selectedRecord.leadTemperature || 'Warm'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Assigned Rep:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{selectedRecord.salesperson}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Primary 4 Action Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Action 1: Log Call */}
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRecord;
                      setSelectedRecord(null);
                      setLoggingFollowup(r);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                    }}
                  >
                    <PhoneCall size={16} />
                    <span>Log Call & Reschedule</span>
                  </button>

                  {/* Action 2: Send WhatsApp */}
                  <a
                    href={getWhatsAppUrl(selectedRecord.phone, selectedRecord)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                      textDecoration: 'none',
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>WhatsApp Offer Copy</span>
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
                      padding: '11px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#334155',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Edit3 size={15} />
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
                      padding: '11px',
                      borderRadius: '12px',
                      border: '1.5px solid #FECDD3',
                      background: '#FEF2F2',
                      color: '#991B1B',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <FileX size={15} />
                    <span>Mark Deal as Lost</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


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
