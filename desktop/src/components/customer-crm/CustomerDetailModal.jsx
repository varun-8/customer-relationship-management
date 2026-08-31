import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Phone,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  User,
  Tag,
  DollarSign,
  Clock,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const CustomerDetailModal = ({ customer: initialCustomer, onClose, onEdit, onDelete }) => {
  const { activeForm, updateCustomer } = useCustomer();
  const { appName } = useBranding();
  const [customer, setCustomer] = useState(initialCustomer);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const data = customer?.data instanceof Map
    ? Object.fromEntries(customer.data)
    : (customer?.data || {});

  // Quick Follow-up logging state
  const [followUpStatus, setFollowUpStatus] = useState(data.status || 'Follow-up');
  const [followUpReason, setFollowUpReason] = useState(data.lastReason || '');
  const [followUpNextDate, setFollowUpNextDate] = useState(data.nextFollowUp || '');
  const [followUpOrderValue, setFollowUpOrderValue] = useState(data.orderValue ? String(data.orderValue) : (data.quotationValue ? String(data.quotationValue) : ''));
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!customer) return null;

  const copyToClipboard = (text, type = 'id') => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogFollowUp = async (e) => {
    if (e) e.preventDefault();
    const currentCount = Number(data.followUpCount) || 0;
    const newCount = currentCount + 1;
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedData = {
      ...data,
      status: followUpStatus,
      lastReason: followUpReason.trim(),
      nextFollowUp: followUpNextDate.trim(),
      lastFollowUp: todayStr,
      followUpCount: newCount,
      ...(followUpOrderValue ? { orderValue: Number(followUpOrderValue) } : {}),
    };

    setSubmittingFollowUp(true);
    const res = await updateCustomer(customer._id || customer.customerId, updatedData);
    setSubmittingFollowUp(false);

    if (res && res.success) {
      setSavedSuccess(true);
      setCustomer((prev) => ({
        ...prev,
        data: updatedData,
      }));
      setTimeout(() => setSavedSuccess(false), 3500);
    } else {
      alert(res?.message || 'Failed to update customer follow-up');
    }
  };

  // Helper for formatting requirement categories into pill tags
  const renderRequirementTags = (req) => {
    if (!req) {
      return (
        <span style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '10px' }}>
          🧱 Floor & Wall Tiles
        </span>
      );
    }
    const arr = Array.isArray(req)
      ? req
      : String(req).split(',').map((s) => s.trim()).filter(Boolean);

    const getIcon = (val) => {
      const v = val.toLowerCase();
      if (v.includes('tile')) return '🧱';
      if (v.includes('sanitary') || v.includes('bath')) return '🚿';
      if (v.includes('cp') || v.includes('tap') || v.includes('faucet')) return '🚰';
      if (v.includes('adhesive') || v.includes('grout')) return '🧪';
      return '✨';
    };

    return arr.map((item, idx) => (
      <span
        key={idx}
        style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#059669',
          fontSize: '12.5px',
          fontWeight: '700',
          padding: '5px 14px',
          borderRadius: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{getIcon(item)}</span>
        <span>{item}</span>
      </span>
    ));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Order Confirmed':
      case 'Confirmed':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Order Confirmed', dot: '#16A34A' };
      case 'Negotiation':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Negotiation', dot: '#F59E0B' };
      case 'Quotation':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'Quotation Shared', dot: '#0284C7' };
      case 'Lost':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Lost Opportunity', dot: '#EF4444' };
      case 'Follow-up':
      case 'In Progress':
      default:
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'Active Follow-up', dot: '#2563EB' };
    }
  };

  const statusStyle = getStatusStyle(data.status);
  const waUrl = getWhatsAppUrl(data.phone, data, appName);

  const registeredDateStr = customer.createdAt || customer.entryDate
    ? new Date(customer.createdAt || customer.entryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent';

  const rawQuotationVal = data.quotationValue || data.orderValue || data.tileBudget;
  const quotationValFormatted = rawQuotationVal
    ? `₹${Number(rawQuotationVal).toLocaleString('en-IN')}`
    : '₹2,50,000';

  return (
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        margin: 0,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '960px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.25)',
          margin: 'auto',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '22px 28px 18px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
            {/* Circular Avatar */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '800',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                flexShrink: 0,
              }}
            >
              {(data.customerName || 'C').charAt(0).toUpperCase()}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Title & Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '23px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  {data.customerName || 'Unnamed Customer'}
                </h1>

                {/* ID Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    padding: '3px 9px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  <span>{customer.customerId || 'CUS-000005'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customer.customerId || 'CUS-000005', 'id')}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="Copy Customer ID"
                  >
                    {copiedId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  </button>
                </div>

                {/* Customer Classification Tag */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    backgroundColor: '#FFEDD5',
                    color: '#C2410C',
                    border: '1px solid #FED7AA',
                  }}
                >
                  {data.customerType || 'Building Owner'}
                </span>

                {/* Status Pill */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusStyle.dot }} />
                  {statusStyle.label}
                </span>
              </div>

              {/* Subtitle Details Line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '13px', color: '#64748B', flexWrap: 'wrap', fontWeight: '500' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#64748B" /> {data.location || 'Site Location'}
                </span>
                <span>•</span>
                <span>Registered: <strong style={{ color: '#0F172A', fontWeight: '700' }}>{registeredDateStr}</strong></span>
                <span>•</span>
                <span>Salesperson: <strong style={{ color: '#2563EB', fontWeight: '700' }}>{data.salesperson || 'Unassigned'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  borderRadius: '12px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <Phone size={14} color="#2563EB" />
                <span>Call</span>
              </a>
            )}

            {data.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#15803D',
                  borderRadius: '12px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MessageSquare size={14} color="#15803D" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(customer);
              }}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#334155',
                borderRadius: '12px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Edit3 size={14} color="#64748B" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Main Modal Body (Two-Column Layout) */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* LEAD PROFILE CARD */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  padding: '22px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="#2563EB" />
                  <span>LEAD PROFILE & CONTACT</span>
                </div>

                {/* Section 1: Contact Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Mobile Phone</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      padding: '4px 10px',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' }}>
                      {data.phone || '—'}
                    </span>
                    {data.phone && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(data.phone, 'phone')}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex' }}
                        title="Copy Phone Number"
                      >
                        {copiedPhone ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 2: Classification Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Site / City Location</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.location || '—'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Customer Type</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#C2410C' }}>{data.customerType || 'Building Owner'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Lead Source Channel</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.leadSource || 'Walk-in'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Assigned Sales Rep</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                      {data.salesperson || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* REQUIREMENTS CARD */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  padding: '22px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={16} color="#059669" />
                    <span>PRODUCT REQUIREMENTS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(customer);
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Edit Categories
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {renderRequirementTags(data.requirement || data.requirementType)}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* DEAL SUMMARY CARD */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  padding: '22px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="#EA580C" />
                    <span>DEAL & PIPELINE SUMMARY</span>
                  </div>
                  {data.houseStage && (
                    <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', fontSize: '11.5px', fontWeight: '800', padding: '3px 10px', borderRadius: '12px' }}>
                      🏠 {data.houseStage}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Pipeline Stage</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: statusStyle.text }}>{data.status || 'Follow-up'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Quotation / Deal Value</span>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{quotationValFormatted}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Last Follow-Up Date</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.lastFollowUp || 'Registered Today'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Total Interactions</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.followUpCount || 1} logged logs</span>
                  </div>
                </div>
              </div>

              {/* QUICK LOG & ACTION CARD */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  padding: '22px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#2563EB" />
                  <span>LOG FOLLOW-UP & UPDATE STAGE</span>
                </div>

                {savedSuccess && (
                  <div style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontSize: '12.5px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#15803D" />
                    <span>Follow-up activity recorded & customer stage updated!</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Pipeline Stage Select Pills */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      UPDATE PIPELINE STAGE
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'Follow-up', label: 'Follow-up' },
                        { id: 'Quotation', label: 'Quotation' },
                        { id: 'Negotiation', label: 'Negotiation' },
                        { id: 'Order Confirmed', label: '🥳 Confirmed' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFollowUpStatus(st.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: followUpStatus === st.id ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            backgroundColor: followUpStatus === st.id ? '#EFF6FF' : '#FFFFFF',
                            color: followUpStatus === st.id ? '#1D4ED8' : '#475569',
                            fontSize: '12px',
                            fontWeight: followUpStatus === st.id ? '800' : '600',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        NEXT FOLLOW-UP DATE
                      </label>
                      <input
                        type="date"
                        value={followUpNextDate}
                        onChange={(e) => setFollowUpNextDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '12px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '13px',
                          color: '#0F172A',
                          fontWeight: '600',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        ORDER VALUE (IF BOOKED)
                      </label>
                      <input
                        type="text"
                        placeholder="₹ Order Amount"
                        value={followUpOrderValue}
                        onChange={(e) => setFollowUpOrderValue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '12px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '13px',
                          color: '#0F172A',
                          fontWeight: '600',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      FOLLOW-UP SUMMARY NOTES
                    </label>
                    <textarea
                      placeholder="Add summary notes of discussion, customer preferences, or site visits..."
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        fontSize: '13px',
                        color: '#0F172A',
                        fontWeight: '500',
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Modal Footer Actions Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 28px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#DC2626' }}>Confirm delete record?</span>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) onDelete(customer._id || customer.customerId);
                  onClose();
                }}
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                Yes, Delete Record
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ backgroundColor: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#DC2626',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={14} color="#DC2626" />
              <span>Delete Customer Record</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                border: 'none',
                color: '#475569',
                borderRadius: '12px',
                padding: '11px 22px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleLogFollowUp}
              disabled={submittingFollowUp}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 24px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: submittingFollowUp ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Edit3 size={15} />
              <span>{submittingFollowUp ? 'Saving Changes...' : 'Save & Update Stage'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
