import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileX,
  Calendar,
  Phone,
  User,
  Building2,
  Tag,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Edit2,
  RotateCcw,
  IndianRupee,
  Layers,
} from 'lucide-react';

export const LostSaleDetailModal = ({ record, onClose, onEdit, onReopen }) => {
  if (!record) return null;

  const isWinBack = record.status === 'win_back';
  const initial = (record.customerName || 'C').charAt(0).toUpperCase();

  const prods = (Array.isArray(record.requirements) && record.requirements.length > 0)
    ? record.requirements
    : (Array.isArray(record.products) && record.products.length > 0 ? record.products : []);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAFB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '15px',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  {record.customerName}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {record.customerType || record.customerRef?.customerType || 'Direct Client'}
                </span>
                {isWinBack ? (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: '#ECFDF5',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                    Win-Back Opportunity
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      color: '#64748B',
                      border: '1px solid #E2E8F0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                    Lost Deal
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {record.customerId && (
                  <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>
                    #{record.customerId}
                  </span>
                )}
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} color="#94A3B8" />
                  Logged on {formatDateLabel(record.dateString)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 4 Financial Highlight Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {/* Quote Value */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quote Value
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                ₹{(record.quoteValue || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Competitor Showroom */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Winning Rival
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {record.competitor || 'Local Dealer'}
              </div>
            </div>

            {/* Competitor Price */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rival Price
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#334155', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {record.competitorPrice > 0 ? `₹${record.competitorPrice.toLocaleString('en-IN')}` : 'Not Disclosed'}
              </div>
            </div>

            {/* Price Gap */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: record.priceDifference > 0 ? '#FEF2F2' : '#F8FAFC',
                border: record.priceDifference > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: record.priceDifference > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Price Undercut
              </div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: '800',
                  color: record.priceDifference > 0 ? '#DC2626' : '#64748B',
                  marginTop: '4px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {record.priceDifference > 0
                  ? `-₹${record.priceDifference.toLocaleString('en-IN')} (${record.priceDiffPercentage}%)`
                  : 'None'}
              </div>
            </div>
          </div>

          {/* Primary Lost Reason Callout Box (Core Focus) */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderLeft: '4px solid #0F172A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <AlertCircle size={14} color="#0F172A" />
              <span>Primary Reason for Loss</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '8px' }}>
              {record.lostReason}
            </div>

            {record.notes && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Executive Remarks & Intel
                </div>
                <div style={{ fontSize: '13px', color: '#334155', marginTop: '5px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {record.notes}
                </div>
              </div>
            )}
          </div>

          {/* Details Grid: Customer & Representative */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              padding: '16px 18px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Sales Executive
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: '700',
                  }}
                >
                  {(record.salesperson || 'S').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                  {record.salesperson}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Contact Phone
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '13.5px', fontWeight: '600', color: '#0F172A' }}>
                <Phone size={13} color="#64748B" />
                <span>{record.phone || 'Not Provided'}</span>
              </div>
            </div>
          </div>

          {/* Quoted Categories / Products */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Quoted Product Categories
            </div>
            {prods.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {prods.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '600',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>No specific products tagged.</span>
            )}
          </div>

          {/* Win-Back History (if applicable) */}
          {isWinBack && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#047857' }}>
                <CheckCircle2 size={14} />
                <span>Reopened as Win-Back Opportunity</span>
              </div>
              {record.winBackNotes && (
                <div style={{ fontSize: '12.5px', color: '#065F46', marginTop: '6px', lineHeight: '1.4' }}>
                  {record.winBackNotes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAFB',
          }}
        >
          <div>
            {!isWinBack && onReopen && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReopen(record);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #A7F3D0',
                  background: '#ECFDF5',
                  color: '#047857',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#047857';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ECFDF5';
                  e.currentTarget.style.color = '#047857';
                }}
              >
                <RotateCcw size={13} />
                <span>Reopen as Win-Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Edit2 size={13} />
              <span>Edit Record</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '700',
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

  return createPortal(modalContent, document.body);
};
