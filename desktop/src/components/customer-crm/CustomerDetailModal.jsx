import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Phone,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Copy,
  Layers,
  FileText,
  Building2,
  IndianRupee,
  Clock,
  Tag,
  MapPin,
  Compass,
  Zap,
  Check,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';

export const CustomerDetailModal = ({ customer: initialCustomer, onClose, onEdit, onDelete }) => {
  const { activeForm, updateCustomer } = useCustomer();
  const { appShortName } = useBranding();
  const [customer, setCustomer] = useState(initialCustomer);
  const [copiedId, setCopiedId] = useState(false);

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      alert(res?.message || 'Failed to update customer follow-up');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Order Confirmed':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Order Confirmed' };
      case 'Negotiation':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Negotiation' };
      case 'Quotation':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'Quotation Shared' };
      case 'Follow-up':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', label: 'Follow-up Active' };
      case 'Lost':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: 'Lost Sale' };
      default:
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF', label: status || 'Lead' };
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Building Owner':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'Mason':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Architect':
        return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' };
      case 'Contractor':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      default:
        return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' };
    }
  };

  const statusBadge = getStatusBadge(data.status);
  const typeBadge = getTypeBadge(data.customerType);

  const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMsg = encodeURIComponent(`Hello ${data.customerName || ''}, greetings from ${appShortName || 'BuildCRM'}! Regarding your requirement for ${data.requirement || 'Tiles & Sanitary Wares'}...`);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '24px 28px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Customer Initial Box */}
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.35)',
                  flexShrink: 0,
                }}
              >
                {(data.customerName || 'C').charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                    {data.customerName || 'Customer Profile'}
                  </h1>

                  {/* Customer ID Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: '#60A5FA',
                    }}
                  >
                    <span>{customer.customerId || 'CUS-LEAD'}</span>
                    <button
                      onClick={() => copyToClipboard(customer.customerId)}
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
                      padding: '3px 10px',
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
                      padding: '3px 10px',
                      borderRadius: '20px',
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.text,
                      border: `1px solid ${statusBadge.border}`,
                    }}
                  >
                    ● {statusBadge.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '12.5px', color: '#94A3B8' }}>
                  {data.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#60A5FA" /> {data.location}
                    </span>
                  )}
                  <span>•</span>
                  <span>Registered: {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>Salesperson: <strong style={{ color: '#F1F5F9' }}>{data.salesperson || 'Showroom Team'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Call, WhatsApp, Close) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {data.phone && (
                <>
                  <a
                    href={`tel:${data.phone}`}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
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
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </>
              )}

              <button
                onClick={onClose}
                className="btn-icon"
                style={{ color: '#94A3B8', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '6px' }}
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
              marginTop: '18px',
            }}
          >
            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>
                Quotation Value
              </div>
              <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#FBBF24', marginTop: '2px' }}>
                {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>
                Tile Budget
              </div>
              <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#60A5FA', marginTop: '2px' }}>
                {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>
                House Construction Stage
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#F1F5F9', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.houseStage || 'Flooring Stage'}
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>
                Total Interactions
              </div>
              <div style={{ fontSize: '16.5px', fontWeight: '800', color: '#4ADE80', marginTop: '2px' }}>
                #{data.followUpCount || 0} Follow-ups
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 2-Column Clean Workspace Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* LEFT COLUMN: Clean Customer & Material Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card 1: Contact & Profile Details */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
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
                    gap: '8px',
                  }}
                >
                  <User size={16} color="#2563EB" />
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Contact & Showroom Lead Profile
                  </h3>
                </div>

                <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Mobile Phone</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {data.phone || '—'}
                      </span>
                      {data.phone && (
                        <a
                          href={`https://wa.me/${fullPhone}?text=${waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            border: '1px solid #86EFAC',
                          }}
                        >
                          WA
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Site / City Location</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.location || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Customer Type</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: typeBadge.text }}>
                      {data.customerType || 'Building Owner'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Lead Source</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.leadSource || 'Walk-in'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
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
                  borderRadius: '12px',
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
                    gap: '8px',
                  }}
                >
                  <Layers size={16} color="#059669" />
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    2. Project Requirements & Material Specs
                  </h3>
                </div>

                <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Tile Requirement</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>
                      {data.requirement || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Approx Quantity</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                      {data.approxQuantity ? `${data.approxQuantity} sq.ft` : '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Sanitary Ware Needs</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.sanitaryRequirement || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Adhesive & Grouts</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.adhesiveRequirement || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Cross-Sell Opportunities</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {data.crossSell || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Follow-up History & 1-Click Action Hub */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card 3: ⚡ Quick Follow-up & Status Update Hub */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #BFDBFE',
                  boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.12)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                        Log Follow-up & Update Stage
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        Updates status, logs call notes, and auto-increments count.
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                    #{data.followUpCount || 0} → Auto #{((Number(data.followUpCount) || 0) + 1)}
                  </span>
                </div>

                {/* Status Selection Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Select Pipeline Stage:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'Quotation',
                      'Negotiation',
                      'Order Confirmed',
                      'Follow-up',
                      'Newly Contacted',
                      'Walk-in',
                      'Lost',
                      'Future Requirement',
                    ].map((st) => {
                      const isSelected = followUpStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFollowUpStatus(st)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #2563EB' : '1px solid var(--border-default)',
                            background: isSelected
                              ? st === 'Order Confirmed'
                                ? '#10B981'
                                : st === 'Lost'
                                ? '#64748B'
                                : '#2563EB'
                              : '#F8FAFC',
                            color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                            fontWeight: isSelected ? '700' : '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {st === 'Order Confirmed' ? '🎉 ' : ''}{st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discussion Notes Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Discussion Notes / Conversation Summary:
                  </label>
                  <textarea
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="e.g. Client visited showroom, selected 2x2 vitrified tiles, requested revised quote by Friday..."
                    rows={2}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      padding: '8px 10px',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>

                {/* Next Scheduled Date */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Next Scheduled Follow-up:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { label: '+2D', days: 2 },
                        { label: '+3D', days: 3 },
                        { label: '+1W', days: 7 },
                        { label: '+2W', days: 14 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            const target = new Date(Date.now() + item.days * 86400000);
                            setFollowUpNextDate(target.toISOString().split('T')[0]);
                          }}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
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
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      padding: '0 10px',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Final Booking Value (if Order Confirmed) */}
                {followUpStatus === 'Order Confirmed' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', marginBottom: '4px' }}>
                      🎉 Final Booking / Order Value (₹):
                    </label>
                    <input
                      type="number"
                      value={followUpOrderValue}
                      onChange={(e) => setFollowUpOrderValue(e.target.value)}
                      placeholder="e.g. 150000"
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1.5px solid #86EFAC',
                        padding: '0 10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogFollowUp}
                  disabled={submittingFollowUp}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '800',
                  }}
                >
                  <Zap size={14} />
                  <span>
                    {submittingFollowUp
                      ? 'Saving Follow-up...'
                      : savedSuccess
                      ? '✓ Follow-up Saved & Synced!'
                      : `Log Follow-up (#${((Number(data.followUpCount) || 0) + 1)}) & Update Status`}
                  </span>
                </button>
              </div>

              {/* Card 4: Latest Discussion & Timeline Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-xs)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Clock size={16} color="#2563EB" />
                  <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Latest Interaction Details
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Last Contacted:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {data.lastFollowUp
                        ? new Date(data.lastFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Newly Registered'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Next Scheduled:</span>
                    <strong style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
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
                        💬 Last Note / Remarks:
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
            padding: '14px 28px',
            borderTop: '1px solid var(--border-default)',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => {
              if (confirm(`Delete customer ${customer.customerId}?`)) {
                onDelete(customer._id);
                onClose();
              }
            }}
            className="btn btn-danger"
            style={{ padding: '7px 16px', fontSize: '13px' }}
          >
            <Trash2 size={15} /> Delete Customer
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="btn btn-primary"
              style={{ padding: '7px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={15} /> Edit Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
