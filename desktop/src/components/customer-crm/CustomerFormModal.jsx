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
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { DynamicFieldInput } from './DynamicFieldInput';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';

const FIELD_SECTIONS = [
  {
    id: 'contact',
    title: '1. Contact & Lead Profile',
    shortTitle: 'Contact Profile',
    icon: User,
    fieldNames: ['customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType'],
    description: 'Basic client details, phone number, location, and showroom lead assignment.',
  },
  {
    id: 'requirements',
    title: '2. Project & Material Specifications',
    shortTitle: 'Material Specs',
    icon: Layers,
    fieldNames: ['houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement'],
    description: 'Flooring stage, tile area, sanitary ware, and adhesive requirements.',
  },
  {
    id: 'quotation',
    title: '3. Quotation & Pipeline Stage',
    shortTitle: 'Quotation & Stage',
    icon: IndianRupee,
    fieldNames: ['quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell'],
    description: 'Shared quotation price, quotation date, deal status, and cross-sell items.',
  },
  {
    id: 'followup',
    title: '4. Follow-up & Interaction Timeline',
    shortTitle: 'Follow-up & Notes',
    icon: Clock,
    fieldNames: ['nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason'],
    description: 'Follow-up reminders, interaction count, and latest client discussion remarks.',
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
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [lookingUpPhone, setLookingUpPhone] = useState(false);

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
      if (!initialData.entryDate) {
        initialData.entryDate = new Date().toISOString().split('T')[0];
      }
      if (!initialData.status) {
        initialData.status = 'Newly Contacted';
      }
      if (!initialData.customerType) {
        initialData.customerType = 'Building Owner';
      }
      setFormData(initialData);
    }
  }, [customer, activeForm, isEdit]);

  const checkPhoneLookup = async (phoneVal) => {
    if (isEdit || !phoneVal) return;
    const clean = String(phoneVal).replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      setLookingUpPhone(true);
      try {
        const res = await api.lookupCustomerByPhone(clean);
        if (res.success && res.exists && res.customer) {
          setExistingCustomer(res.customer);
        } else {
          setExistingCustomer(null);
        }
      } catch (e) {
        console.warn('Phone check error:', e);
      } finally {
        setLookingUpPhone(false);
      }
    } else {
      setExistingCustomer(null);
    }
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      checkPhoneLookup(value);
    }
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
        const customerIdToUpdate = customer?._id || customer?.customerId || customer?.id;
        const res = await updateCustomer(customerIdToUpdate, formData, notes);
        if (res && res.success) {
          onSuccess && onSuccess(res.customer);
          onClose();
        } else {
          setGeneralError(res?.message || 'Failed to update customer');
          if (res?.errors) setErrors(res.errors);
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

  const getFieldsForSection = (fieldNames) => {
    return activeFields.filter((f) => fieldNames.includes(f.name));
  };

  const activeSections = isEdit
    ? [
        {
          id: 'contact',
          title: '1. Contact & Lead Profile',
          shortTitle: 'Contact Profile',
          icon: User,
          fieldNames: ['customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType'],
          description: 'Client personal details, contact number, location, and showroom sales assignment.',
        },
        {
          id: 'requirements',
          title: '2. Project & Material Specifications',
          shortTitle: 'Material Specs',
          icon: Layers,
          fieldNames: ['houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement'],
          description: 'Flooring stage, tile area, sanitary ware, and adhesive requirements.',
        },
        {
          id: 'quotation',
          title: '3. Commercial & Quotation Value',
          shortTitle: 'Quotation & Value',
          icon: IndianRupee,
          fieldNames: ['quotationValue', 'quotationDate', 'orderValue', 'crossSell'],
          description: 'Shared quotation price, quotation date, confirmed order value, and cross-sell items.',
        },
      ]
    : FIELD_SECTIONS;

  const predefinedNames = activeSections.flatMap((s) => s.fieldNames);
  const extraFields = activeFields.filter((f) => !predefinedNames.includes(f.name));

  const currentSectionIndex = activeSections.findIndex((s) => s.id === activeTab);
  const currentSection = activeSections[currentSectionIndex] || activeSections[0];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '940px',
          width: '95%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          background: '#FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '20px 28px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: isEdit ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEdit ? '0 8px 16px rgba(37, 99, 235, 0.35)' : '0 8px 16px rgba(5, 150, 105, 0.35)',
              }}
            >
              {isEdit ? <Edit3 size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                  {isEdit ? `Edit Customer Profile` : 'Register New Showroom Customer'}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#93C5FD',
                  }}
                >
                  <Hash size={11} />
                  <span>{isEdit ? customer.customerId : (sequenceConfig?.nextPreview || 'CUS-AUTO')}</span>
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '3px 0 0' }}>
                {isEdit
                  ? 'Update customer details, material specs, and quotation dynamically.'
                  : 'Quickly record client requirements, tile budgets, and follow-up timeline.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#94A3B8',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Step Chips & Progress Line */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-default)' }}>
          {/* Progress Line */}
          <div style={{ height: '3px', background: '#F1F5F9', width: '100%' }}>
            <div
              style={{
                height: '100%',
                background: '#2563EB',
                width: activeTab === 'all' ? '100%' : `${((currentSectionIndex + 1) / activeSections.length) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px 28px', overflowX: 'auto' }}>
            {activeSections.map((sec, idx) => {
              const Icon = sec.icon;
              const isSelected = activeTab === sec.id;
              const secFields = getFieldsForSection(sec.fieldNames);
              const hasError = secFields.some((f) => errors[f.name]);
              const isCompleted = idx < currentSectionIndex;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isSelected ? '#EFF6FF' : isCompleted ? '#F0FDF4' : '#F8FAFC',
                    color: isSelected ? '#2563EB' : isCompleted ? '#15803D' : '#475569',
                    border: `1.5px solid ${isSelected ? '#93C5FD' : isCompleted ? '#BBF7D0' : '#E2E8F0'}`,
                    fontSize: '12.5px',
                    fontWeight: isSelected ? '800' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={14} color={isSelected ? '#2563EB' : isCompleted ? '#16A34A' : '#64748B'} />
                  <span>{sec.shortTitle}</span>
                  {hasError ? (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }} />
                  ) : isCompleted ? (
                    <Check size={12} color="#16A34A" />
                  ) : null}
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
                padding: '8px 16px',
                borderRadius: '8px',
                background: activeTab === 'all' ? '#EFF6FF' : '#F8FAFC',
                color: activeTab === 'all' ? '#2563EB' : '#475569',
                border: `1.5px solid ${activeTab === 'all' ? '#93C5FD' : '#E2E8F0'}`,
                fontSize: '12.5px',
                fontWeight: activeTab === 'all' ? '800' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <LayoutGrid size={14} />
              <span>View All Fields</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC' }}>
          {generalError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                color: '#E11D48',
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
            {/* If Single Section Active: Render Section Card */}
            {activeTab !== 'all' ? (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                  padding: '22px 24px',
                }}
              >
                {/* Active Section Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', marginBottom: '18px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <currentSection.icon size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                        {currentSection.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                        {currentSection.description}
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#2563EB', background: '#EFF6FF', padding: '3px 9px', borderRadius: '6px' }}>
                    Step {currentSectionIndex + 1} of {activeSections.length}
                  </span>
                </div>

                {/* Real-time Existing Customer Auto-Detection Banner */}
                {existingCustomer && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                      border: '1.5px solid #FDE68A',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400E' }}>
                          🔄 Existing Customer Found: <span style={{ textDecoration: 'underline' }}>{existingCustomer.customerName}</span> (#{existingCustomer.customerId})
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '2px' }}>
                          Type: {existingCustomer.customerType} • Location: {existingCustomer.location || 'Showroom'} • Past Orders: {existingCustomer.pastOrdersCount}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customerName: existingCustomer.customerName || prev.customerName,
                          customerType: existingCustomer.customerType || prev.customerType,
                          location: existingCustomer.location || prev.location,
                          leadSource: 'Existing Customer',
                          salesperson: existingCustomer.salesperson || prev.salesperson,
                          isRepeatCustomer: true,
                        }));
                      }}
                      style={{
                        padding: '6px 14px',
                        background: '#D97706',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)',
                      }}
                    >
                      ⚡ Auto-fill Profile
                    </button>
                  </div>
                )}

                {/* 2-Column Responsive Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px 20px' }}>
                  {getFieldsForSection(currentSection.fieldNames).map((field) => (
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
            ) : (
              /* If "All Fields" Active: Render Grouped Sections */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeSections.map((sec) => {
                  const secFields = getFieldsForSection(sec.fieldNames);
                  if (secFields.length === 0) return null;
                  const Icon = sec.icon;

                  return (
                    <div
                      key={sec.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                        padding: '20px 22px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                        <Icon size={16} color="#2563EB" />
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                          {sec.title}
                        </h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px 20px' }}>
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
                })}
              </div>
            )}

            {/* Extra custom fields if any */}
            {extraFields.length > 0 && (
              <div style={{ marginTop: '18px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px 22px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', marginBottom: '14px' }}>
                  Additional Showroom Fields
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px 20px' }}>
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
              <div style={{ marginTop: '16px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px 22px' }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Internal Showroom Remarks & Special Delivery Notes:
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Add any internal showroom instructions, delivery terms, or quotation notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer with Step Navigation */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-default)',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Step Back button */}
          <div>
            {activeTab !== 'contact' && activeTab !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  const idx = activeSections.findIndex((s) => s.id === activeTab);
                  if (idx > 0) setActiveTab(activeSections[idx - 1].id);
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
              >
                <ChevronLeft size={16} />
                <span>Previous Section</span>
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              Cancel
            </button>

            {/* Next Section or Final Submit */}
            {currentSectionIndex < activeSections.length - 1 && activeTab !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  const idx = activeSections.findIndex((s) => s.id === activeTab);
                  if (idx < activeSections.length - 1) setActiveTab(activeSections[idx + 1].id);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', fontWeight: '700' }}
              >
                <span>Next: {activeSections[currentSectionIndex + 1]?.shortTitle}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                form="customer-form-modal"
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '8px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', borderRadius: '8px' }}
              >
                <Check size={16} />
                <span>
                  {submitting
                    ? 'Saving Profile...'
                    : isEdit
                    ? 'Save Customer Profile'
                    : '✓ Register Customer Profile'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
