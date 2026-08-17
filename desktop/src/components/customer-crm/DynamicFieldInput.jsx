import React from 'react';
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  Link,
  Hash,
  Check,
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
                color: 'var(--amber-700)',
                fontWeight: '700',
                fontSize: '15px',
                pointerEvents: 'none',
              }}
            >
              {validation.currencySymbol || '₹'}
            </span>
            <input
              type="number"
              className="form-input"
              style={{ paddingLeft: '32px' }}
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
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-light)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="tel"
              className="form-input"
              style={{ paddingLeft: '34px' }}
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
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-light)',
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
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-light)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id={`chk_${field.id}`}
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#0F766E', cursor: 'pointer' }}
            />
            <label
              htmlFor={`chk_${field.id}`}
              style={{ fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none', fontWeight: '500' }}
            >
              {placeholder || 'Yes, mark as interested'}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
            {options.map((opt, idx) => {
              const isChecked = value === opt.value;
              return (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: isChecked ? 'var(--primary-800)' : 'var(--text-primary)',
                    background: isChecked ? 'var(--primary-50)' : '#FFFFFF',
                    border: `1px solid ${isChecked ? 'var(--primary-600)' : 'var(--border-default)'}`,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.15s ease',
                    fontWeight: isChecked ? '600' : '400',
                  }}
                >
                  <input
                    type="radio"
                    name={`radio_${name}`}
                    value={opt.value}
                    checked={isChecked}
                    onChange={() => handleChange(opt.value)}
                    style={{ accentColor: '#0F766E' }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );

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
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'var(--primary-700)' : '#FFFFFF',
                    border: isSelected ? '1px solid var(--primary-800)' : '1px solid var(--border-default)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: isSelected ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-xs)',
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
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            <Hash size={15} color="var(--primary-700)" />
            <span className="mono">{value || '(Auto-generated on creation)'}</span>
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
    <div className="form-group" style={{ marginBottom: '14px' }}>
      <label className="form-label">
        <span>{label}</span>
        {required && <span className="required-star">*</span>}
      </label>
      {renderInput()}
      {description && <span className="form-help">{description}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
