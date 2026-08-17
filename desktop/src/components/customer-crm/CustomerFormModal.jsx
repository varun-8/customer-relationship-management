import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Edit3,
  Check,
  AlertCircle,
  Hash,
  User,
  Layers,
  IndianRupee,
  Clock,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import { DynamicFieldInput } from './DynamicFieldInput';
import { useCustomer } from '../../context/CustomerContext';

const FIELD_SECTIONS = [
  {
    id: 'contact',
    title: 'Customer & Contact Profile',
    icon: User,
    fieldNames: ['customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType'],
  },
  {
    id: 'requirements',
    title: 'Project & Product Requirements',
    icon: Layers,
    fieldNames: ['houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement'],
  },
  {
    id: 'quotation',
    title: 'Quotation & Financial Pipeline',
    icon: IndianRupee,
    fieldNames: ['quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell'],
  },
  {
    id: 'followup',
    title: 'Follow-up & Interaction History',
    icon: Clock,
    fieldNames: ['nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason'],
  },
];

export const CustomerFormModal = ({ customer, onClose, onSuccess }) => {
  const { activeForm, createCustomer, updateCustomer, sequenceConfig } = useCustomer();
  const isEdit = Boolean(customer);

  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({});
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEdit && customer) {
      const initialData = {};
      if (customer.data) {
        if (customer.data instanceof Map) {
          customer.data.forEach((v, k) => { initialData[k] = v; });
        } else if (typeof customer.data === 'object') {
          Object.assign(initialData, customer.data);
        }
      }
      setFormData(initialData);
      setNotes(customer.notes || '');
    } else if (activeForm && activeForm.fields) {
      const initialData = {};
      activeForm.fields.forEach((field) => {
        if (field.defaultValue !== null && field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        }
      });
      // Default entryDate to today if missing
      if (!initialData.entryDate) {
        initialData.entryDate = new Date().toISOString().split('T')[0];
      }
      setFormData(initialData);
    }
  }, [customer, activeForm, isEdit]);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setGeneralError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!activeForm || !activeForm.fields) return true;

    activeForm.fields.forEach((field) => {
      if (!field.active) return;
      const val = formData[field.name];
      const isMissing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

      if (field.required && isMissing && field.type !== 'auto_number') {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setGeneralError('Please fill in all mandatory customer fields marked with *');
      return;
    }

    setSubmitting(true);
    setGeneralError('');

    try {
      if (isEdit) {
        const res = await updateCustomer(customer._id, formData, notes);
        if (res.success) {
          onSuccess && onSuccess(res.customer);
          onClose();
        } else {
          setGeneralError(res.message || 'Failed to update customer');
          if (res.errors) setErrors(res.errors);
        }
      } else {
        const res = await createCustomer(formData, notes);
        if (res.success) {
          onSuccess && onSuccess(res.customer);
          onClose();
        } else {
          setGeneralError(res.message || 'Failed to create customer');
          if (res.errors) setErrors(res.errors);
        }
      }
    } catch (err) {
      setGeneralError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeFields = activeForm ? activeForm.fields.filter((f) => f.active) : [];

  // Group fields into the 4 sections
  const getFieldsForSection = (fieldNames) => {
    return activeFields.filter((f) => fieldNames.includes(f.name));
  };

  // Fields that might not belong to predefined sections
  const predefinedNames = FIELD_SECTIONS.flatMap((s) => s.fieldNames);
  const extraFields = activeFields.filter((f) => !predefinedNames.includes(f.name));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '880px', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isEdit ? 'var(--blue-50)' : 'var(--primary-50)',
                color: isEdit ? 'var(--blue-700)' : 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isEdit ? <Edit3 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
                {isEdit ? `Edit Customer: ${customer.customerId}` : 'New Showroom Customer Entry (23 Fields)'}
              </h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {isEdit
                  ? 'Update customer details dynamically in MongoDB Atlas'
                  : 'Customer ID is automatically assigned by atomic sequence generator'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Top Info Banner & Section Tabs */}
        <div style={{ padding: '14px 28px 0', background: '#FFFFFF', borderBottom: '1px solid var(--border-default)' }}>
          {/* Customer ID Notice Box */}
          <div
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#F8FAFC',
              border: '1px solid var(--border-default)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={15} color="var(--primary-700)" />
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                {isEdit ? 'Customer ID:' : 'Assigned Customer ID:'}
              </span>
              <span className="mono" style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--primary-700)' }}>
                {isEdit ? customer.customerId : (sequenceConfig?.nextPreview || 'CUS-XXXXXX')}
              </span>
            </div>
            <span className="badge badge-emerald">23 Fields • Schema v{activeForm?.version || 1}</span>
          </div>

          {/* Section Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px' }}>
            {FIELD_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeTab === sec.id;
              const secFields = getFieldsForSection(sec.fieldNames);
              const hasError = secFields.some((f) => errors[f.name]);

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--primary-700)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--primary-800)' : 'var(--border-default)'}`,
                    fontSize: '12.5px',
                    fontWeight: isSelected ? '700' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={14} color={isSelected ? '#FFFFFF' : 'var(--primary-700)'} />
                  <span>{sec.title}</span>
                  {hasError && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--rose-500)' }} />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'all' ? 'var(--primary-700)' : '#FFFFFF',
                color: activeTab === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === 'all' ? 'var(--primary-800)' : 'var(--border-default)'}`,
                fontSize: '12.5px',
                fontWeight: activeTab === 'all' ? '700' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <LayoutGrid size={14} />
              <span>All 23 Fields</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 28px' }}>
          {generalError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--rose-50)',
                border: '1px solid #FECDD3',
                color: 'var(--rose-600)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{generalError}</span>
            </div>
          )}

          <form id="customer-form-modal" onSubmit={handleSubmit}>
            {/* Render Tabbed Section or All Fields */}
            {activeTab === 'all' ? (
              FIELD_SECTIONS.map((sec) => {
                const secFields = getFieldsForSection(sec.fieldNames);
                if (secFields.length === 0) return null;
                const Icon = sec.icon;

                return (
                  <div key={sec.id} style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-default)' }}>
                      <Icon size={16} color="var(--primary-700)" />
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                        {sec.title}
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
                      {secFields.map((field) => (
                        <DynamicFieldInput
                          key={field.id}
                          field={field}
                          value={formData[field.name]}
                          onChange={handleFieldChange}
                          error={errors[field.name]}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              (() => {
                const currentSec = FIELD_SECTIONS.find((s) => s.id === activeTab);
                const secFields = currentSec ? getFieldsForSection(currentSec.fieldNames) : [];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
                    {secFields.map((field) => (
                      <DynamicFieldInput
                        key={field.id}
                        field={field}
                        value={formData[field.name]}
                        onChange={handleFieldChange}
                        error={errors[field.name]}
                      />
                    ))}
                  </div>
                );
              })()
            )}

            {/* Extra custom fields if any */}
            {extraFields.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-default)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Additional Fields
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
                  {extraFields.map((field) => (
                    <DynamicFieldInput
                      key={field.id}
                      field={field}
                      value={formData[field.name]}
                      onChange={handleFieldChange}
                      error={errors[field.name]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* General Internal Remarks */}
            {(activeTab === 'followup' || activeTab === 'all') && (
              <div className="form-group" style={{ marginTop: '14px', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
                <label className="form-label">Internal Showroom Remarks & Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add any internal showroom notes, special delivery notes, or quotation terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'contact' && activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  const idx = FIELD_SECTIONS.findIndex((s) => s.id === activeTab);
                  if (idx > 0) setActiveTab(FIELD_SECTIONS[idx - 1].id);
                }}
                className="btn btn-secondary"
                style={{ padding: '7px 14px', fontSize: '12.5px' }}
              >
                ← Previous Section
              </button>
            )}

            {activeTab !== 'followup' && activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  const idx = FIELD_SECTIONS.findIndex((s) => s.id === activeTab);
                  if (idx < FIELD_SECTIONS.length - 1) setActiveTab(FIELD_SECTIONS[idx + 1].id);
                }}
                className="btn btn-secondary"
                style={{ padding: '7px 14px', fontSize: '12.5px' }}
              >
                Next Section →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              form="customer-form-modal"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Check size={16} />
              {submitting ? 'Saving...' : isEdit ? 'Save Customer Changes' : 'Register Customer (23 Fields)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
