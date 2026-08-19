import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

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
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
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
          maxWidth: '400px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const bg = isSuccess ? '#F0FDF4' : isError ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#EFF6FF';
          const borderColor = isSuccess ? '#BBF7D0' : isError ? '#FECDD3' : isWarning ? '#FDE68A' : '#BFDBFE';
          const textColor = isSuccess ? '#166534' : isError ? '#991B1B' : isWarning ? '#92400E' : '#1E40AF';
          const iconColor = isSuccess ? '#22C55E' : isError ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6';

          const IconComponent = isSuccess
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
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                pointerEvents: 'auto',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }}>
                <IconComponent size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title ? (
                  <div style={{ fontWeight: '800', fontSize: '13px', color: textColor, marginBottom: '2px' }}>
                    {t.title}
                  </div>
                ) : null}
                <div style={{ fontSize: '12px', color: textColor, lineHeight: '1.4', wordBreak: 'break-word' }}>
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
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
              >
                <X size={15} />
              </button>
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
    // Fallback safe dummy object if used outside provider
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      warning: (msg) => console.warn('Toast warning:', msg),
      info: (msg) => console.info('Toast info:', msg),
      remove: () => {},
    };
  }
  return context;
};
