import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  UserCheck,
  FileText,
  Clock,
  Calendar,
  ChevronDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Phone,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Check,
  FileX,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useToneDown } from '../../context/ToneDownContext';
import { ColumnSettingsModal } from './ColumnSettingsModal';
import { LostSaleModal } from '../lost-sales/LostSaleModal';
import { ConnectionErrorState } from '../common/ConnectionErrorState';
import { getWhatsAppUrl } from '../../utils/whatsappHelper';

export const CustomerListTable = ({ onAddCustomer, onEditCustomer, onViewCustomer }) => {
  const { isToneDown } = useToneDown();
  const [markingLostCustomer, setMarkingLostCustomer] = useState(null);
  const {
    customers,
    pagination,
    setPagination,
    search,
    setSearch,
    customerType,
    setCustomerType,
    status,
    setStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    loading,
    fetchError,
    fetchCustomers,
    activeForm,
    deleteCustomer,
  } = useCustomer();

  const DEFAULT_COLUMNS = [
    'customerId',
    'customerName',
    'phone',
    'customerType',
    'houseStage',
    'status',
    'quotationValue',
    'nextFollowUp',
    'salesperson',
  ];

  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('vasantham_crm_visible_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch (e) {
      return DEFAULT_COLUMNS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vasantham_crm_visible_columns', JSON.stringify(visibleColumnKeys));
    } catch (e) {
      console.warn('Failed to save column visibility:', e);
    }
  }, [visibleColumnKeys]);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const typeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (field) => {
    const key = field.startsWith('data.') || ['customerId', 'createdAt'].includes(field) ? field : `data.${field}`;
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const copyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics Computation
  const totalCount = pagination.total || customers.length;

  const buildingOwnersCount = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    return d.customerType === 'Building Owner';
  }).length;

  const totalQuotationsValue = customers.reduce((acc, c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    const val = Number(d.quotationValue || d.tileBudget || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const activeFollowupsCount = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    return d.status === 'Follow-up' || d.status === 'In Progress';
  }).length;

  const confirmedOrdersCount = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    return d.status === 'Order Confirmed';
  }).length;

  const getAvatarStyle = (name = '') => {
    const char = (name.charAt(0) || 'C').toUpperCase();
    switch (char) {
      case 'A': case 'B': case 'C': return { bg: '#EFF6FF', text: '#2563EB', char };
      case 'D': case 'E': case 'F': return { bg: '#ECFDF5', text: '#059669', char };
      case 'G': case 'H': case 'I': return { bg: '#FFFBEB', text: '#D97706', char };
      case 'J': case 'K': case 'L': return { bg: '#F5F3FF', text: '#7C3AED', char };
      case 'M': case 'N': case 'O': return { bg: '#FEF2F2', text: '#DC2626', char };
      default: return { bg: '#F1F5F9', text: '#475569', char };
    }
  };

  const getTypeStyle = (type = '') => {
    switch (type) {
      case 'Building Owner':
      case 'BUILDING OWNER':
        return { bg: '#ECFDF5', text: '#059669' };
      case 'Mason':
      case 'MASON':
        return { bg: '#FFFBEB', text: '#D97706' };
      case 'Architect':
      case 'ARCHITECT':
        return { bg: '#EFF6FF', text: '#2563EB' };
      case 'Engineer':
      case 'Contractor':
      case 'Builder':
        return { bg: '#F5F3FF', text: '#7C3AED' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const getStatusStyle = (statusVal = '') => {
    switch (statusVal) {
      case 'Order Confirmed':
      case 'ORDER CONFIRMED':
        return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
      case 'Quotation':
      case 'QUOTATION':
        return { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' };
      case 'Negotiation':
      case 'NEGOTIATION':
        return { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' };
      case 'Newly Contacted':
      case 'NEWLY CONTACTED':
        return { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' };
      case 'Follow-up':
      case 'FOLLOW-UP':
        return { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' };
      case 'Lost':
      case 'LOST':
        return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
      default:
        return { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' };
    }
  };

  // Pagination offsets
  const pageNumber = pagination.page || 1;
  const limitNumber = pagination.limit || 15;
  const totalPages = pagination.pages || Math.ceil(totalCount / limitNumber) || 1;
  const fromIndex = totalCount === 0 ? 0 : (pageNumber - 1) * limitNumber + 1;
  const toIndex = Math.min(totalCount, pageNumber * limitNumber);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      pages.push(i);
    }
    return pages;
  };

  const customFields = (activeForm?.fields || []).filter((f) => f.active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 5 Real Metric Cards */}
      <div className="metrics-row-5">
        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users size={18} />
          </div>
          <div>
            <div className="metric-value">{totalCount.toLocaleString('en-IN')}</div>
            <div className="metric-label">Total Customers</div>
          </div>
        </div>

        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <UserCheck size={18} />
          </div>
          <div>
            <div className="metric-value">{buildingOwnersCount}</div>
            <div className="metric-label">Building Owners</div>
          </div>
        </div>

        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <FileText size={18} />
          </div>
          <div>
            <div className="metric-value">₹{(totalQuotationsValue / 100000).toFixed(2)}L</div>
            <div className="metric-label">Quotes Value</div>
          </div>
        </div>

        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <Clock size={18} />
          </div>
          <div>
            <div className="metric-value">{activeFollowupsCount}</div>
            <div className="metric-label">Active Follow-ups</div>
          </div>
        </div>

        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
            <Calendar size={18} />
          </div>
          <div>
            <div className="metric-value">{confirmedOrdersCount}</div>
            <div className="metric-label">Confirmed Orders</div>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div
        className="control-bar-container"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {/* Enhanced Search Input */}
          <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by customer name, ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: search ? '32px' : '14px',
                paddingTop: '9px',
                paddingBottom: '9px',
                backgroundColor: '#F8FAFC',
                border: '1.2px solid #CBD5E1',
                borderRadius: '11px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0F172A',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '9px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Customer Type Dropdown */}
          <div className="dropdown-wrapper" ref={typeDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              style={{
                backgroundColor: customerType !== 'all' ? '#EFF6FF' : '#FFFFFF',
                border: `1.2px solid ${customerType !== 'all' ? '#BFDBFE' : '#CBD5E1'}`,
                borderRadius: '11px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: '700',
                color: customerType !== 'all' ? '#1D4ED8' : '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🏢 {customerType === 'all' ? 'All Customer Types' : customerType}</span>
              <ChevronDown size={14} color={customerType !== 'all' ? '#1D4ED8' : '#64748B'} />
            </button>
            {showTypeDropdown && (
              <div
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 20,
                  marginTop: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  padding: '6px',
                }}
              >
                {['all', 'Building Owner', 'Contractor', 'Architect', 'Engineer', 'Mason'].map((t) => (
                  <div
                    key={t}
                    onClick={() => {
                      setCustomerType(t);
                      setShowTypeDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: customerType === t ? '800' : '600',
                      color: customerType === t ? '#2563EB' : '#334155',
                      backgroundColor: customerType === t ? '#EFF6FF' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'all' ? 'All Customer Types' : t}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="dropdown-wrapper" ref={statusDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{
                backgroundColor: status !== 'all' ? '#ECFDF5' : '#FFFFFF',
                border: `1.2px solid ${status !== 'all' ? '#A7F3D0' : '#CBD5E1'}`,
                borderRadius: '11px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: '700',
                color: status !== 'all' ? '#047857' : '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>📋 {status === 'all' ? 'All Statuses' : status}</span>
              <ChevronDown size={14} color={status !== 'all' ? '#047857' : '#64748B'} />
            </button>
            {showStatusDropdown && (
              <div
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 20,
                  marginTop: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  minWidth: '190px',
                  padding: '6px',
                }}
              >
                {['all', 'Follow-up', 'Quotation', 'Negotiation', 'Order Confirmed', 'Lost'].map((s) => (
                  <div
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      setShowStatusDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: status === s ? '800' : '600',
                      color: status === s ? '#059669' : '#334155',
                      backgroundColor: status === s ? '#ECFDF5' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {s === 'all' ? 'All Statuses' : s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowColumnModal(true)}
            style={{
              backgroundColor: '#F8FAFC',
              border: '1.2px solid #CBD5E1',
              borderRadius: '11px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Configure Table Columns"
          >
            <SlidersHorizontal size={14} />
            <span>Columns ({visibleColumnKeys.length})</span>
          </button>

          <button
            onClick={onAddCustomer}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px' }}
          >
            <Plus size={15} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-card-container">
        <table className="buildcrm-table">
          <thead>
            <tr>
              {visibleColumnKeys.includes('customerId') && (
                <th onClick={() => handleSort('customerId')} style={{ width: '110px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>CUSTOMER ID</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('customerName') && (
                <th onClick={() => handleSort('data.customerName')} style={{ minWidth: '220px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>CUSTOMER NAME</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('phone') && (
                <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>MOBILE</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('customerType') && (
                <th style={{ width: '130px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>CUSTOMER TYPE</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('houseStage') && (
                <th style={{ width: '115px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>HOUSE STAGE</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('status') && (
                <th style={{ width: '135px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>STATUS</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('quotationValue') && (
                <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>QUOTATION VALUE</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('nextFollowUp') && (
                <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>NEXT FOLLOW-UP</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('salesperson') && (
                <th style={{ width: '135px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>SALESPERSON</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('createdAt') && (
                <th onClick={() => handleSort('createdAt')} style={{ width: '125px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>CREATED DATE</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {visibleColumnKeys.includes('createdBy') && (
                <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>CREATED BY</span>
                    <ArrowUpDown size={11} color="var(--text-light)" />
                  </div>
                </th>
              )}

              {customFields.map((f) => visibleColumnKeys.includes(f.name) && (
                <th key={f.name} style={{ width: '130px', whiteSpace: 'nowrap' }}>
                  <span>{f.label.toUpperCase()}</span>
                </th>
              ))}

              <th style={{ width: '85px', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumnKeys.length + 1} style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#2563EB' }}>
                    <div className="spin" style={{ width: '20px', height: '20px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span style={{ fontWeight: '600' }}>Fetching customer records from database...</span>
                  </div>
                </td>
              </tr>
            ) : fetchError && customers.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnKeys.length + 1} style={{ padding: '30px 20px' }}>
                  <ConnectionErrorState
                    title="Unable to Reach CRM Server"
                    message={fetchError}
                    onRetry={() => fetchCustomers()}
                  />
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnKeys.length + 1} style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    No customer records found
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {search ? `No records matching "${search}".` : 'Click "+ Add Customer" to register your first record.'}
                  </p>
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const data = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
                const avatar = getAvatarStyle(data.customerName || '');
                const typeStyle = getTypeStyle(data.customerType);
                const statusStyle = getStatusStyle(data.status);

                const rawQuotation = data.quotationValue !== undefined && data.quotationValue !== null && data.quotationValue !== ''
                  ? Number(data.quotationValue)
                  : data.tileBudget !== undefined && data.tileBudget !== null && data.tileBudget !== ''
                  ? Number(data.tileBudget)
                  : null;

                const quotationFormatted = rawQuotation !== null && !isNaN(rawQuotation)
                  ? `₹${rawQuotation.toLocaleString('en-IN')}`
                  : '—';

                let followUpFormatted = '—';
                if (data.nextFollowUp) {
                  try {
                    const parsedDate = new Date(data.nextFollowUp);
                    if (!isNaN(parsedDate.getTime())) {
                      followUpFormatted = parsedDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                    } else {
                      followUpFormatted = String(data.nextFollowUp);
                    }
                  } catch (e) {
                    followUpFormatted = String(data.nextFollowUp);
                  }
                }

                const salesperson = data.salesperson || '—';
                const createdDateFormatted = c.createdAt
                  ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';

                return (
                  <tr
                    key={c._id}
                    onClick={() => onViewCustomer(c)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    className="customer-table-row"
                  >
                    {visibleColumnKeys.includes('customerId') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            className="id-badge"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewCustomer(c);
                            }}
                            title="View Customer Profile"
                          >
                            {c.customerId || 'CUS-NEW'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyId(c.customerId, e);
                            }}
                            className="btn-icon"
                            style={{ padding: '2px' }}
                            title="Copy ID"
                          >
                            {copiedId === c.customerId ? (
                              <Check size={11} color="var(--emerald-600)" />
                            ) : (
                              <Copy size={11} color="var(--text-light)" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}

                    {visibleColumnKeys.includes('customerName') && (
                      <td style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            className="avatar-initial"
                            style={{ backgroundColor: avatar.bg, color: avatar.text }}
                          >
                            {avatar.char}
                          </div>
                          <div style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontWeight: '700',
                                  color: 'var(--text-primary)',
                                  fontSize: '13px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {data.customerName || 'Unnamed Customer'}
                              </span>
                              {(data.leadSource === 'Existing Customer' || data.isRepeatCustomer) && (
                                <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '1px 5px', borderRadius: '4px' }}>
                                  🔄 Repeat
                                </span>
                              )}
                            </div>
                            {data.location ? (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px', whiteSpace: 'nowrap' }}>
                                <MapPin size={10} color="var(--text-light)" />
                                <span>{data.location}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    )}

                    {visibleColumnKeys.includes('phone') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {data.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                            <a
                              href={`tel:${data.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                              className="mono"
                            >
                              <Phone size={11} color="var(--text-light)" />
                              {data.phone}
                            </a>
                            <a
                              href={getWhatsAppUrl(data.phone, data)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Chat on WhatsApp"
                              style={{
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: '#DCFCE7',
                                color: '#15803D',
                                fontSize: '10px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                border: '1px solid #86EFAC',
                              }}
                            >
                              WA
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    )}

                    {visibleColumnKeys.includes('customerType') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {data.customerType ? (
                          <span
                            className="type-capsule"
                            style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                          >
                            {String(data.customerType).toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    )}

                    {visibleColumnKeys.includes('houseStage') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {data.houseStage ? (
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {data.houseStage}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    )}

                    {visibleColumnKeys.includes('status') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {data.status ? (
                          <span
                            className="status-dot-capsule"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          >
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusStyle.dot }} />
                            <span>{String(data.status).toUpperCase()}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    )}

                    {visibleColumnKeys.includes('quotationValue') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '800', color: quotationFormatted !== '—' ? 'var(--text-primary)' : 'var(--text-light)', fontSize: '13px' }}>
                          {quotationFormatted}
                        </span>
                      </td>
                    )}

                    {visibleColumnKeys.includes('nextFollowUp') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {followUpFormatted !== '—' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '12px', fontWeight: '500' }}>
                            <Calendar size={12} color="#10B981" />
                            <span>{followUpFormatted}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    )}

                    {visibleColumnKeys.includes('salesperson') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {salesperson !== '—' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#F1F5F9',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {salesperson.charAt(0)}
                            </div>
                            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                              {salesperson}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    )}

                    {visibleColumnKeys.includes('createdAt') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {createdDateFormatted}
                        </span>
                      </td>
                    )}

                    {visibleColumnKeys.includes('createdBy') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {c.createdBy?.name || 'System'}
                        </span>
                      </td>
                    )}

                    {customFields.map((f) => visibleColumnKeys.includes(f.name) && (
                      <td key={f.name} style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {data[f.name] !== undefined && data[f.name] !== null ? String(data[f.name]) : '—'}
                        </span>
                      </td>
                    ))}

                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCustomer(c);
                          }}
                          className="btn-icon"
                          title="View Details & Follow-up History"
                          style={{ color: '#0D9488', padding: '4px' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCustomer(c);
                          }}
                          className="btn-icon"
                          title="Edit Customer"
                          style={{ color: '#2563EB', padding: '4px' }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarkingLostCustomer({
                              customerId: c.customerId,
                              customerName: data.customerName,
                              phone: data.phone,
                              quotationValue: data.quotationValue || data.orderValue || data.tileBudget,
                              salesperson: data.salesperson,
                              requirement: data.requirement,
                            });
                          }}
                          className="btn-icon"
                          title="Record Lost Sale & Competitor Analysis"
                          style={{ color: '#DC2626', padding: '4px' }}
                        >
                          <FileX size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete customer record for "${data.customerName || 'Unnamed'}"?`)) {
                              deleteCustomer(c._id || c.customerId);
                            }
                          }}
                          className="btn-icon"
                          title="Delete Record"
                          style={{ color: '#EF4444', padding: '4px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Pagination Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Showing <strong>{fromIndex}</strong> to <strong>{toIndex}</strong> of <strong>{totalCount}</strong> customer records
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pageNumber <= 1}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
              color: pageNumber <= 1 ? 'var(--text-light)' : 'var(--text-secondary)',
            }}
          >
            <ChevronLeft size={13} />
          </button>

          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                border: pageNumber === p ? 'none' : '1px solid var(--border-default)',
                background: pageNumber === p ? 'var(--primary-600)' : '#FFFFFF',
                color: pageNumber === p ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: pageNumber === p ? '700' : '500',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}

          {totalPages > 5 && (
            <span style={{ fontSize: '12px', color: 'var(--text-light)', padding: '0 4px' }}>...</span>
          )}

          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={pageNumber >= totalPages}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: pageNumber >= totalPages ? 'not-allowed' : 'pointer',
              color: pageNumber >= totalPages ? 'var(--text-light)' : 'var(--text-secondary)',
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Column Customizer Modal */}
      {showColumnModal && (
        <ColumnSettingsModal
          allFields={customFields}
          visibleColumnKeys={visibleColumnKeys}
          setVisibleColumnKeys={setVisibleColumnKeys}
          onClose={() => setShowColumnModal(false)}
        />
      )}

      {/* Lost Sale Recording Modal */}
      {markingLostCustomer && (
        <LostSaleModal
          customer={markingLostCustomer}
          onClose={() => setMarkingLostCustomer(null)}
          onSaved={() => {
            setMarkingLostCustomer(null);
            if (pagination?.fetchCustomers) pagination.fetchCustomers();
          }}
        />
      )}
    </div>
  );
};
