import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Settings,
  ListPlus,
} from 'lucide-react';
import { useFormBuilder } from '../../context/FormBuilderContext';

export const FieldConfigModal = ({ field, onClose }) => {
  const { updateField } = useFormBuilder();

  const [formData, setFormData] = useState({
    label: field.label || '',
    name: field.name || '',
    description: field.description || '',
    placeholder: field.placeholder || '',
    required: field.required ?? false,
    active: field.active ?? true,
    defaultValue: field.defaultValue ?? '',
    options: field.options ? JSON.parse(JSON.stringify(field.options)) : [],
    validation: {
      min: field.validation?.min ?? '',
      max: field.validation?.max ?? '',
      minLength: field.validation?.minLength ?? '',
      maxLength: field.validation?.maxLength ?? '',
      pattern: field.validation?.pattern ?? '',
      currencySymbol: field.validation?.currencySymbol ?? '₹',
      phoneFormat: field.validation?.phoneFormat ?? '10-digit',
      autoNumberConfig: {
        prefix: field.validation?.autoNumberConfig?.prefix ?? 'VAS-',
        start: field.validation?.autoNumberConfig?.start ?? 1,
        digits: field.validation?.autoNumberConfig?.digits ?? 6,
        step: field.validation?.autoNumberConfig?.step ?? 1,
      },
    },
  });

  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  const isSelectableType = ['select', 'radio', 'multiselect'].includes(field.type);
  const isTextType = ['text', 'textarea'].includes(field.type);

  const handleSave = () => {
    const cleanValidation = { ...formData.validation };
    if (cleanValidation.min !== '') cleanValidation.min = Number(cleanValidation.min);
    else delete cleanValidation.min;

    if (cleanValidation.max !== '') cleanValidation.max = Number(cleanValidation.max);
    else delete cleanValidation.max;

    if (cleanValidation.minLength !== '') cleanValidation.minLength = Number(cleanValidation.minLength);
    else delete cleanValidation.minLength;

    if (cleanValidation.maxLength !== '') cleanValidation.maxLength = Number(cleanValidation.maxLength);
    else delete cleanValidation.maxLength;

    updateField(field.id, {
      ...formData,
      validation: cleanValidation,
    });
    onClose();
  };

  const addOption = () => {
    if (!newOptionLabel.trim()) return;
    const value = newOptionValue.trim() || newOptionLabel.trim();
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { label: newOptionLabel.trim(), value, isDefault: prev.options.length === 0 },
      ],
    }));
    setNewOptionLabel('');
    setNewOptionValue('');
  };

  const removeOption = (idx) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  const setDefaultOption = (idx) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isDefault: i === idx,
      })),
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary-50)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
                Configure Field: {field.label}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Field Type: <span className="badge badge-emerald">{field.type}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Display Label */}
            <div className="form-group">
              <label className="form-label">
                Display Label <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. Customer Name, Project Budget"
              />
              <span className="form-help">Shown on desktop and mobile forms</span>
            </div>

            {/* Field Key */}
            <div className="form-group">
              <label className="form-label">
                Field Identifier (API Key) <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input mono"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                placeholder="e.g. projectBudget"
              />
              <span className="form-help">Stored in database record</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Placeholder Text</label>
              <input
                type="text"
                className="form-input"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="e.g. Enter full name or 10-digit number"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Help Text / Description</label>
              <input
                type="text"
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Used for quotation generation"
              />
            </div>
          </div>

          {/* Toggles Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="req-checkbox"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#0F766E' }}
              />
              <label htmlFor="req-checkbox" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Required Field (Mandatory in forms)
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: formData.active ? 'var(--emerald-700)' : 'var(--text-muted)', fontWeight: '600' }}>
                {formData.active ? 'Active' : 'Disabled'}
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Options Manager */}
          {isSelectableType && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ListPlus size={15} color="var(--primary-700)" />
                  Dropdown & Choice Options
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formData.options.length} options defined
                </span>
              </div>

              {/* Add option bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Option Display Label (e.g. Architect)"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOption()}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Value (Optional)"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOption()}
                  style={{ maxWidth: '160px' }}
                />
                <button type="button" onClick={addOption} className="btn btn-primary" style={{ padding: '0 14px' }}>
                  <Plus size={15} /> Add
                </button>
              </div>

              {/* Options list */}
              <div
                style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFFFF',
                }}
              >
                {formData.options.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    No options added yet. Add choices above.
                  </div>
                ) : (
                  formData.options.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderBottom: idx < formData.options.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {opt.label}
                        </span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({opt.value})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setDefaultOption(idx)}
                          className={`btn ${opt.isDefault ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                          {opt.isDefault ? 'Default' : 'Set Default'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="btn-icon"
                          style={{ color: 'var(--rose-600)', padding: '4px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Currency Configuration */}
          {field.type === 'currency' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.validation.currencySymbol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, currencySymbol: e.target.value },
                    })
                  }
                  placeholder="₹"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Min Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.validation.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, min: e.target.value },
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.validation.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, max: e.target.value },
                    })
                  }
                  placeholder="100000000"
                />
              </div>
            </div>
          )}

          {/* Number Constraints */}
          {field.type === 'number' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Minimum Allowed Value</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.validation.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, min: e.target.value },
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Allowed Value</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.validation.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, max: e.target.value },
                    })
                  }
                  placeholder="100000"
                />
              </div>
            </div>
          )}

          {/* Text Length & Regex Rules */}
          {isTextType && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '10px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Min Length</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.validation.minLength}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, minLength: e.target.value },
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Length</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.validation.maxLength}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, maxLength: e.target.value },
                    })
                  }
                  placeholder="255"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Regex Pattern</label>
                <input
                  type="text"
                  className="form-input mono"
                  value={formData.validation.pattern}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, pattern: e.target.value },
                    })
                  }
                  placeholder="^[A-Z0-9]+$"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn btn-primary">
            <Check size={15} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
