import React, { useState, useMemo } from 'react';
import { X, Columns, Check, Search, RotateCcw, CheckSquare, Square, AlertCircle } from 'lucide-react';

export const ColumnSettingsModal = ({ allFields = [], visibleColumnKeys = [], setVisibleColumnKeys, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const systemColumns = useMemo(
    () => [
      { key: 'customerId', label: 'Customer ID' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'phone', label: 'Mobile Number' },
      { key: 'customerType', label: 'Customer Type' },
      { key: 'houseStage', label: 'House Stage' },
      { key: 'status', label: 'Status' },
      { key: 'quotationValue', label: 'Quotation Value' },
      { key: 'nextFollowUp', label: 'Next Follow-Up' },
      { key: 'salesperson', label: 'Salesperson' },
      { key: 'notes', label: 'Internal Showroom Remarks & Special Delivery Notes' },
      { key: 'createdAt', label: 'Created Date' },
      { key: 'createdBy', label: 'Created By' },
    ],
    []
  );

  const DEFAULT_COLUMNS = useMemo(
    () => [
      'customerId',
      'customerName',
      'phone',
      'customerType',
      'houseStage',
      'status',
      'quotationValue',
      'nextFollowUp',
      'salesperson',
    ],
    []
  );

  const safeAllFields = Array.isArray(allFields) ? allFields : [];
  const systemKeysSet = useMemo(() => new Set(systemColumns.map((s) => s.key)), [systemColumns]);

  const toggleColumn = (key) => {
    try {
      if (!key) return;
      if (visibleColumnKeys.includes(key)) {
        if (visibleColumnKeys.length > 1) {
          setVisibleColumnKeys(visibleColumnKeys.filter((k) => k !== key));
        } else {
          setErrorMsg('At least one column must remain visible in the table.');
          setTimeout(() => setErrorMsg(null), 3000);
        }
      } else {
        setVisibleColumnKeys(Array.from(new Set([...visibleColumnKeys, key])));
      }
    } catch (err) {
      console.error('Error toggling column setting:', err);
      setErrorMsg('Unable to toggle column. Please try again.');
    }
  };

  const selectAll = () => {
    try {
      const validCustomFields = safeAllFields.filter((field) => {
        if (!field || !field.name) return false;
        const fName = String(field.name).toLowerCase().trim();
        const fLabel = String(field.label || '').toLowerCase().trim();
        return (
          !systemKeysSet.has(field.name) &&
          !systemKeysSet.has(fName) &&
          fName !== 'customerid' &&
          fName !== 'field_customer_id' &&
          fName !== 'customer_id' &&
          fName !== 'remarks' &&
          fName !== 'specialdeliverynotes' &&
          fName !== 'notes' &&
          fLabel !== 'customer id'
        );
      });
      const allKeys = Array.from(
        new Set([...systemColumns.map((c) => c.key), ...validCustomFields.map((f) => f.name)])
      );
      setVisibleColumnKeys(allKeys);
      setErrorMsg(null);
    } catch (err) {
      console.error('Error selecting all columns:', err);
      setErrorMsg('Failed to select all columns.');
    }
  };

  const deselectAll = () => {
    // Keep at least customerName & customerId
    setVisibleColumnKeys(['customerId', 'customerName']);
    setErrorMsg(null);
  };

  const resetToDefaults = () => {
    setVisibleColumnKeys(DEFAULT_COLUMNS);
    setErrorMsg(null);
  };

  const filteredSystemColumns = useMemo(() => {
    const query = (searchTerm || '').toLowerCase().trim();
    if (!query) return systemColumns;
    return systemColumns.filter(
      (col) =>
        (col.label || '').toLowerCase().includes(query) ||
        (col.key || '').toLowerCase().includes(query)
    );
  }, [systemColumns, searchTerm]);

  const filteredCustomFields = useMemo(() => {
    const query = (searchTerm || '').toLowerCase().trim();
    const seen = new Set();
    return safeAllFields.filter((field) => {
      if (!field || !field.name) return false;
      const fName = String(field.name).toLowerCase().trim();
      const fLabel = String(field.label || '').toLowerCase().trim();

      const isSystemDuplicate =
        systemKeysSet.has(field.name) ||
        systemKeysSet.has(fName) ||
        fName === 'customerid' ||
        fName === 'field_customer_id' ||
        fName === 'customer_id' ||
        fName === 'remarks' ||
        fName === 'specialdeliverynotes' ||
        fName === 'notes' ||
        fLabel === 'customer id';

      if (isSystemDuplicate) return false;

      if (seen.has(field.name)) return false;
      seen.add(field.name);

      if (!query) return true;
      return fLabel.includes(query) || fName.includes(query);
    });
  }, [safeAllFields, systemKeysSet, searchTerm]);

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        margin: 0,
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          width: '92vw',
          maxWidth: '560px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          borderRadius: '16px',
          background: '#FFFFFF',
          overflow: 'hidden',
          margin: 'auto',
          alignSelf: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)',
              }}
            >
              <Columns size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Configure Table Columns
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Customize visible columns ({visibleColumnKeys.length} selected)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Inline Notification Banner */}
        {errorMsg && (
          <div
            style={{
              padding: '8px 16px',
              background: '#FFF1F2',
              borderBottom: '1px solid #FECDD3',
              color: '#E11D48',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Toolbar & Search */}
        <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: '12px',
                paddingTop: '7px',
                paddingBottom: '7px',
                fontSize: '12.5px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={selectAll}
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckSquare size={12} color="#2563EB" /> Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Square size={12} color="#64748B" /> Minimum
              </button>
            </div>

            <button
              type="button"
              onClick={resetToDefaults}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                color: '#1D4ED8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={12} /> Reset Defaults
            </button>
          </div>
        </div>

        {/* Scrollable Column List Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* System Columns Section */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Standard System Fields ({filteredSystemColumns.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
                {filteredSystemColumns.map((col) => {
                  const isChecked = visibleColumnKeys.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: isChecked ? '#F0FDFA' : '#FFFFFF',
                        border: `1.5px solid ${isChecked ? '#0D9488' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12.5px',
                          color: isChecked ? '#0F766E' : '#1E293B',
                          fontWeight: isChecked ? '700' : '500',
                        }}
                      >
                        {col.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(col.key)}
                        style={{ accentColor: '#0D9488', width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Dynamic Fields Section */}
            {safeAllFields.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Custom Dynamic Fields ({filteredCustomFields.length})
                </div>
                {filteredCustomFields.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', padding: '8px' }}>
                    No matching custom fields found.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
                    {filteredCustomFields.map((field) => {
                      const isChecked = visibleColumnKeys.includes(field.name);
                      return (
                        <label
                          key={field.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: isChecked ? '#F0FDFA' : '#FFFFFF',
                            border: `1.5px solid ${isChecked ? '#0D9488' : '#E2E8F0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: '12.5px',
                                color: isChecked ? '#0F766E' : '#1E293B',
                                fontWeight: isChecked ? '700' : '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {field.label}
                            </span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                background: '#F1F5F9',
                                color: '#475569',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: '700',
                                flexShrink: 0,
                              }}
                            >
                              {field.type}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(field.name)}
                            style={{ accentColor: '#0D9488', width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-default)',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              borderRadius: '8px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} /> Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};


