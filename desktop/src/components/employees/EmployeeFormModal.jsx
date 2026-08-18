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
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '580px',
          width: '95%',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          background: '#FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Modern Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '20px 24px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
                borderRadius: '10px',
                background: isEdit ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEdit ? '0 4px 12px rgba(37, 99, 235, 0.4)' : '0 4px 12px rgba(5, 150, 105, 0.4)',
              }}
            >
              {isEdit ? <UserCheck size={20} /> : <User size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {isEdit ? `Edit Staff Credentials` : 'Add Showroom Staff / Login'}
              </h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                {isEdit
                  ? `Update role, mobile credentials and profile for ${employee.name}`
                  : 'Create mobile app credentials and assign showroom roles'}
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
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '12.5px',
                fontWeight: '700',
                marginBottom: '16px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Staff Full Name */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
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
                  style={{ paddingLeft: '34px', borderRadius: '8px' }}
                />
              </div>
            </div>

            {/* Login Email */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Mobile Login Email / Username</span> <span className="required-star">*</span>
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
                  style={{ paddingLeft: '34px', borderRadius: '8px' }}
                />
              </div>
              <span className="form-help" style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                Used by staff to identify their showroom transactions.
              </span>
            </div>

            {/* Mobile Login Password */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                  <span>{isEdit ? 'New Password (Optional)' : 'Mobile Password'}</span> {!isEdit && <span className="required-star">*</span>}
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
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
                  placeholder={isEdit ? 'Leave blank to keep unchanged' : 'Minimum 6 characters'}
                  required={!isEdit}
                  style={{ paddingLeft: '34px', paddingRight: '40px', borderRadius: '8px' }}
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
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                  <span>Phone Number</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9840123456"
                    style={{ paddingLeft: '34px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                  <span>Account Status</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: active ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
                      background: active ? '#ECFDF5' : '#F8FAFC',
                      color: active ? '#047857' : '#64748B',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? '#10B981' : '#94A3B8' }} />
                    <span>{active ? 'Active Employee' : 'Inactive / Suspended'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Access Role Selection Cards */}
            <div>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Showroom Access Role</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Option 1: Sales Staff */}
                <div
                  onClick={() => setRole('employee')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: role === 'employee' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: role === 'employee' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: role === 'employee' ? '#2563EB' : '#0F172A' }}>
                      💼 Sales Executive
                    </span>
                    {role === 'employee' && <Check size={14} color="#2563EB" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Records leads, quotes, follow-ups, and daily walk-ins.
                  </span>
                </div>

                {/* Option 2: Showroom Owner */}
                <div
                  onClick={() => setRole('owner')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: role === 'owner' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: role === 'owner' ? '#F5F3FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: role === 'owner' ? '#7C3AED' : '#0F172A' }}>
                      👑 Showroom Owner
                    </span>
                    {role === 'owner' && <Check size={14} color="#7C3AED" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Executive overview, all employee filtering & settings.
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
              style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px' }}
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
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={15} />
              <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Staff Login'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
