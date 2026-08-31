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
        @keyframes slideInToast {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Toast Notification Floating Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isBackup = t.type === 'backup';

          const bg = isBackup
            ? 'rgba(240, 253, 250, 0.96)'
            : isSuccess
            ? 'rgba(240, 253, 244, 0.96)'
            : isError
            ? 'rgba(254, 242, 242, 0.96)'
            : isWarning
            ? 'rgba(255, 251, 235, 0.96)'
            : 'rgba(239, 246, 255, 0.96)';

          const borderColor = isBackup
            ? '#99F6E4'
            : isSuccess
            ? '#BBF7D0'
            : isError
            ? '#FECDD3'
            : isWarning
            ? '#FDE68A'
            : '#BFDBFE';

          const accentColor = isBackup
            ? '#0D9488'
            : isSuccess
            ? '#16A34A'
            : isError
            ? '#DC2626'
            : isWarning
            ? '#D97706'
            : '#2563EB';

          const textColor = isBackup
            ? '#0F766E'
            : isSuccess
            ? '#166534'
            : isError
            ? '#991B1B'
            : isWarning
            ? '#92400E'
            : '#1E40AF';

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
                backgroundColor: bg,
                border: `1.5px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '14px 16px',
                boxShadow: '0 12px 30px -6px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                pointerEvents: 'auto',
                animation: 'slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left Accent Color Indicator */}
              <div
                style={{
                  width: '4px',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: accentColor,
                  borderRadius: '16px 0 0 16px',
                }}
              />

              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                <IconComponent size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title ? (
                  <div style={{ fontWeight: '800', fontSize: '13.5px', color: textColor, marginBottom: '2px' }}>
                    {t.title}
                  </div>
                ) : null}
                <div style={{ fontSize: '12.5px', color: textColor, lineHeight: '1.4', wordBreak: 'break-word', fontWeight: '500' }}>
                  {t.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textColor,
                  opacity: 0.6,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
              >
                <X size={15} />
              </button>

              {/* Progress Line */}
              {t.duration > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    backgroundColor: `${accentColor}30`,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: accentColor,
                      animation: `toastProgress ${t.duration}ms linear forwards`,
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
