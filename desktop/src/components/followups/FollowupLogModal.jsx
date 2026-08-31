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
  MessageSquare,
  User,
  Hash,
  Sparkles,
  Send,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

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

const QUICK_SNIPPETS = [
  'Client visited showroom & selected tiles',
  'Shared revised quote via WhatsApp',
  'Negotiating 5-10% discount on quotation',
  'Site plastering in progress, call next week',
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
      approxQuantity: d.approxQuantity || d.sqft,
      houseStage: d.houseStage,
      customerType: d.customerType,
      lastReason: d.lastReason || d.notes,
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        margin: 0,
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          backgroundColor: '#FFFFFF',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F172A',
            padding: '20px 24px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
              }}
            >
              <PhoneCall size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Log Follow-up Activity & Discussion
                </h3>
                {selectedFollowUp?.customerId && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(30, 58, 138, 0.6)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    <Hash size={11} />
                    <span>{selectedFollowUp.customerId}</span>
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Record client discussion remarks, update lead priority, and schedule next follow-up.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px',
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', backgroundColor: '#F8FAFC' }}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: CUSTOMER LEAD DETAILS CARD */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#2563EB" />
                  <span>1. CUSTOMER LEAD & COMMERCIAL DETAILS</span>
                </div>
              </div>

              {!selectedFollowUp ? (
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    SEARCH & SELECT CUSTOMER LEAD *
                  </label>
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, or ID (e.g. #CUS-000001)..."
                    value={searchCrm}
                    onChange={(e) => setSearchCrm(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                    autoFocus
                  />

                  {showCrmDropdown && crmResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '4px', overflow: 'hidden' }}>
                      {crmResults.map((cust) => {
                        const d = cust.data instanceof Map ? Object.fromEntries(cust.data) : (cust.data || {});
                        return (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'monospace', fontSize: '12px' }}>
                                #{cust.customerId}
                              </span>
                              <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                                {d.customerName || 'Unnamed'}
                              </span>
                            </div>
                            <span style={{ color: '#64748B', fontSize: '12px' }}>
                              📞 {d.phone || 'No phone'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Editable Lead Details Box */}
                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          value={selectedFollowUp.customerName || ''}
                          onChange={(e) => setSelectedFollowUp({ ...selectedFollowUp, customerName: e.target.value })}
                          style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            backgroundColor: '#FFFFFF',
                            flex: 1,
                          }}
                          placeholder="Customer Name"
                        />
                        {selectedFollowUp.customerId && (
                          <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', padding: '2px 7px', borderRadius: '6px' }}>
                            #{selectedFollowUp.customerId}
                          </span>
                        )}
                      </div>

                      {selectedFollowUp.phone && (
                        <a
                          href={getWhatsAppUrl(selectedFollowUp.phone, selectedFollowUp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '11.5px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '4px 10px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Editable Detail Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '12px' }}>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</span>
                        <input
                          type="text"
                          value={selectedFollowUp.phone || ''}
                          onChange={(e) => setSelectedFollowUp({ ...selectedFollowUp, phone: e.target.value })}
                          style={{ width: '100%', fontWeight: '800', color: '#0F172A', marginTop: '2px', border: 'none', outline: 'none', backgroundColor: 'transparent' }}
                          placeholder="Phone"
                        />
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Requirements</span>
                        <div style={{ fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                          {Array.isArray(selectedFollowUp.requirement)
                            ? selectedFollowUp.requirement.join(', ')
                            : typeof selectedFollowUp.requirement === 'string'
                            ? selectedFollowUp.requirement.replace(/([a-z])([A-Z])/g, '$1, $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1, $2')
                            : selectedFollowUp.requirement || 'Tiles & Sanitary'}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Salesperson</span>
                        <input
                          type="text"
                          value={selectedFollowUp.salesperson || ''}
                          onChange={(e) => setSelectedFollowUp({ ...selectedFollowUp, salesperson: e.target.value })}
                          style={{ width: '100%', fontWeight: '700', color: '#0F172A', marginTop: '2px', border: 'none', outline: 'none', backgroundColor: 'transparent' }}
                          placeholder="Salesperson"
                        />
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Stage</span>
                        <div style={{ fontWeight: '700', color: '#334155', marginTop: '2px' }}>🏗️ {selectedFollowUp.houseStage || 'Planning'}</div>
                      </div>
                    </div>

                    {(selectedFollowUp.lastReason || selectedFollowUp.notes) && (
                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                        <span style={{ color: '#64748B', fontWeight: '700' }}>Last Discussion Note:</span>{' '}
                        <span style={{ fontStyle: 'italic', color: '#334155' }}>"{selectedFollowUp.lastReason || selectedFollowUp.notes}"</span>
                      </div>
                    )}
                  </div>

                  {/* Editable Quotation Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                      QUOTATION VALUE (₹)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '10px', fontSize: '15px', fontWeight: '900', color: '#059669' }}>₹</span>
                      <input
                        type="number"
                        placeholder="Quotation Value"
                        value={quotationValue}
                        onChange={(e) => setQuotationValue(e.target.value)}
                        style={{ width: '100%', paddingLeft: '32px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '16px', fontWeight: '900', color: '#059669', backgroundColor: '#FFFFFF' }}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: INTERACTION OUTCOME & DISCUSSION NOTES */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} color="#059669" />
                <span>2. INTERACTION OUTCOME & DISCUSSION NOTES</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Latest Discussion Result <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23475569' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>

                  {outcome === 'Deal Lost / Postponed' && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: '10px', fontSize: '12px', color: '#991B1B', fontWeight: '600' }}>
                      ⚠️ Selecting "Deal Lost" will route to the Lost Sale analysis window.
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                      Discussion Notes & Customer Remarks
                    </label>
                  </div>

                  {/* Quick Snippet Chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {QUICK_SNIPPETS.map((snip) => (
                      <button
                        key={snip}
                        type="button"
                        onClick={() => setDiscussionNotes(snip)}
                        style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        + {snip.slice(0, 28)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="e.g. Customer visited showroom, liked Kajaria 4x2 marble finish tiles. Requested 5% discount..."
                    value={discussionNotes}
                    onChange={(e) => setDiscussionNotes(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: PRIORITY TEMPERATURE & NEXT FOLLOW-UP */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#D97706" />
                <span>3. LEAD PRIORITY & NEXT FOLLOW-UP SCHEDULE</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Temperature Priority Buttons */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Lead Temperature Priority <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setLeadTemperature('Hot')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: leadTemperature === 'Hot' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                        backgroundColor: leadTemperature === 'Hot' ? '#FEF2F2' : '#FFFFFF',
                        color: leadTemperature === 'Hot' ? '#991B1B' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>🔥 Hot</span>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>Decision Soon</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeadTemperature('Warm')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: leadTemperature === 'Warm' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                        backgroundColor: leadTemperature === 'Warm' ? '#FEF3C7' : '#FFFFFF',
                        color: leadTemperature === 'Warm' ? '#92400E' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>☀️ Warm</span>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>Evaluating Specs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeadTemperature('Future')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: leadTemperature === 'Future' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        backgroundColor: leadTemperature === 'Future' ? '#EFF6FF' : '#FFFFFF',
                        color: leadTemperature === 'Future' ? '#1E40AF' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>⏳ Future</span>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>Long-term Site</span>
                    </button>
                  </div>
                </div>

                {/* Date Picker & Quick Days */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                      Next Scheduled Date <span style={{ color: '#E11D48' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleQuickDays(1)}
                        style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        +1d Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDays(3)}
                        style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        +3d
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDays(7)}
                        style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        +1w Week
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDays(15)}
                        style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        +15d
                      </button>
                    </div>
                  </div>

                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: '800', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#F1F5F9', border: 'none', color: '#475569', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedFollowUp}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Send size={15} />
              <span>{saving ? 'Recording...' : '✓ Save Follow-up Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
