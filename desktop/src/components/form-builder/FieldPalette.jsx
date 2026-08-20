import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  Binary,
  Phone,
  Mail,
  Calendar,
  Clock,
  CalendarClock,
  CheckSquare,
  Radio,
  ChevronDown,
  ListFilter,
  IndianRupee,
  Link,
  Hash,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useFormBuilder } from '../../context/FormBuilderContext';

export const FIELD_DEFINITIONS = [
  { type: 'text', label: 'Single Text', icon: Type, category: 'Basic Inputs', desc: 'Customer name, firm title, etc.' },
  { type: 'textarea', label: 'Paragraph / Notes', icon: AlignLeft, category: 'Basic Inputs', desc: 'Multi-line requirements & notes' },
  { type: 'number', label: 'Number', icon: Binary, category: 'Basic Inputs', desc: 'Square footage, quantity, etc.' },
  { type: 'phone', label: 'Phone Number', icon: Phone, category: 'Basic Inputs', desc: '10-digit mobile contact number' },
  { type: 'email', label: 'Email Address', icon: Mail, category: 'Basic Inputs', desc: 'Quotation delivery email' },
  { type: 'url', label: 'Website / Link', icon: Link, category: 'Basic Inputs', desc: 'Portfolio or company website' },

  { type: 'date', label: 'Date', icon: Calendar, category: 'Date & Time', desc: 'Target purchase or site visit date' },
  { type: 'time', label: 'Time', icon: Clock, category: 'Date & Time', desc: 'Showroom consultation time' },
  { type: 'datetime', label: 'Date & Time', icon: CalendarClock, category: 'Date & Time', desc: 'Exact appointment datetime' },

  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, category: 'Selection', desc: 'Yes/No binary boolean flag' },
  { type: 'radio', label: 'Radio Choice', icon: Radio, category: 'Selection', desc: 'Single choice from list options' },
  { type: 'select', label: 'Dropdown Select', icon: ChevronDown, category: 'Selection', desc: 'Single choice dropdown list' },
  { type: 'multiselect', label: 'Multi-Select', icon: ListFilter, category: 'Selection', desc: 'Multiple selectable items / chips' },

  { type: 'currency', label: 'Currency (₹)', icon: IndianRupee, category: 'Financial & System', desc: 'Monetary figure with rupee symbol' },
  { type: 'auto_number', label: 'Auto-Number', icon: Hash, category: 'Financial & System', desc: 'Backend-generated sequential ID' },
];

export const FieldPalette = () => {
  const { addField } = useFormBuilder();
  const [search, setSearch] = useState('');

  const categories = ['Basic Inputs', 'Date & Time', 'Selection', 'Financial & System'];

  const filteredFields = FIELD_DEFINITIONS.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return f.label.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q);
  });

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={16} color="#2563EB" />
            Field Palette
          </h3>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '12px' }}>
            15 Types
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
          Click any field to add it to your live customer form.
        </p>
      </div>

      {/* Quick Palette Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        <input
          type="text"
          placeholder="Filter field types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '32px',
            paddingRight: '12px',
            paddingTop: '7px',
            paddingBottom: '7px',
            fontSize: '12px',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#F8FAFC',
            outline: 'none',
            color: '#0F172A',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '2px' }}>
        {categories.map((cat) => {
          const fieldsInCat = filteredFields.filter((f) => f.category === cat);
          if (fieldsInCat.length === 0) return null;

          return (
            <div key={cat}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                {cat}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                {fieldsInCat.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addField(item.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        color: '#0F172A',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#93C5FD';
                        e.currentTarget.style.backgroundColor = '#EFF6FF';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                      title={item.desc}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563EB',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', lineHeight: 1.2 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>
                            {item.desc.slice(0, 26)}...
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          backgroundColor: '#DBEAFE',
                          color: '#1D4ED8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={14} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
