import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Briefcase,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Copy,
  Check,
  Crown,
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
  const [copiedId, setCopiedId] = useState(null);

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
        const msg = res?.message || 'Failed to load showroom employees';
        setError(msg);
        if (users.length > 0) toast.warning(msg, 'Staff Directory');
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
      const msg = err.message || 'Error connecting to backend server';
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
        toast.success(
          `Staff member "${user.name}" is now ${updatedActive ? 'Active' : 'Inactive'}`,
          'Status Updated'
        );
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
    if (
      !window.confirm(
        `Are you sure you want to remove staff member "${user.name}"?\n\nAll active leads and follow-ups assigned to ${user.name} will automatically be reassigned to the Showroom Owner.`
      )
    ) {
      return;
    }

    try {
      const res = await api.deleteUser(user._id);
      if (res && res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        toast.info(
          res.message || `Staff member "${user.name}" removed and leads reassigned to Showroom Owner.`,
          'Staff Removed'
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete user', 'Delete Error');
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.info(`Copied "${text}" to clipboard`, 'Copied');
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

  // Analytics Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active !== false).length;
  const ownerCount = users.filter((u) => u.role === 'owner').length;
  const employeeCount = users.filter((u) => u.role === 'employee').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* Minimalist Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
            Team Directory
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0', fontWeight: '500' }}>
            {totalUsers} team members • {activeUsers} active mobile logins
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchUsers}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingEmployee(null);
              setShowModal(true);
            }}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <UserPlus size={16} />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Minimal Filter & Controls Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '10px',
              fontSize: '13px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#0F172A',
              fontWeight: '500',
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '10px', border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            {[
              { id: 'all', label: 'All', count: totalUsers },
              { id: 'employee', label: 'Sales Execs', count: employeeCount },
              { id: 'owner', label: 'Owners', count: ownerCount },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleFilter(r.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: roleFilter === r.id ? '#FFFFFF' : 'transparent',
                  color: roleFilter === r.id ? '#0F172A' : '#64748B',
                  fontSize: '12.5px',
                  fontWeight: roleFilter === r.id ? '700' : '500',
                  cursor: 'pointer',
                  boxShadow: roleFilter === r.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {r.label} ({r.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Content Section */}
      {error && users.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <ConnectionErrorState
            title="Unable to Load Staff Directory"
            message={error}
            onRetry={fetchUsers}
            isRetrying={loading}
          />
        </div>
      ) : loading ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '50px 20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}
        >
          <RefreshCw size={24} color="#2563EB" className="spin" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: '#64748B', fontWeight: '600', fontSize: '13.5px', margin: 0 }}>
            Loading showroom staff directory...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '44px 20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#94A3B8',
            }}
          >
            <Users size={24} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
            No staff records found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 14px 0' }}>
            {search || roleFilter !== 'all'
              ? 'No staff members match your filter settings.'
              : 'Add staff members to grant mobile CRM access.'}
          </p>
          {(search || roleFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#1E293B',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* MINIMALIST TABLE VIEW */
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          <div className="table-responsive">
            <table className="kpi-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '18px' }}>Staff Name</th>
                  <th>Login Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '18px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isOwner = u.role === 'owner';
                  const isPrimaryAdmin = u.email === 'owner@vasantham.com';
                  const isActive = u.active !== false;
                  const initial = (u.name || 'S').charAt(0).toUpperCase();

                  return (
                    <tr key={u._id}>
                      {/* Name */}
                      <td style={{ paddingLeft: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isOwner ? '#F5F3FF' : '#EFF6FF',
                              color: isOwner ? '#7C3AED' : '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '13px',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>{u.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#334155', fontFamily: 'monospace' }}>{u.email}</span>
                      </td>

                      {/* Role */}
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: isOwner ? '#7C3AED' : '#2563EB' }}>
                          {isOwner ? 'Owner' : 'Sales Exec'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#64748B' }}>{u.phone || '—'}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            background: isActive ? '#ECFDF5' : '#F1F5F9',
                            color: isActive ? '#059669' : '#64748B',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10B981' : '#94A3B8' }} />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(u);
                              setShowModal(true);
                            }}
                            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Edit
                          </button>

                          {!isPrimaryAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Remove
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
        </div>
      )}

      {/* Register / Edit Staff Modal */}
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
          }}
        />
      )}
    </div>
  );
};
