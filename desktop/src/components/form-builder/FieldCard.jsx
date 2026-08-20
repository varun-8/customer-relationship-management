import React from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings2,
  Copy,
  Trash2,
  Asterisk,
} from 'lucide-react';
import { useFormBuilder } from '../../context/FormBuilderContext';
import { FIELD_DEFINITIONS } from './FieldPalette';

export const FieldCard = ({ field, index, total, onEdit, isDragging, onDragStart, onDragOver, onDrop }) => {
  const { deleteField, duplicateField, toggleFieldActive, moveField } = useFormBuilder();

  const fieldDef = FIELD_DEFINITIONS.find((d) => d.type === field.type) || {
    label: field.type,
    category: 'Custom',
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'currency':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'phone':
      case 'email':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'select':
      case 'radio':
      case 'multiselect':
        return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' };
      case 'date':
      case 'datetime':
      case 'time':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  const badgeStyle = getBadgeStyle(field.type);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      style={{
        padding: '14px 18px',
        marginBottom: '10px',
        borderRadius: '16px',
        border: `1.5px solid ${isDragging ? '#2563EB' : field.active ? '#E2E8F0' : '#CBD5E1'}`,
        backgroundColor: isDragging ? '#EFF6FF' : field.active ? '#FFFFFF' : '#F8FAFC',
        opacity: field.active ? 1 : 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        cursor: 'grab',
        boxShadow: isDragging
          ? '0 10px 25px -5px rgba(37, 99, 235, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.02)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Left: Drag Handle, Step Order & Field Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {/* Grip Handle */}
        <div style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', cursor: 'grab' }}>
          <GripVertical size={18} />
        </div>

        {/* Up / Down Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <button
            type="button"
            onClick={() => moveField(field.id, 'up')}
            disabled={index === 0}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: index === 0 ? 'default' : 'pointer',
              color: index === 0 ? '#CBD5E1' : '#64748B',
            }}
            title="Move field up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => moveField(field.id, 'down')}
            disabled={index === total - 1}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: index === total - 1 ? 'default' : 'pointer',
              color: index === total - 1 ? '#CBD5E1' : '#64748B',
            }}
            title="Move field down"
          >
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Order Step Number Pill */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800',
            color: '#1D4ED8',
          }}
        >
          {index + 1}
        </div>

        {/* Field Name & Metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
              {field.label}
            </span>

            {field.required && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  color: '#E11D48',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  padding: '1px 7px',
                  borderRadius: '6px',
                }}
              >
                <Asterisk size={10} /> Required
              </span>
            )}

            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                border: `1px solid ${badgeStyle.border}`,
                padding: '2px 8px',
                borderRadius: '8px',
              }}
            >
              {fieldDef.label || field.type}
            </span>

            {!field.active && (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  padding: '1px 6px',
                  borderRadius: '6px',
                }}
              >
                Inactive
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
            <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#64748B', fontWeight: '600' }}>
              key: {field.name}
            </span>
            {field.placeholder ? (
              <span style={{ fontSize: '11.5px', color: '#475569' }}>
                • "{field.placeholder}"
              </span>
            ) : null}
            {field.options && field.options.length > 0 ? (
              <span style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: '700' }}>
                • {field.options.length} options
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right Actions Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Active Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
          <span style={{ fontSize: '11.5px', color: field.active ? '#059669' : '#64748B', fontWeight: '700' }}>
            {field.active ? 'Active' : 'Disabled'}
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={field.active}
              onChange={() => toggleFieldActive(field.id)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Configure Button */}
        <button
          type="button"
          onClick={() => onEdit(field)}
          style={{
            backgroundColor: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            color: '#1D4ED8',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          title="Configure field properties and options"
        >
          <Settings2 size={14} color="#2563EB" />
          Configure
        </button>

        {/* Duplicate Button */}
        <button
          type="button"
          onClick={() => duplicateField(field.id)}
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: '#475569',
            borderRadius: '10px',
            padding: '7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Duplicate field"
        >
          <Copy size={14} />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => deleteField(field.id)}
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECDD3',
            color: '#991B1B',
            borderRadius: '10px',
            padding: '7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Delete field"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
