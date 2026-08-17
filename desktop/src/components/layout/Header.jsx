import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';

export const Header = ({ title, subtitle, onAddCustomer }) => {
  return (
    <header className="app-header">
      <div className="page-header-intro">
        <h1 className="page-header-title">{title || 'Customers'}</h1>
        <p className="page-header-subtitle">
          {subtitle || 'Manage and track all customer interactions'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onAddCustomer}
          className="btn btn-primary"
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '700',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          <span>Add New Customer</span>
          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 2px' }} />
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
};
