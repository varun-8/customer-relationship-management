import React from 'react';
import { Plus, RefreshCw, Wifi, WifiOff, Cloud } from 'lucide-react';

export const Header = ({
  title,
  subtitle,
  onAddCustomer,
  showAddCustomer = false,
  isOnline = true,
  isChecking = false,
  onRetryConnection,
}) => {
  return (
    <header className="app-header">
      <div className="page-header-intro">
        <h1 className="page-header-title">{title || 'Customers'}</h1>
        <p className="page-header-subtitle">
          {subtitle || 'Manage and track all customer interactions'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Live Cloud Connection Status Badge */}
        {isOnline ? (
          <div
            title="Connected to Node.js & MongoDB Atlas backend"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#047857',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
              }}
            />
            <span>Cloud Live</span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECDD3',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#B91C1C',
            }}
          >
            <WifiOff size={14} color="#EF4444" />
            <span>Server Offline</span>
            {onRetryConnection && (
              <button
                type="button"
                onClick={onRetryConnection}
                disabled={isChecking}
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <RefreshCw size={10} className={isChecking ? 'spin-animation' : ''} />
                <span>{isChecking ? 'Checking...' : 'Reconnect'}</span>
              </button>
            )}
          </div>
        )}

        {showAddCustomer && (
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
        )}
      </div>
    </header>
  );
};
