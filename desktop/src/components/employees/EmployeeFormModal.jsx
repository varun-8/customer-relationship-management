import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Crown,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const EmployeeFormModal = ({ employee, onClose, onSuccess }) => {
  const toast = useToast();
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
    toast.info('Generated strong random password for staff login', 'Password Generator');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Login Email / Identifier is required.');
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
        toast.success(
          isEdit
            ? `Staff profile for "${payload.name}" updated successfully.`
            : `New staff member "${payload.name}" registered successfully.`,
          isEdit ? 'Profile Saved' : 'Staff Registered'
        );
        onSuccess(res.data);
      } else {
        setError(res?.message || 'Failed to save staff record.');
        toast.error(res?.message || 'Failed to save staff record.', 'Save Error');
      }
    } catch (err) {
      setError(err.message || 'Error processing request');
      toast.error(err.message || 'Error processing request', 'Save Error');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        margin: 0,
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '580px',
          width: '100%',
          maxHeight: '92vh',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: '#FFFFFF',
          animation: 'modalCardScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          border: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '22px 26px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: isEdit
                  ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEdit
                  ? '0 6px 18px rgba(37, 99, 235, 0.35)'
                  : '0 6px 18px rgba(5, 150, 105, 0.35)',
              }}
            >
              {isEdit ? <UserCheck size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  {isEdit ? `Edit Staff Credentials` : 'Register New Staff Member'}
                </h2>
              </div>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '3px 0 0' }}>
                {isEdit
                  ? `Update role permissions and mobile login password for ${employee.name}`
                  : 'Configure mobile CRM login credentials and assign showroom role'}
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
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 26px', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '13px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Staff Full Name */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                <span>Staff Full Name</span> <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. Karthik Raja (Sales Exec)"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#0F172A',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Login Email */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                <span>Login Email / Identifier</span> <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. karthik@vasantham.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#0F172A',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Mobile Password & Random Generator */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                  <span>{isEdit ? 'Update Password (Optional)' : 'Password'}</span> {!isEdit && <span style={{ color: '#EF4444' }}>*</span>}
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
                    padding: '3px 10px',
                    borderRadius: '8px',
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
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={isEdit ? 'Leave blank to retain current password' : 'Minimum 6 characters'}
                  required={!isEdit}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 38px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#0F172A',
                    outline: 'none',
                  }}
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Contact Phone & Account Status Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  <span>Contact Phone</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9840123456"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  <span>Mobile Account Status</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: active ? '1.5px solid #A7F3D0' : '1px solid #CBD5E1',
                    background: active ? '#ECFDF5' : '#F8FAFC',
                    color: active ? '#047857' : '#64748B',
                    fontWeight: '800',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? '#10B981' : '#94A3B8' }} />
                  <span>{active ? 'Active Mobile Login' : 'Disabled / Suspended'}</span>
                </button>
              </div>
            </div>

            {/* Access Role Selector Cards */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                <span>Showroom Access Role</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Option 1: Sales Staff */}
                <div
                  onClick={() => setRole('employee')}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: role === 'employee' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: role === 'employee' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: role === 'employee' ? '0 4px 14px rgba(37, 99, 235, 0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={16} color={role === 'employee' ? '#2563EB' : '#64748B'} />
                      <span style={{ fontWeight: '800', fontSize: '13.5px', color: role === 'employee' ? '#2563EB' : '#0F172A' }}>
                        Sales Executive
                      </span>
                    </div>
                    {role === 'employee' && <Check size={16} color="#2563EB" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    Records leads, quotes, follow-ups, and customer visits on mobile.
                  </span>
                </div>

                {/* Option 2: Showroom Owner */}
                <div
                  onClick={() => setRole('owner')}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: role === 'owner' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                    background: role === 'owner' ? '#F5F3FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: role === 'owner' ? '0 4px 14px rgba(124, 58, 237, 0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={16} color={role === 'owner' ? '#7C3AED' : '#64748B'} />
                      <span style={{ fontWeight: '800', fontSize: '13.5px', color: role === 'owner' ? '#7C3AED' : '#0F172A' }}>
                        Showroom Owner
                      </span>
                    </div>
                    {role === 'owner' && <Check size={16} color="#7C3AED" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
                    Full showroom management, team filters, and executive dashboard.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              marginTop: '26px',
              paddingTop: '18px',
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
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '700',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: '800',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Check size={16} />
              <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
