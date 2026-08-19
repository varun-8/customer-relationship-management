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
  Compass,
  FileText,
  BadgePercent,
  CheckCircle,
  AlertCircle,
  Send,
  CornerDownRight,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';

export const CustomerDetailModal = ({ customer: initialCustomer, onClose, onEdit, onDelete }) => {
  const { activeForm, updateCustomer } = useCustomer();
  const { appShortName, appName } = useBranding();
  const [customer, setCustomer] = useState(initialCustomer);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Order Confirmed':
        return {
          bg: 'rgba(16, 185, 129, 0.25)',
          text: '#34D399',
          border: 'rgba(52, 211, 153, 0.4)',
          dot: '#10B981',
          label: 'Order Confirmed',
          icon: '🎉',
        };
      case 'Negotiation':
        return {
          bg: 'rgba(245, 158, 11, 0.25)',
          text: '#FCD34D',
          border: 'rgba(252, 211, 77, 0.4)',
          dot: '#F59E0B',
          label: 'Negotiation Stage',
          icon: '🤝',
        };
      case 'Quotation':
        return {
          bg: 'rgba(14, 165, 233, 0.25)',
          text: '#7DD3FC',
          border: 'rgba(125, 211, 252, 0.4)',
          dot: '#0EA5E9',
          label: 'Quotation Shared',
          icon: '📄',
        };
      case 'Follow-up':
        return {
          bg: 'rgba(59, 130, 246, 0.25)',
          text: '#93C5FD',
          border: 'rgba(147, 197, 253, 0.4)',
          dot: '#3B82F6',
          label: 'Active Follow-up',
          icon: '📞',
        };
      case 'Lost':
        return {
          bg: 'rgba(100, 116, 139, 0.25)',
          text: '#CBD5E1',
          border: 'rgba(148, 163, 184, 0.4)',
          dot: '#94A3B8',
          label: 'Lost Sale',
          icon: '✕',
        };
      default:
        return {
          bg: 'rgba(139, 92, 246, 0.25)',
          text: '#C4B5FD',
          border: 'rgba(196, 181, 253, 0.4)',
          dot: '#8B5CF6',
          label: status || 'Newly Contacted',
          icon: '✨',
        };
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Building Owner':
        return { bg: 'rgba(37, 99, 235, 0.22)', text: '#93C5FD', border: 'rgba(96, 165, 250, 0.4)', icon: '🏠' };
      case 'Mason':
        return { bg: 'rgba(217, 119, 6, 0.22)', text: '#FDE68A', border: 'rgba(251, 191, 36, 0.4)', icon: '🧱' };
      case 'Architect':
        return { bg: 'rgba(124, 58, 237, 0.22)', text: '#DDD6FE', border: 'rgba(196, 181, 253, 0.4)', icon: '📐' };
      case 'Contractor':
        return { bg: 'rgba(5, 150, 105, 0.22)', text: '#A7F3D0', border: 'rgba(110, 231, 183, 0.4)', icon: '👷' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.15)', text: '#F1F5F9', border: 'rgba(255, 255, 255, 0.2)', icon: '👤' };
    }
  };

  const statusBadge = getStatusBadge(data.status);
  const typeBadge = getTypeBadge(data.customerType);

  const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMsg = encodeURIComponent(
    `Hello ${data.customerName || ''}!\n\nThank you for visiting *${appName || 'Vasantham CRM'}*.\nRegarding your requirements for *${data.requirement || 'Tiles & Sanitary Wares'}*...\nFeel free to reach us. Have a great day!`
  );

  const QUICK_NOTE_SNIPPETS = [
    'Client visited showroom & selected tiles',
    'Shared quotation via WhatsApp',
    'Negotiating 5-10% discount on quotation',
    'Flooring stage in progress, follow up next week',
    'Payment confirmed, processing order delivery',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '1020px',
          width: '95%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            1. TOP HERO BANNER: Sleek Dark Mesh Gradient + KPI Cards
           ========================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, #090E1D 0%, #0F1D38 45%, #182747 100%)',
            padding: '24px 28px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            position: 'relative',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '20%',
              width: '260px',
              height: '180px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Identity Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Left: Avatar + Customer Title + Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
              {/* Glossy Avatar with Gradient Border */}
              <div
                style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  fontWeight: '900',
                  boxShadow: '0 10px 25px rgba(37, 99, 235, 0.45)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  flexShrink: 0,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {(data.customerName || 'C').charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1
                    style={{
                      fontSize: '23px',
                      fontWeight: '900',
                      margin: 0,
                      letterSpacing: '-0.02em',
                      color: '#FFFFFF',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {data.customerName || 'Customer Profile'}
                  </h1>

                  {/* Customer ID Pill with Copy */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(30, 58, 138, 0.55)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    <span>{customer.customerId || 'CUS-LEAD'}</span>
                    <button
                      onClick={() => copyToClipboard(customer.customerId, 'id')}
                      style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: '1px', display: 'flex' }}
                      title="Copy Customer ID"
                    >
                      {copiedId ? <Check size={13} color="#4ADE80" /> : <Copy size={13} />}
                    </button>
                  </div>

                  {/* Classification Tag */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: typeBadge.bg,
                      color: typeBadge.text,
                      border: `1px solid ${typeBadge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{typeBadge.icon}</span>
                    <span>{data.customerType || 'Building Owner'}</span>
                  </span>

                  {/* Pipeline Status Tag */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.text,
                      border: `1px solid ${statusBadge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: statusBadge.dot,
                        boxShadow: `0 0 8px ${statusBadge.dot}`,
                      }}
                    />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>

                {/* Subtitle / Metadata Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '13px', color: '#CBD5E1', flexWrap: 'wrap' }}>
                  {data.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#93C5FD', fontWeight: '700' }}>
                      <MapPin size={14} color="#60A5FA" /> {data.location}
                    </span>
                  )}
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} color="#94A3B8" /> Registered:{' '}
                    <strong style={{ color: '#F1F5F9' }}>
                      {new Date(customer.createdAt || customer.entryDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} color="#FDE047" /> Sales Rep:{' '}
                    <strong style={{ color: '#FDE047' }}>{data.salesperson || 'Showroom Team'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Header Actions (Call, WhatsApp, Edit, Close) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {data.phone && (
                <>
                  <a
                    href={`tel:${data.phone}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Call Customer Directly"
                  >
                    <Phone size={14} color="#93C5FD" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${fullPhone}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '900',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid #34D399',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
                    }}
                    title="Open WhatsApp Chat"
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
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.25)',
                  color: '#93C5FD',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  border: '1px solid rgba(147, 197, 253, 0.35)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                title="Edit Customer Details"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>

              <button
                onClick={onClose}
                className="btn-icon"
                style={{
                  color: '#CBD5E1',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 4 Executive Metric Hero Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginTop: '22px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Metric 1: Quotation Value */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quotation Value
                </span>
                <IndianRupee size={14} color="#FDE047" />
              </div>
              <div style={{ fontSize: '19px', fontWeight: '900', color: '#FDE047', marginTop: '4px', letterSpacing: '-0.01em' }}>
                {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                {data.quotationDate ? `Shared ${data.quotationDate}` : 'Shared Quote'}
              </div>
            </div>

            {/* Metric 2: Tile / Material Budget */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tile Budget
                </span>
                <Layers size={14} color="#60A5FA" />
              </div>
              <div style={{ fontSize: '19px', fontWeight: '900', color: '#93C5FD', marginTop: '4px', letterSpacing: '-0.01em' }}>
                {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                {data.approxQuantity ? `${data.approxQuantity} sq.ft area` : 'Client Target'}
              </div>
            </div>

            {/* Metric 3: Construction / House Stage */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Site Stage
                </span>
                <Building2 size={14} color="#34D399" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#6EE7B7', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.houseStage || 'Flooring Stage'}
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                Project Timeline
              </div>
            </div>

            {/* Metric 4: Follow-up Activity */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Interactions
                </span>
                <Clock size={14} color="#C084FC" />
              </div>
              <div style={{ fontSize: '19px', fontWeight: '900', color: '#DDD6FE', marginTop: '4px' }}>
                #{data.followUpCount || 0} Calls/Visits
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                {data.lastFollowUp ? `Last ${data.lastFollowUp}` : 'New Registration'}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            2. MODAL BODY: 2-Column Responsive Workspace Grid
           ========================================================= */}
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: '22px', alignItems: 'start' }}>
            
            {/* =========================================================
                LEFT COLUMN: Specifications & Showroom Profile
               ========================================================= */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Card 1: Contact & Showroom Lead Profile */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={15} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Contact & Lead Profile
                    </h3>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                    Showroom Lead
                  </span>
                </div>

                <div style={{ padding: '4px 18px', display: 'flex', flexDirection: 'column' }}>
                  {/* Phone Row with Copy & WhatsApp Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="#94A3B8" /> Mobile Phone
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' }}>
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
                            fontSize: '11.5px',
                            fontWeight: '800',
                            textDecoration: 'none',
                            border: '1px solid #86EFAC',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          💬 Chat
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Location Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#94A3B8" /> Site / City Location
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                      {data.location || '—'}
                    </span>
                  </div>

                  {/* Customer Type Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={13} color="#94A3B8" /> Classification
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                      }}
                    >
                      {data.customerType || 'Building Owner'}
                    </span>
                  </div>

                  {/* Lead Source Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={13} color="#94A3B8" /> Lead Source
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#F8FAFC',
                        color: '#334155',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {data.leadSource || 'Direct Walk-in'}
                    </span>
                  </div>

                  {/* Salesperson Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={13} color="#94A3B8" /> Assigned Rep
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
                      {data.salesperson || 'Showroom Team'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Material & Product Specifications */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                    borderBottom: '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={15} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#065F46', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Material & Project Specifications
                    </h3>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', background: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                    Showroom Quote
                  </span>
                </div>

                <div style={{ padding: '4px 18px', display: 'flex', flexDirection: 'column' }}>
                  {/* Tile Requirements */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Tile Requirements</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', maxWidth: '60%', textAlign: 'right' }}>
                      {data.requirement || '—'}
                    </span>
                  </div>

                  {/* Approx Area */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Approx Area / Qty</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                      {data.approxQuantity ? `${data.approxQuantity} sq.ft` : '—'}
                    </span>
                  </div>

                  {/* Sanitary Ware Needs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Sanitary Ware Needs</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', maxWidth: '60%', textAlign: 'right' }}>
                      {data.sanitaryRequirement || '—'}
                    </span>
                  </div>

                  {/* Adhesives & Grouts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Adhesive & Grouts</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', maxWidth: '60%', textAlign: 'right' }}>
                      {data.adhesiveRequirement || '—'}
                    </span>
                  </div>

                  {/* Cross-Sell Opportunities */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Cross-Sell Items</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                      {data.crossSell || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Dynamic Custom Schema Fields (Added in Form Builder) */}
              {customFields.length > 0 ? (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 18px',
                      background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                      borderBottom: '1px solid #E9D5FF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tag size={15} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#6B21A8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Custom Specifications & Form Fields
                    </h3>
                  </div>

                  <div style={{ padding: '4px 18px', display: 'flex', flexDirection: 'column' }}>
                    {customFields.map((cf, idx) => {
                      const val = data[cf.name];
                      let displayVal = '—';
                      if (val !== undefined && val !== null && val !== '') {
                        if (cf.type === 'checkbox') {
                          displayVal = val ? '✓ Yes' : '✕ No';
                        } else if (cf.type === 'currency') {
                          displayVal = `₹ ${Number(val).toLocaleString('en-IN')}`;
                        } else if (Array.isArray(val)) {
                          displayVal = val.join(', ');
                        } else {
                          displayVal = String(val);
                        }
                      }

                      return (
                        <div
                          key={cf.id || cf.name}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '11px 0',
                            borderBottom: idx < customFields.length - 1 ? '1px solid #F1F5F9' : 'none',
                          }}
                        >
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{cf.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', maxWidth: '60%', textAlign: 'right' }}>
                            {displayVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Card 4: Internal Showroom Remarks */}
              {customer.notes ? (
                <div
                  style={{
                    background: '#FFFBEB',
                    borderRadius: '14px',
                    border: '1px solid #FDE68A',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: '900', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📌 Internal Showroom Notes:
                  </div>
                  <div style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{customer.notes}"
                  </div>
                </div>
              ) : null}
            </div>

            {/* =========================================================
                RIGHT COLUMN: Commercial & Follow-up Actions
               ========================================================= */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Card 1: 💰 Commercial & Deal Summary */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    borderBottom: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IndianRupee size={15} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1E40AF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Commercial & Deal Summary
                    </h3>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#1D4ED8', background: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #93C5FD' }}>
                    Financials
                  </span>
                </div>

                <div style={{ padding: '6px 18px', display: 'flex', flexDirection: 'column' }}>
                  {/* Status Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Pipeline Status</span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '800',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                      }}
                    >
                      {data.status || 'Active Lead'}
                    </span>
                  </div>

                  {/* Quotation Shared */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Quotation Shared</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                      ₹ {Number(data.quotationValue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Confirmed Order Value (if applicable) */}
                  {data.orderValue ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9', background: '#F0FDF4', margin: '0 -18px', paddingLeft: '18px', paddingRight: '18px' }}>
                      <span style={{ fontSize: '13px', color: '#15803D', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle size={14} color="#16A34A" /> Confirmed Order Value
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#15803D' }}>
                        ₹ {Number(data.orderValue).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : null}

                  {/* Quotation Date */}
                  {data.quotationDate ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Quotation Date</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                        {data.quotationDate}
                      </span>
                    </div>
                  ) : null}

                  {/* Total Interactions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Total Interactions</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>
                      {data.followUpCount || 0} calls/meetings
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: ⚡ Interactive Quick Follow-up Logger */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px solid #BFDBFE',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#FDE047" />
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Quick Log Follow-up & Stage
                    </h3>
                  </div>

                  {savedSuccess ? (
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#4ADE80', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ Updated Live!
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#BFDBFE', fontWeight: '700' }}>
                      1-Click Update
                    </span>
                  )}
                </div>

                <form onSubmit={handleLogFollowUp} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Pipeline Stage Buttons */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      Select Pipeline Stage
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['Follow-up', 'Quotation', 'Negotiation', 'Order Confirmed', 'Lost'].map((st) => {
                        const isSelected = followUpStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFollowUpStatus(st)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '7px',
                              fontSize: '11.5px',
                              fontWeight: isSelected ? '800' : '600',
                              border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                              background: isSelected ? '#EFF6FF' : '#F8FAFC',
                              color: isSelected ? '#1D4ED8' : '#64748B',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {st === 'Order Confirmed' ? '🎉 Confirmed' : st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Snippet Chips */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px', display: 'block' }}>
                      Quick Discussion Remarks:
                    </label>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {QUICK_NOTE_SNIPPETS.map((snip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFollowUpReason(snip)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            color: '#334155',
                            fontSize: '10.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          + {snip}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      style={{ fontSize: '12.5px', width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', resize: 'vertical' }}
                      placeholder="Enter follow-up conversation notes, requirements or customer feedback..."
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                    />
                  </div>

                  {/* Next Follow-up Date & Order Value Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                        Next Follow-up Date
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ fontSize: '12px', padding: '6px 8px', width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        value={followUpNextDate}
                        onChange={(e) => setFollowUpNextDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                        {followUpStatus === 'Order Confirmed' ? 'Confirmed Order (₹)' : 'Expected Value (₹)'}
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ fontSize: '12px', padding: '6px 8px', width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: '700' }}
                        placeholder="e.g. 150000"
                        value={followUpOrderValue}
                        onChange={(e) => setFollowUpOrderValue(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit Update Button */}
                  <button
                    type="submit"
                    disabled={submittingFollowUp}
                    style={{
                      marginTop: '4px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: savedSuccess ? '#10B981' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {submittingFollowUp ? (
                      <span>Saving to Atlas...</span>
                    ) : savedSuccess ? (
                      <>
                        <Check size={16} />
                        <span>✓ Follow-up Saved!</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Save Follow-up & Stage</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Card 3: Interaction Timeline Status */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <History size={16} color="#2563EB" />
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Interaction Timeline Status
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Last Contact Date:</span>
                    <strong style={{ color: '#0F172A' }}>
                      {data.lastFollowUp
                        ? new Date(data.lastFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Newly Registered'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Next Scheduled Date:</span>
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

        {/* =========================================================
            3. MODAL FOOTER
           ========================================================= */}
        <div
          className="modal-footer"
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #E2E8F0',
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
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFF1F2',
              color: '#E11D48',
              border: '1px solid #FECDD3',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={15} /> Delete Customer
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '8px', fontWeight: '700' }}
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="btn btn-primary"
              style={{
                padding: '8px 22px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '800',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Edit3 size={15} /> Edit Customer Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
