import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Download,
  Eye,
  Printer,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  UserCheck,
  TrendingUp,
  Users,
  Clock,
  FileX,
  Award,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useBranding } from '../../context/BrandingContext';
import { useToast } from '../../context/ToastContext';
import { generatePdfReport, exportToCSV } from '../../utils/reportPdfGenerator';

// Comprehensive Helper Functions to Extract Customer Fields across all MongoDB Schema & Mongoose Map variants
const extractDataObj = (item) => {
  if (!item) return {};
  if (item.data instanceof Map) {
    return Object.fromEntries(item.data);
  }
  if (item.data && typeof item.data === 'object') {
    return item.data;
  }
  return item;
};

const extractCustomerName = (item) => {
  if (!item) return 'Unnamed Customer';
  const d = extractDataObj(item);
  const val =
    d.name ||
    d.customerName ||
    d.nameOfCustomer ||
    d.fullName ||
    d.clientName ||
    item.customerName ||
    item.name;
  return val && val !== 'null' && val !== 'undefined' ? String(val) : 'Unnamed Customer';
};

const extractSalesperson = (item) => {
  if (!item) return 'Unassigned';
  const d = extractDataObj(item);
  const val =
    d.salesperson ||
    d.assignedTo ||
    d.salesExecutive ||
    d.executive ||
    (typeof item.assignedTo === 'object' ? item.assignedTo?.name : item.assignedTo) ||
    item.salesperson ||
    item.salesExecutive ||
    (typeof item.createdBy === 'object' ? item.createdBy?.name : item.createdBy);
  return val && val !== 'null' && val !== 'undefined' ? String(val) : 'Unassigned';
};

const extractPhone = (item) => {
  if (!item) return '-';
  const d = extractDataObj(item);
  const val = d.phone || d.phoneNumber || d.mobile || item.customerPhone || item.phone;
  return val && val !== 'null' && val !== 'undefined' ? String(val) : '-';
};

const extractQuoteValue = (item) => {
  if (!item) return 0;
  const d = extractDataObj(item);
  return Number(d.quoteValue || d.quotationValue || item.quoteValue || item.lostAmount || 0);
};

const extractCity = (item) => {
  if (!item) return '-';
  const d = extractDataObj(item);
  const val = d.city || d.projectCity || d.location || d.address || item.city;
  return val && val !== 'null' && val !== 'undefined' ? String(val) : '-';
};

const extractRequirement = (item) => {
  if (!item) return '-';
  const d = extractDataObj(item);
  const val = d.requirementType || d.requirements || d.productRequirement || item.requirement;
  return val && val !== 'null' && val !== 'undefined' ? String(val) : '-';
};

const extractStatus = (item) => {
  if (!item) return 'New';
  const d = extractDataObj(item);
  const val = d.status || item.status || 'New';
  return String(val);
};

const REPORT_TYPES = [
  {
    id: 'executive',
    label: 'Executive Revenue Report',
    shortLabel: 'Executive Revenue',
    icon: TrendingUp,
    color: '#2563EB',
    desc: 'High-level showroom sales revenue, quotation totals, and conversion rates',
  },
  {
    id: 'customers',
    label: 'Customer Leads & Pipeline',
    shortLabel: 'Leads & Pipeline',
    icon: Users,
    color: '#059669',
    desc: 'Detailed breakdown of customer leads by stage, value, and source',
  },
  {
    id: 'followups',
    label: 'Follow-up Activity & Schedule',
    shortLabel: 'Follow-up Logs',
    icon: Clock,
    color: '#D97706',
    desc: 'Pending call logs, appointment schedules, and overdue follow-up tasks',
  },
  {
    id: 'lost',
    label: 'Lost Sales & Competitor Intel',
    shortLabel: 'Lost Sales Intel',
    icon: FileX,
    color: '#E11D48',
    desc: 'Dropped quotations, lost revenue totals, and competitor reason analysis',
  },
  {
    id: 'staff',
    label: 'Staff Performance Matrix',
    shortLabel: 'Staff Matrix',
    icon: Award,
    color: '#0EA5E9',
    desc: 'Sales executive conversion metrics, deal volume, and activity contribution',
  },
];

const DATE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

export const ReportsView = () => {
  const { branding } = useBranding();
  const toast = useToast();

  const [activeReportId, setActiveReportId] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Filters State
  const [datePreset, setDatePreset] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Raw API Data Storage
  const [reportData, setReportData] = useState([]);

  // Load Staff dropdown on mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.getUsers();
        if (res && res.data) {
          setStaffList(res.data);
        }
      } catch (e) {
        console.warn('Failed to load staff for report filters:', e);
      }
    };
    fetchStaff();
  }, []);

  // Compute actual date range bounds from preset
  const computedDateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return { start: todayStr, end: todayStr };
    }
    if (datePreset === 'this_week') {
      const first = now.getDate() - now.getDay();
      const firstDay = new Date(now.setDate(first));
      return { start: firstDay.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    }
    if (datePreset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    }
    if (datePreset === 'last_30_days') {
      const past30 = new Date(now.setDate(now.getDate() - 30));
      return { start: past30.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    }
    if (datePreset === 'custom') {
      return { start: startDate, end: endDate };
    }
    return { start: '', end: '' };
  }, [datePreset, startDate, endDate]);

  // Fetch Report Data based on Active Tab & Filters
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeReportId === 'executive') {
        const res = await api.getCustomers({ limit: 500 });
        const customers = res?.data?.customers || res?.data || [];
        setReportData(customers);
      } else if (activeReportId === 'customers') {
        const res = await api.getCustomers({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          assignedTo: selectedStaff !== 'all' ? selectedStaff : undefined,
          search: searchQuery || undefined,
          limit: 500,
        });
        setReportData(res?.data?.customers || res?.data || []);
      } else if (activeReportId === 'followups') {
        const res = await api.getFollowupsList({
          assignedTo: selectedStaff !== 'all' ? selectedStaff : undefined,
          priority: selectedStatus !== 'all' ? selectedStatus : undefined,
          limit: 500,
        });
        setReportData(res?.data?.followups || res?.data || []);
      } else if (activeReportId === 'lost') {
        const res = await api.getLostSales({
          reason: selectedStatus !== 'all' ? selectedStatus : undefined,
          salesExecutive: selectedStaff !== 'all' ? selectedStaff : undefined,
          limit: 500,
        });
        setReportData(res?.data?.lostSales || res?.data || []);
      } else if (activeReportId === 'staff') {
        const [usersRes, custRes] = await Promise.all([
          api.getUsers(),
          api.getCustomers({ limit: 1000 }),
        ]);
        const users = usersRes?.data || [];
        const customers = custRes?.data?.customers || custRes?.data || [];

        // Aggregate staff metrics
        const staffMetrics = users.map((u) => {
          const userCusts = customers.filter((c) => {
            const sp = extractSalesperson(c);
            return (
              c.assignedTo?._id === u._id ||
              c.assignedTo === u.name ||
              sp.toLowerCase() === String(u.name).toLowerCase()
            );
          });
          const wonCusts = userCusts.filter(
            (c) => extractStatus(c).toLowerCase() === 'won'
          );
          const wonRevenue = wonCusts.reduce(
            (acc, curr) => acc + extractQuoteValue(curr),
            0
          );
          const totalQuotes = userCusts.reduce(
            (acc, curr) => acc + extractQuoteValue(curr),
            0
          );

          return {
            _id: u._id,
            name: u.name,
            role: u.role === 'owner' ? 'Showroom Owner' : 'Sales Executive',
            email: u.email,
            totalLeads: userCusts.length,
            wonDeals: wonCusts.length,
            conversionRate: userCusts.length > 0 ? ((wonCusts.length / userCusts.length) * 100).toFixed(1) + '%' : '0%',
            wonRevenue: wonRevenue,
            totalQuoteValue: totalQuotes,
          };
        });
        setReportData(staffMetrics);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      toast.error('Failed to load report dataset: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  }, [activeReportId, selectedStatus, selectedStaff, searchQuery, computedDateRange, toast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Client-side Filtered Records
  const filteredRecords = useMemo(() => {
    if (!Array.isArray(reportData)) return [];
    let items = [...reportData];

    // 1. Staff Filter (for reports that return customer/followup/lost records)
    if (selectedStaff !== 'all' && activeReportId !== 'staff') {
      items = items.filter((item) => {
        const sp = extractSalesperson(item);
        return sp.toLowerCase() === selectedStaff.toLowerCase();
      });
    }

    // 2. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = extractCustomerName(item);
        const phone = extractPhone(item);
        const salesperson = extractSalesperson(item);
        const id = item.customerId || item._id || '';
        return (
          name.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q) ||
          salesperson.toLowerCase().includes(q) ||
          String(id).toLowerCase().includes(q)
        );
      });
    }

    // 3. Date Filter
    if (computedDateRange.start && computedDateRange.end) {
      const startMs = new Date(computedDateRange.start).getTime();
      const endMs = new Date(computedDateRange.end).setHours(23, 59, 59, 999);

      items = items.filter((item) => {
        const dateVal = item.createdAt || item.date || item.lastActivityDate;
        if (!dateVal) return true;
        const t = new Date(dateVal).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    return items;
  }, [reportData, searchQuery, computedDateRange, selectedStaff, activeReportId]);

  // Report Specific Configuration (Columns & KPI Summaries)
  const reportConfig = useMemo(() => {
    const formatINR = (val) =>
      '₹' +
      Number(val || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 0,
      });

    if (activeReportId === 'executive') {
      // Filter ONLY order confirmed / closed won records for the revenue report
      const confirmedRecords = filteredRecords.filter((item) => {
        const st = extractStatus(item).toLowerCase();
        return ['won', 'closed won', 'order confirmed', 'confirmed'].includes(st);
      });

      const totalConfirmedRevenue = confirmedRecords.reduce(
        (acc, item) => acc + extractQuoteValue(item),
        0
      );

      const avgOrderValue =
        confirmedRecords.length > 0 ? totalConfirmedRevenue / confirmedRecords.length : 0;

      const distinctStaffCount = new Set(
        confirmedRecords.map((item) => extractSalesperson(item))
      ).size;

      const footRow = [
        'TOTAL REVENUE',
        `${confirmedRecords.length} Confirmed Orders`,
        '-',
        '-',
        `${distinctStaffCount} Executive(s)`,
        'ORDER CONFIRMED',
        formatINR(totalConfirmedRevenue),
      ];

      return {
        summaryCards: [
          { label: 'Confirmed Orders', value: confirmedRecords.length, color: '#059669' },
          { label: 'Confirmed Revenue Total', value: formatINR(totalConfirmedRevenue), color: '#2563EB' },
          { label: 'Avg Order Deal Size', value: formatINR(avgOrderValue), color: '#7C3AED' },
          { label: 'Contributing Executives', value: distinctStaffCount, color: '#D97706' },
        ],
        columns: [
          { header: 'Order ID', dataKey: 'customerId', width: 22, align: 'center' },
          { header: 'Customer Name', dataKey: 'name', width: 36, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 26, align: 'center' },
          { header: 'Requirement', dataKey: 'requirement', width: 28, align: 'left' },
          { header: 'Sales Person', dataKey: 'assignedTo', width: 28, align: 'left' },
          { header: 'Status', dataKey: 'statusBadge', width: 22, align: 'center' },
          { header: 'Confirmed Value', dataKey: 'quoteFormatted', width: 24, align: 'right' },
        ],
        rows: confirmedRecords.map((item) => ({
          customerId: item.customerId || '-',
          name: extractCustomerName(item),
          phone: extractPhone(item),
          requirement: extractRequirement(item),
          assignedTo: extractSalesperson(item),
          statusBadge: 'ORDER CONFIRMED',
          quoteFormatted: formatINR(extractQuoteValue(item)),
        })),
        footRow: footRow,
      };
    }

    if (activeReportId === 'customers') {
      return {
        summaryCards: [
          { label: 'Total Customers', value: filteredRecords.length, color: '#059669' },
          {
            label: 'New & Quoted Leads',
            value: filteredRecords.filter((r) =>
              ['new', 'quoted', 'negotiating'].includes(
                extractStatus(r).toLowerCase()
              )
            ).length,
            color: '#2563EB',
          },
          {
            label: 'Won Customers',
            value: filteredRecords.filter(
              (r) => extractStatus(r).toLowerCase() === 'won'
            ).length,
            color: '#10B981',
          },
          {
            label: 'Lost Opportunities',
            value: filteredRecords.filter(
              (r) => extractStatus(r).toLowerCase() === 'lost'
            ).length,
            color: '#E11D48',
          },
        ],
        columns: [
          { header: 'ID', dataKey: 'customerId', width: 22, align: 'center' },
          { header: 'Customer Name', dataKey: 'name', width: 36, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 26, align: 'center' },
          { header: 'Project Area', dataKey: 'city', width: 28, align: 'left' },
          { header: 'Assigned Executive', dataKey: 'assignedTo', width: 28, align: 'left' },
          { header: 'Stage', dataKey: 'status', width: 22, align: 'center' },
          { header: 'Quote Value', dataKey: 'quoteValue', width: 24, align: 'right' },
        ],
        rows: filteredRecords.map((item) => ({
          customerId: item.customerId || '-',
          name: extractCustomerName(item),
          phone: extractPhone(item),
          city: extractCity(item),
          assignedTo: extractSalesperson(item),
          status: extractStatus(item).toUpperCase(),
          quoteValue: formatINR(extractQuoteValue(item)),
        })),
      };
    }

    if (activeReportId === 'followups') {
      const overdueCount = filteredRecords.filter((f) => String(f.status).toLowerCase() === 'overdue').length;
      const pendingCount = filteredRecords.filter((f) => String(f.status).toLowerCase() === 'pending').length;
      const completedCount = filteredRecords.filter((f) => String(f.status).toLowerCase() === 'completed').length;

      return {
        summaryCards: [
          { label: 'Total Follow-up Logs', value: filteredRecords.length, color: '#D97706' },
          { label: 'Overdue Follow-ups', value: overdueCount, color: '#E11D48' },
          { label: 'Pending Calls', value: pendingCount, color: '#2563EB' },
          { label: 'Completed Follow-ups', value: completedCount, color: '#059669' },
        ],
        columns: [
          { header: 'Customer', dataKey: 'name', width: 40, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 28, align: 'center' },
          { header: 'Priority', dataKey: 'priority', width: 22, align: 'center' },
          { header: 'Scheduled Date', dataKey: 'scheduleDate', width: 28, align: 'center' },
          { header: 'Status', dataKey: 'status', width: 24, align: 'center' },
          { header: 'Assigned Executive', dataKey: 'assignedTo', width: 44, align: 'left' },
        ],
        rows: filteredRecords.map((item) => ({
          name: extractCustomerName(item),
          phone: extractPhone(item),
          priority: (item.priority || 'Medium').toUpperCase(),
          scheduleDate: item.nextFollowupDate
            ? new Date(item.nextFollowupDate).toLocaleDateString('en-IN')
            : '-',
          status: (item.status || 'Pending').toUpperCase(),
          assignedTo: extractSalesperson(item),
        })),
      };
    }

    if (activeReportId === 'lost') {
      const totalLostRevenue = filteredRecords.reduce(
        (acc, r) => acc + extractQuoteValue(r),
        0
      );

      return {
        summaryCards: [
          { label: 'Total Lost Opportunities', value: filteredRecords.length, color: '#E11D48' },
          { label: 'Total Lost Revenue Value', value: formatINR(totalLostRevenue), color: '#991B1B' },
        ],
        columns: [
          { header: 'Customer Name', dataKey: 'name', width: 38, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 28, align: 'center' },
          { header: 'Lost Reason', dataKey: 'reason', width: 34, align: 'left' },
          { header: 'Competitor', dataKey: 'competitor', width: 30, align: 'left' },
          { header: 'Lost Amount', dataKey: 'lostAmount', width: 26, align: 'right' },
          { header: 'Sales Executive', dataKey: 'salesExecutive', width: 30, align: 'left' },
        ],
        rows: filteredRecords.map((item) => ({
          name: extractCustomerName(item),
          phone: extractPhone(item),
          reason: item.reason || item.lostReason || 'Price High',
          competitor: item.competitor || 'Local Competitor',
          lostAmount: formatINR(extractQuoteValue(item)),
          salesExecutive: extractSalesperson(item),
        })),
      };
    }

    // Staff Performance Matrix
    const totalTeamRevenue = filteredRecords.reduce(
      (acc, r) => acc + (Number(r.wonRevenue) || 0),
      0
    );
    const totalTeamDeals = filteredRecords.reduce(
      (acc, r) => acc + (Number(r.wonDeals) || 0),
      0
    );

    return {
      summaryCards: [
        { label: 'Total Active Staff', value: filteredRecords.length, color: '#0EA5E9' },
        { label: 'Total Team Deals Won', value: totalTeamDeals, color: '#059669' },
        { label: 'Total Team Revenue Won', value: formatINR(totalTeamRevenue), color: '#2563EB' },
      ],
      columns: [
        { header: 'Staff Name', dataKey: 'name', width: 40, align: 'left' },
        { header: 'Role', dataKey: 'role', width: 34, align: 'left' },
        { header: 'Assigned Leads', dataKey: 'totalLeads', width: 26, align: 'center' },
        { header: 'Deals Won', dataKey: 'wonDeals', width: 24, align: 'center' },
        { header: 'Conversion Rate', dataKey: 'conversionRate', width: 28, align: 'center' },
        { header: 'Won Revenue', dataKey: 'wonRevenue', width: 34, align: 'right' },
      ],
      rows: filteredRecords.map((item) => ({
        name: item.name,
        role: item.role,
        totalLeads: item.totalLeads,
        wonDeals: item.wonDeals,
        conversionRate: item.conversionRate,
        wonRevenue: formatINR(item.wonRevenue),
      })),
    };
  }, [activeReportId, filteredRecords]);

  // Handle PDF Export / Print / Download
  const handleGeneratePdf = (actionType = 'download') => {
    const activeReport = REPORT_TYPES.find((r) => r.id === activeReportId);
    if (!activeReport) return;

    if (reportConfig.rows.length === 0) {
      toast.warning('No records found for the current report filters.');
      return;
    }

    const filtersText = [
      datePreset !== 'all' ? `Date: ${datePreset.replace('_', ' ')}` : 'Date: All Time',
      selectedStaff !== 'all' ? `Staff: ${selectedStaff}` : null,
      selectedStatus !== 'all' ? `Status: ${selectedStatus}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    generatePdfReport({
      reportTitle: activeReport.label,
      subtitle: activeReport.desc,
      branding: branding,
      filtersText: filtersText,
      summaryCards: reportConfig.summaryCards,
      columns: reportConfig.columns,
      rows: reportConfig.rows,
      footRow: reportConfig.footRow,
      fileName: `${activeReport.shortLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      action: actionType,
    });

    toast.success(`PDF ${actionType === 'download' ? 'downloaded' : 'generated'} successfully!`);
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    const activeReport = REPORT_TYPES.find((r) => r.id === activeReportId);
    if (!activeReport || reportConfig.rows.length === 0) {
      toast.warning('No records to export.');
      return;
    }

    exportToCSV(
      reportConfig.columns,
      reportConfig.rows,
      `${activeReport.shortLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    toast.success('CSV spreadsheet exported successfully!');
  };

  const currentReportObj = REPORT_TYPES.find((r) => r.id === activeReportId);

  return (
    <div className="reports-container">
      {/* 1. Header Navigation Bar */}
      <div className="reports-nav-header">
        <div className="reports-nav-grid">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            const isActive = activeReportId === report.id;
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => setActiveReportId(report.id)}
                className={`report-nav-card ${isActive ? 'report-nav-card-active' : ''}`}
                style={{
                  borderColor: isActive ? report.color : undefined,
                }}
              >
                <div
                  className="report-card-icon"
                  style={{
                    backgroundColor: isActive ? report.color : `${report.color}15`,
                    color: isActive ? '#FFFFFF' : report.color,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div className="report-card-text">
                  <div className="report-card-title">{report.shortLabel}</div>
                  <div className="report-card-subtitle">{report.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Filter Bar */}
      <div className="reports-filter-bar">
        <div className="filter-group-left">
          {/* Date Preset Filter */}
          <div className="filter-item">
            <label className="filter-label">
              <Calendar size={13} />
              <span>Date Range</span>
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="filter-select"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Inputs */}
          {datePreset === 'custom' && (
            <div className="filter-item-custom-dates">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-input-date"
              />
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-input-date"
              />
            </div>
          )}

          {/* Staff Filter */}
          <div className="filter-item">
            <label className="filter-label">
              <UserCheck size={13} />
              <span>Salesperson</span>
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Sales Executive</option>
              {staffList.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name} ({s.role === 'owner' ? 'Owner' : 'Sales'})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          {(activeReportId === 'customers' || activeReportId === 'followups' || activeReportId === 'lost') && (
            <div className="filter-item">
              <label className="filter-label">
                <Filter size={13} />
                <span>Filter Category</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {activeReportId === 'customers' && (
                  <>
                    <option value="new">New Lead</option>
                    <option value="quoted">Quoted</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="won">Closed Won</option>
                    <option value="lost">Closed Lost</option>
                  </>
                )}
                {activeReportId === 'followups' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                    <option value="high">High Priority</option>
                  </>
                )}
                {activeReportId === 'lost' && (
                  <>
                    <option value="Price High">Price High</option>
                    <option value="Competitor Lower Rate">Competitor Lower Rate</option>
                    <option value="Stock Not Available">Stock Not Available</option>
                    <option value="Delivery Delay">Delivery Delay</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Search Query */}
          <div className="filter-item filter-search-item">
            <div className="filter-search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search report records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
            </div>
          </div>
        </div>

        {/* Reset & Refresh */}
        <div className="filter-group-right">
          <button
            type="button"
            onClick={() => {
              setDatePreset('this_month');
              setStartDate('');
              setEndDate('');
              setSelectedStaff('all');
              setSelectedStatus('all');
              setSearchQuery('');
              fetchReportData();
            }}
            className="filter-reset-btn"
            title="Reset Filters"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3. Executive Report Generator Hub Plate (Ultra-Minimalist & Spacious) */}
      <div className="report-generator-hub-card">
        <div className="hub-card-content">
          <div className="hub-card-left">
            <div className="hub-badge" style={{ backgroundColor: `${currentReportObj.color}15`, color: currentReportObj.color }}>
              <FileText size={14} />
              <span>Report Ready for Export</span>
            </div>
            <h3 className="hub-title">{currentReportObj.label}</h3>
            <p className="hub-desc">{currentReportObj.desc}</p>

            {/* Active Parameters Pill Strip */}
            <div className="hub-params-strip">
              <div className="hub-param-tag">
                <Calendar size={12} />
                <span>Date: {datePreset.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div className="hub-param-tag">
                <UserCheck size={12} />
                <span>Staff: {selectedStaff}</span>
              </div>
              {selectedStatus !== 'all' && (
                <div className="hub-param-tag">
                  <Filter size={12} />
                  <span>Category: {selectedStatus}</span>
                </div>
              )}
              <div className="hub-param-tag count-tag">
                <span>{reportConfig.rows.length} {reportConfig.rows.length === 1 ? 'Record' : 'Records'} Included</span>
              </div>
            </div>

            <div className="hub-specs-note">
              <Sparkles size={13} color="#2563EB" />
              <span>Format: Minimalist A4 Vector PDF • Custom Branding Header • Auto Summary Footers</span>
            </div>
          </div>

          <div className="hub-card-right">
            <button
              type="button"
              onClick={() => handleGeneratePdf('download')}
              className="hub-btn-primary"
              disabled={loading || reportConfig.rows.length === 0}
            >
              <Download size={18} />
              <span>Generate & Download PDF</span>
            </button>

            <div className="hub-btn-secondary-grid">
              <button
                type="button"
                onClick={() => handleGeneratePdf('preview')}
                className="hub-btn-outline"
                disabled={loading || reportConfig.rows.length === 0}
                title="Preview PDF Document in New Tab"
              >
                <Eye size={15} />
                <span>Preview PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleGeneratePdf('print')}
                className="hub-btn-outline"
                disabled={loading || reportConfig.rows.length === 0}
                title="Send Report Directly to Printer"
              >
                <Printer size={15} />
                <span>Print Report</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="hub-btn-outline btn-csv"
                disabled={loading || reportConfig.rows.length === 0}
                title="Download Raw Data as CSV Spreadsheet"
              >
                <FileSpreadsheet size={15} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
