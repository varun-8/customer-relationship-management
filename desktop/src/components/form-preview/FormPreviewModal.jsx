import React, { useState } from 'react';
import {
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Save,
  Sparkles,
} from 'lucide-react';
import { DynamicFieldInput } from '../customer-crm/DynamicFieldInput';
import { useFormBuilder } from '../../context/FormBuilderContext';

export const FormPreviewModal = ({ onClose, onPublishClick }) => {
  const { draftForm, saveDraft } = useFormBuilder();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [testResult, setTestResult] = useState(null);

  if (!draftForm) return null;

  const activeFields = (draftForm.fields || []).filter((f) => f.active);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleTestSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    activeFields.forEach((field) => {
      const val = formData[field.name];
      const isMissing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

      if (field.required && isMissing && field.type !== 'auto_number') {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTestResult({
        type: 'error',
        message: `Validation failed: ${Object.keys(newErrors).length} required field(s) missing or invalid.`,
      });
    } else {
      setErrors({});
      setTestResult({
        type: 'success',
        message: 'All validation rules passed! The dynamic form is configured properly.',
        data: formData,
      });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
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
              <Eye size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
                Live Customer Form Preview (v{draftForm.version || 1})
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Simulating how employees and mobile users will interact with this form
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Test Status Banner */}
          {testResult && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: testResult.type === 'success' ? 'var(--emerald-50)' : 'var(--rose-50)',
                border: `1px solid ${testResult.type === 'success' ? '#A7F3D0' : '#FECDD3'}`,
                color: testResult.type === 'success' ? 'var(--emerald-700)' : 'var(--rose-600)',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {testResult.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <form onSubmit={handleTestSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
              {activeFields.map((field) => (
                <DynamicFieldInput
                  key={field.id}
                  field={field}
                  value={formData[field.name] ?? field.defaultValue}
                  onChange={handleFieldChange}
                  error={errors[field.name]}
                />
              ))}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {activeFields.length} active fields rendered dynamically
              </span>
              <button type="submit" className="btn btn-secondary">
                <Sparkles size={14} color="var(--amber-600)" />
                Test Submit Simulation
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={async () => {
              await saveDraft();
              alert('Draft saved successfully!');
            }}
            className="btn btn-secondary"
          >
            <Save size={14} /> Save Draft
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Close Preview
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onPublishClick();
              }}
              className="btn btn-primary"
            >
              <UploadCloud size={15} /> Publish Changes to Showroom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
