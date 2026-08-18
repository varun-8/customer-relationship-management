import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Shield,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { api } from '../../services/api';

export const EmployeeFormModal = ({ employee, onClose, onSuccess }) => {
  const isEdit = Boolean(employee && employee._id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setRole(employee.role || 'employee');
      setPhone(employee.phone || '');
      setActive(employee.active !== false);
      setPassword(''); // Blank unless user explicitly types new password
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('employee');
      setPhone('');
      setActive(true);
    }
  }, [employee]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff Name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      setError('Login Email cannot be empty.');
      return;
    }
    if (!isEdit && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      phone: phone.trim(),
      active,
    };

    if (password && password.trim().length >= 6) {
      payload.password = password.trim();
    }

    try {
      let res;
      if (isEdit) {
        res = await api.updateUser(employee._id, payload);
      } else {
        res = await api.createUser(payload);
      }

      if (res && res.success) {
        onSuccess(res.data);
      } else {
        setError(res?.message || 'Failed to save employee record.');
      }
    } catch (err) {
      setError(err.message || 'Error processing request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 120,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          background: '#FFFFFF',
          animation: 'tabFadeInUp 0.25s ease',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Minimalist Dark Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '20px 24px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isEdit ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEdit ? '0 4px 14px rgba(37, 99, 235, 0.4)' : '0 4px 14px rgba(5, 150, 105, 0.4)',
              }}
            >
              {isEdit ? <UserCheck size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {isEdit ? `Edit Staff Member` : 'Add New Staff Member'}
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: isEdit ? 'rgba(37, 99, 235, 0.2)' : 'rgba(5, 150, 105, 0.2)',
                    color: isEdit ? '#93C5FD' : '#6EE7B7',
                    border: isEdit ? '1px solid rgba(147, 197, 253, 0.3)' : '1px solid rgba(110, 231, 183, 0.3)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {isEdit ? 'Credentials' : 'New Login'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0' }}>
                {isEdit
                  ? `Update showroom role and mobile credentials for ${employee.name}`
                  : 'Create staff credentials to record leads on mobile CRM'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#94A3B8',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '11px 16px',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '12.5px',
                fontWeight: '700',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Staff Full Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Staff Full Name</span> <span className="required-star">*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. Karthik Raja"
                  required
                  style={{ paddingLeft: '34px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Login Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Login Email / Identifier</span> <span className="required-star">*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. karthik@vasantham.com"
                  required
                  style={{ paddingLeft: '34px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Mobile Login Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  <span>{isEdit ? 'Update Password (Optional)' : 'Password'}</span> {!isEdit && <span className="required-star">*</span>}
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    color: '#2563EB',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    padding: '2px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Sparkles size={12} />
                  <span>Generate Password</span>
                </button>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={isEdit ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                  required={!isEdit}
                  style={{ paddingLeft: '34px', paddingRight: '40px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Contact Phone & Status Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Contact Phone</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9840123456"
                    style={{ paddingLeft: '34px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Account Status</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: active ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
                      background: active ? '#ECFDF5' : '#F8FAFC',
                      color: active ? '#047857' : '#64748B',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? '#10B981' : '#94A3B8' }} />
                    <span>{active ? 'Active Staff' : 'Inactive / Suspended'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Access Role Selection Cards */}
            <div>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Showroom Access Role</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Option 1: Sales Staff */}
                <div
                  onClick={() => setRole('employee')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: role === 'employee' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: role === 'employee' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: role === 'employee' ? '#2563EB' : '#0F172A' }}>
                      💼 Sales Executive
                    </span>
                    {role === 'employee' && <Check size={14} color="#2563EB" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                    Records leads, quotes, follow-ups, and customer visits.
                  </span>
                </div>

                {/* Option 2: Showroom Owner */}
                <div
                  onClick={() => setRole('owner')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: role === 'owner' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: role === 'owner' ? '#F5F3FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: role === 'owner' ? '#7C3AED' : '#0F172A' }}>
                      👑 Showroom Owner
                    </span>
                    {role === 'owner' && <Check size={14} color="#7C3AED" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                    Full showroom management, team filter & analytics.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '9px 22px',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Check size={15} />
              <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
