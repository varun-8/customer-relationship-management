import React, { useState, useEffect } from 'react';
import { Hash, Check } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const SequenceConfigModal = () => {
  const { sequenceConfig, updateSequence } = useCustomer();

  const [prefix, setPrefix] = useState('VAS-');
  const [startValue, setStartValue] = useState(1);
  const [padding, setPadding] = useState(6);
  const [step, setStep] = useState(1);
  const [currentValue, setCurrentValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sequenceConfig) {
      setPrefix(sequenceConfig.prefix ?? 'VAS-');
      setStartValue(sequenceConfig.startValue ?? 1);
      setPadding(sequenceConfig.padding ?? 6);
      setStep(sequenceConfig.step ?? 1);
      setCurrentValue(sequenceConfig.currentValue ?? 0);
    }
  }, [sequenceConfig]);

  const previewNumber = Number(currentValue) + Number(step);
  const livePreview = `${prefix || ''}${String(Math.max(1, previewNumber)).padStart(Number(padding) || 6, '0')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prefix.trim()) {
      setError('Prefix code cannot be empty.');
      return;
    }
    setSaving(true);
    setSavedSuccess(false);
    setError('');
    try {
      const res = await updateSequence({
        prefix: prefix.trim().toUpperCase(),
        startValue: Number(startValue),
        padding: Number(padding),
        step: Number(step),
        currentValue: Number(currentValue),
      });
      if (res && res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setError(res?.message || 'Failed to update customer sequence settings.');
      }
    } catch (err) {
      setError(err.message || 'Error updating sequence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Hash size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Customer ID Sequence Generator
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0' }}>
                Configure automated, non-duplicative Customer ID generation format for showroom leads.
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px' }}>
              <Check size={16} />
              <span>Sequence Updated Live!</span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '700', marginBottom: '18px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Live Preview Box */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0B1120 0%, #1E293B 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Next Generated Customer Reference ID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: '900', color: '#60A5FA', marginTop: '4px', letterSpacing: '0.05em' }}>
              {livePreview}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>
              Current database sequence counter: #{currentValue}
            </div>
          </div>
          <span style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: '800', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px' }}>
            ⚡ Atomic Counter
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Prefix Code</span> <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input mono"
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="VAS-"
                required
                style={{ borderRadius: '8px', fontWeight: '800', color: '#2563EB' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>Example: VAS-, VSW-, CUS-</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Number Length (Digit Padding)</span> <span className="required-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={padding}
                min={3}
                max={12}
                onChange={(e) => setPadding(e.target.value)}
                required
                style={{ borderRadius: '8px' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>6 digits produces 000001, 000002...</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Starting Base Number</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={startValue}
                min={1}
                onChange={(e) => setStartValue(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>Base initial count (e.g. 1)</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Current Sequence Counter</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={currentValue}
                min={0}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                style={{ borderRadius: '8px', fontWeight: '700' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>Last issued number in showroom</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Increment Step Value</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={step}
                min={1}
                max={10}
                onChange={(e) => setStep(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>Increment by 1 per new lead</span>
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: '10px 24px', fontSize: '13.5px', fontWeight: '800', borderRadius: '8px' }}
            >
              <Check size={16} />
              <span>{saving ? 'Updating Sequence...' : 'Save Sequence Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
