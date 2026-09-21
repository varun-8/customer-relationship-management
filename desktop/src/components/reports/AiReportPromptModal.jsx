import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Calendar, TrendingUp, Target, ArrowRight, X, ShieldAlert, Zap, FileText } from 'lucide-react';

/**
 * Modern, crisp white-themed prompt modal that appears once at the beginning of each
 * month or year upon admin login, inviting them to generate the AI Showroom Intelligence Report.
 * Uses pure inline CSS and standard modal classes so it displays reliably on all platforms.
 */
export const AiReportPromptModal = ({ promptInfo, onGenerate, onDismiss }) => {
  if (!promptInfo) return null;

  const isYearly = promptInfo.type === 'yearly';
  const periodLabel = isYearly ? `${promptInfo.year} Annual` : `${promptInfo.monthName} ${promptInfo.year}`;

  return createPortal(
    <div
      className="modal-backdrop modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '24px',
        margin: 0,
        boxSizing: 'border-box',
      }}
      onClick={onDismiss}
    >
      <div
        className="modal-card"
        style={{
          position: 'relative',
          maxWidth: '820px',
          width: '95%',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
          color: '#0F172A',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div
          style={{
            height: '5px',
            width: '100%',
            background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 50%, #10B981 100%)',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#F1F5F9',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
          title="Dismiss for now"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Header pill & icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                border: '1px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} color="#4F46E5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#EEF2FF',
                    color: '#4338CA',
                    border: '1px solid #C7D2FE',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Calendar size={12} />
                  {isYearly ? 'New Year Executive Briefing' : 'New Month Beginning'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Zap size={11} />
                  1-Click Ready
                </span>
              </div>
              <h2 style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.01em' }}>
                {isYearly ? `Review & Kickoff: ${promptInfo.year} Annual AI Report` : `Start Strong: ${promptInfo.monthName} AI Intelligence Report`}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569', lineHeight: 1.55, fontWeight: '500' }}>
            A new period has commenced for the showroom! Run an executive AI analysis across all sales inquiries, lost deals, consultant follow-up metrics, and target closures to optimize showroom performance.
          </p>

          {/* Value cards - Crisp White Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                <TrendingUp size={16} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Funnel Analysis</div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.35, fontWeight: '500' }}>
                Detect lost deal reasons, price objections, & lost margins.
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#F3E8FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                <Target size={16} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Executive Targets</div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.35, fontWeight: '500' }}>
                Clear recommendations to boost consultant closure rates.
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                <FileText size={16} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Print & ChatGPT</div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.35, fontWeight: '500' }}>
                Formatted markdown summary ready to copy or download.
              </div>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '11.5px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '22px',
            }}
          >
            <ShieldAlert size={16} color="#D97706" style={{ flexShrink: 0 }} />
            <span>
              This automated prompt appears once per {isYearly ? 'year' : 'month'} upon admin login.
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onDismiss}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#475569'; }}
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={onGenerate}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.35)'; }}
            >
              <Sparkles size={14} />
              <span>Generate {periodLabel} Report</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
