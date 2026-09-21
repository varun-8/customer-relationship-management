import React from 'react';
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  Link,
  Hash,
  Check,
  Building2,
  MapPin,
  Tag,
  IndianRupee,
  Layers,
  ChevronDown,
  Lock,
} from 'lucide-react';

export const DynamicFieldInput = ({ field, value, onChange, error }) => {
  if (!field || !field.active) return null;

  const {
    type,
    label,
    name,
    required,
    placeholder,
    description,
    options = [],
    validation = {},
  } = field;

  const handleChange = (newVal) => {
    onChange(name, newVal);
  };

  const renderInput = () => {
    if (field.readOnly || name === 'lastFollowUp' || name === 'followUpCount') {
      const displayVal =
        value !== undefined && value !== null && String(value).trim() !== ''
          ? String(value)
          : name === 'followUpCount'
          ? '0'
          : 'Not yet recorded';

      return (
        <div
          style={{
            padding: '9px 13px',
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#1E293B',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <span>{displayVal}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#64748B',
              background: '#EEF2F6',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            <Lock size={11} /> Auto-managed
          </span>
        </div>
      );
    }

    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            className="form-input"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            className="form-textarea"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className="form-input"
            placeholder={placeholder || '0'}
            min={validation.min}
            max={validation.max}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
        );

      case 'currency':
        return (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: '#B45309',
                fontWeight: '800',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              {validation.currencySymbol || '₹'}
            </span>
            <input
              type="number"
              className="form-input"
              style={{ paddingLeft: '32px', fontWeight: '700', color: '#0F172A' }}
              placeholder={placeholder || '50000'}
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        );

      case 'phone':
        return (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Phone
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                color: '#64748B',
                pointerEvents: 'none',
              }}
            />
            <input
              type="tel"
              className="form-input"
              style={{ paddingLeft: '34px', fontFamily: 'monospace', fontWeight: '600' }}
              placeholder={placeholder || '9876543210'}
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value)}
            />
          </div>
        );

      case 'email':
        return (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                color: '#64748B',
                pointerEvents: 'none',
              }}
            />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: '34px' }}
              placeholder={placeholder || 'customer@example.com'}
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value)}
            />
          </div>
        );

      case 'url':
        return (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Link
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                color: '#64748B',
                pointerEvents: 'none',
              }}
            />
            <input
              type="url"
              className="form-input"
              style={{ paddingLeft: '34px' }}
              placeholder={placeholder || 'https://example.com'}
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value)}
            />
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            className="form-input"
            value={value ? String(value).substring(0, 10) : ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="form-input"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            className="form-input"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: Boolean(value) ? '#EFF6FF' : '#F8FAFC',
              border: `1.5px solid ${Boolean(value) ? '#93C5FD' : '#E2E8F0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="checkbox"
              id={`chk_${field.id}`}
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: Boolean(value) ? '#1E40AF' : '#334155', fontWeight: '600' }}>
              {placeholder || 'Yes, mark as interested / active'}
            </span>
          </label>
        );

      case 'radio': {
        const isBinary = options.length === 2 &&
          options.some(o => String(o.label).toLowerCase() === 'yes') &&
          options.some(o => String(o.label).toLowerCase() === 'no');

        // Fallback to select dropdown if options > 3 to avoid cluttering forms
        if (options.length > 3 && !isBinary) {
          return (
            <select
              className="form-select"
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value)}
            >
              <option value="">{placeholder || '-- Select an option --'}</option>
              {options.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        return (
          <div style={{ display: 'flex', gap: '8px', padding: '2px 0' }}>
            {options.map((opt, idx) => {
              const isChecked = value === opt.value;
              const isYes = String(opt.label).toLowerCase() === 'yes';
              const isNo = String(opt.label).toLowerCase() === 'no';
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleChange(opt.value)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: isChecked ? (isYes ? '#047857' : isNo ? '#B91C1C' : '#1D4ED8') : '#475569',
                    background: isChecked ? (isYes ? '#ECFDF5' : isNo ? '#FEF2F2' : '#EFF6FF') : '#F8FAFC',
                    border: `1.5px solid ${isChecked ? (isYes ? '#10B981' : isNo ? '#EF4444' : '#3B82F6') : '#E2E8F0'}`,
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: isChecked ? '700' : '600',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isChecked ? (isYes ? '#10B981' : isNo ? '#EF4444' : '#3B82F6') : '#94A3B8'}`,
                      background: isChecked ? (isYes ? '#10B981' : isNo ? '#EF4444' : '#3B82F6') : 'transparent',
                      display: 'inline-block',
                    }}
                  />
                  <span>{isYes ? '✓ Yes' : isNo ? '✕ No' : opt.label}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'select':
        return (
          <select
            className="form-select"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">{placeholder || '-- Select an option --'}</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect': {
        const selectedArr = Array.isArray(value) ? value : [];
        const toggleSelection = (optVal) => {
          if (selectedArr.includes(optVal)) {
            handleChange(selectedArr.filter((item) => item !== optVal));
          } else {
            handleChange([...selectedArr, optVal]);
          }
        };

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {options.map((opt, idx) => {
              const isSelected = selectedArr.includes(opt.value);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleSelection(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: isSelected ? '#2563EB' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #1D4ED8' : '1px solid #E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    fontSize: '12px',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && <Check size={12} />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'auto_number':
        return (
          <div
            style={{
              padding: '9px 13px',
              background: '#F8FAFC',
              border: '1.5px dashed #CBD5E1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748B',
              fontSize: '13px',
            }}
          >
            <Hash size={15} color="#2563EB" />
            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1E40AF' }}>
              {value || '(Auto-assigned by atomic sequence)'}
            </span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            className="form-input"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div
      className="form-group"
      style={{
        marginBottom: '16px',
        gridColumn: (type === 'textarea' || field.fullWidth || name === 'remarks' || name === 'specialDeliveryNotes') ? '1 / -1' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label className="form-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <span>{label}</span>
          {required && <span style={{ color: '#E11D48', fontWeight: '900', marginLeft: '4px' }}>*</span>}
        </label>
        {required && (
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8' }}>
            REQUIRED
          </span>
        )}
      </div>
      {renderInput()}
      {description && <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', display: 'block' }}>{description}</span>}
      {error && <span className="form-error" style={{ fontSize: '12px', color: '#E11D48', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {error}</span>}
    </div>
  );
};
