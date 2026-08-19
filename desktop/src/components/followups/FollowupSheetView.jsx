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
} from 'lucide-react';
import { api } from '../../services/api';
import { FollowupLogModal } from './FollowupLogModal';
import { LostSaleModal } from '../lost-sales/LostSaleModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';

export const FollowupSheetView = ({ onEditCustomer }) => {
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'upcoming', 'overdue', 'all'
  const [temperatureFilter, setTemperatureFilter] = useState('all'); // 'Hot', 'Warm', 'Future', 'all'
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [followups, setFollowups] = useState([]);
  const [counts, setCounts] = useState({ today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0, totalPipelineValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [loggingFollowup, setLoggingFollowup] = useState(null);
  const [markingLostLead, setMarkingLostLead] = useState(null);

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
    <div className="kpi-view-container followup-view-container">
      {/* 1. Top Executive Summary Stat Strip */}
      <div className="dash-kpi-grid" style={{ marginBottom: '14px' }}>
        {/* Overdue */}
        <div
          className={`kpi-stat-card ${counts.overdue > 0 ? 'lost-stat-card-red' : ''}`}
          onClick={() => setActiveTab('overdue')}
          style={{ cursor: 'pointer', borderColor: activeTab === 'overdue' ? '#DC2626' : undefined }}
        >
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">OVERDUE FOLLOW-UPS</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: counts.overdue > 0 ? '#DC2626' : '#0F172A' }}>
            {counts.overdue} leads
          </div>
          <div className="kpi-stat-footer">
            <span>Scheduled date has passed</span>
          </div>
        </div>

        {/* Today */}
        <div
          className="kpi-stat-card kpi-stat-card-blue"
          onClick={() => setActiveTab('today')}
          style={{ cursor: 'pointer', borderColor: activeTab === 'today' ? '#2563EB' : undefined }}
        >
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">TODAY'S SCHEDULE</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#2563EB' }}>
            {counts.today} calls
          </div>
          <div className="kpi-stat-footer">
            <span>Active calls & visits for today</span>
          </div>
        </div>

        {/* Upcoming (7 Days) */}
        <div
          className="kpi-stat-card kpi-stat-card-green"
          onClick={() => setActiveTab('upcoming')}
          style={{ cursor: 'pointer', borderColor: activeTab === 'upcoming' ? '#059669' : undefined }}
        >
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">UPCOMING (NEXT 7 DAYS)</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#059669' }}>
            {counts.upcoming} scheduled
          </div>
          <div className="kpi-stat-footer">
            <span>Upcoming pipeline nurture</span>
          </div>
        </div>

        {/* Hot Leads Pipeline */}
        <div
          className="kpi-stat-card kpi-stat-card-amber"
          onClick={() => setTemperatureFilter(temperatureFilter === 'Hot' ? 'all' : 'Hot')}
          style={{ cursor: 'pointer', borderColor: temperatureFilter === 'Hot' ? '#D97706' : undefined }}
        >
          <div className="kpi-stat-header">
            <span className="kpi-stat-title">HOT CONVERSION PIPELINE</span>
            <div className="kpi-stat-icon-bubble" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Flame size={18} />
            </div>
          </div>
          <div className="kpi-stat-value" style={{ color: '#D97706' }}>
            {counts.hot} hot deals
          </div>
          <div className="kpi-stat-footer">
            <span>Total Pipeline: <strong>₹{(counts.totalPipelineValue || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Segmented Smart Time-Horizon Tabs & Action Toolbar */}
      <div className="followup-tabs-bar">
        <div className="followup-time-tabs">
          <button
            type="button"
            className={`followup-time-tab ${activeTab === 'today' ? 'followup-time-tab-active-blue' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <Clock size={14} />
            <span>Today</span>
            <span className="followup-tab-badge">{counts.today}</span>
          </button>

          <button
            type="button"
            className={`followup-time-tab ${activeTab === 'upcoming' ? 'followup-time-tab-active-green' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Calendar size={14} />
            <span>Upcoming (Next 7 Days)</span>
            <span className="followup-tab-badge">{counts.upcoming}</span>
          </button>

          <button
            type="button"
            className={`followup-time-tab ${activeTab === 'overdue' ? 'followup-time-tab-active-red' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            <AlertTriangle size={14} />
            <span>Overdue</span>
            <span className="followup-tab-badge followup-tab-badge-red">{counts.overdue}</span>
          </button>

          <button
            type="button"
            className={`followup-time-tab ${activeTab === 'all' ? 'followup-time-tab-active-dark' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Open Leads</span>
            <span className="followup-tab-badge">{counts.total}</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="kpi-toolbar-right-group">
          {/* Temperature Chips */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>PRIORITY:</span>
            {['all', 'Hot', 'Warm', 'Future'].map((t) => (
              <button
                key={t}
                type="button"
                className={`lost-pill-filter ${temperatureFilter === t ? 'lost-pill-filter-active' : ''}`}
                onClick={() => setTemperatureFilter(t)}
              >
                {t === 'Hot' ? '🔥 Hot' : t === 'Warm' ? '☀️ Warm' : t === 'Future' ? '⏳ Future' : 'All'}
              </button>
            ))}
          </div>

          {/* Salesperson Filter */}
          <div className="kpi-filter-box">
            <span className="kpi-filter-label">Staff:</span>
            <select
              className="form-select form-select-sm"
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
            >
              <option value="all">All Sales Staff</option>
              <option value="Karthik Raja">Karthik Raja</option>
              <option value="Senthil Kumar">Senthil Kumar</option>
              <option value="Priya Dharshini">Priya Dharshini</option>
              <option value="Manoj Kumar">Manoj Kumar</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchFollowups}
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setLoggingFollowup({})}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '800' }}
          >
            <Plus size={14} />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* 3. Search Bar Sub-row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input form-input-sm"
              placeholder="Search by customer, phone, requirement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '280px', paddingLeft: '28px' }}
            />
            <Search
              size={13}
              style={{ position: 'absolute', left: '9px', top: '9px', color: '#94A3B8' }}
            />
          </div>
          {search && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { setSearch(''); fetchFollowups(); }}
            >
              ✕
            </button>
          )}
        </form>

        <span style={{ fontSize: '12px', color: '#64748B' }}>
          Showing <strong>{followups.length}</strong> follow-up leads
        </span>
      </div>

      {/* 4. The 7-Column Follow-up Ledger Table */}
      <div className="kpi-table-card">
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
          <div className="kpi-empty-state">
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📞</div>
            <div className="kpi-empty-title">
              {activeTab === 'overdue'
                ? 'No overdue follow-ups!'
                : activeTab === 'today'
                ? "No follow-up calls scheduled for today"
                : 'No follow-up records found'}
            </div>
            <div className="kpi-empty-sub">
              {activeTab === 'overdue'
                ? 'Great job! All active customer leads are contacted on schedule.'
                : 'Follow-ups help prevent lead leakage and boost quote conversion.'}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>1. Customer</th>
                  <th>2. Phone & Communication</th>
                  <th>3. Requirement</th>
                  <th>4. Quote Value</th>
                  <th>5. Salesperson</th>
                  <th>6. Next Followup</th>
                  <th>7. Status (Temperature)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((f) => {
                  const isOverdue = f.bucket === 'overdue';
                  const isHot = f.leadTemperature === 'Hot';
                  const isWarm = f.leadTemperature === 'Warm';

                  // Relative follow-up pill
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

                  const waText = encodeURIComponent(
                    `Hello ${f.customerName}, greeting from Vasantham Tiles & Sanitary Wares! Following up on your quotation${f.quotationValue ? ` for ₹${Number(f.quotationValue).toLocaleString('en-IN')}` : ''}. Please let us know if you need any further assistance with tile designs or sample displays.`
                  );

                  const phoneClean = String(f.phone || '').replace(/[^0-9]/g, '');
                  const waNumber = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;

                  return (
                    <tr key={f._id}>
                      {/* 1. Customer */}
                      <td>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
                          {f.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', gap: '6px', marginTop: '1px' }}>
                          {f.customerId && (
                            <span style={{ color: '#2563EB', fontWeight: '700', fontFamily: 'monospace' }}>
                              #{f.customerId}
                            </span>
                          )}
                          <span>• {f.customerType}</span>
                        </div>
                      </td>

                      {/* 2. Phone */}
                      <td>
                        {f.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a
                              href={`tel:${f.phone}`}
                              style={{ color: '#0F172A', fontWeight: '700', fontSize: '12.5px', textDecoration: 'none' }}
                              title="Click to call"
                            >
                              📞 {f.phone}
                            </a>
                            <a
                              href={`https://wa.me/${waNumber}?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="follow-wa-badge"
                              title="Open WhatsApp Chat"
                            >
                              💬 WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>

                      {/* 3. Requirement */}
                      <td style={{ maxWidth: '220px' }}>
                        <div style={{ fontWeight: '600', color: '#334155', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.requirement}
                        </div>
                        {f.approxQuantity && (
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            Qty: {f.approxQuantity}
                          </div>
                        )}
                      </td>

                      {/* 4. Quote Value */}
                      <td style={{ fontWeight: '900', color: '#059669', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                        ₹{(f.quotationValue || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 5. Salesperson */}
                      <td style={{ fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                        {f.salesperson}
                      </td>

                      {/* 6. Next Followup */}
                      <td>
                        <span
                          className={`follow-urgency-pill ${
                            isOverdue
                              ? 'follow-urgency-overdue'
                              : f.bucket === 'today'
                              ? 'follow-urgency-today'
                              : 'follow-urgency-upcoming'
                          }`}
                        >
                          {relativeLabel}
                        </span>
                        <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                          {f.nextFollowUp}
                        </div>
                      </td>

                      {/* 7. Status (Temperature) */}
                      <td>
                        {isHot ? (
                          <span className="follow-temp-pill follow-temp-hot">
                            🔥 Hot
                          </span>
                        ) : isWarm ? (
                          <span className="follow-temp-pill follow-temp-warm">
                            ☀️ Warm
                          </span>
                        ) : (
                          <span className="follow-temp-pill follow-temp-future">
                            ⏳ Future
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '11px', padding: '4px 9px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setLoggingFollowup(f)}
                            title="Log Call Discussion & Reschedule"
                          >
                            <PhoneCall size={12} />
                            <span>Log Activity</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '11px', padding: '4px 8px', fontWeight: '700', color: '#DC2626', borderColor: '#FECDD3', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Record Lost Deal & Competitor Analysis"
                            onClick={() => setMarkingLostLead({
                              customerId: f.customerId,
                              customerName: f.customerName,
                              phone: f.phone,
                              quotationValue: f.quotationValue,
                              salesperson: f.salesperson,
                              requirement: f.requirement,
                            })}
                          >
                            <FileX size={12} color="#DC2626" />
                            <span>Record Lost</span>
                          </button>

                          {onEditCustomer && (
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ color: '#2563EB', padding: '5px' }}
                              title="Edit Customer Profile"
                              onClick={() => onEditCustomer(f)}
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
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

      {/* Follow-up Logger Popup Modal */}
      {loggingFollowup && (
        <FollowupLogModal
          followUp={loggingFollowup?._id ? loggingFollowup : null}
          onClose={() => setLoggingFollowup(null)}
          onSaved={fetchFollowups}
          onOpenLostSale={(lead) => setMarkingLostLead({
            customerId: lead.customerId,
            customerName: lead.customerName,
            phone: lead.phone,
            quotationValue: lead.quotationValue,
            salesperson: lead.salesperson,
            requirement: lead.requirement,
          })}
        />
      )}

      {/* Lost Sale Popup Modal Integration */}
      {markingLostLead && (
        <LostSaleModal
          customer={markingLostLead}
          onClose={() => setMarkingLostLead(null)}
          onSaved={fetchFollowups}
        />
      )}
    </div>
  );
};
