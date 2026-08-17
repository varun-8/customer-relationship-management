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

  const getBadgeClass = (type) => {
    switch (type) {
      case 'currency': return 'badge-amber';
      case 'phone':
      case 'email': return 'badge-blue';
      case 'select':
      case 'radio':
      case 'multiselect': return 'badge-purple';
      case 'date':
      case 'datetime':
      case 'time': return 'badge-emerald';
      default: return 'badge-slate';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      className="glass-card glass-card-interactive"
      style={{
        padding: '14px 18px',
        marginBottom: '10px',
        opacity: field.active ? 1 : 0.65,
        borderColor: isDragging ? 'var(--primary-600)' : 'var(--border-default)',
        background: isDragging ? 'var(--primary-50)' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        cursor: 'grab',
      }}
    >
      {/* Left: Drag Handle, Order, and Title Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {/* Grip Handle */}
        <div style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
          <GripVertical size={18} />
        </div>

        {/* Up / Down Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <button
            onClick={() => moveField(field.id, 'up')}
            disabled={index === 0}
            className="btn-icon"
            style={{ padding: '2px', opacity: index === 0 ? 0.25 : 1 }}
            title="Move field up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={() => moveField(field.id, 'down')}
            disabled={index === total - 1}
            className="btn-icon"
            style={{ padding: '2px', opacity: index === total - 1 ? 0.25 : 1 }}
            title="Move field down"
          >
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Order Number Badge */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--primary-50)',
            border: '1px solid #CCFBF1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--primary-700)',
          }}
        >
          {index + 1}
        </div>

        {/* Field Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {field.label}
            </span>

            {field.required && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  color: 'var(--rose-600)',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: 'var(--rose-50)',
                  border: '1px solid #FECDD3',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                <Asterisk size={10} /> Required
              </span>
            )}

            <span className={`badge ${getBadgeClass(field.type)}`}>
              {fieldDef.label || field.type}
            </span>

            {!field.active && (
              <span className="badge badge-slate" style={{ color: 'var(--text-muted)' }}>
                Inactive
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              key: {field.name}
            </span>
            {field.placeholder && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                • "{field.placeholder}"
              </span>
            )}
            {field.options && field.options.length > 0 && (
              <span style={{ fontSize: '11.5px', color: 'var(--primary-700)', fontWeight: '500' }}>
                • {field.options.length} choices
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Active Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
          <span style={{ fontSize: '11.5px', color: field.active ? 'var(--emerald-700)' : 'var(--text-muted)', fontWeight: '600' }}>
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
          onClick={() => onEdit(field)}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px', gap: '5px' }}
          title="Configure field settings"
        >
          <Settings2 size={13} color="var(--primary-700)" />
          Configure
        </button>

        {/* Duplicate Button */}
        <button
          onClick={() => duplicateField(field.id)}
          className="btn-icon"
          title="Duplicate field"
        >
          <Copy size={14} />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => deleteField(field.id)}
          className="btn-icon"
          style={{ color: 'var(--rose-600)' }}
          title="Delete field"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
