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
  Zap,
  Check,
  Sparkles,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  History,
  Tag,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';

export const CustomerDetailModal = ({ customer: initialCustomer, onClose, onEdit, onDelete }) => {
  const { activeForm, updateCustomer } = useCustomer();
  const { appShortName } = useBranding();
  const [customer, setCustomer] = useState(initialCustomer);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const data = customer?.data instanceof Map
    ? Object.fromEntries(customer.data)
    : (customer?.data || {});

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

  const handleLogFollowUp = async () => {
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Order Confirmed':
        return { bg: 'rgba(16, 185, 129, 0.25)', text: '#4ADE80', border: 'rgba(74, 222, 128, 0.4)', dot: '#4ADE80', label: 'Order Confirmed' };
      case 'Negotiation':
        return { bg: 'rgba(245, 158, 11, 0.25)', text: '#FCD34D', border: 'rgba(252, 211, 77, 0.4)', dot: '#FCD34D', label: 'Negotiation' };
      case 'Quotation':
        return { bg: 'rgba(14, 165, 233, 0.25)', text: '#7DD3FC', border: 'rgba(125, 211, 252, 0.4)', dot: '#7DD3FC', label: 'Quotation Shared' };
      case 'Follow-up':
        return { bg: 'rgba(59, 130, 246, 0.25)', text: '#93C5FD', border: 'rgba(147, 197, 253, 0.4)', dot: '#93C5FD', label: 'Follow-up Active' };
      case 'Lost':
        return { bg: 'rgba(100, 116, 139, 0.25)', text: '#CBD5E1', border: 'rgba(148, 163, 184, 0.4)', dot: '#94A3B8', label: 'Lost Sale' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.25)', text: '#C4B5FD', border: 'rgba(196, 181, 253, 0.4)', dot: '#C4B5FD', label: status || 'Newly Contacted' };
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Building Owner':
        return { bg: 'rgba(37, 99, 235, 0.25)', text: '#93C5FD', border: 'rgba(96, 165, 250, 0.4)' };
      case 'Mason':
        return { bg: 'rgba(217, 119, 6, 0.25)', text: '#FDE68A', border: 'rgba(251, 191, 36, 0.4)' };
      case 'Architect':
        return { bg: 'rgba(109, 40, 217, 0.25)', text: '#DDD6FE', border: 'rgba(196, 181, 253, 0.4)' };
      case 'Contractor':
        return { bg: 'rgba(5, 150, 105, 0.25)', text: '#A7F3D0', border: 'rgba(110, 231, 183, 0.4)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.15)', text: '#F1F5F9', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const statusBadge = getStatusBadge(data.status);
  const typeBadge = getTypeBadge(data.customerType);

  const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMsg = encodeURIComponent(`Hello ${data.customerName || ''}, greetings from ${appShortName || 'BuildCRM'}! Regarding your requirement for ${data.requirement || 'Tiles & Sanitary Wares'}...`);

  // Quick conversation note suggestions
  const QUICK_NOTE_SNIPPETS = [
    'Client visited showroom & selected tiles',
    'Shared quotation via WhatsApp',
    'Requested 10% discount on quotation',
    'Site flooring in progress, follow up next week',
    'Payment confirmed, processing order',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '980px',
          width: '95%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #090E1A 0%, #111C38 50%, #1E293B 100%)',
            padding: '24px 28px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
              {/* Customer Initial Box */}
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '800',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  flexShrink: 0,
                }}
              >
                {(data.customerName || 'C').charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {data.customerName || 'Customer Profile'}
                  </h1>

                  {/* Customer ID Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(37, 99, 235, 0.35)',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: '#93C5FD',
                      border: '1px solid rgba(147, 197, 253, 0.4)',
                    }}
                  >
                    <span>{customer.customerId || 'CUS-LEAD'}</span>
                    <button
                      onClick={() => copyToClipboard(customer.customerId, 'id')}
                      style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', padding: '1px', display: 'flex' }}
                      title="Copy Customer ID"
                    >
                      {copiedId ? <Check size={12} color="#4ADE80" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Customer Type */}
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: typeBadge.bg,
                      color: typeBadge.text,
                      border: `1px solid ${typeBadge.border}`,
                    }}
                  >
                    {data.customerType || 'Building Owner'}
                  </span>

                  {/* Pipeline Status */}
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.text,
                      border: `1px solid ${statusBadge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusBadge.dot }} />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#CBD5E1', flexWrap: 'wrap' }}>
                  {data.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#93C5FD', fontWeight: '600' }}>
                      <MapPin size={13} color="#60A5FA" /> {data.location}
                    </span>
                  )}
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                  <span>Registered: <strong style={{ color: '#FFFFFF' }}>{new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                  <span>Salesperson: <strong style={{ color: '#FDE047' }}>{data.salesperson || 'Showroom Team'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Call, WhatsApp, Edit, Close) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {data.phone && (
                <>
                  <a
                    href={`tel:${data.phone}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Phone size={13} />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${fullPhone}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid #34D399',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </>
              )}

              <button
                onClick={() => {
                  onClose();
                  onEdit(customer);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Edit Customer Details"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                onClick={onClose}
                className="btn-icon"
                style={{ color: '#E2E8F0', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '7px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 4 Executive Metric Cards Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginTop: '20px',
            }}
          >
            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quotation Value
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FDE047', marginTop: '3px' }}>
                {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tile Budget
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#93C5FD', marginTop: '3px' }}>
                {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                House Stage
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.houseStage || 'Flooring Stage'}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Interactions
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#86EFAC', marginTop: '3px' }}>
                #{data.followUpCount || 0} Follow-ups
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 2-Column Clean Workspace Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '22px', alignItems: 'start' }}>
            {/* LEFT COLUMN: Customer Specifications & Profile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card 1: Contact & Profile Details */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-xs)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={15} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Contact & Showroom Profile
                    </h3>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                    Showroom CRM
                  </span>
                </div>

                <div style={{ padding: '6px 18px', display: 'flex', flexDirection: 'column' }}>
                  {/* Phone Row with Copy & WA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Mobile Phone</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {data.phone || '—'}
                      </span>
                      {data.phone && (
                        <button
                          onClick={() => copyToClipboard(data.phone, 'phone')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748B', display: 'flex' }}
                          title="Copy Phone Number"
                        >
                          {copiedPhone ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                        </button>
                      )}
                      {data.phone && (
                        <a
                          href={`https://wa.me/${fullPhone}?text=${waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            fontSize: '11px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            border: '1px solid #86EFAC',
                          }}
                        >
                          💬 Chat
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Site / City Location</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.location || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Customer Classification</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: typeBadge.text }}>
                      {data.customerType || 'Building Owner'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Lead Source</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.leadSource || 'Direct Walk-in'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Assigned Salesperson</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>
                      {data.salesperson || 'Showroom Team'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Material & Product Specifications */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-xs)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={15} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Material & Project Specifications
                    </h3>
                  </div>
                </div>

                <div style={{ padding: '6px 18px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Tile Requirements</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>
                      {data.requirement || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Approx Area / Quantity</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                      {data.approxQuantity ? `${data.approxQuantity} sq.ft` : '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Sanitary Ware Needs</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.sanitaryRequirement || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Adhesives & Grouts</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.adhesiveRequirement || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Cross-Sell Opportunities</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.crossSell || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Internal Notes & Delivery Terms */}
              {customer.notes ? (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid var(--border-default)',
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                    📌 Internal Showroom Notes:
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                    {customer.notes}
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT COLUMN: ⚡ Quick Follow-up Action & Stage Update Hub */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card: ⚡ Quick Follow-up Action Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1.5px solid #93C5FD',
                  boxShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.14)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                        Log Follow-up & Stage
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        1-Click update status, discussion notes & next date.
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E40AF', background: '#DBEAFE', padding: '4px 10px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                    #{data.followUpCount || 0} → Auto #{((Number(data.followUpCount) || 0) + 1)}
                  </span>
                </div>

                {savedSuccess && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#047857',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Follow-up logged successfully & count updated!</span>
                  </div>
                )}

                {/* Pipeline Stage Selection Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Select Pipeline Stage:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { name: 'Quotation', color: '#2563EB' },
                      { name: 'Negotiation', color: '#D97706' },
                      { name: 'Order Confirmed', color: '#059669', icon: '🎉' },
                      { name: 'Follow-up', color: '#3B82F6' },
                      { name: 'Newly Contacted', color: '#6366F1' },
                      { name: 'Walk-in', color: '#0284C7' },
                      { name: 'Lost', color: '#475569' },
                      { name: 'Future Requirement', color: '#8B5CF6' },
                    ].map((st) => {
                      const isSelected = followUpStatus === st.name;
                      return (
                        <button
                          key={st.name}
                          type="button"
                          onClick={() => setFollowUpStatus(st.name)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isSelected ? `2px solid ${st.color}` : '1px solid var(--border-default)',
                            background: isSelected ? st.color : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                            fontWeight: isSelected ? '800' : '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? `0 2px 8px ${st.color}44` : 'none',
                          }}
                        >
                          {st.icon ? `${st.icon} ` : ''}{st.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Scheduled Follow-up Date */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Next Scheduled Follow-up:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { label: '+2 Days', days: 2 },
                        { label: '+3 Days', days: 3 },
                        { label: '+1 Week', days: 7 },
                        { label: '+2 Weeks', days: 14 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            const target = new Date(Date.now() + item.days * 86400000);
                            setFollowUpNextDate(target.toISOString().split('T')[0]);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 7px',
                            borderRadius: '5px',
                            border: '1px solid #DBEAFE',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={followUpNextDate}
                    onChange={(e) => setFollowUpNextDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Discussion Notes Input */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Discussion Notes / Call Summary:
                    </label>
                  </div>
                  <textarea
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="Enter notes from call/meeting (e.g. Client agreed on pricing, visiting showroom tomorrow for billing)..."
                    rows={3}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      padding: '10px 12px',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: 1.4,
                    }}
                  />

                  {/* Quick Tag Snippets */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                    {QUICK_NOTE_SNIPPETS.map((snip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFollowUpReason((prev) => (prev ? `${prev} • ${snip}` : snip))}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        + {snip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Booking / Order Value (if Order Confirmed) */}
                {followUpStatus === 'Order Confirmed' && (
                  <div style={{ padding: '12px', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', marginBottom: '4px' }}>
                      🎉 Final Booking / Order Value (₹):
                    </label>
                    <input
                      type="number"
                      value={followUpOrderValue}
                      onChange={(e) => setFollowUpOrderValue(e.target.value)}
                      placeholder="e.g. 250000"
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1.5px solid #059669',
                        padding: '0 10px',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#065F46',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="button"
                  onClick={handleLogFollowUp}
                  disabled={submittingFollowUp}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 20px',
                    fontSize: '13.5px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '800',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <Zap size={16} />
                  <span>
                    {submittingFollowUp
                      ? 'Saving Follow-up to MongoDB...'
                      : savedSuccess
                      ? '✓ Follow-up Saved & Synced!'
                      : `Log Follow-up (#${((Number(data.followUpCount) || 0) + 1)}) & Save Stage`}
                  </span>
                </button>
              </div>

              {/* Card: Latest Interaction Timeline Summary */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-xs)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <History size={16} color="#2563EB" />
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Interaction Timeline Status
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Last Contact Date:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {data.lastFollowUp
                        ? new Date(data.lastFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Newly Registered'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Next Scheduled Date:</span>
                    <strong style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {data.nextFollowUp
                        ? new Date(data.nextFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Not Scheduled'}
                    </strong>
                  </div>

                  {data.lastReason ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        marginTop: '4px',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase', marginBottom: '2px' }}>
                        💬 Latest Discussion Note:
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.45 }}>
                        "{data.lastReason}"
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-default)',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to permanently delete customer ${customer.customerId} (${data.customerName})?`)) {
                onDelete(customer._id);
                onClose();
              }
            }}
            className="btn btn-danger"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={15} /> Delete Customer
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
            >
              <Edit3 size={15} /> Edit Customer Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
