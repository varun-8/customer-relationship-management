import React from 'react';
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
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

const DETAIL_SECTIONS = [
  {
    title: 'Customer & Contact Information',
    icon: User,
    fieldNames: ['customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType'],
  },
  {
    title: 'Project & Product Specifications',
    icon: Layers,
    fieldNames: ['houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement'],
  },
  {
    title: 'Quotation & Financial Pipeline',
    icon: IndianRupee,
    fieldNames: ['quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell'],
  },
  {
    title: 'Follow-up & Interaction History',
    icon: Clock,
    fieldNames: ['nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason'],
  },
];

export const CustomerDetailModal = ({ customer, onClose, onEdit, onDelete }) => {
  const { activeForm } = useCustomer();
  if (!customer) return null;

  const data = customer.data instanceof Map
    ? Object.fromEntries(customer.data)
    : (customer.data || {});

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ${text} to clipboard`);
  };

  const fields = activeForm?.fields || [];
  const fieldMap = new Map(fields.map((f) => [f.name, f]));

  const formatFieldValue = (fieldName, val) => {
    const field = fieldMap.get(fieldName) || { type: typeof val, label: fieldName };

    if (val === undefined || val === null || val === '') {
      return <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Not specified</span>;
    }

    switch (field.type) {
      case 'currency':
        return (
          <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--amber-700)' }}>
            ₹ {Number(val).toLocaleString('en-IN')}
          </span>
        );

      case 'phone':
        return (
          <a
            href={`tel:${val}`}
            style={{
              color: 'var(--primary-700)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              fontWeight: '700',
            }}
          >
            <Phone size={13} /> {val}
          </a>
        );

      case 'checkbox':
        return val ? (
          <span className="badge badge-emerald" style={{ gap: '4px' }}>
            <CheckCircle2 size={12} /> Yes
          </span>
        ) : (
          <span className="badge badge-slate" style={{ gap: '4px' }}>
            <XCircle size={12} /> No
          </span>
        );

      case 'radio':
        return val === 'Yes' ? (
          <span className="badge badge-emerald">Yes</span>
        ) : (
          <span className="badge badge-slate">No</span>
        );

      case 'multiselect':
        return Array.isArray(val) ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'flex-end' }}>
            {val.map((item, idx) => (
              <span key={idx} className="badge badge-emerald" style={{ fontSize: '11px' }}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          String(val)
        );

      case 'date':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)', fontWeight: '600' }}>
            <Calendar size={13} color="var(--text-muted)" />
            {new Date(val).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        );

      default:
        return <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{String(val)}</span>;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Order Confirmed': return 'badge-emerald';
      case 'Negotiation':
      case 'Quotation': return 'badge-amber';
      case 'Follow-up': return 'badge-blue';
      case 'Lost': return 'badge-slate';
      default: return 'badge-purple';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '840px', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--brand-gradient)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                fontWeight: '800',
              }}
            >
              {(data.customerName || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
                  {data.customerName || 'Customer Profile'}
                </h2>
                <span className="badge badge-emerald mono" style={{ fontSize: '12px' }}>
                  {customer.customerId}
                </span>
                <button
                  onClick={() => copyToClipboard(customer.customerId)}
                  className="btn-icon"
                  style={{ padding: '3px' }}
                  title="Copy Customer ID"
                >
                  <Copy size={12} />
                </button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Registered on {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • by {customer.createdBy?.name || 'Staff'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 28px' }}>
          {/* Quick Showroom Status Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px',
              marginBottom: '22px',
            }}
          >
            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Pipeline Status
              </div>
              <div style={{ marginTop: '4px' }}>
                <span className={`badge ${getStatusBadgeClass(data.status)}`}>
                  {data.status || 'Newly Contacted'}
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Quotation Value
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--amber-700)', marginTop: '2px' }}>
                {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Tile Budget
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-700)', marginTop: '2px' }}>
                {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Assigned Salesperson
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {data.salesperson || 'Showroom Team'}
              </div>
            </div>
          </div>

          {/* 4 Categorized Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {DETAIL_SECTIONS.map((sec) => {
              const Icon = sec.icon;

              return (
                <div
                  key={sec.title}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      background: '#F8FAFC',
                      borderBottom: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Icon size={15} color="var(--primary-700)" />
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {sec.title}
                    </h3>
                  </div>

                  <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column' }}>
                    {sec.fieldNames.map((name, idx) => {
                      const field = fieldMap.get(name);
                      const label = field ? field.label : name;
                      const val = data[name];

                      return (
                        <div
                          key={name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 6px',
                            borderBottom: idx < sec.fieldNames.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            gap: '12px',
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {label}
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            {formatFieldValue(name, val)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Showroom Notes */}
          {customer.notes && (
            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--text-muted)" />
                Staff Remarks & Discussion Notes
              </h4>
              <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-primary)', border: '1px solid var(--border-default)', lineHeight: 1.5 }}>
                {customer.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
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
              style={{ padding: '7px 18px', fontSize: '13px' }}
            >
              <Edit3 size={15} /> Edit Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
