import React from 'react';
import { X } from 'lucide-react';
import { MobilePairingView } from './MobilePairingView';

export const MobilePairingModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '1100px',
          width: '95%',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F8FAFC',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '18px 24px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📱</span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>
              Mobile App Scanner & Pairing Center
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <MobilePairingView isModal onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
