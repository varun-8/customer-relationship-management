import React, { useState, useEffect } from 'react';
import { Hash, Check } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const SequenceConfigModal = () => {
  const { sequenceConfig, updateSequence } = useCustomer();

  const [prefix, setPrefix] = useState('VAS-');
  const [startValue, setStartValue] = useState(1);
  const [padding, setPadding] = useState(6);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (sequenceConfig) {
      setPrefix(sequenceConfig.prefix ?? 'VAS-');
      setStartValue(sequenceConfig.startValue ?? 1);
      setPadding(sequenceConfig.padding ?? 6);
      setStep(sequenceConfig.step ?? 1);
    }
  }, [sequenceConfig]);

  const previewNumber = sequenceConfig ? sequenceConfig.currentValue + step : startValue;
  const livePreview = `${prefix}${String(previewNumber).padStart(Number(padding) || 6, '0')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await updateSequence({
        prefix,
        startValue: Number(startValue),
        padding: Number(padding),
        step: Number(step),
      });
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert('Error updating sequence: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--primary-50)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Hash size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
              Customer ID Sequence Generator
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Configure the automated, non-duplicative Customer ID format for showroom records.
            </p>
          </div>
        </div>

        {/* Live Preview Box */}
        <div
          style={{
            padding: '20px',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #CCFBF1',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--primary-800)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Next Generated Customer ID
            </div>
            <div className="mono" style={{ fontSize: '26px', fontWeight: '800', color: 'var(--primary-800)', marginTop: '2px' }}>
              {livePreview}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primary-700)', marginTop: '2px' }}>
              Current sequence counter in database: #{sequenceConfig?.currentValue ?? 0}
            </div>
          </div>
          <span className="badge badge-emerald" style={{ padding: '4px 10px', fontSize: '11.5px' }}>
            Atomic & Unique
          </span>
        </div>

        {savedSuccess && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--emerald-50)',
              border: '1px solid #A7F3D0',
              color: 'var(--emerald-700)',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            Customer ID sequence format updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Prefix Code <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input mono"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="VAS-"
                required
              />
              <span className="form-help">Example: VAS-, VSW-, CUST-</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Number Length (Padding) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={padding}
                min={3}
                max={12}
                onChange={(e) => setPadding(e.target.value)}
                required
              />
              <span className="form-help">6 digits produces 000001, 000002...</span>
            </div>

            <div className="form-group">
              <label className="form-label">Starting Number</label>
              <input
                type="number"
                className="form-input"
                value={startValue}
                min={1}
                onChange={(e) => setStartValue(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Increment Step</label>
              <input
                type="number"
                className="form-input"
                value={step}
                min={1}
                max={10}
                onChange={(e) => setStep(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Check size={15} />
              {saving ? 'Updating...' : 'Save Sequence Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
