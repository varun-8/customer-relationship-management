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
import { ColumnSettingsModal } from './ColumnSettingsModal';
import { LostSaleModal } from '../lost-sales/LostSaleModal';

export const CustomerListTable = ({ onAddCustomer, onEditCustomer, onViewCustomer }) => {
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
    activeForm,
    deleteCustomer,
  } = useCustomer();

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

  // Real MongoDB Atlas Data Metrics Computation
  const totalCount = pagination.total || customers.length;

  const buildingOwnersCount = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    return d.customerType === 'Building Owner';
  }).length;

  const totalQuotationsValue = customers.reduce((acc, c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    const val = Number(d.quotationValue) || Number(d.tileBudget) || Number(d.orderValue) || 0;
    return acc + val;
  }, 0);

  // Real calculation: Created this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthCount = customers.filter((c) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Real calculation: Pending follow-ups
  const pendingFollowUpsCount = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    return Boolean(d.nextFollowUp) || d.status === 'Follow-up';
  }).length;

  // Avatar styles
  const getAvatarStyle = (name = '') => {
    const char = (name.trim().charAt(0) || 'C').toUpperCase();
    switch (char) {
      case 'M': return { bg: '#EFF6FF', text: '#2563EB', char };
      case 'D': return { bg: '#ECFDF5', text: '#059669', char };
      case 'E': return { bg: '#F5F3FF', text: '#7C3AED', char };
      case 'S': return { bg: '#FFFBEB', text: '#D97706', char };
      case 'P': return { bg: '#FFF1F2', text: '#E11D48', char };
      case 'K': return { bg: '#EFF6FF', text: '#1D4ED8', char };
      case 'R': return { bg: '#F0FDFA', text: '#0F766E', char };
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

  // Real Pagination offsets
  const pageNumber = pagination.page || 1;
  const limitNumber = pagination.limit || 15;
  const totalPages = pagination.pages || Math.ceil(totalCount / limitNumber) || 1;
  const fromIndex = totalCount === 0 ? 0 : (pageNumber - 1) * limitNumber + 1;
  const toIndex = Math.min(totalCount, pageNumber * limitNumber);

  // Generate page numbers
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
        {/* 1. Total Customers */}
        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users size={18} />
          </div>
          <div>
            <div className="metric-value">{totalCount.toLocaleString('en-IN')}</div>
            <div className="metric-label">Total Customers</div>
          </div>
        </div>

        {/* 2. Active Customers */}
        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <UserCheck size={18} />
          </div>
          <div>
            <div className="metric-value">{buildingOwnersCount}</div>
            <div className="metric-label">Building Owners</div>
          </div>
        </div>

        {/* 3. Total Quotations */}
        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
            <FileText size={18} />
          </div>
          <div>
            <div className="metric-value">₹{totalQuotationsValue.toLocaleString('en-IN')}</div>
            <div className="metric-label">Total Pipeline (₹)</div>
          </div>
        </div>

        {/* 4. This Month */}
        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
            <Clock size={18} />
          </div>
          <div>
            <div className="metric-value">{thisMonthCount}</div>
            <div className="metric-label">This Month</div>
          </div>
        </div>

        {/* 5. Pending Follow-ups */}
        <div className="metric-card-item">
          <div className="metric-icon-box" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <Calendar size={18} />
          </div>
          <div>
            <div className="metric-value">{pendingFollowUpsCount}</div>
            <div className="metric-label">Pending Follow-ups</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon-pos" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by name, mobile, location, or customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* All Types Dropdown */}
          <div style={{ position: 'relative' }} ref={typeDropdownRef}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="dropdown-filter-btn"
            >
              <span>{customerType === 'all' ? 'All Types' : customerType}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>
            {showTypeDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: 0,
                  background: '#FFFFFF',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 20,
                  minWidth: '160px',
                  padding: '4px',
                }}
              >
                {['all', 'Building Owner', 'Mason', 'Architect', 'Engineer', 'Contractor', 'Builder', 'Referral', 'Other'].map((t) => (
                  <div
                    key={t}
                    onClick={() => {
                      setCustomerType(t);
                      setShowTypeDropdown(false);
                    }}
                    style={{
                      padding: '7px 12px',
                      fontSize: '12.5px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: customerType === t ? '#EFF6FF' : 'transparent',
                      color: customerType === t ? '#2563EB' : 'var(--text-primary)',
                      fontWeight: customerType === t ? '700' : '500',
                    }}
                  >
                    {t === 'all' ? 'All Types' : t}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Status Dropdown */}
          <div style={{ position: 'relative' }} ref={statusDropdownRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="dropdown-filter-btn"
            >
              <span>{status === 'all' ? 'All Status' : status}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>
            {showStatusDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: 0,
                  background: '#FFFFFF',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 20,
                  minWidth: '170px',
                  padding: '4px',
                }}
              >
                {['all', 'Newly Contacted', 'Walk-in', 'Quotation', 'Follow-up', 'Negotiation', 'Order Confirmed', 'Lost', 'Future Requirement'].map((s) => (
                  <div
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      setShowStatusDropdown(false);
                    }}
                    style={{
                      padding: '7px 12px',
                      fontSize: '12.5px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: status === s ? '#EFF6FF' : 'transparent',
                      color: status === s ? '#2563EB' : 'var(--text-primary)',
                      fontWeight: status === s ? '700' : '500',
                    }}
                  >
                    {s === 'all' ? 'All Status' : s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column Customizer / Filter Button */}
          <button
            className="dropdown-filter-btn"
            onClick={() => setShowColumnModal(true)}
            title="Configure Visible Columns"
          >
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <span>Columns</span>
          </button>

          {/* Primary Add Button */}
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

      {/* Real Data Table Container */}
      <div className="table-card-container">
        <table className="buildcrm-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('customerId')} style={{ width: '110px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>CUSTOMER ID</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th onClick={() => handleSort('data.customerName')} style={{ minWidth: '220px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>CUSTOMER NAME</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>MOBILE</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '130px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>CUSTOMER TYPE</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '115px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>HOUSE STAGE</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '135px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>STATUS</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>QUOTATION VALUE</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '125px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>NEXT FOLLOW-UP</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '135px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>SALESPERSON</span>
                  <ArrowUpDown size={11} color="var(--text-light)" />
                </div>
              </th>
              <th style={{ width: '85px', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#2563EB' }}>
                    <div className="spin" style={{ width: '20px', height: '20px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span style={{ fontWeight: '600' }}>Fetching real customer records from MongoDB Atlas...</span>
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '60px 20px' }}>
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

                // Real quotation value or currency
                const rawQuotation = data.quotationValue !== undefined && data.quotationValue !== null && data.quotationValue !== ''
                  ? Number(data.quotationValue)
                  : data.tileBudget !== undefined && data.tileBudget !== null && data.tileBudget !== ''
                  ? Number(data.tileBudget)
                  : null;

                const quotationFormatted = rawQuotation !== null && !isNaN(rawQuotation)
                  ? `₹${rawQuotation.toLocaleString('en-IN')}`
                  : '—';

                // Real follow up date formatting
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

                return (
                  <tr
                    key={c._id}
                    onClick={() => onViewCustomer(c)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    className="customer-table-row"
                  >
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
                            href={`https://wa.me/${String(data.phone).replace(/[^0-9]/g, '').length === 10 ? '91' + String(data.phone).replace(/[^0-9]/g, '') : String(data.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${data.customerName || ''}, greeting from BuildCRM!`)}`}
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

                    <td style={{ whiteSpace: 'nowrap' }}>
                      {data.houseStage ? (
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {data.houseStage}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>

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

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '800', color: quotationFormatted !== '—' ? 'var(--text-primary)' : 'var(--text-light)', fontSize: '13px' }}>
                        {quotationFormatted}
                      </span>
                    </td>

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
                            if (confirm(`Delete customer ${c.customerId}?`)) {
                              deleteCustomer(c._id);
                            }
                          }}
                          className="btn-icon"
                          title="Delete Customer"
                          style={{ color: '#64748B', padding: '4px' }}
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

      {/* Real Dynamic Pagination Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Showing {fromIndex} to {toIndex} of {totalCount} customers
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Prev Button */}
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

          {/* Dynamic Page Buttons */}
          {getPageNumbers().map((p) => {
            const isCurrent = p === pageNumber;
            return (
              <button
                key={p}
                onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: isCurrent ? 'none' : '1px solid var(--border-default)',
                  background: isCurrent ? '#2563EB' : '#FFFFFF',
                  color: isCurrent ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: isCurrent ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            );
          })}

          {totalPages > 5 && <span style={{ color: 'var(--text-muted)', padding: '0 3px', fontSize: '12px' }}>...</span>}

          {totalPages > 5 && (
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: totalPages }))}
              style={{
                width: '34px',
                height: '30px',
                borderRadius: '6px',
                border: totalPages === pageNumber ? 'none' : '1px solid var(--border-default)',
                background: totalPages === pageNumber ? '#2563EB' : '#FFFFFF',
                color: totalPages === pageNumber ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: totalPages === pageNumber ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {totalPages}
            </button>
          )}

          {/* Next Button */}
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
          visibleColumnKeys={['customerId', 'customerName', 'phone', 'customerType', 'houseStage', 'status', 'quotationValue', 'nextFollowUp', 'salesperson']}
          setVisibleColumnKeys={() => {}}
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
            // Refresh customer list
            if (pagination?.fetchCustomers) pagination.fetchCustomers();
          }}
        />
      )}
    </div>
  );
};
