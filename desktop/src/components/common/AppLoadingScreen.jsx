import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const AppLoadingScreen = ({
  statusMessage = 'Connecting to showroom database...',
  onRetry,
  onBypass,
  isTakingLong = false,
}) => {
  const [progress, setProgress] = useState(20);
  const [dynamicMsg, setDynamicMsg] = useState('Connecting to showroom database...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(52);
      setDynamicMsg('Synchronizing customer leads & pipelines...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(82);
      setDynamicMsg('Loading performance KPI metrics & workspace...');
    }, 1000);

    const t3 = setTimeout(() => {
      setProgress(98);
      setDynamicMsg('Ready! Launching executive workspace...');
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: 'none',
        padding: '24px',
        overflow: 'hidden',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <style>{`
        @keyframes orbitalRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes logoPulseBloom {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.95;
          }
        }
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
        @keyframes liveDotPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
            box-shadow: 0 0 10px #10B981;
          }
        }
        @keyframes cardFadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Ambient Soft Radial Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(219, 234, 254, 0.7) 0%, rgba(248, 250, 252, 0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(209, 250, 229, 0.6) 0%, rgba(248, 250, 252, 0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      {/* Executive White Glassmorphic Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(241, 245, 249, 0.8)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          animation: 'cardFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Animated Brand Orbital Badge */}
        <div
          style={{
            position: 'relative',
            width: '86px',
            height: '86px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          {/* Subtle Glow Behind Logo */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(186, 230, 253, 0.7) 0%, rgba(219, 234, 254, 0.3) 60%, transparent 80%)',
              animation: 'logoPulseBloom 2.4s ease-in-out infinite',
              filter: 'blur(8px)',
            }}
          />

          {/* Outer Orbital Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px dashed #93C5FD',
              animation: 'orbitalRotate 8s linear infinite',
            }}
          />

          {/* Inner Accent Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '4px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#2563EB',
              borderRightColor: '#10B981',
              animation: 'orbitalRotate 3.2s linear infinite reverse',
            }}
          />

          {/* Center Logo Box */}
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '6px',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.12)',
              position: 'relative',
              zIndex: 2,
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
                color: '#2563EB',
              }}
            >
              <Layers size={28} />
            </div>
          </div>
        </div>

        {/* Brand Titles */}
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#0F172A',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Vasantham CRM
        </h1>
        <p
          style={{
            fontSize: '12.5px',
            color: '#64748B',
            margin: '0 0 24px',
            fontWeight: '600',
            letterSpacing: '0.01em',
          }}
        >
          Tiles & Sanitary Wares • Enterprise Workspace
        </p>

        {/* Crisp White-Themed Progress Track */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#F1F5F9',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 50%, #10B981 100%)',
              borderRadius: '999px',
              transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              boxShadow: '0 0 10px rgba(37, 99, 235, 0.3)',
            }}
          >
            {/* Shimmer Sweep */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '60px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
                animation: 'shimmerSweep 1.5s ease infinite',
              }}
            />
          </div>
        </div>

        {/* Dynamic Status Message */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '22px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              animation: 'liveDotPulse 1.8s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '12.5px',
              color: '#334155',
              fontWeight: '600',
              letterSpacing: '0.01em',
              transition: 'all 0.3s ease',
            }}
          >
            {statusMessage || dynamicMsg}
          </span>
        </div>

        {/* Taking Long / Retry Controls */}
        {isTakingLong && (
          <div
            style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              animation: 'cardFadeInUp 0.3s ease forwards',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    border: '1.5px solid #CBD5E1',
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                >
                  <RefreshCw size={13} />
                  <span>Retry Server</span>
                </button>
              )}
              {onBypass && (
                <button
                  type="button"
                  onClick={onBypass}
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '7px 16px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Open CRM</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer System Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#64748B',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        <ShieldCheck size={15} color="#2563EB" />
        <span>Enterprise Showroom Security Active</span>
      </div>
    </div>
  );
};
