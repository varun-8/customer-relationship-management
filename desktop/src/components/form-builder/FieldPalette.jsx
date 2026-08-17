import React from 'react';
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

  const categories = ['Basic Inputs', 'Date & Time', 'Selection', 'Financial & System'];

  return (
    <div className="glass-card">
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} color="var(--primary-700)" />
          Field Types Palette
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Click any field type to add it to your customer form layout.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {categories.map((cat) => {
          const fieldsInCat = FIELD_DEFINITIONS.filter((f) => f.category === cat);

          return (
            <div key={cat}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                {cat}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                {fieldsInCat.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addField(item.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 10px',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-600)';
                        e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title={item.desc}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'var(--primary-50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-700)',
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {item.label}
                        </div>
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
