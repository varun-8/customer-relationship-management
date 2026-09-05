import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Phone,
  Calendar,
  User,
  CheckCircle2,
  Copy,
  Layers,
  Building2,
  IndianRupee,
  Clock,
  MapPin,
  Check,
  Sparkles,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const CustomerDetailModal = ({ customer: initialCustomer, onClose, onEdit, onDelete }) => {
  const { activeForm, updateCustomer } = useCustomer();
  const { appShortName, appName } = useBranding();
  const [customer, setCustomer] = useState(initialCustomer);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const data = customer?.data instanceof Map
    ? Object.fromEntries(customer.data)
    : (customer?.data || {});

  const standardFieldKeys = [
    'customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType',
    'houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement',
    'quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell',
    'nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason',
  ];

  const activeFields = (activeForm?.fields || []).filter((f) => f.active);
  const customFields = activeFields.filter((f) => !standardFieldKeys.includes(f.name));

  // Quick Follow-up logging state
  const [followUpStatus, setFollowUpStatus] = useState(data.status || 'Follow-up');
  const [followUpReason, setFollowUpReason] = useState(data.lastReason || '');
  const [followUpNextDate, setFollowUpNextDate] = useState(data.nextFollowUp || '');
  const [followUpOrderValue, setFollowUpOrderValue] = useState(data.orderValue ? String(data.orderValue) : '');
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

  // Helper for formatting requirements neatly
  const formatRequirement = (req) => {
    if (!req) return 'Tiles & Sanitary';
    if (Array.isArray(req)) return req.join(', ');
    if (typeof req === 'string') {
      // Split concatenated camelCase/words if needed
      return req.replace(/([a-z])([A-Z])/g, '$1, $2').replace(/,/g, ', ');
    }
    return String(req);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Order Confirmed':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Order Confirmed' };
      case 'Negotiation':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Negotiation Stage' };
      case 'Quotation':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'Quotation Shared' };
      case 'Follow-up':
      case 'In Progress':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'Active Follow-up' };
      case 'Lost':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECDD3', label: 'Deal Lost' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', label: status || 'Registered' };
    }
  };

  const statusStyle = getStatusStyle(data.status);
  const waUrl = getWhatsAppUrl(data.phone, data, appName);

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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '1020px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.4)',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Banner */}
        <div
          style={{
            backgroundColor: '#0F172A',
            padding: '22px 28px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '900',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                flexShrink: 0,
              }}
            >
              {(data.customerName || 'C').charAt(0).toUpperCase()}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                  {data.customerName || 'Customer Lead Profile'}
                </h1>

                {/* Customer ID Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(30, 58, 138, 0.6)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <span>{customer.customerId || 'CUS-LEAD'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customer.customerId, 'id')}
                    style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="Copy Customer ID"
                  >
                    {copiedId ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                  </button>
                </div>

                {/* Classification Pill */}
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
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
                    borderRadius: '12px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                  }}
                >
                  {statusStyle.label}
                </span>
              </div>

              {/* Subtitle Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12.5px', color: '#94A3B8', flexWrap: 'wrap' }}>
                {data.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#60A5FA', fontWeight: '600' }}>
                    <MapPin size={13} /> {data.location}
                  </span>
                )}
                <span>•</span>
                <span>Registered: <strong style={{ color: '#E2E8F0' }}>{new Date(customer.createdAt || customer.entryDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                <span>•</span>
                <span>Sales Rep: <strong style={{ color: '#FBBF24' }}>{data.salesperson || 'Showroom Staff'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {data.phone && (
              <>
                <a
                  href={`tel:${data.phone}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Phone size={14} color="#60A5FA" />
                  <span>Call</span>
                </a>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <span>💬 WhatsApp</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(147, 197, 253, 0.3)',
                color: '#93C5FD',
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
              <Edit3 size={14} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#94A3B8',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards Strip (4 Metrics) */}
        <div style={{ backgroundColor: '#F8FAFC', padding: '16px 28px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {/* Quotation Value */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quotation Value
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '3px' }}>
                ₹{(Number(data.quotationValue) || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {data.quotationDate ? `Shared ${data.quotationDate}` : 'Quotation Estimate'}
              </div>
            </div>

            {/* Tile Budget */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tile Budget & Area
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB', marginTop: '3px' }}>
                ₹{(Number(data.tileBudget) || Number(data.quotationValue) || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {data.approxQuantity || 'Est. area'}
              </div>
            </div>

            {/* Site Stage */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Site Construction Stage
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#D97706', marginTop: '3px' }}>
                {data.houseStage || 'Planning'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Project Timeline Stage
              </div>
            </div>

            {/* Total Interactions */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Interactions Logged
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#7C3AED', marginTop: '3px' }}>
                #{data.followUpCount || 1} Calls/Visits
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {data.lastFollowUp ? `Last ${data.lastFollowUp}` : 'Active Lead'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Modal Body (Two Columns) */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* LEFT COLUMN: Lead Profile & Material Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Contact & Lead Profile Card */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Contact & Lead Profile</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '8px' }}>
                    Showroom Lead
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Mobile Phone</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' }}>{data.phone || 'N/A'}</span>
                      {data.phone && (
                        <button type="button" onClick={() => copyToClipboard(data.phone, 'phone')} style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 0 }} title="Copy Phone Number">
                          {copiedPhone ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Site / City Location</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.location || 'Madurai'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Classification</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#0F172A', padding: '2px 8px', borderRadius: '6px' }}>{data.customerType || 'Building Owner'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Lead Source Channel</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>{data.leadSource || 'Direct Walk-in'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Assigned Sales Rep</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>● {data.salesperson || 'Showroom Team'}</span>
                  </div>
                </div>
              </div>

              {/* Material & Specifications Card */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Material & Project Specifications</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '8px' }}>
                    Showroom Quote
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Tile Requirements</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#059669' }}>{formatRequirement(data.requirement)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Approx Floor Area</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.approxQuantity || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Sanitary Requirement</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: data.sanitaryRequirement === 'Yes' ? '#DCFCE7' : '#F1F5F9', color: data.sanitaryRequirement === 'Yes' ? '#15803D' : '#64748B', padding: '2px 8px', borderRadius: '6px' }}>
                      {data.sanitaryRequirement || 'No'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Tile Adhesive & Grout</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: data.adhesiveRequirement === 'Yes' ? '#DCFCE7' : '#F1F5F9', color: data.adhesiveRequirement === 'Yes' ? '#15803D' : '#64748B', padding: '2px 8px', borderRadius: '6px' }}>
                      {data.adhesiveRequirement || 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Commercial Summary & Follow-up Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Commercial & Deal Summary */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Commercial & Deal Summary</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: '8px' }}>
                    Financials
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Pipeline Stage</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, padding: '2px 10px', borderRadius: '10px' }}>
                      {data.status || 'Follow-up'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Quotation Shared</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>₹{(Number(data.quotationValue) || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Quotation Date</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{data.quotationDate || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Total Interactions</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>{data.followUpCount || 1} calls/meetings</span>
                  </div>
                </div>
              </div>

              {/* Quick Log Follow-up & Pipeline Stage */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1.5px solid #BFDBFE', padding: '20px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#2563EB" />
                    Quick Log Follow-up & Stage
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '8px' }}>
                    1-Click Update
                  </span>
                </div>

                {savedSuccess && (
                  <div style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontSize: '12.5px', fontWeight: '700', marginBottom: '12px' }}>
                    ✓ Follow-up activity saved & lead status updated!
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      SELECT PIPELINE STAGE
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {['Follow-up', 'Quotation', 'Negotiation', 'Order Confirmed'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFollowUpStatus(st)}
                          style={{
                            padding: '7px 4px',
                            borderRadius: '8px',
                            border: followUpStatus === st ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                            backgroundColor: followUpStatus === st ? '#EFF6FF' : '#FFFFFF',
                            color: followUpStatus === st ? '#1D4ED8' : '#475569',
                            fontSize: '11.5px',
                            fontWeight: followUpStatus === st ? '800' : '600',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          {st === 'Order Confirmed' ? '🎉 Confirmed' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        NEXT FOLLOW-UP DATE
                      </label>
                      <input
                        type="date"
                        value={followUpNextDate}
                        onChange={(e) => setFollowUpNextDate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12.5px', color: '#0F172A' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        ORDER VALUE (IF BOOKED)
                      </label>
                      <input
                        type="number"
                        placeholder="₹ Order Amount"
                        value={followUpOrderValue}
                        onChange={(e) => setFollowUpOrderValue(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12.5px', color: '#0F172A' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      CALL / MEETING NOTES
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spoke with client, requested 5% discount on sanitary setup"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12.5px', color: '#0F172A' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleLogFollowUp}
                    disabled={submittingFollowUp}
                    style={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <Send size={14} />
                    <span>{submittingFollowUp ? 'Saving...' : 'Save Follow-up Update'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Footer Actions */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 28px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#991B1B' }}>Confirm delete this customer lead?</span>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) onDelete(customer._id || customer.customerId);
                  onClose();
                }}
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', color: '#991B1B', borderRadius: '10px', padding: '9px 16px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} />
              <span>Delete Customer</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#F1F5F9', border: 'none', color: '#475569', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
            >
              <Edit3 size={15} />
              <span>Edit Customer Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
