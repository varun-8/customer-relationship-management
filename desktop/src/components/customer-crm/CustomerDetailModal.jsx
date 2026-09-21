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
  Building2,
  User,
  Tag,
  DollarSign,
  Clock,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Layers,
  Compass,
  Lock,
  Package,
  CalendarDays,
  Target,
  History,
  Info,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const CustomerDetailModal = ({ customer: initialCustomer, onClose, onEdit, onDelete }) => {
  const { activeForm, updateCustomer } = useCustomer();
  const { appName } = useBranding();
  const [customer, setCustomer] = useState(initialCustomer);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'timeline' | 'quick_log'
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
  const [followUpOrderValue, setFollowUpOrderValue] = useState(
    data.orderValue ? String(data.orderValue) : (data.quotationValue ? String(data.quotationValue) : '')
  );
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

  const renderRequirementTags = (req) => {
    if (!req) {
      return (
        <span style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
          Tiles
        </span>
      );
    }
    const arr = Array.isArray(req)
      ? req
      : String(req).split(',').map((s) => s.trim()).filter(Boolean);

    return arr.map((item, idx) => (
      <span
        key={idx}
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          color: '#334155',
          fontSize: '12px',
          fontWeight: '700',
          padding: '4px 10px',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#64748B' }} />
        <span>{item}</span>
      </span>
    ));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Order Confirmed':
      case 'Confirmed':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Order Confirmed', dot: '#10B981' };
      case 'Lost':
      case 'LOST':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECDD3', label: 'Lost Opportunity', dot: '#EF4444' };

      default:
        return { bg: '#F8FAFC', text: '#1E293B', border: '#E2E8F0', label: status || 'Active Follow-up', dot: '#475569' };
    }
  };

  const statusStyle = getStatusStyle(data.status);
  const waUrl = getWhatsAppUrl(data.phone, data, appName);

  const rawDate = customer.entryDate || data.entryDate || data.date || customer.createdAt;
  const registeredDateStr = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    const num = Number(val);
    if (isNaN(num) || num === 0) return '₹ 0';
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  const isConfirmed = data.status === 'Order Confirmed' || data.status === 'Confirmed';

  // Parse notes into activity timeline
  const notesStr = customer.notes || data.notes || '';
  const timelineEntries = [];
  if (notesStr) {
    notesStr.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^\[([\d-]+)\]\s*(.*?):\s*(.*)$/);
      if (match) {
        timelineEntries.push({ date: match[1], outcome: match[2], text: match[3] });
      } else {
        timelineEntries.push({ date: '', outcome: 'Discussion Remark', text: trimmed });
      }
    });
    timelineEntries.reverse();
  }

  // Extract dynamic custom fields defined outside standard keys
  const standardFieldKeys = [
    'customerId', 'entryDate', 'date', 'customerName', 'name', 'phone', 'mobileNumber', 'mobilePhone',
    'location', 'city', 'leadSource', 'salesperson', 'customerType',
    'houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'adhesiveRequirement',
    'quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell',
    'nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason', 'notes',
  ];

  const customFields = (activeForm?.fields || []).filter(
    (f) => f.active && !standardFieldKeys.includes(f.name)
  );

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        margin: 0,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '1080px',
          width: '92vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '22px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.35)',
          margin: 'auto',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px 28px 16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
            {/* Circular Avatar */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '800',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                flexShrink: 0,
              }}
            >
              {(data.customerName || 'C').charAt(0).toUpperCase()}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Title & Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  {data.customerName || customer.customerName || 'Unnamed Customer'}
                </h1>

                {/* ID Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#334155',
                  }}
                >
                  <span>{customer.customerId || data.customerId || 'CUS-000000'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customer.customerId || data.customerId, 'id')}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="Copy Customer ID"
                  >
                    {copiedId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  </button>
                </div>

                {/* Customer Classification Tag */}
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {data.customerType || 'Building Owner'}
                </span>

                {/* Status Pill */}
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusStyle.dot }} />
                  {statusStyle.label}
                </span>
              </div>

              {/* Subtitle Details Line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', fontSize: '12.5px', color: '#64748B', flexWrap: 'wrap', fontWeight: '500' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#64748B" /> {data.location || 'Site Location Not Specified'}
                </span>
                <span>•</span>
                <span>Reg: <strong style={{ color: '#0F172A', fontWeight: '700' }}>{registeredDateStr}</strong></span>
                <span>•</span>
                <span>Salesperson: <strong style={{ color: '#0F172A', fontWeight: '700' }}>{data.salesperson || 'Unassigned'}</strong></span>
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
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <Phone size={13} color="#0F172A" />
                <span>Call</span>
              </a>
            )}

            {data.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MessageSquare size={13} color="#15803D" />
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
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Edit3 size={13} color="#64748B" />
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
                width: '34px',
                height: '34px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close Modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* 2. Top Metric Highlights Strip (4 KPI Tiles) */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '12px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <DollarSign size={13} color="#0F172A" />
              <span>QUOTATION VALUE</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>
              {formatCurrency(data.quotationValue)}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
              Date: {data.quotationDate || 'Not specified'}
            </div>
          </div>

          <div style={{ backgroundColor: isConfirmed ? '#ECFDF5' : '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: isConfirmed ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isConfirmed ? '#059669' : '#64748B', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Package size={13} color={isConfirmed ? '#059669' : '#64748B'} />
              <span>ORDER VALUE</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: isConfirmed ? '#059669' : '#64748B', marginTop: '2px' }}>
              {isConfirmed ? formatCurrency(data.orderValue) : 'Pending Confirmation'}
            </div>
            <div style={{ fontSize: '11px', color: isConfirmed ? '#059669' : '#94A3B8', marginTop: '1px', fontWeight: isConfirmed ? '700' : '400' }}>
              {isConfirmed ? '✓ Confirmed Deal' : 'Shown when confirmed'}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Layers size={13} color="#0F172A" />
              <span>TILE BUDGET</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>
              {formatCurrency(data.tileBudget)}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
              Area: {data.approxQuantity ? `${data.approxQuantity} sq.ft` : '—'}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <CalendarDays size={13} color="#0F172A" />
              <span>NEXT FOLLOW-UP</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
              {data.nextFollowUp || 'None Scheduled'}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
              Total Logs: {data.followUpCount || 0} interaction(s)
            </div>
          </div>
        </div>

        {/* 3. Segmented Navigation Tabs */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '8px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeTab === 'details' ? '1px solid #0F172A' : '1px solid transparent',
              backgroundColor: activeTab === 'details' ? '#F1F5F9' : 'transparent',
              color: activeTab === 'details' ? '#0F172A' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={14} color={activeTab === 'details' ? '#0F172A' : '#64748B'} />
            <span>All Details & Specifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeTab === 'timeline' ? '1px solid #0F172A' : '1px solid transparent',
              backgroundColor: activeTab === 'timeline' ? '#F1F5F9' : 'transparent',
              color: activeTab === 'timeline' ? '#0F172A' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <History size={14} color={activeTab === 'timeline' ? '#0F172A' : '#64748B'} />
            <span>Discussion History & Timeline</span>
            {timelineEntries.length > 0 && (
              <span style={{ backgroundColor: activeTab === 'timeline' ? '#0F172A' : '#E2E8F0', color: activeTab === 'timeline' ? '#FFFFFF' : '#475569', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '10px' }}>
                {timelineEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick_log')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: activeTab === 'quick_log' ? '1px solid #0F172A' : '1px solid transparent',
              backgroundColor: activeTab === 'quick_log' ? '#F1F5F9' : 'transparent',
              color: activeTab === 'quick_log' ? '#0F172A' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <Target size={14} color={activeTab === 'quick_log' ? '#0F172A' : '#64748B'} />
            <span>Quick Activity Logger</span>
          </button>
        </div>

        {/* 4. Modal Body Content */}
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* TAB 1: ALL DETAILS & SPECIFICATIONS */}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
              {/* LEFT COLUMN: Section 1 & Section 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* SECTION 1: CONTACT & LEAD PROFILE */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    borderLeft: '5px solid #2563EB',
                    padding: '20px',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E40AF', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="#2563EB" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>Contact & Profile Details</span>
                    </div>
                    <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                      SECTION 1
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer ID</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', fontFamily: 'monospace' }}>
                        {customer.customerId || data.customerId || '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration Date</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                        {data.entryDate || registeredDateStr}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Client Name</span>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                        {data.customerName || customer.customerName || '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mobile Phone</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Site / City Location</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {data.location || '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Type</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', background: '#F8FAFC', padding: '2px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        {data.customerType || 'Building Owner'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lead Source</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {data.leadSource || 'Showroom Walk-in'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Salesperson Assigned</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        {data.salesperson || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PROJECT & MATERIAL SPECIFICATIONS */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    borderLeft: '5px solid #059669',
                    padding: '20px',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#065F46', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={16} color="#059669" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>Project & Material Specs</span>
                    </div>
                    <span style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                      SECTION 2
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>House / Project Stage</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', backgroundColor: '#F8FAFC', padding: '2px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        {data.houseStage || 'Planning'}
                      </span>
                    </div>

                    <div style={{ paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Requirement Categories</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {renderRequirementTags(data.requirement)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approx Coverage Area</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        {data.approxQuantity ? `${data.approxQuantity} sq.ft / units` : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tile Target Budget</span>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                        {formatCurrency(data.tileBudget)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Adhesive / Epoxy Requirement</span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: String(data.adhesiveRequirement).toLowerCase() === 'yes' ? '#ECFDF5' : '#F8FAFC',
                          color: String(data.adhesiveRequirement).toLowerCase() === 'yes' ? '#059669' : '#64748B',
                          border: String(data.adhesiveRequirement).toLowerCase() === 'yes' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        }}
                      >
                        {data.adhesiveRequirement || 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Section 3 & Section 4 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* SECTION 3: QUOTATION & COMMERCIAL DETAILS */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    borderLeft: '5px solid #D97706',
                    padding: '20px',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#92400E', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={16} color="#D97706" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>Quotation & Commercials</span>
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                      SECTION 3
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quotation Shared Value</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                        {formatCurrency(data.quotationValue)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quotation Date</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {data.quotationDate || '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pipeline Status</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: statusStyle.text }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed Order Value</span>
                      <span
                        style={{
                          fontSize: isConfirmed ? '15.5px' : '13px',
                          fontWeight: '800',
                          color: isConfirmed ? '#059669' : '#94A3B8',
                        }}
                      >
                        {isConfirmed ? formatCurrency(data.orderValue) : 'Not Confirmed (Pending)'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Cross-Sell Products</div>
                      {data.crossSell && (Array.isArray(data.crossSell) ? data.crossSell.length > 0 : String(data.crossSell).trim() !== '') ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(Array.isArray(data.crossSell) ? data.crossSell : String(data.crossSell).split(',')).map((cs, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                color: '#334155',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                padding: '3px 9px',
                                borderRadius: '6px',
                              }}
                            >
                              + {String(cs).trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic' }}>None selected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: FOLLOW-UP TRACKING & ACTIVITY */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    borderLeft: '5px solid #7C3AED',
                    padding: '20px',
                    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#5B21B6', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={16} color="#7C3AED" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>Follow-up & Records</span>
                    </div>
                    <span style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid #DDD6FE' }}>
                      SECTION 4
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Follow-up Date</span>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                        {data.nextFollowUp || 'None Scheduled'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Follow-up Date</span>
                        <span style={{ fontSize: '10px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Lock size={9} /> Auto
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {data.lastFollowUp || 'Not yet logged'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Follow-up Interactions Count</span>
                        <span style={{ fontSize: '10px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Lock size={9} /> Auto
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        {data.followUpCount || 0} interaction(s)
                      </span>
                    </div>

                    {data.lastReason && String(data.lastReason).trim() !== '' && (
                      <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.03em' }}>
                          Latest Discussion Remarks / Objective
                        </div>
                        <div style={{ fontSize: '13px', color: '#1E293B', fontWeight: '600', lineHeight: '1.45' }}>
                          {data.lastReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 5: AUDIT & CREATION METADATA */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#64748B" />
                    <span>System Audit & Record Metadata</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                    <div>
                      <span>Created On: </span>
                      <strong style={{ color: '#0F172A' }}>{registeredDateStr}</strong>
                    </div>
                    <div>
                      <span>Created By: </span>
                      <strong style={{ color: '#0F172A' }}>{customer.createdBy?.name || data.salesperson || 'Sales Team'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITY TIMELINE & DISCUSSION HISTORY */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={17} color="#2563EB" />
                  <span>Chronological Follow-up & Discussion Timeline</span>
                </h3>

                {timelineEntries.length > 0 ? (
                  <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px dashed #CBD5E1', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {timelineEntries.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '-31px',
                            top: '2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#0F172A',
                            border: '3px solid #FFFFFF',
                            boxShadow: '0 0 0 1px #0F172A',
                          }}
                        />
                        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>
                              {item.outcome}
                            </span>
                            {item.date && (
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                {item.date}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
                            {item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94A3B8' }}>
                    <MessageSquare size={32} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>No discussion notes logged yet for this client.</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Log an activity in the "Quick Activity Logger" tab to add records to this timeline.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUICK ACTIVITY LOGGER */}
          {activeTab === 'quick_log' && (
            <div style={{ maxWidth: '680px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} color="#0F172A" />
                <span>Record New Follow-up & Discussion Activity</span>
              </div>

              {savedSuccess && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontSize: '13px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#15803D" />
                  <span>Activity logged successfully! Customer record updated.</span>
                </div>
              )}

              <form onSubmit={handleLogFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    PIPELINE STATUS
                  </label>
                  <select
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Lost">Lost</option>
                    <option value="Future Requirement">Future Requirement</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      NEXT FOLLOW-UP DATE
                    </label>
                    <input
                      type="date"
                      value={followUpNextDate}
                      onChange={(e) => setFollowUpNextDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        fontSize: '13px',
                        color: '#0F172A',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ORDER VALUE (IF CONFIRMED)
                    </label>
                    <input
                      type="number"
                      placeholder="₹ Amount"
                      value={followUpOrderValue}
                      onChange={(e) => setFollowUpOrderValue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
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
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    DISCUSSION REMARKS & OBJECTIVE
                  </label>
                  <textarea
                    placeholder="Type key points discussed with customer, objections, sample requests or commitments..."
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: '500',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: '1.5',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFollowUp}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: submittingFollowUp ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                  }}
                >
                  <Send size={15} />
                  <span>{submittingFollowUp ? 'Saving Activity...' : 'Save & Log Activity'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 5. Modal Footer Actions Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '14px 28px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#DC2626' }}>Confirm delete customer record?</span>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) onDelete(customer._id || customer.customerId);
                  onClose();
                }}
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
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
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Trash2 size={14} color="#DC2626" />
              <span>Delete Customer Record</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(customer);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Edit3 size={14} />
              <span>Edit Full Customer Profile</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
