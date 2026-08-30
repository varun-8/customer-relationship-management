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
  LayoutGrid,
  List,
  Copy,
  Check,
  Crown,
  Activity,
  ArrowUpRight,
  Filter,
  UserCheck,
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'tabFadeInUp 0.3s ease' }}>
      
      {/* 1. Modern Page Header Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 12px 30px -6px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Glowing Background Circles Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(38, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38BDF8',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Activity size={12} /> SHOWROOM TEAM DIRECTORY
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#4ADE80',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#4ADE80',
                  boxShadow: '0 0 6px #4ADE80',
                }}
              />
              {activeUsers} Active Logins
            </span>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
            Showroom Staff Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0', maxWidth: '560px', lineHeight: '1.4' }}>
            Manage staff credentials, allocate mobile CRM access roles, and control active mobile sessions for your showroom team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 22px',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s ease',
          }}
          className="btn-glow-effect"
        >
          <UserPlus size={18} />
          <span>+ Register Staff Member</span>
        </button>
      </div>

      {/* 2. Premium Metric Analytics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Total Team */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Showroom Team
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '4px', lineHeight: 1.1 }}>
              {totalUsers}
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px', fontWeight: '600' }}>
              Registered profiles
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#EFF6FF',
              border: '1px solid #DBEAFE',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
        </div>

        {/* Card 2: Sales Executives */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sales Executives
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB', marginTop: '4px', lineHeight: 1.1 }}>
              {employeeCount}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
              Floor & Field Staff
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Briefcase size={22} />
          </div>
        </div>

        {/* Card 3: Showroom Owners */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Showroom Owners
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#7C3AED', marginTop: '4px', lineHeight: 1.1 }}>
              {ownerCount}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
              Full Admin Privileges
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Crown size={22} />
          </div>
        </div>

        {/* Card 4: Active Mobile Credentials */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Mobile Logins
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', marginTop: '4px', lineHeight: 1.1 }}>
              {activeUsers}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
              Enabled mobile accounts
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={22} />
          </div>
        </div>
      </div>

      {/* 3. Control Toolbar (Search, Filter Tabs & View Switcher) */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* Left Group: Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by staff name, email, phone..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '12px',
                fontSize: '13px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontWeight: '600',
                outline: 'none',
              }}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  border: 'none',
                  background: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
            {[
              { id: 'all', label: 'All Team', count: totalUsers },
              { id: 'employee', label: 'Sales Execs', count: employeeCount },
              { id: 'owner', label: 'Owners', count: ownerCount },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleFilter(r.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: roleFilter === r.id ? '#FFFFFF' : 'transparent',
                  color: roleFilter === r.id ? '#2563EB' : '#64748B',
                  boxShadow: roleFilter === r.id ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  fontSize: '12.5px',
                  fontWeight: roleFilter === r.id ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{r.label}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: roleFilter === r.id ? '#EFF6FF' : 'rgba(148, 163, 184, 0.2)',
                    color: roleFilter === r.id ? '#2563EB' : '#64748B',
                    fontWeight: '800',
                  }}
                >
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Group: View Switcher & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '2px', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? '#0F172A' : '#64748B',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700',
              }}
              title="Grid Card View"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? '#0F172A' : '#64748B',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700',
              }}
              title="Table View"
            >
              <List size={15} />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#475569',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Refresh staff directory"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4. Staff Content Section (Grid Cards vs Table View) */}
      {error && users.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #E2E8F0' }}>
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
            borderRadius: '18px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}
        >
          <RefreshCw size={30} color="#2563EB" className="spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748B', fontWeight: '700', fontSize: '14px', margin: 0 }}>
            Fetching showroom staff profiles & credentials...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#94A3B8',
            }}
          >
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            No staff records found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 16px 0' }}>
            {search || roleFilter !== 'all'
              ? 'No staff members match your current filter settings.'
              : 'Register staff members to grant mobile CRM access and manage showroom leads.'}
          </p>
          {(search || roleFilter !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#1E293B',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingEmployee(null);
                setShowModal(true);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              + Register Staff Member
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
          }}
        >
          {filteredUsers.map((u) => {
            const isOwner = u.role === 'owner';
            const isPrimaryAdmin = u.email === 'owner@vasantham.com';
            const isActive = u.active !== false;
            const initial = (u.name || 'S').charAt(0).toUpperCase();

            return (
              <div
                key={u._id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                className="staff-profile-card"
              >
                {/* Header Badge Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {isOwner ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 11px',
                        borderRadius: '10px',
                        background: '#F5F3FF',
                        border: '1px solid #DDD6FE',
                        color: '#7C3AED',
                        fontSize: '11px',
                        fontWeight: '800',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <Crown size={12} /> SHOWROOM OWNER
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 11px',
                        borderRadius: '10px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        fontSize: '11px',
                        fontWeight: '800',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <Briefcase size={12} /> SALES EXECUTIVE
                    </span>
                  )}

                  {/* Active Status Pill */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    style={{
                      background: isActive ? '#ECFDF5' : '#F1F5F9',
                      border: `1px solid ${isActive ? '#A7F3D0' : '#CBD5E1'}`,
                      color: isActive ? '#047857' : '#64748B',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Click to toggle account status"
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isActive ? '#10B981' : '#94A3B8',
                        boxShadow: isActive ? '0 0 6px #10B981' : 'none',
                      }}
                    />
                    <span>{isActive ? 'Active Login' : 'Inactive'}</span>
                  </button>
                </div>

                {/* Profile Identity Block */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: isOwner
                        ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                        : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '18px',
                      boxShadow: isOwner
                        ? '0 6px 16px rgba(124, 58, 237, 0.25)'
                        : '0 6px 16px rgba(37, 99, 235, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          color: '#0F172A',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {u.name}
                      </h3>
                      {isPrimaryAdmin && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: '900',
                            color: '#7C3AED',
                            background: '#F5F3FF',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            border: '1px solid #DDD6FE',
                            flexShrink: 0,
                          }}
                        >
                          PRIMARY
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: '600' }}>
                      {isOwner ? 'Showroom Owner & Director' : 'Showroom Sales Executive'}
                    </div>
                  </div>
                </div>

                {/* Credentials & Contact Info Box */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: '1px solid #F1F5F9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {/* Email / Login ID */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <Mail size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '12.5px',
                          color: '#334155',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: 'monospace',
                        }}
                      >
                        {u.email}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(u.email, `email_${u._id}`)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: copiedId === `email_${u._id}` ? '#059669' : '#94A3B8',
                        cursor: 'pointer',
                        padding: '2px 4px',
                      }}
                      title="Copy Email ID"
                    >
                      {copiedId === `email_${u._id}` ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>

                  {/* Phone */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>
                      {u.phone ? u.phone : 'No phone linked'}
                    </span>
                  </div>
                </div>

                {/* Capabilities Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {isOwner ? (
                    <>
                      <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        👑 Full Admin Rights
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        📊 Executive Analytics
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        📱 Mobile CRM
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        ⚡ Lead Entry
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        📋 Quotations
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        📱 Mobile App Access
                      </span>
                    </>
                  )}
                </div>

                {/* Action Footer */}
                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmployee(u);
                      setShowModal(true);
                    }}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      color: '#2563EB',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Profile</span>
                  </button>

                  {!isPrimaryAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECDD3',
                        color: '#DC2626',
                        padding: '7px 12px',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                      title="Remove staff member"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STRUCTURED TABLE VIEW */
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            overflow: 'hidden',
          }}
        >
          <div className="table-responsive">
            <table className="kpi-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Staff Name</th>
                  <th>Mobile Login ID</th>
                  <th>Showroom Access Role</th>
                  <th>Contact Phone</th>
                  <th>Mobile Account Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
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
                      {/* Name & Avatar */}
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '11px',
                              background: isOwner
                                ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '900',
                              fontSize: '14px',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                              {u.name}
                            </div>
                            {isPrimaryAdmin && (
                              <span style={{ fontSize: '10px', color: '#7C3AED', fontWeight: '900' }}>
                                ★ PRIMARY ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Login Email */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontSize: '12.5px', fontFamily: 'monospace' }}>
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
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: '#F5F3FF',
                              border: '1px solid #DDD6FE',
                              color: '#7C3AED',
                              fontSize: '11.5px',
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
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              fontSize: '11.5px',
                              fontWeight: '800',
                            }}
                          >
                            💼 Sales Executive
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '12.5px' }}>
                          <Phone size={13} color="#94A3B8" />
                          <span>{u.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            background: isActive ? '#ECFDF5' : '#F1F5F9',
                            color: isActive ? '#047857' : '#64748B',
                            border: `1px solid ${isActive ? '#A7F3D0' : '#CBD5E1'}`,
                            padding: '4px 11px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isActive ? '#10B981' : '#94A3B8',
                            }}
                          />
                          <span>{isActive ? 'Active Login' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(u);
                              setShowModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #DBEAFE',
                              background: '#EFF6FF',
                              color: '#2563EB',
                              fontSize: '12px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          {!isPrimaryAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #FECDD3',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                              title="Delete staff member"
                            >
                              <Trash2 size={13} />
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
