import React from 'react';
import { Plus } from 'lucide-react';

export const Header = ({ title, subtitle, onAddCustomer, showAddCustomer = false }) => {
  return (
    <header className="app-header">
      <div className="page-header-intro">
        <h1 className="page-header-title">{title || 'Customers'}</h1>
        <p className="page-header-subtitle">
          {subtitle || 'Manage and track all customer interactions'}
        </p>
      </div>

      {showAddCustomer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onAddCustomer}
            className="btn btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '800',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            <span>Add New Customer</span>
          </button>
        </div>
      )}
    </header>
  );
};
