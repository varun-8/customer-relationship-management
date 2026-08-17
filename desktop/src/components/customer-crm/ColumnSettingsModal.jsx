import React from 'react';
import { X, Columns, Check } from 'lucide-react';

export const ColumnSettingsModal = ({ allFields, visibleColumnKeys, setVisibleColumnKeys, onClose }) => {
  const toggleColumn = (key) => {
    if (visibleColumnKeys.includes(key)) {
      if (visibleColumnKeys.length > 1) {
        setVisibleColumnKeys(visibleColumnKeys.filter((k) => k !== key));
      }
    } else {
      setVisibleColumnKeys([...visibleColumnKeys, key]);
    }
  };

  const systemColumns = [
    { key: 'customerId', label: 'Customer ID' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'phone', label: 'Mobile Number' },
    { key: 'customerType', label: 'Customer Type' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'createdBy', label: 'Created By' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Columns size={16} color="var(--primary-700)" />
            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Configure Table Columns</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Select which dynamic customer fields should appear as columns in the table.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Standard System Fields
            </div>
            {systemColumns.map((col) => {
              const isChecked = visibleColumnKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isChecked ? 'var(--primary-50)' : '#FFFFFF',
                    border: `1px solid ${isChecked ? 'var(--primary-600)' : 'var(--border-default)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '13px', color: isChecked ? 'var(--primary-800)' : 'var(--text-primary)', fontWeight: isChecked ? '600' : '400' }}>
                    {col.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(col.key)}
                    style={{ accentColor: '#0F766E', width: '15px', height: '15px' }}
                  />
                </label>
              );
            })}

            {allFields.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '10px' }}>
                  Custom Dynamic Fields
                </div>
                {allFields.map((field) => {
                  const isChecked = visibleColumnKeys.includes(field.name);
                  return (
                    <label
                      key={field.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isChecked ? 'var(--primary-50)' : '#FFFFFF',
                        border: `1px solid ${isChecked ? 'var(--primary-600)' : 'var(--border-default)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: isChecked ? 'var(--primary-800)' : 'var(--text-primary)', fontWeight: isChecked ? '600' : '400' }}>
                          {field.label}
                        </span>
                        <span className="badge badge-slate" style={{ fontSize: '10px' }}>{field.type}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(field.name)}
                        style={{ accentColor: '#0F766E', width: '15px', height: '15px' }}
                      />
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>
            <Check size={14} /> Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
