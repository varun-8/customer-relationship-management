import React, { useState } from 'react';
import { History, Calendar, User, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useFormBuilder } from '../../context/FormBuilderContext';

export const FormVersionHistoryModal = () => {
  const { versions } = useFormBuilder();
  const [expandedVersionId, setExpandedVersionId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedVersionId(expandedVersionId === id ? null : id);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--purple-50)',
              color: 'var(--purple-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
              Form Version History & Audit Log
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Complete audit log of all published Customer CRM form configurations.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {versions.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No version history records found.
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isExpanded = expandedVersionId === ver._id;
              const isLatest = idx === 0;

              return (
                <div
                  key={ver._id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isLatest ? 'var(--primary-600)' : 'var(--border-default)'}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => toggleExpand(ver._id)}
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isLatest ? 'var(--primary-50)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: isLatest ? 'var(--primary-700)' : '#F1F5F9',
                          color: isLatest ? '#FFFFFF' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '13px',
                        }}
                      >
                        v{ver.version}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {ver.name || `Form Schema v${ver.version}`}
                          </span>
                          {isLatest && <span className="badge badge-emerald">Active Schema</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={12} />
                            {ver.publishedAt ? new Date(ver.publishedAt).toLocaleString('en-IN') : 'Initial'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <User size={12} />
                            {ver.publishedBy?.name || 'Owner'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Layers size={12} />
                            {ver.fields?.length || 0} fields
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {ver.changelog && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{ver.changelog}"
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-default)', background: '#F8FAFC' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Fields Snapshot for Version {ver.version}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                        {ver.fields?.map((f, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '8px 10px',
                              background: '#FFFFFF',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                            }}
                          >
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{f.label}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                              <span>{f.type}</span>
                              <span>{f.required ? 'Required' : 'Optional'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
