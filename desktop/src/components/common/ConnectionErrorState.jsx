import React from 'react';
import { WifiOff, RefreshCw, AlertCircle, Server } from 'lucide-react';

export const ConnectionErrorState = ({
  title = 'Unable to Connect to CRM Server',
  message = 'The desktop app could not communicate with the backend server. Please verify your connection or local server.',
  onRetry,
  compact = false,
  isRetrying = false,
}) => {
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: '#FEF2F2',
          border: '1.5px solid #FECDD3',
          color: '#991B1B',
          fontSize: '13px',
          margin: '10px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WifiOff size={16} color="#EF4444" />
          <span style={{ fontWeight: '700' }}>{title}</span>
          <span style={{ color: '#7F1D1D', fontSize: '12px' }}>— {message}</span>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontWeight: '700',
              fontSize: '12px',
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <RefreshCw size={12} className={isRetrying ? 'spin' : ''} />
            <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px dashed #FECDD3',
        textAlign: 'center',
        margin: '20px 0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <WifiOff size={28} />
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px' }}>
        {title}
      </h3>

      <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', lineHeight: '1.5', margin: '0 0 20px' }}>
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            padding: '9px 20px',
            borderRadius: '8px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: '700',
            fontSize: '13px',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
          }}
        >
          <RefreshCw size={14} className={isRetrying ? 'spin' : ''} />
          <span>{isRetrying ? 'Connecting to Server...' : 'Retry Connection'}</span>
        </button>
      )}
    </div>
  );
};
