import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Smartphone,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { EmployeeFormModal } from './EmployeeFormModal';

export const EmployeeManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getUsers();
      if (res && res.success) {
        setUsers(res.data || []);
      } else {
        setError(res?.message || 'Failed to load employees');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleToggleStatus = async (user) => {
    try {
      const updatedActive = !user.active;
      const res = await api.updateUser(user._id, { active: updatedActive });
      if (res && res.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, active: updatedActive } : u)));
        showToast(`Staff "${user.name}" status updated to ${updatedActive ? 'Active' : 'Inactive'}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === 'owner@vasantham.com') {
      alert('Cannot delete the primary showroom owner account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${user.name}"?`)) {
      return;
    }

    try {
      const res = await api.deleteUser(user._id);
      if (res && res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        showToast(`Staff "${user.name}" removed successfully`);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        search.trim() === '' ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.phone && u.phone.includes(search));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Analytics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active !== false).length;
  const ownerCount = users.filter((u) => u.role === 'owner').length;
  const employeeCount = users.filter((u) => u.role === 'employee').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: '700',
          }}
        >
          <CheckCircle size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Scorecard Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Total Team */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>
              Total Showroom Team
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>
              {totalUsers} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>members</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Employees */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>
              Sales Executives
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
              {employeeCount} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>staff</span>
            </div>
          </div>
        </div>

        {/* Card 3: Showroom Owners */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>
              Showroom Owners
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#7C3AED', marginTop: '2px' }}>
              {ownerCount} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>admin</span>
            </div>
          </div>
        </div>

        {/* Card 4: Mobile Access */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>
              Mobile Credentials
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#D97706', marginTop: '2px' }}>
              {activeUsers} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* Left: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              style={{ width: '260px', paddingLeft: '34px', borderRadius: '8px', fontSize: '12.5px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'employee', label: 'Sales Staff' },
              { id: 'owner', label: 'Owners' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleFilter(r.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: roleFilter === r.id ? '#2563EB' : 'transparent',
                  color: roleFilter === r.id ? '#FFFFFF' : '#64748B',
                  fontSize: '12px',
                  fontWeight: roleFilter === r.id ? '800' : '600',
                  cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            className="btn btn-secondary"
            title="Refresh list"
            style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Right: Add Employee Action */}
        <button
          type="button"
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
          className="btn btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: '800',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UserPlus size={16} />
          <span>Add Employee / Mobile Login</span>
        </button>
      </div>

      {/* 3. Staff Directory List */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Showroom Staff & Mobile Logins
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Manage credentials, assign showroom roles, and control mobile CRM access.
            </p>
          </div>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
            Showing {filteredUsers.length} of {totalUsers} staff
          </span>
        </div>

        {error && (
          <div style={{ padding: '16px 20px', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', fontWeight: '700' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <div>Loading showroom employees...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>No staff records found</div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Click "Add Employee / Mobile Login" to register showroom staff.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Mobile Login ID</th>
                  <th>Showroom Role</th>
                  <th>Contact Phone</th>
                  <th>Mobile Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isOwner = u.role === 'owner';
                  const initial = (u.name || 'S').charAt(0).toUpperCase();

                  return (
                    <tr key={u._id}>
                      {/* Name & Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: isOwner ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '13px',
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px' }}>
                              {u.name}
                            </div>
                            {u.email === 'owner@vasantham.com' && (
                              <span style={{ fontSize: '10px', color: '#7C3AED', fontWeight: '800' }}>
                                ★ PRIMARY ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Login Email */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontSize: '12.5px' }}>
                          <Mail size={13} color="#94A3B8" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        {isOwner ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              background: '#F5F3FF',
                              border: '1px solid #DDD6FE',
                              color: '#7C3AED',
                              fontSize: '11px',
                              fontWeight: '800',
                            }}
                          >
                            👑 Showroom Owner
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              fontSize: '11px',
                              fontWeight: '800',
                            }}
                          >
                            💼 Sales Executive
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '12px' }}>
                          <Phone size={13} color="#94A3B8" />
                          <span>{u.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            background: u.active ? '#ECFDF5' : '#F1F5F9',
                            color: u.active ? '#047857' : '#64748B',
                            border: u.active ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title="Click to toggle active status"
                        >
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.active ? '#10B981' : '#94A3B8' }} />
                          <span>{u.active ? 'Active Login' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(u);
                              setShowModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Credentials & Role"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>

                          {u.email !== 'owner@vasantham.com' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="btn btn-danger"
                              style={{ padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                              title="Delete Employee"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={(saved) => {
            setShowModal(false);
            setEditingEmployee(null);
            fetchUsers();
            showToast(editingEmployee ? `Staff "${saved.name}" updated successfully` : `Staff "${saved.name}" added successfully`);
          }}
        />
      )}
    </div>
  );
};
