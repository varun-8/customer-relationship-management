import React, { useState } from 'react';
import { Layers, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

export const LoginPage = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your username or email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(identifier.trim(), password);
      if (!res?.success) {
        setError(res?.message || 'Invalid username or password');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at top, #F1F5F9 0%, #E2E8F0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.03)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand Icon & Logo */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            padding: '8px',
          }}
        >
          <img
            src={logoImg}
            alt="Vasantham Logo"
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
            <Layers size={32} />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#0F172A',
            margin: '0 0 6px',
            letterSpacing: '-0.025em',
            textAlign: 'center',
          }}
        >
          Vasantham CRM
        </h1>
        <p
          style={{
            fontSize: '13.5px',
            color: '#64748B',
            margin: '0 0 30px',
            textAlign: 'center',
            lineHeight: '1.4',
          }}
        >
          Enter your credentials to access the showroom workspace
        </p>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              color: '#DC2626',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span style={{ lineHeight: 1.3 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Username / Email */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              Username or Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User
                size={17}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="Enter username or email"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0F172A';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '26px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0F172A';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 18px',
              borderRadius: '12px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.8 : 1,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        {/* Security Footer */}
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94A3B8',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          <ShieldCheck size={15} />
          <span>Vasantham CRM Security Authentication</span>
        </div>
      </div>
    </div>
  );
};
