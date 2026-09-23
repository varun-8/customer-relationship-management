import React from 'react';
import { LogOut, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const { user, isOwner, logout } = useAuth();

  if (!isOpen) return null;

  const userName = user?.name || (isOwner ? 'Vasantham Admin' : 'Showroom Staff');
  const userRole = user?.role === 'owner' ? 'Showroom Owner' : 'Sales Executive';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      logout();
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                flexShrink: 0,
              }}
            >
              <LogOut size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A', lineHeight: '1.2' }}>
                Confirm Sign Out
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                Vasantham CRM Session Security
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
            Are you sure you want to log out of your session? Any unsaved customer edit forms or active draft notes will be closed.
          </p>

          {/* User Profile Info Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Shield size={11} color="#2563EB" />
                <span>{userRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer Bar */}
        <div
          style={{
            padding: '16px 24px 20px 24px',
            backgroundColor: '#FAFAFA',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            <LogOut size={15} />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
