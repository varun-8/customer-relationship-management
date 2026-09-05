import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const AppLoadingScreen = ({
  statusMessage = 'Initializing application...',
  onRetry,
  onBypass,
  isTakingLong = false,
}) => {
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(60), 400);
    const t2 = setTimeout(() => setProgress(90), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        userSelect: 'none',
        padding: '20px',
      }}
    >
      {/* Small Minimalist White Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Clean Logo */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            overflow: 'hidden',
            padding: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <img
            src={logoImg}
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            style={{
              display: 'none',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
            }}
          >
            <Layers size={22} />
          </div>
        </div>

        {/* Minimal App Title */}
        <h1
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#0F172A',
            margin: '0 0 2px',
            letterSpacing: '-0.02em',
          }}
        >
          Vasantham CRM
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: '#64748B',
            margin: '0 0 20px',
            fontWeight: '400',
          }}
        >
          Tiles & Sanitary Wares
        </p>

        {/* Slim Minimalist Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#F1F5F9',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#0F172A',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Status Message */}
        <p
          style={{
            fontSize: '11.5px',
            color: '#94A3B8',
            margin: 0,
            fontWeight: '500',
          }}
        >
          {statusMessage}
        </p>

        {/* Long load options */}
        {isTakingLong && (
          <div
            style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid #F1F5F9',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Retry</span>
                </button>
              )}
              {onBypass && (
                <button
                  type="button"
                  onClick={onBypass}
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={11} />
                  <span>Open</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
