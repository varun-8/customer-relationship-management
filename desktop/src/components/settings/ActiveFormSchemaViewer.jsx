import React, { useState } from 'react';
import {
  Layers,
  CheckCircle,
  Eye,
  Edit3,
  Check,
  Sparkles,
  Calendar,
  Hash,
  Phone,
  MapPin,
  IndianRupee,
  Sliders,
  FileText,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { FormBuilderView } from '../form-builder/FormBuilderView';

export const ActiveFormSchemaViewer = ({ activeForm }) => {
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'builder'

  const rawFields = activeForm?.fields || [];
  const fields = rawFields.filter((f, idx, self) => self.findIndex((x) => x.name === f.name) === idx);
  const activeFields = fields.filter((f) => f.active);
  const requiredCount = activeFields.filter((f) => f.required).length;
  const optionalCount = activeFields.length - requiredCount;

  // Group fields logically for showroom clarity
  const getFieldCategory = (f) => {
    const name = (f.name || '').toLowerCase();
    if (['customerid', 'entrydate', 'customername', 'phone', 'location', 'customertype'].some((k) => name.includes(k))) {
      return '👤 1. Customer Identity & Contact';
    }
    if (['salesperson', 'leadsource', 'product', 'brand', 'category', 'subcategory'].some((k) => name.includes(k))) {
      return '💼 2. Sales Assignment & Requirements';
    }
    if (['size', 'sqft', 'squarefeet', 'delivery', 'urgency'].some((k) => name.includes(k))) {
      return '📐 3. Sizing & Project Timelines';
    }
    if (['budget', 'quotation', 'price', 'payment', 'value', 'order'].some((k) => name.includes(k))) {
      return '💰 4. Quotation, Budget & Financials';
    }
    return '📅 5. Follow-up & Discussion Notes';
  };

  const groupedFields = activeFields.reduce((acc, f) => {
    const cat = getFieldCategory(f);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const getTypeColor = (type) => {
    switch (type) {
      case 'select':
      case 'multi_select':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'number':
      case 'currency':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'date':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
      case 'phone':
        return { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' };
      case 'auto_number':
        return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'tabFadeInUp 0.25s ease' }}>
      {/* 1. Active Form Banner Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {activeForm?.name || 'Vasantham 23-Field CRM Form'}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle size={12} color="#10B981" />
                <span>LIVE ACTIVE ON ALL PLATFORMS</span>
              </span>
              <span style={{ fontSize: '11.5px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                v{activeForm?.version || 1}.0
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
              This schema is currently deployed live across desktop workstations and all employee mobile devices.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'preview' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'preview' ? '#2563EB' : '#64748B',
              boxShadow: viewMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontSize: '12.5px',
              fontWeight: viewMode === 'preview' ? '800' : '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={14} />
            <span>Active Form (Live)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('builder')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'builder' ? '#2563EB' : 'transparent',
              color: viewMode === 'builder' ? '#FFFFFF' : '#64748B',
              fontSize: '12.5px',
              fontWeight: viewMode === 'builder' ? '800' : '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit3 size={14} />
            <span>Customize Form Builder</span>
          </button>
        </div>
      </div>

      {/* 2. Active Form Schema View */}
      {viewMode === 'preview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Metric Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                {activeFields.length}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Active Fields</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Available on Form</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                {requiredCount}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Required (*)</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Mandatory Inputs</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                {optionalCount}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Optional</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Flexible Details</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Live Sync</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#059669' }}>Real-time Connected</div>
              </div>
            </div>
          </div>

          {/* Grouped Field Cards */}
          {Object.entries(groupedFields).map(([category, categoryFields]) => (
            <div
              key={category}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                  {category}
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>
                  {categoryFields.length} {categoryFields.length === 1 ? 'field' : 'fields'}
                </span>
              </div>

              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {categoryFields.map((field, idx) => {
                  const typeStyle = getTypeColor(field.type);

                  return (
                    <div
                      key={field.id || field.name}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>
                            {field.label}
                          </span>
                          {field.required && (
                            <span style={{ color: '#DC2626', fontWeight: '900', fontSize: '13px' }} title="Required field">*</span>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: typeStyle.bg,
                            color: typeStyle.text,
                            border: `1px solid ${typeStyle.border}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {field.type}
                        </span>
                      </div>

                      {/* Options or Placeholder */}
                      {field.options && field.options.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {field.options.slice(0, 4).map((opt) => (
                            <span
                              key={opt.value || opt}
                              style={{
                                fontSize: '10.5px',
                                background: '#F1F5F9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: '600',
                              }}
                            >
                              {opt.label || opt.value || opt}
                            </span>
                          ))}
                          {field.options.length > 4 && (
                            <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: '700' }}>
                              +{field.options.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                          {field.placeholder || `Enter ${field.label}...`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. Form Builder Mode */
        <FormBuilderView />
      )}
    </div>
  );
};
