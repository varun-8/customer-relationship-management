import React, { useState, useEffect } from 'react';
import { X, Target, IndianRupee, Users, Check, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../../services/api';

export const SalesTargetModal = ({ month, currentMetrics, onClose, onSaved }) => {
  const [showroomTarget, setShowroomTarget] = useState(
    String(currentMetrics?.kpi?.salesTarget || 2500000)
  );

  const [enableStaffTargets, setEnableStaffTargets] = useState(
    currentMetrics?.enableStaffTargets !== false
  );

  const [staffTargets, setStaffTargets] = useState(() => {
    const existing = currentMetrics?.salespersonPerformance || [];
    if (existing.length > 0) {
      return existing.map((s) => ({
        staffName: s.staff,
        target: String(s.target || 625000),
        disabled: Boolean(s.targetDisabled),
      }));
    }
    return [];
  });

  // Fetch live active showroom employees dynamically
  useEffect(() => {
    const fetchLiveStaff = async () => {
      try {
        const [usersRes, customersRes] = await Promise.all([
          api.getUsers(),
          api.getCustomers(),
        ]);

        const userStaff = (usersRes && usersRes.success && Array.isArray(usersRes.data))
          ? usersRes.data.filter((u) => u.active !== false).map((u) => u.name)
          : [];

        const customerStaff = (customersRes && customersRes.success && Array.isArray(customersRes.data))
          ? customersRes.data.map((c) => {
              const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
              return d.salesperson;
            }).filter(Boolean)
          : [];

        // Unique staff list
        const allStaffNames = Array.from(new Set([...userStaff, ...customerStaff]));

        const existing = currentMetrics?.salespersonPerformance || [];
        const existingMap = {};
        existing.forEach((s) => {
          existingMap[s.staff] = { target: String(s.target || ''), disabled: Boolean(s.targetDisabled) };
        });

        const defaultSplit = allStaffNames.length > 0
          ? String(Math.round((Number(showroomTarget) || 2500000) / allStaffNames.length))
          : '625000';

        const mapped = allStaffNames.map((name) => ({
          staffName: name,
          target: existingMap[name]?.target || defaultSplit,
          disabled: existingMap[name]?.disabled || false,
        }));

        if (mapped.length > 0) {
          setStaffTargets(mapped);
        }
      } catch (err) {
        console.warn('Error fetching live showroom staff for targets:', err);
      }
    };
    fetchLiveStaff();
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleStaffTargetChange = (name, val) => {
    setStaffTargets((prev) =>
      prev.map((s) => (s.staffName === name ? { ...s, target: val } : s))
    );
  };

  const handleToggleStaffDisabled = (name) => {
    setStaffTargets((prev) =>
      prev.map((s) => (s.staffName === name ? { ...s, disabled: !s.disabled } : s))
    );
  };

  // Auto distribute showroom target equally among active staff
  const handleAutoDistribute = () => {
    const total = Number(showroomTarget) || 0;
    const activeStaff = staffTargets.filter((s) => !s.disabled);
    if (total <= 0 || activeStaff.length === 0) return;
    const split = Math.round(total / activeStaff.length);
    setStaffTargets((prev) =>
      prev.map((s) => (s.disabled ? s : { ...s, target: String(split) }))
    );
  };

  const activeStaffList = staffTargets.filter((s) => !s.disabled);
  const totalAllocated = activeStaffList.reduce((acc, s) => acc + (Number(s.target) || 0), 0);
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
        enableStaffTargets,
        staffTargets: staffTargets.map((s) => ({
          staffName: s.staffName,
          target: Number(s.target) || 0,
          disabled: s.disabled,
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                Configure Sales Targets ({month})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                Set monthly showroom revenue target and manage individual staff targets.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', color: '#DC2626', fontSize: '12.5px', fontWeight: '600' }}>
                {error}
              </div>
            )}

            {/* Total Showroom Target */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Showroom Monthly Target (₹) *
                </label>
                {enableStaffTargets && (
                  <button
                    type="button"
                    onClick={handleAutoDistribute}
                    style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ⚡ Distribute Equally
                  </button>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '16px', fontWeight: '900', color: '#059669' }}>₹</span>
                <input
                  type="number"
                  placeholder="e.g. 2500000"
                  value={showroomTarget}
                  onChange={(e) => setShowroomTarget(e.target.value)}
                  style={{ width: '100%', paddingLeft: '28px', paddingRight: '14px', paddingTop: '9px', paddingBottom: '9px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '16px', fontWeight: '900', color: '#059669', outline: 'none' }}
                  required
                  min="0"
                />
              </div>
            </div>

            {/* Global Staff Targets Toggle Switch */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                  Enable Individual Salesperson Quotas
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  Turn off to disable target quotas for all sales staff
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnableStaffTargets(!enableStaffTargets)}
                style={{
                  backgroundColor: enableStaffTargets ? '#2563EB' : '#94A3B8',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <span>{enableStaffTargets ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Individual Staff Allocations */}
            {enableStaffTargets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    INDIVIDUAL SALESPERSON ALLOCATIONS
                  </label>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: isBalanced ? '#059669' : '#D97706' }}>
                    Allocated: ₹{totalAllocated.toLocaleString('en-IN')} / ₹{showroomNum.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {staffTargets.map((s) => (
                    <div
                      key={s.staffName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: s.disabled ? '#F1F5F9' : '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        gap: '12px',
                        opacity: s.disabled ? 0.7 : 1,
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A', flex: 1 }}>
                        {s.staffName}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStaffDisabled(s.staffName)}
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          backgroundColor: s.disabled ? '#FEE2E2' : '#EFF6FF',
                          color: s.disabled ? '#DC2626' : '#2563EB',
                          border: s.disabled ? '1px solid #FECDD3' : '1px solid #BFDBFE',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        {s.disabled ? 'Target: OFF' : 'Target: ACTIVE'}
                      </button>

                      {!s.disabled && (
                        <div style={{ width: '150px', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>₹</span>
                          <input
                            type="number"
                            placeholder="Target"
                            value={s.target}
                            onChange={(e) => handleStaffTargetChange(s.staffName, e.target.value)}
                            style={{ width: '100%', paddingLeft: '24px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', outline: 'none' }}
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '14px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 16px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 20px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {saving ? 'Saving...' : 'Save Target Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
