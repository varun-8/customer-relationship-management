import React, { useState } from 'react';
import {
  X,
  Wifi,
  Battery,
  Signal,
  RefreshCw,
  Plus,
  CheckCircle,
  Layers,
  ArrowLeft,
  Phone,
  User,
  IndianRupee,
  Clock,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { DynamicFieldInput } from '../customer-crm/DynamicFieldInput';

const SECTIONS = [
  { id: 'contact', title: '1. Contact', icon: User, fieldNames: ['customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType'] },
  { id: 'requirements', title: '2. Project Req', icon: Layers, fieldNames: ['houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement'] },
  { id: 'quotation', title: '3. Quotation', icon: IndianRupee, fieldNames: ['quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell'] },
  { id: 'followup', title: '4. Follow-up', icon: Clock, fieldNames: ['nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason'] },
];

export const MobileSimulatorModal = ({ onClose }) => {
  const { activeForm, customers, fetchActiveForm, fetchCustomers, createCustomer } = useCustomer();

  const [activeScreen, setActiveScreen] = useState('list'); // 'list' | 'add' | 'detail'
  const [formSection, setFormSection] = useState('contact');
  const [selectedMobileCustomer, setSelectedMobileCustomer] = useState(null);
  const [mobileFormData, setMobileFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const activeFields = (activeForm?.fields || []).filter((f) => f.active);

  const handleSync = async () => {
    setSyncing(true);
    await fetchActiveForm();
    await fetchCustomers();
    setTimeout(() => {
      setSyncing(false);
      setSuccessToast('Synced with MongoDB Atlas!');
      setTimeout(() => setSuccessToast(''), 2500);
    }, 600);
  };

  const handleFieldChange = (name, value) => {
    setMobileFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    activeFields.forEach((f) => {
      const val = mobileFormData[f.name];
      const isMissing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (f.required && f.type !== 'auto_number' && isMissing) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const res = await createCustomer(mobileFormData);
    if (res.success) {
      setMobileFormData({});
      setSuccessToast(`Customer ${res.customer.customerId} created!`);
      setActiveScreen('list');
      setTimeout(() => setSuccessToast(''), 3000);
    } else {
      alert(res.message || 'Error submitting customer');
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'Building Owner': return 'badge-emerald';
      case 'Architect': return 'badge-blue';
      case 'Mason': return 'badge-purple';
      default: return 'badge-amber';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '420px',
          height: '830px',
          borderRadius: '40px',
          border: '4px solid #CBD5E1',
          background: '#F8FAFC',
          padding: 0,
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status Bar */}
        <div
          style={{
            height: '38px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: '700',
            borderTopLeftRadius: '36px',
            borderTopRightRadius: '36px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span>9:41</span>
          <div style={{ width: '65px', height: '15px', background: '#E2E8F0', borderRadius: '10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Signal size={11} />
            <Wifi size={11} />
            <Battery size={12} />
          </div>
        </div>

        {/* Mobile Header */}
        <div
          style={{
            padding: '12px 16px',
            background: '#FFFFFF',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeScreen !== 'list' ? (
              <button
                onClick={() => setActiveScreen('list')}
                className="btn-icon"
                style={{ padding: '4px' }}
              >
                <ArrowLeft size={16} color="var(--text-primary)" />
              </button>
            ) : (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'var(--brand-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={14} color="#FFFFFF" />
              </div>
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                VASANTHAM CRM
              </div>
              <div style={{ fontSize: '10px', color: 'var(--primary-700)', fontWeight: '700' }}>
                React Native • Schema v{activeForm?.version || 1} (23 Fields)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleSync}
              className="btn-icon"
              title="Sync Schema"
              style={{ padding: '5px' }}
            >
              <RefreshCw size={13} className={syncing ? 'spin' : ''} color="var(--primary-700)" />
            </button>
            <button onClick={onClose} className="btn-icon" style={{ padding: '5px' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div
            style={{
              background: 'var(--emerald-600)',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: '600',
              padding: '6px 12px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle size={13} />
            {successToast}
          </div>
        )}

        {/* Viewport Body */}
        <div style={{ height: 'calc(100% - 134px)', overflowY: 'auto', padding: '14px', background: '#F8FAFC' }}>
          {activeScreen === 'list' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Showroom Leads ({customers.length})
                </span>
                <button
                  onClick={() => {
                    const initial = {};
                    activeFields.forEach((f) => {
                      if (f.defaultValue) initial[f.name] = f.defaultValue;
                    });
                    initial.entryDate = new Date().toISOString().split('T')[0];
                    setMobileFormData(initial);
                    setFormSection('contact');
                    setActiveScreen('add');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: 'var(--radius-full)' }}
                >
                  <Plus size={13} /> Add Customer
                </button>
              </div>

              {/* Customer Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customers.map((c) => {
                  const data = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
                  const initial = (data.customerName || 'C').charAt(0).toUpperCase();

                  return (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSelectedMobileCustomer(c);
                        setActiveScreen('detail');
                      }}
                      style={{
                        padding: '12px',
                        background: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              background: 'var(--primary-50)',
                              color: 'var(--primary-700)',
                              fontWeight: '800',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {data.customerName || 'Unnamed'}
                            </div>
                            <span className="mono" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-700)' }}>
                              {c.customerId}
                            </span>
                          </div>
                        </div>
                        <span className={`badge ${getBadgeClass(data.customerType)}`} style={{ fontSize: '9.5px' }}>
                          {data.customerType || 'Customer'}
                        </span>
                      </div>

                      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} color="var(--primary-700)" /> {data.phone || '—'}
                        </span>
                        {data.quotationValue || data.tileBudget ? (
                          <span style={{ color: 'var(--amber-700)', fontWeight: '800' }}>
                            ₹ {Number(data.quotationValue || data.tileBudget).toLocaleString('en-IN')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeScreen === 'add' && (
            <div>
              {/* Section Tabs Bar */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '4px' }}>
                {SECTIONS.map((sec) => {
                  const isSelected = formSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setFormSection(sec.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--primary-700)' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? 'var(--primary-800)' : 'var(--border-default)'}`,
                        fontSize: '10.5px',
                        fontWeight: isSelected ? '700' : '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sec.title}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {SECTIONS.find((s) => s.id === formSection)?.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  23-Field Schema (v{activeForm?.version || 1})
                </div>
              </div>

              <form onSubmit={handleMobileSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {(() => {
                    const currentSec = SECTIONS.find((s) => s.id === formSection);
                    const secFields = activeFields.filter((f) => currentSec?.fieldNames.includes(f.name));

                    return secFields.map((field) => (
                      <DynamicFieldInput
                        key={field.id}
                        field={field}
                        value={mobileFormData[field.name]}
                        onChange={handleFieldChange}
                        error={errors[field.name]}
                      />
                    ));
                  })()}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  {formSection !== 'contact' && (
                    <button
                      type="button"
                      onClick={() => {
                        const idx = SECTIONS.findIndex((s) => s.id === formSection);
                        if (idx > 0) setFormSection(SECTIONS[idx - 1].id);
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    >
                      ← Prev
                    </button>
                  )}

                  {formSection !== 'followup' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const idx = SECTIONS.findIndex((s) => s.id === formSection);
                        if (idx < SECTIONS.length - 1) setFormSection(SECTIONS[idx + 1].id);
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    >
                      Next Section →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    >
                      Submit Customer
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeScreen === 'detail' && selectedMobileCustomer && (
            <div>
              {(() => {
                const data = selectedMobileCustomer.data instanceof Map
                  ? Object.fromEntries(selectedMobileCustomer.data)
                  : (selectedMobileCustomer.data || {});

                return (
                  <div>
                    <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', marginBottom: '12px', boxShadow: 'var(--shadow-xs)' }}>
                      <span className="mono" style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-700)' }}>
                        {selectedMobileCustomer.customerId}
                      </span>
                      <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {data.customerName}
                      </h3>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <span className={`badge ${getBadgeClass(data.customerType)}`}>
                          {data.customerType}
                        </span>
                        {data.status && <span className="badge badge-amber">{data.status}</span>}
                      </div>
                    </div>

                    {/* 4 Sections */}
                    {SECTIONS.map((sec) => {
                      const secFields = activeFields.filter((f) => sec.fieldNames.includes(f.name));
                      return (
                        <div key={sec.id} style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {sec.title}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {secFields.map((f) => (
                              <div key={f.name} style={{ padding: '8px 10px', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '12px' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{f.label}</div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginTop: '2px' }}>
                                  {data[f.name] !== undefined && data[f.name] !== null && data[f.name] !== ''
                                    ? Array.isArray(data[f.name])
                                      ? data[f.name].join(', ')
                                      : f.type === 'currency'
                                      ? `₹ ${Number(data[f.name]).toLocaleString('en-IN')}`
                                      : String(data[f.name])
                                    : '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Home Bar */}
        <div
          style={{
            height: '34px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: '36px',
            borderBottomRightRadius: '36px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ width: '90px', height: '4px', background: '#CBD5E1', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
};
