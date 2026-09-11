import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Database } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = '', duration = 4500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newToast = { id, type, message, title, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success') => addToast('success', message, title),
    error: (message, title = 'Error') => addToast('error', message, title, 6000),
    warning: (message, title = 'Warning') => addToast('warning', message, title, 5000),
    info: (message, title = 'Notice') => addToast('info', message, title),
    backup: (message, title = 'Database Backup') => addToast('backup', message, title, 5500),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <style>{`
        @keyframes toastSlideIn {
          0% {
            opacity: 0;
            transform: translateX(36px) scale(0.94);
          }
          60% {
            transform: translateX(-4px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toastProgressCountdown {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        @keyframes toastPulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Modern Aesthetic Floating Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '22px',
          right: '24px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '430px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isBackup = t.type === 'backup';

          const accentColor = isBackup
            ? '#0D9488' // Teal
            : isSuccess
            ? '#059669' // Emerald
            : isError
            ? '#E11D48' // Rose
            : isWarning
            ? '#D97706' // Amber
            : '#2563EB'; // Blue

          const badgeBg = isBackup
            ? '#F0FDFA'
            : isSuccess
            ? '#ECFDF5'
            : isError
            ? '#FFF1F2'
            : isWarning
            ? '#FFFBEB'
            : '#EFF6FF';

          const badgeBorder = isBackup
            ? '#99F6E4'
            : isSuccess
            ? '#A7F3D0'
            : isError
            ? '#FECDD3'
            : isWarning
            ? '#FDE68A'
            : '#BFDBFE';

          const IconComponent = isBackup
            ? Database
            : isSuccess
            ? CheckCircle2
            : isError
            ? XCircle
            : isWarning
            ? AlertTriangle
            : Info;

          return (
            <div
              key={t.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '14px 16px',
                boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05), inset 0 1px 0 #FFFFFF',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '13px',
                pointerEvents: 'auto',
                animation: 'toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left Color Accent Strip */}
              <div
                style={{
                  width: '4px',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: accentColor,
                }}
              />

              {/* Light Pastel Icon Badge */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: badgeBg,
                  border: `1px solid ${badgeBorder}`,
                  color: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                <IconComponent size={18} strokeWidth={2.2} />
              </div>

              {/* Text Information */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
                {t.title ? (
                  <div
                    style={{
                      fontWeight: '800',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      marginBottom: '2px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {t.title}
                  </div>
                ) : null}
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#334155',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    fontWeight: '500',
                  }}
                >
                  {t.message}
                </div>
              </div>

              {/* Close Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '-2px',
                  marginRight: '-4px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0F172A';
                  e.currentTarget.style.backgroundColor = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#64748B';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Dismiss"
              >
                <X size={15} />
              </button>

              {/* Modern Countdown Timer Line */}
              {t.duration > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    backgroundColor: '#F1F5F9',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '100%',
                      transformOrigin: 'left center',
                      backgroundColor: accentColor,
                      animation: `toastProgressCountdown ${t.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      warning: (msg) => console.warn('Toast warning:', msg),
      info: (msg) => console.info('Toast info:', msg),
      backup: (msg) => console.log('Toast backup:', msg),
      remove: () => {},
    };
  }
  return context;
};
