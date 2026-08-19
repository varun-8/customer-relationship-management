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
import { useToast } from '../../context/ToastContext';
import { EmployeeFormModal } from './EmployeeFormModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';

export const EmployeeManagementView = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getUsers();
      if (res && res.success) {
        setUsers(res.data || []);
      } else {
        const msg = res?.message || 'Failed to load employees';
        setError(msg);
        if (users.length > 0) toast.warning(msg, 'Staff Directory');
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
      const msg = err.message || 'Error connecting to backend';
      setError(msg);
      if (users.length > 0) toast.warning(msg, 'Connection Issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      const updatedActive = !user.active;
      const res = await api.updateUser(user._id, { active: updatedActive });
      if (res && res.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, active: updatedActive } : u)));
        toast.success(`Staff "${user.name}" status updated to ${updatedActive ? 'Active' : 'Inactive'}`, 'Status Updated');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status', 'Update Error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === 'owner@vasantham.com' || user.role === 'owner') {
      toast.warning('Cannot delete the primary showroom owner account.', 'Action Blocked');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${user.name}"?\n\nAll active leads and follow-ups assigned to ${user.name} will automatically be transferred to the Showroom Owner.`)) {
      return;
    }

    try {
      const res = await api.deleteUser(user._id);
      if (res && res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        toast.info(res.message || `Staff "${user.name}" removed and leads reassigned to Showroom Owner.`, 'Staff Removed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete user', 'Delete Error');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'tabFadeInUp 0.3s ease' }}>
      {/* 1. Scorecard Metric Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Total Team */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', lineHeight: 1.1 }}>
              {totalUsers}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Total Showroom Team
            </div>
          </div>
        </div>

        {/* Card 2: Sales Executives */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
              {employeeCount}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Sales Executives
            </div>
          </div>
        </div>

        {/* Card 3: Showroom Owners */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#7C3AED', lineHeight: 1.1 }}>
              {ownerCount}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Showroom Owners
            </div>
          </div>
        </div>

        {/* Card 4: Mobile Credentials */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#D97706', lineHeight: 1.1 }}>
              {activeUsers}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Active Mobile Logins
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* Left: Search & Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              style={{
                width: '260px',
                paddingLeft: '34px',
                borderRadius: '10px',
                fontSize: '12.5px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
            {[
              { id: 'all', label: 'All Team' },
              { id: 'employee', label: 'Sales Staff' },
              { id: 'owner', label: 'Owners' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleFilter(r.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: roleFilter === r.id ? '#FFFFFF' : 'transparent',
                  color: roleFilter === r.id ? '#2563EB' : '#64748B',
                  boxShadow: roleFilter === r.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontSize: '12px',
                  fontWeight: roleFilter === r.id ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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
            style={{ padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
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
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          }}
        >
          <UserPlus size={16} />
          <span>+ Add Staff Member</span>
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

        {error && users.length === 0 ? (
          <div style={{ padding: '24px' }}>
            <ConnectionErrorState
              title="Unable to Load Staff Directory"
              message={error}
              onRetry={fetchUsers}
              isRetrying={loading}
            />
          </div>
        ) : null}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <div>Loading showroom employees...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>No staff records found</div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Click "Add Staff Member" to register showroom staff.</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748B' }}>
            <Users size={32} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
            <div style={{ fontWeight: '700', fontSize: '14px' }}>No staff found matching filter</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Try changing the search query or role filter.</div>
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
