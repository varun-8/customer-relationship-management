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
  Layers,
  Building2,
  DollarSign,
  ChevronDown,
  Info,
  History,
  FileText,
  Phone,
  MapPin,
  Tag,
  Plus,
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
  'Callback requested in evening',
  'Scheduled site measurement with engineer',
];

const STAGES = [
  'Foundation',
  'Brickwork',
  'Plastering',
  'Painting',
  'Building Completion',
  'Renovation',
];

const REQUIREMENTS_LIST = [
  'Tiles',
  'Sanitary',
  'Adhesive / Epoxy',
  'CP Fittings',
  'Bath Fittings',
  'Kitchen Sinks',
];

// Parse historical discussion notes and conversation remarks
const parseNotesHistory = (followUp) => {
  if (!followUp) return [];
  const rawNotes = followUp.notes || followUp.data?.notes || '';
  const rawDiscussion = followUp.discussionNotes || followUp.data?.discussionNotes || '';
  const rawRemarks = followUp.conversationRemarks || followUp.data?.conversationRemarks || '';
  const lastReason = followUp.lastReason || followUp.data?.lastReason || '';

  const combined = [rawNotes, rawRemarks, rawDiscussion].filter(Boolean).join('\n');
  const lines = combined
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lastReason && lastReason.trim() && !lines.includes(lastReason.trim())) {
    lines.push(lastReason.trim());
  }

  // Deduplicate
  const uniqueLines = [];
  const seen = new Set();
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      uniqueLines.push(line);
    }
  }

  const parsed = uniqueLines.map((line, idx) => {
    const dateMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const rest = dateMatch[2];
      const outcomeMatch = rest.match(/^(.*?):\s*(.*)$/);
      if (outcomeMatch) {
        return {
          id: `note-${idx}`,
          date: dateStr,
          outcome: outcomeMatch[1],
          text: outcomeMatch[2],
        };
      }
      return {
        id: `note-${idx}`,
        date: dateStr,
        outcome: null,
        text: rest,
      };
    }
    return {
      id: `note-${idx}`,
      date: null,
      outcome: null,
      text: line,
    };
  });

  return parsed.reverse();
};

export const FollowupLogModal = ({ followUp: initialFollowUp, onClose, onSaved, onOpenLostSale }) => {
  const toast = useToast();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Default active section is 'timeline' (Read-only view mode) if initialFollowUp exists, else 'log'
  const [activeSection, setActiveSection] = useState(() => (initialFollowUp ? 'timeline' : 'log')); // 'timeline' | 'log' | 'info'

  const [selectedFollowUp, setSelectedFollowUp] = useState(initialFollowUp || null);
  const [outcome, setOutcome] = useState('Spoke with Customer / Positive Interest');
  const [leadTemperature, setLeadTemperature] = useState(initialFollowUp?.leadTemperature || 'Hot');
  const [houseStage, setHouseStage] = useState(
    initialFollowUp?.houseStage || initialFollowUp?.stage || 'Plastering'
  );
  const [requirements, setRequirements] = useState(() => {
    const r = initialFollowUp?.requirement;
    if (Array.isArray(r)) return r;
    if (typeof r === 'string' && r.trim()) {
      return r.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return ['Tiles'];
  });
  const [nextFollowUp, setNextFollowUp] = useState(
    initialFollowUp?.nextFollowUp || tomorrow.toISOString().split('T')[0]
  );
  const [quotationValue, setQuotationValue] = useState(
    initialFollowUp?.quotationValue !== undefined ? String(initialFollowUp.quotationValue) : ''
  );
  const [orderValueAmount, setOrderValueAmount] = useState(
    initialFollowUp?.orderValue !== undefined ? String(initialFollowUp.orderValue) : (initialFollowUp?.quotationValue !== undefined ? String(initialFollowUp.quotationValue) : '')
  );
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState(
    initialFollowUp?.status || 'Negotiation & Follow-up'
  );

  // Discussion & Customer Notes history state
  const [notesHistory, setNotesHistory] = useState(() => parseNotesHistory(initialFollowUp));
  const [savingQuickNote, setSavingQuickNote] = useState(false);

  useEffect(() => {
    if (selectedFollowUp) {
      setNotesHistory(parseNotesHistory(selectedFollowUp));
    }
  }, [selectedFollowUp]);

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
      customerName: d.customerName || cust.customerName || 'Unnamed Customer',
      phone: d.phone || '',
      requirement: d.requirement || 'Tiles',
      quotationValue: Number(d.quotationValue) || Number(d.orderValue) || 0,
      salesperson: d.salesperson || 'Showroom Staff',
      leadTemperature: d.leadTemperature || 'Hot',
      nextFollowUp: d.nextFollowUp || tomorrow.toISOString().split('T')[0],
      approxQuantity: d.approxQuantity || d.sqft,
      tileBudget: d.tileBudget,
      adhesiveRequirement: d.adhesiveRequirement,
      houseStage: d.houseStage || 'Plastering',
      customerType: d.customerType || 'Building Owner',
      location: d.location || '',
      leadSource: d.leadSource || 'Showroom Walk-in',
      lastReason: d.lastReason || d.notes,
      notes: d.notes || cust.notes || '',
      conversationRemarks: d.conversationRemarks || cust.conversationRemarks || '',
      discussionNotes: d.discussionNotes || cust.discussionNotes || '',
      orderValue: d.orderValue,
      status: d.status,
    };
    setSelectedFollowUp(mapped);
    if (mapped.quotationValue) setQuotationValue(String(mapped.quotationValue));
    if (mapped.nextFollowUp) setNextFollowUp(mapped.nextFollowUp);
    if (mapped.houseStage) setHouseStage(mapped.houseStage);
    if (mapped.status) setPipelineStatus(mapped.status);
    if (mapped.requirement) {
      setRequirements(Array.isArray(mapped.requirement) ? mapped.requirement : [mapped.requirement]);
    }
    setNotesHistory(parseNotesHistory(mapped));
    setShowCrmDropdown(false);
    setSearchCrm('');
  };

  const handleToggleRequirement = (req) => {
    if (requirements.includes(req)) {
      if (requirements.length === 1) return;
      setRequirements(requirements.filter((r) => r !== req));
    } else {
      setRequirements([...requirements, req]);
    }
  };

  const handleQuickDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextFollowUp(d.toISOString().split('T')[0]);
  };

  const handleAppendSnippet = (snip) => {
    setDiscussionNotes((prev) => {
      const clean = snip.trim();
      if (!prev.trim()) return clean;
      return `${prev.trim()}\n• ${clean}`;
    });
  };

  const handleAddQuickNote = async () => {
    const noteText = discussionNotes.trim();
    if (!noteText || !selectedFollowUp) return;
    setSavingQuickNote(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const newEntry = `[${todayStr}] Remark: ${noteText}`;
      const existingNotes = selectedFollowUp.notes || selectedFollowUp.data?.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n${newEntry}` : newEntry;

      const recordId = selectedFollowUp._id || selectedFollowUp.customerId;
      const res = await api.updateCustomer(recordId, {
        notes: updatedNotes,
        lastReason: newEntry,
        conversationRemarks: selectedFollowUp.conversationRemarks
          ? `${selectedFollowUp.conversationRemarks}\n${newEntry}`
          : newEntry,
      });

      if (res && res.success) {
        toast.success('Discussion note recorded into customer history!', 'Note Added');
        const updated = {
          ...selectedFollowUp,
          notes: updatedNotes,
          lastReason: newEntry,
        };
        setSelectedFollowUp(updated);
        setNotesHistory(parseNotesHistory(updated));
        setDiscussionNotes('');
        if (onSaved) onSaved();
      } else {
        toast.error(res?.message || 'Failed to record discussion note', 'Error');
      }
    } catch (err) {
      toast.error(err.message || 'Error saving discussion note', 'Error');
    } finally {
      setSavingQuickNote(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFollowUp) {
      setError('Please search and select a customer lead first.');
      return;
    }

    const isLostTrigger =
      outcome === 'Deal Lost / Postponed' ||
      pipelineStatus === 'Lost' ||
      pipelineStatus === 'Lost Sale' ||
      pipelineStatus === 'Sale Lost' ||
      (pipelineStatus && String(pipelineStatus).toLowerCase().includes('lost'));

    let finalOrderVal = orderValueAmount ? Number(orderValueAmount) : (quotationValue ? Number(quotationValue) : undefined);

    if (isLostTrigger) {
      setSaving(true);
      try {
        const followUpId = selectedFollowUp._id || selectedFollowUp.customerId;
        await api.logFollowupActivity(followUpId, {
          outcome,
          customerName: selectedFollowUp.customerName,
          phone: selectedFollowUp.phone,
          discussionNotes: discussionNotes.trim(),
          nextFollowUp,
          leadTemperature,
          houseStage,
          quotationValue: quotationValue ? Number(quotationValue) : undefined,
          orderValue: finalOrderVal,
          statusUpdate: 'Lost Sale',
        });
      } catch (logErr) {
        console.warn('Error logging followup prior to lost sale modal:', logErr);
      } finally {
        setSaving(false);
      }

      if (onOpenLostSale) {
        onOpenLostSale(selectedFollowUp);
        onClose();
        return;
      }
    }

    const isOrderConfirmedTrigger = outcome === 'Order Confirmed / Ready for Billing' || pipelineStatus === 'Order Confirmed';
    if (isOrderConfirmedTrigger) {
      if (!finalOrderVal || finalOrderVal <= 0) {
        setError('Please enter the confirmed order deal amount (₹) at which the deal is closed.');
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const followUpId = selectedFollowUp._id || selectedFollowUp.customerId;
      const res = await api.logFollowupActivity(followUpId, {
        outcome,
        customerName: selectedFollowUp.customerName,
        phone: selectedFollowUp.phone,
        discussionNotes: discussionNotes.trim(),
        nextFollowUp,
        leadTemperature,
        houseStage,
        quotationValue: quotationValue ? Number(quotationValue) : undefined,
        orderValue: finalOrderVal,
        statusUpdate: isOrderConfirmedTrigger ? 'Order Confirmed' : (isLostTrigger ? 'Lost Sale' : (pipelineStatus || undefined)),
      });

      if (res.success) {
        toast.success(
          `Follow-up logged for ${selectedFollowUp.customerName || 'Customer'}!`,
          'Activity Recorded'
        );
        if (onSaved) onSaved();
        onClose();
      } else {
        throw new Error(res.message || 'Failed to record activity');
      }
    } catch (err) {
      console.error('Follow-up log error:', err);
      setError(err.message || 'Failed to log follow-up');
      toast.error(err.message || 'Failed to log follow-up', 'Activity Error');
    } finally {
      setSaving(false);
    }
  };

  const customerName = selectedFollowUp?.customerName || 'Customer Lead';
  const customerId = selectedFollowUp?.customerId || 'CUS-000000';
  const phone = selectedFollowUp?.phone || '';
  const customerType = selectedFollowUp?.customerType || 'Building Owner';
  const location = selectedFollowUp?.location || '';
  const leadSource = selectedFollowUp?.leadSource || 'Showroom Walk-in';
  const salesperson = selectedFollowUp?.salesperson || 'Showroom Staff';
  const approxQuantity = selectedFollowUp?.approxQuantity || '';
  const tileBudget = selectedFollowUp?.tileBudget || '';
  const adhesiveRequirement = selectedFollowUp?.adhesiveRequirement || 'No';

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '1040px',
          width: '92vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.4)',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            backgroundColor: '#0F172A',
            padding: '18px 24px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
              }}
            >
              <PhoneCall size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {activeSection === 'log' ? 'Log Activity & Follow-up' : 'Follow-up Activity & Timeline Info'}
                </h3>
                {customerId && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(15, 118, 110, 0.5)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: '#5EEAD4',
                      border: '1px solid rgba(94, 234, 212, 0.3)',
                    }}
                  >
                    <Hash size={11} />
                    <span>{customerId}</span>
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                {customerName} • {activeSection === 'timeline' ? 'Read-only activity log and history timeline' : 'Record discussion remarks and schedule next reminder'}
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

        {/* Top Segmented Navigation Switcher: [Log Info & Timeline (Read-Only)] vs [Log Activity] vs [Customer Info] */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSection('timeline')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeSection === 'timeline' ? '1px solid #99F6E4' : '1px solid transparent',
              backgroundColor: activeSection === 'timeline' ? '#F0FDFA' : 'transparent',
              color: activeSection === 'timeline' ? '#0F766E' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <History size={14} color={activeSection === 'timeline' ? '#0F766E' : '#64748B'} />
            <span>Activity Timeline (Read-Only)</span>
            {activeSection === 'timeline' && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0F766E' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('log')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeSection === 'log' ? '1px solid #BFDBFE' : '1px solid transparent',
              backgroundColor: activeSection === 'log' ? '#EFF6FF' : 'transparent',
              color: activeSection === 'log' ? '#1D4ED8' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={14} color={activeSection === 'log' ? '#1D4ED8' : '#64748B'} />
            <span>Log Follow-up Form</span>
            {activeSection === 'log' && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1D4ED8' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('info')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeSection === 'info' ? '1px solid #E2E8F0' : '1px solid transparent',
              backgroundColor: activeSection === 'info' ? '#F8FAFC' : 'transparent',
              color: activeSection === 'info' ? '#0F172A' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={14} color={activeSection === 'info' ? '#0F172A' : '#64748B'} />
            <span>Customer Specs</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#F8FAFC' }}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: READ-ONLY ACTIVITY & DISCUSSION TIMELINE (Default on click) */}
            {activeSection === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Non-Editable Quick Info Summary Banner */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{customerName}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞 {phone || 'No phone'}</span>
                          {phone && (
                            <a
                              href={getWhatsAppUrl(phone, selectedFollowUp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#15803D', fontWeight: '800', textDecoration: 'none' }}
                            >
                              💬 WhatsApp
                            </a>
                          )}
                          <span>• {customerType}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #99F6E4',
                        fontSize: '12px',
                        fontWeight: '800',
                      }}
                    >
                      Status: {pipelineStatus}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>STAGE</span>
                      <span style={{ fontWeight: '800', color: '#0F172A' }}>{houseStage}</span>
                    </div>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>PRIORITY</span>
                      <span style={{ fontWeight: '800', color: leadTemperature === 'Hot' ? '#DC2626' : '#D97706' }}>🔥 {leadTemperature}</span>
                    </div>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>NEXT REMINDER</span>
                      <span style={{ fontWeight: '800', color: '#2563EB' }}>📅 {nextFollowUp || 'Not Set'}</span>
                    </div>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>QUOTATION</span>
                      <span style={{ fontWeight: '800', color: '#059669' }}>₹{quotationValue ? Number(quotationValue).toLocaleString('en-IN') : '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Read-Only Timeline Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <History size={18} color="#0F766E" />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                        Activity & Conversation Timeline
                      </h4>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', padding: '3px 9px', borderRadius: '6px' }}>
                      {notesHistory.length} {notesHistory.length === 1 ? 'Timeline Log' : 'Timeline Logs'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notesHistory.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '13px' }}>
                        💬 No previous follow-up activity logged yet for {customerName}. Click "Log Activity & Update" above to record the first log.
                      </div>
                    ) : (
                      notesHistory.map((note) => (
                        <div
                          key={note.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderLeft: '4px solid #0F766E',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', padding: '2px 8px', borderRadius: '5px', fontFamily: 'monospace' }}>
                              📅 {note.date || 'Log Entry'}
                            </span>
                            {note.outcome && (
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '5px' }}>
                                {note.outcome}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: '500' }}>
                            {note.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOG ACTIVITY FORM (Clean Form Mode - No history clutter) */}
            {activeSection === 'log' && (
              <>
                {/* Search if no customer selected */}
                {!selectedFollowUp && (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                      SEARCH & SELECT CUSTOMER LEAD *
                    </label>
                    <input
                      type="text"
                      placeholder="Search by customer name, phone, or ID (e.g. #CUS-000001)..."
                      value={searchCrm}
                      onChange={(e) => setSearchCrm(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', backgroundColor: '#FFFFFF' }}
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
                                <span style={{ fontWeight: '800', color: '#0F766E', fontFamily: 'monospace', fontSize: '12px' }}>
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
                )}

                {/* CARD 1: CALL OUTCOME & LEAD PRIORITY DROPDOWN */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={15} color="#0F766E" />
                    </div>
                    <span>1. Call Outcome & Lead Priority</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {/* Outcome Dropdown List Box */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        CALL OUTCOME RESULT <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={outcome}
                          onChange={(e) => setOutcome(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #94A3B8',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: outcome === 'Deal Lost / Postponed' ? '#DC2626' : '#0F172A',
                            backgroundColor: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {OUTCOMES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} color="#64748B" style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Pipeline Status Dropdown List Box */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        EDIT PIPELINE STATUS <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={pipelineStatus}
                          onChange={(e) => setPipelineStatus(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #94A3B8',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#0F172A',
                            backgroundColor: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Newly Contacted">📌 Newly Contacted</option>
                          <option value="Requirement Collected">📋 Requirement Collected</option>
                          <option value="Quotation Provided">📄 Quotation Provided</option>
                          <option value="Negotiation & Follow-up">🤝 Negotiation & Follow-up</option>
                          <option value="Won - Closed">🎉 Won - Closed</option>
                          <option value="Lost Sale">❌ Lost Sale</option>
                        </select>
                        <ChevronDown size={16} color="#64748B" style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Priority Dropdown List Box */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        LEAD PRIORITY TEMPERATURE <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={leadTemperature}
                          onChange={(e) => setLeadTemperature(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #94A3B8',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: leadTemperature === 'Hot' ? '#DC2626' : (leadTemperature === 'Warm' ? '#D97706' : '#0F766E'),
                            backgroundColor: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Hot">🔥 Hot Deal (High Urgency)</option>
                          <option value="Warm">☀️ Warm Lead (Evaluating)</option>
                          <option value="Future">⏳ Future Requirement</option>
                        </select>
                        <ChevronDown size={16} color="#64748B" style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
                      </div>
                    </div>
                  </div>

                  {outcome === 'Deal Lost / Postponed' && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: '10px', fontSize: '12px', color: '#991B1B', fontWeight: '700' }}>
                      ⚠️ Note: Selecting "Deal Lost / Postponed" will open the Lost Sale root cause analysis workflow.
                    </div>
                  )}
                </div>

                {/* CARD 2: SITE SPECIFICATIONS & MATERIAL REQUIREMENTS */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={15} color="#2563EB" />
                    </div>
                    <span>2. Site Stage & Material Requirements</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {/* Construction Stage Dropdown List Box */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        CONSTRUCTION / PROJECT STAGE
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={houseStage}
                          onChange={(e) => setHouseStage(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#0F172A',
                            backgroundColor: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {STAGES.map((stg) => (
                            <option key={stg} value={stg}>
                              {stg}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} color="#64748B" style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Deal / Quotation Value */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        DEAL / QUOTATION VALUE (₹)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '15px', fontWeight: '900', color: '#0F766E' }}>₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 120000"
                          value={quotationValue}
                          onChange={(e) => setQuotationValue(e.target.value)}
                          style={{
                            width: '100%',
                            paddingLeft: '30px',
                            paddingRight: '12px',
                            paddingTop: '9px',
                            paddingBottom: '9px',
                            borderRadius: '10px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '14px',
                            fontWeight: '800',
                            color: '#0F172A',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                          }}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confirmed Order Value Input Field (Visible when Order Confirmed option is selected) */}
                  {(outcome === 'Order Confirmed / Ready for Billing' || pipelineStatus === 'Order Confirmed') && (
                    <div style={{ marginTop: '14px', backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={16} color="#059669" />
                        <span>CONFIRMED ORDER VALUE (₹) *</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '15px', fontWeight: '900', color: '#059669' }}>₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 150000"
                          value={orderValueAmount}
                          onChange={(e) => setOrderValueAmount(e.target.value)}
                          style={{
                            width: '100%',
                            paddingLeft: '30px',
                            paddingRight: '12px',
                            paddingTop: '9px',
                            paddingBottom: '9px',
                            borderRadius: '10px',
                            border: '1.5px solid #86EFAC',
                            fontSize: '14px',
                            fontWeight: '900',
                            color: '#065F46',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                          }}
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Requirements Multi-Select Pills */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      MATERIAL CATEGORIES NEEDED (MULTI-SELECT)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {REQUIREMENTS_LIST.map((req) => {
                        const isSel = requirements.includes(req);
                        return (
                          <button
                            key={req}
                            type="button"
                            onClick={() => handleToggleRequirement(req)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: isSel ? '800' : '600',
                              cursor: 'pointer',
                              backgroundColor: isSel ? '#F0FDFA' : '#F8FAFC',
                              border: `1.5px solid ${isSel ? '#0F766E' : '#E2E8F0'}`,
                              color: isSel ? '#0F766E' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isSel ? '✓ ' : '+ '}{req}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* CARD 3: FOLLOW-UP REMINDER SCHEDULE */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={15} color="#D97706" />
                    </div>
                    <span>3. Follow-up Reminder Schedule</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        NEXT SCHEDULED FOLLOW-UP DATE <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={nextFollowUp}
                        onChange={(e) => setNextFollowUp(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '13px',
                          color: '#0F172A',
                          fontWeight: '700',
                          backgroundColor: '#FFFFFF',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        QUICK REMINDER PRESETS
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleQuickDays(1)}
                          style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                        >
                          +1d Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDays(3)}
                          style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                        >
                          +3d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDays(7)}
                          style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                        >
                          +1w Next Week
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDays(15)}
                          style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                        >
                          +15d
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 4: NEW DISCUSSION REMARK INPUT (Clean input form - no inline time history clutter) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #E2E8F0',
                    borderLeft: '4px solid #0F766E',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', backgroundColor: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        4. New Discussion Remark & Notes
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                        Type new call notes or client conversation remarks to log into history
                      </div>
                    </div>
                  </div>

                  {/* Quick Snippet Chips */}
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      QUICK REMARK SNIPPETS (CLICK TO INSERT)
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {QUICK_SNIPPETS.map((snip) => (
                        <button
                          key={snip}
                          type="button"
                          onClick={() => handleAppendSnippet(snip)}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: '#F8FAFC',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                            padding: '4px 10px',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          + {snip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    DISCUSSION REMARK / CUSTOMER NOTES
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Type conversation notes, sample selections, customer commitments, delivery preferences..."
                    value={discussionNotes}
                    onChange={(e) => setDiscussionNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </>
            )}

            {/* TAB 3: CUSTOMER SPECIFICATIONS & CONTACT VIEW */}
            {activeSection === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="#2563EB" />
                    <span>1. Customer & Contact Details</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Customer ID:</span>{' '}
                      <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>#{customerId}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Client Name:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{customerName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Mobile Phone:</span>{' '}
                      <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{phone || '—'}</strong>
                      {phone && (
                        <a
                          href={getWhatsAppUrl(phone, selectedFollowUp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: '8px', fontSize: '11px', color: '#15803D', fontWeight: '800', textDecoration: 'none' }}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Site Location:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{location || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Customer Type:</span>{' '}
                      <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                        {customerType}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Salesperson:</span>{' '}
                      <strong style={{ color: '#2563EB' }}>{salesperson}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} color="#059669" />
                    <span>2. Construction & Material Specifications</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Stage:</span>{' '}
                      <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                        {houseStage}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Requirements:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{requirements.join(', ') || 'Tiles'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Approx Coverage:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{approxQuantity ? `${approxQuantity} sq.ft` : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: '600' }}>Tile Budget:</span>{' '}
                      <strong style={{ color: '#0F172A' }}>{tileBudget ? `₹${Number(tileBudget).toLocaleString('en-IN')}` : '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              Close
            </button>

            {activeSection === 'timeline' ? (
              <button
                type="button"
                onClick={() => setActiveSection('log')}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
                }}
              >
                <Plus size={14} />
                <span>Log Activity & Update Follow-up</span>
              </button>
            ) : activeSection === 'log' ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveSection('timeline')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Timeline
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedFollowUp}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    backgroundColor: outcome === 'Deal Lost / Postponed' ? '#DC2626' : '#0F766E',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: saving || !selectedFollowUp ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
                  }}
                >
                  <Send size={14} />
                  <span>
                    {saving
                      ? 'Saving...'
                      : outcome === 'Deal Lost / Postponed'
                        ? 'Record Lost Deal'
                        : 'Save & Record Activity'}
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSection('timeline')}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                Return to Timeline
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
