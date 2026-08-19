import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PhoneCall,
  Calendar,
  Flame,
  Sun,
  Clock,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  MessageSquare,
  Search,
  User,
  Hash,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const OUTCOMES = [
  'Spoke with Customer / Positive Interest',
  'Customer Visiting Showroom Today / Soon',
  'Sent Revised Quotation / Discount Provided',
  'No Answer / Customer Busy / Callback Requested',
  'Negotiating Final Price / Competitor Comparison',
  'Site Measurement Scheduled',
  'Order Confirmed / Ready for Billing',
  'Deal Lost / Postponed',
];

export const FollowupLogModal = ({ followUp: initialFollowUp, onClose, onSaved, onOpenLostSale }) => {
  const toast = useToast();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [selectedFollowUp, setSelectedFollowUp] = useState(initialFollowUp || null);
  const [outcome, setOutcome] = useState('Spoke with Customer / Positive Interest');
  const [leadTemperature, setLeadTemperature] = useState(initialFollowUp?.leadTemperature || 'Hot');
  const [nextFollowUp, setNextFollowUp] = useState(
    initialFollowUp?.nextFollowUp || tomorrow.toISOString().split('T')[0]
  );
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [quotationValue, setQuotationValue] = useState(
    initialFollowUp?.quotationValue !== undefined ? String(initialFollowUp.quotationValue) : ''
  );

  // CRM Search if no lead initially pre-selected
  const [searchCrm, setSearchCrm] = useState('');
  const [crmResults, setCrmResults] = useState([]);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic search for CRM leads
  useEffect(() => {
    if (!searchCrm.trim() || searchCrm.length < 2) {
      setCrmResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingCrm(true);
      try {
        const res = await api.getCustomers({ search: searchCrm.trim(), limit: 5 });
        const list = res.customers || res.data || [];
        setCrmResults(list);
        setShowCrmDropdown(true);
      } catch (err) {
        console.warn('CRM search error:', err);
      } finally {
        setLoadingCrm(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCrm]);

  const handleSelectCustomer = (cust) => {
    const d = cust.data instanceof Map ? Object.fromEntries(cust.data) : (cust.data || {});
    const mapped = {
      _id: cust._id,
      customerId: cust.customerId,
      customerName: d.customerName || 'Unnamed Customer',
      phone: d.phone || '',
      requirement: d.requirement || 'Tiles & Sanitary',
      quotationValue: Number(d.quotationValue) || Number(d.orderValue) || 0,
      salesperson: d.salesperson || 'Showroom Staff',
      leadTemperature: d.leadTemperature || 'Hot',
      nextFollowUp: d.nextFollowUp || tomorrow.toISOString().split('T')[0],
    };
    setSelectedFollowUp(mapped);
    if (mapped.quotationValue) setQuotationValue(String(mapped.quotationValue));
    if (mapped.nextFollowUp) setNextFollowUp(mapped.nextFollowUp);
    if (mapped.leadTemperature) setLeadTemperature(mapped.leadTemperature);
    setSearchCrm('');
    setShowCrmDropdown(false);
  };

  const handleQuickDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextFollowUp(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedFollowUp?._id) {
      setError('Please select a customer lead first');
      return;
    }

    // If deal lost is selected, route directly to Lost Sale modal
    if (outcome === 'Deal Lost / Postponed') {
      if (onOpenLostSale) {
        onOpenLostSale(selectedFollowUp);
        onClose();
        return;
      }
    }

    setSaving(true);
    try {
      await api.logFollowupActivity(selectedFollowUp._id, {
        outcome,
        discussionNotes: discussionNotes.trim(),
        nextFollowUp,
        leadTemperature,
        quotationValue: quotationValue ? Number(quotationValue) : undefined,
        statusUpdate: outcome === 'Order Confirmed / Ready for Billing' ? 'Order Confirmed' : undefined,
      });

      toast.success(
        `Follow-up call logged for ${selectedFollowUp.customerName}. Next reminder set for ${nextFollowUp}.`,
        'Activity Logged'
      );

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.warn('Error logging follow-up activity:', err.message);
      setError(err.message || 'Failed to log follow-up');
      toast.error(err.message || 'Failed to log follow-up', 'Activity Error');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '92vh',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
          background: '#FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rich Gradient Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '18px 24px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <PhoneCall size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  Log Follow-up Activity & Discussion
                </h3>
                {selectedFollowUp?.customerId && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#60A5FA',
                    }}
                  >
                    <Hash size={11} />
                    <span>{selectedFollowUp.customerId}</span>
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Record client discussion remarks, update lead priority temperature, and schedule next follow-up.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Distinct Sections */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div className="kpi-alert-danger">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: CUSTOMER LEAD & QUOTATION */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#2563EB" />
                  <span>1. CUSTOMER LEAD & QUOTATION VALUE</span>
                </div>
                {selectedFollowUp?.salesperson && (
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                    Rep: {selectedFollowUp.salesperson}
                  </span>
                )}
              </div>

              {!selectedFollowUp ? (
                <div style={{ position: 'relative' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                    SEARCH & SELECT CUSTOMER LEAD *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search by customer name, phone, or ID (e.g. #CUS-1002)..."
                      value={searchCrm}
                      onChange={(e) => setSearchCrm(e.target.value)}
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                      autoFocus
                    />
                    {loadingCrm && (
                      <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '11px', color: '#64748B' }}>
                        Searching...
                      </span>
                    )}
                  </div>

                  {showCrmDropdown && crmResults.length > 0 && (
                    <div className="lost-crm-search-dropdown">
                      {crmResults.map((cust) => {
                        const d = cust.data instanceof Map ? Object.fromEntries(cust.data) : (cust.data || {});
                        return (
                          <div
                            key={cust._id}
                            className="lost-crm-search-item"
                            onClick={() => handleSelectCustomer(cust)}
                          >
                            <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'monospace' }}>
                              #{cust.customerId}
                            </span>
                            <span style={{ fontWeight: '700', color: '#0F172A' }}>
                              {d.customerName || 'Unnamed'}
                            </span>
                            <span style={{ color: '#64748B', fontSize: '11.5px' }}>
                              📞 {d.phone || 'No phone'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="kpi-grid-2">
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>CUSTOMER NAME</div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', marginTop: '2px' }}>
                      {selectedFollowUp.customerName}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#2563EB', marginTop: '2px' }}>
                      📞 {selectedFollowUp.phone || 'No phone'}
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                      QUOTATION VALUE (₹)
                    </label>
                    <div className="input-icon-wrapper">
                      <span className="input-currency-tag">₹</span>
                      <input
                        type="number"
                        className="form-input form-input-with-currency"
                        placeholder="e.g. 150000"
                        value={quotationValue}
                        onChange={(e) => setQuotationValue(e.target.value)}
                        style={{ fontWeight: '800', color: '#059669', fontSize: '15px' }}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: INTERACTION OUTCOME & DISCUSSION REMARKS */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} color="#059669" />
                  <span>2. INTERACTION OUTCOME & NOTES</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800' }}>
                  Latest Discussion Result *
                </label>
                <select
                  className="form-select"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  style={{ fontWeight: '700', fontSize: '13px' }}
                >
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>

                {outcome === 'Deal Lost / Postponed' && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: '8px', fontSize: '12px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <span>Selecting "Deal Lost" will automatically open the Lost Sale & Competitor Analysis popup.</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label" style={{ fontWeight: '700' }}>
                  Discussion Notes & Customer Remarks
                </label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="e.g. Customer visited showroom, liked Kajaria 4x2 marble finish tiles. Requested 5% discount on adhesive..."
                  value={discussionNotes}
                  onChange={(e) => setDiscussionNotes(e.target.value)}
                  style={{ fontSize: '12.5px' }}
                />
              </div>
            </div>

            {/* SECTION 3: PRIORITY TEMPERATURE & NEXT FOLLOW-UP */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#D97706" />
                  <span>3. LEAD PRIORITY & NEXT FOLLOW-UP SCHEDULE</span>
                </div>
              </div>

              {/* Temperature Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800' }}>
                  Lead Temperature Priority *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`follow-temp-btn ${leadTemperature === 'Hot' ? 'follow-temp-hot-active' : ''}`}
                    onClick={() => setLeadTemperature('Hot')}
                  >
                    <Flame size={16} color="#DC2626" />
                    <span style={{ fontWeight: '800' }}>🔥 Hot</span>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Decision Soon</span>
                  </button>

                  <button
                    type="button"
                    className={`follow-temp-btn ${leadTemperature === 'Warm' ? 'follow-temp-warm-active' : ''}`}
                    onClick={() => setLeadTemperature('Warm')}
                  >
                    <Sun size={16} color="#D97706" />
                    <span style={{ fontWeight: '800' }}>☀️ Warm</span>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Evaluating Specs</span>
                  </button>

                  <button
                    type="button"
                    className={`follow-temp-btn ${leadTemperature === 'Future' ? 'follow-temp-future-active' : ''}`}
                    onClick={() => setLeadTemperature('Future')}
                  >
                    <Clock size={16} color="#2563EB" />
                    <span style={{ fontWeight: '800' }}>⏳ Future</span>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Long-term Site</span>
                  </button>
                </div>
              </div>

              {/* Next Follow-up Date */}
              <div className="form-group" style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontWeight: '800', margin: 0 }}>
                    Next Scheduled Date *
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="follow-quick-day-btn"
                      onClick={() => handleQuickDays(1)}
                    >
                      +1d Tomorrow
                    </button>
                    <button
                      type="button"
                      className="follow-quick-day-btn"
                      onClick={() => handleQuickDays(3)}
                    >
                      +3d
                    </button>
                    <button
                      type="button"
                      className="follow-quick-day-btn"
                      onClick={() => handleQuickDays(7)}
                    >
                      +1w Week
                    </button>
                    <button
                      type="button"
                      className="follow-quick-day-btn"
                      onClick={() => handleQuickDays(15)}
                    >
                      +15d
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  className="form-input"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  required
                  style={{ fontWeight: '800', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Sticky Modal Action Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !selectedFollowUp}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                fontWeight: '800',
                padding: '8px 20px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {saving ? 'Recording...' : '✓ Save Follow-up Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
