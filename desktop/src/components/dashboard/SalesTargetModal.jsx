import React, { useState, useEffect } from 'react';
import { X, Target, IndianRupee, Users, Check, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_STAFF = ['Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar'];

export const SalesTargetModal = ({ month, currentMetrics, onClose, onSaved }) => {
  const [showroomTarget, setShowroomTarget] = useState(
    String(currentMetrics?.kpi?.salesTarget || 2500000)
  );

  const [staffTargets, setStaffTargets] = useState(() => {
    const existing = currentMetrics?.salespersonPerformance || [];
    if (existing.length > 0) {
      return existing.map((s) => ({
        staffName: s.staff,
        target: String(s.target || 625000),
      }));
    }
    return DEFAULT_STAFF.map((name) => ({
      staffName: name,
      target: '625000',
    }));
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleStaffTargetChange = (name, val) => {
    setStaffTargets((prev) =>
      prev.map((s) => (s.staffName === name ? { ...s, target: val } : s))
    );
  };

  // Auto distribute showroom target equally among staff
  const handleAutoDistribute = () => {
    const total = Number(showroomTarget) || 0;
    if (total <= 0 || staffTargets.length === 0) return;
    const split = Math.round(total / staffTargets.length);
    setStaffTargets((prev) => prev.map((s) => ({ ...s, target: String(split) })));
  };

  const totalAllocated = staffTargets.reduce((acc, s) => acc + (Number(s.target) || 0), 0);
  const showroomNum = Number(showroomTarget) || 0;
  const isBalanced = totalAllocated === showroomNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!showroomTarget || Number(showroomTarget) <= 0) {
      setError('Please enter a valid monthly showroom target');
      return;
    }

    setSaving(true);
    try {
      await api.updateSalesTargets({
        month,
        showroomTarget: Number(showroomTarget),
        staffTargets: staffTargets.map((s) => ({
          staffName: s.staffName,
          target: Number(s.target) || 0,
        })),
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving sales targets:', err);
      setError(err.message || 'Failed to save sales targets');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                Configure Sales Targets ({month})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                Set monthly showroom revenue target and individual salesperson quotas.
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px' }}>
            {error && (
              <div className="kpi-alert-danger" style={{ marginBottom: '14px' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Total Showroom Target */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: '800', margin: 0 }}>
                  Total Showroom Monthly Target (₹) *
                </label>
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Distribute Equally
                </button>
              </div>

              <div className="input-icon-wrapper">
                <span className="input-currency-tag">₹</span>
                <input
                  type="number"
                  className="form-input form-input-with-currency"
                  placeholder="e.g. 2500000"
                  value={showroomTarget}
                  onChange={(e) => setShowroomTarget(e.target.value)}
                  style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}
                  required
                  min="0"
                />
              </div>
            </div>

            {/* Individual Staff Allocations */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ fontWeight: '800', margin: 0, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', color: '#64748B' }}>
                  INDIVIDUAL SALESPERSON ALLOCATIONS
                </label>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    color: isBalanced ? '#059669' : '#D97706',
                  }}
                >
                  Allocated: ₹{totalAllocated.toLocaleString('en-IN')} / ₹{showroomNum.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {staffTargets.map((s) => (
                  <div
                    key={s.staffName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#1E293B', flex: 1 }}>
                      {s.staffName}
                    </div>
                    <div style={{ width: '160px' }} className="input-icon-wrapper">
                      <span className="input-currency-tag">₹</span>
                      <input
                        type="number"
                        className="form-input form-input-with-currency"
                        placeholder="Target"
                        value={s.target}
                        onChange={(e) => handleStaffTargetChange(s.staffName, e.target.value)}
                        style={{ padding: '6px 10px 6px 26px', fontSize: '12.5px', fontWeight: '800' }}
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '14px 20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '✓ Save Target Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
