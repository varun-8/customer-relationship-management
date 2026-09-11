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
  Layers,
  Compass,
  Tag,
} from 'lucide-react';
import { api } from '../../services/api';
import { useBranding } from '../../context/BrandingContext';
import { useToast } from '../../context/ToastContext';
import { useToneDown } from '../../context/ToneDownContext';
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

const extractCustomerType = (item) => {
  if (!item) return '-';
  const d = extractDataObj(item);
  const val = d.customerType || item.customerType;
  return val && val !== 'null' && val !== 'undefined' ? String(val) : '-';
};

const extractLeadSource = (item) => {
  if (!item) return '-';
  const d = extractDataObj(item);
  const val = d.leadSource || item.leadSource;
  return val && val !== 'null' && val !== 'undefined' ? String(val) : '-';
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
  return Number(d.orderValue || d.quoteValue || d.quotationValue || item.orderValue || item.quoteValue || item.lostAmount || 0);
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
  const val = d.requirement || d.requirementType || d.requirements || d.productRequirement || item.requirement;
  if (Array.isArray(val)) return val.join(', ');
  return val && val !== 'null' && val !== 'undefined' ? String(val) : '-';
};

const extractStatus = (item) => {
  if (!item) return 'New Lead';
  const d = extractDataObj(item);
  const val = d.status || item.status || 'New Lead';
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
  const { isToneDown } = useToneDown();
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
  const [selectedCustomerType, setSelectedCustomerType] = useState('all');
  const [selectedLeadSource, setSelectedLeadSource] = useState('all');
  const [selectedRequirement, setSelectedRequirement] = useState('all');
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

  // Fetch Report Data based on Active Tab
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeReportId === 'executive' || activeReportId === 'customers') {
        const res = await api.getCustomers({ limit: 1000 });
        const customers = res?.data?.customers || res?.data || [];
        setReportData(customers);
      } else if (activeReportId === 'followups') {
        const res = await api.getFollowupsList({ limit: 1000 });
        setReportData(res?.data?.followups || res?.data || []);
      } else if (activeReportId === 'lost') {
        const res = await api.getLostSales({ limit: 1000 });
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
          const wonCusts = userCusts.filter((c) => {
            const st = extractStatus(c).toLowerCase();
            return ['won', 'closed won', 'order confirmed', 'confirmed'].includes(st);
          });
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
  }, [activeReportId, toast]);

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

    // 2. Customer Type Filter
    if (selectedCustomerType !== 'all') {
      items = items.filter((item) => {
        const ct = extractCustomerType(item);
        return ct.toLowerCase() === selectedCustomerType.toLowerCase();
      });
    }

    // 3. Status Filter
    if (selectedStatus !== 'all') {
      items = items.filter((item) => {
        const st = extractStatus(item);
        const sel = selectedStatus.toLowerCase();
        // Handle priority/category mapping for followups & lost sales
        if (activeReportId === 'followups') {
          return String(item.priority || item.status || '').toLowerCase() === sel;
        }
        if (activeReportId === 'lost') {
          return String(item.reason || item.lostReason || '').toLowerCase() === sel;
        }
        return st.toLowerCase() === sel;
      });
    }

    // 4. Lead Source Filter
    if (selectedLeadSource !== 'all') {
      items = items.filter((item) => {
        const ls = extractLeadSource(item);
        return ls.toLowerCase() === selectedLeadSource.toLowerCase();
      });
    }

    // 5. Product Requirement Filter
    if (selectedRequirement !== 'all') {
      items = items.filter((item) => {
        const d = extractDataObj(item);
        const req = d.requirement || d.requirements || item.requirement;
        if (Array.isArray(req)) {
          return req.some((r) => String(r).toLowerCase().includes(selectedRequirement.toLowerCase()));
        }
        return String(req || '').toLowerCase().includes(selectedRequirement.toLowerCase());
      });
    }

    // 6. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = extractCustomerName(item);
        const phone = extractPhone(item);
        const salesperson = extractSalesperson(item);
        const ct = extractCustomerType(item);
        const ls = extractLeadSource(item);
        const id = item.customerId || item._id || '';
        return (
          name.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q) ||
          salesperson.toLowerCase().includes(q) ||
          ct.toLowerCase().includes(q) ||
          ls.toLowerCase().includes(q) ||
          String(id).toLowerCase().includes(q)
        );
      });
    }

    // 7. Date Filter
    if (computedDateRange.start && computedDateRange.end) {
      const startMs = new Date(computedDateRange.start).getTime();
      const endMs = new Date(computedDateRange.end).setHours(23, 59, 59, 999);

      items = items.filter((item) => {
        const dateVal = item.createdAt || item.date || item.lastActivityDate || item.entryDate;
        if (!dateVal) return true;
        const t = new Date(dateVal).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    return items;
  }, [
    reportData,
    searchQuery,
    computedDateRange,
    selectedStaff,
    selectedCustomerType,
    selectedStatus,
    selectedLeadSource,
    selectedRequirement,
    activeReportId,
  ]);

  // Report Specific Configuration (Columns & KPI Summaries)
  // Per business rule: The amount/value column is displayed ONLY for "Order Confirmed" status.
  // For other reports or statuses, the amount column is omitted for a clean, executive design.
  const reportConfig = useMemo(() => {
    const formatINR = (val) =>
      'Rs. ' +
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
          { header: 'Order ID', dataKey: 'customerId', width: 20, align: 'center' },
          { header: 'Customer Name', dataKey: 'name', width: 32, align: 'left' },
          { header: 'Customer Type', dataKey: 'customerType', width: 24, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 26, align: 'center' },
          { header: 'Requirement', dataKey: 'requirement', width: 26, align: 'left' },
          { header: 'Sales Person', dataKey: 'assignedTo', width: 26, align: 'left' },
          { header: 'Status', dataKey: 'statusBadge', width: 24, align: 'center' },
          { header: 'Confirmed Value', dataKey: 'quoteFormatted', width: 26, align: 'right' },
        ],
        rows: confirmedRecords.map((item) => ({
          customerId: item.customerId || '-',
          name: extractCustomerName(item),
          customerType: extractCustomerType(item),
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
      const isOnlyConfirmed =
        selectedStatus.toLowerCase() === 'order confirmed' ||
        selectedStatus.toLowerCase() === 'won' ||
        selectedStatus.toLowerCase() === 'closed won';

      const wonRecords = filteredRecords.filter((r) =>
        ['won', 'closed won', 'order confirmed', 'confirmed'].includes(
          extractStatus(r).toLowerCase()
        )
      );
      const activeLeadsCount = filteredRecords.filter((r) =>
        ['new lead', 'newly contacted', 'new', 'quoted', 'quotation', 'follow-up', 'negotiation', 'negotiating'].includes(
          extractStatus(r).toLowerCase()
        )
      ).length;
      const lostCount = filteredRecords.filter((r) =>
        ['lost', 'closed lost'].includes(extractStatus(r).toLowerCase())
      ).length;

      const baseColumns = [
        { header: 'Lead ID', dataKey: 'customerId', width: 20, align: 'center' },
        { header: 'Customer Name', dataKey: 'name', width: 34, align: 'left' },
        { header: 'Customer Type', dataKey: 'customerType', width: 26, align: 'left' },
        { header: 'Phone Number', dataKey: 'phone', width: 26, align: 'center' },
        { header: 'Requirement', dataKey: 'requirement', width: 28, align: 'left' },
        { header: 'Sales Person', dataKey: 'assignedTo', width: 28, align: 'left' },
        { header: 'Pipeline Stage', dataKey: 'status', width: 26, align: 'center' },
      ];

      // Only include amount column if this customer report is exclusively for Order Confirmed status
      const columns = isOnlyConfirmed
        ? [
            ...baseColumns,
            { header: 'Confirmed Value', dataKey: 'quoteFormatted', width: 26, align: 'right' },
          ]
        : baseColumns;

      const summaryCards = isOnlyConfirmed
        ? [
            { label: 'Confirmed Orders', value: wonRecords.length, color: '#10B981' },
            {
              label: 'Confirmed Revenue',
              value: formatINR(
                wonRecords.reduce((acc, curr) => acc + extractQuoteValue(curr), 0)
              ),
              color: '#2563EB',
            },
            { label: 'Customer Type', value: selectedCustomerType === 'all' ? 'All Types' : selectedCustomerType, color: '#7C3AED' },
            { label: 'Sales Staff', value: selectedStaff === 'all' ? 'All Team' : selectedStaff, color: '#D97706' },
          ]
        : [
            { label: 'Total Customer Leads', value: filteredRecords.length, color: '#059669' },
            { label: 'New & Active Leads', value: activeLeadsCount, color: '#2563EB' },
            { label: 'Confirmed Orders', value: wonRecords.length, color: '#10B981' },
            { label: 'Lost Opportunities', value: lostCount, color: '#E11D48' },
          ];

      return {
        summaryCards: summaryCards,
        columns: columns,
        rows: filteredRecords.map((item) => {
          const st = extractStatus(item).toLowerCase();
          const isConfirmed = ['won', 'closed won', 'order confirmed', 'confirmed'].includes(st);
          return {
            customerId: item.customerId || '-',
            name: extractCustomerName(item),
            customerType: extractCustomerType(item),
            phone: extractPhone(item),
            requirement: extractRequirement(item),
            assignedTo: extractSalesperson(item),
            status: extractStatus(item).toUpperCase(),
            quoteFormatted: isConfirmed ? formatINR(extractQuoteValue(item)) : '-',
          };
        }),
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
          { header: 'Customer Name', dataKey: 'name', width: 36, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 26, align: 'center' },
          { header: 'Priority', dataKey: 'priority', width: 22, align: 'center' },
          { header: 'Scheduled Date', dataKey: 'scheduleDate', width: 26, align: 'center' },
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
      // Group lost reasons to find primary reason
      const reasonCounts = {};
      const compCounts = {};
      filteredRecords.forEach((r) => {
        const re = r.reason || r.lostReason || 'Price High';
        const cp = r.competitor || 'Local Competitor';
        reasonCounts[re] = (reasonCounts[re] || 0) + 1;
        compCounts[cp] = (compCounts[cp] || 0) + 1;
      });

      const topReason = Object.keys(reasonCounts).sort((a, b) => reasonCounts[b] - reasonCounts[a])[0] || 'Price High';
      const topComp = Object.keys(compCounts).sort((a, b) => compCounts[b] - compCounts[a])[0] || 'Competitor';

      return {
        summaryCards: [
          { label: 'Total Lost Opportunities', value: filteredRecords.length, color: '#E11D48' },
          { label: 'Top Competitor Loss', value: topComp, color: '#EA580C' },
          { label: 'Primary Lost Reason', value: topReason, color: '#DC2626' },
        ],
        columns: [
          { header: 'Customer Name', dataKey: 'name', width: 36, align: 'left' },
          { header: 'Customer Type', dataKey: 'customerType', width: 24, align: 'left' },
          { header: 'Phone Number', dataKey: 'phone', width: 26, align: 'center' },
          { header: 'Requirement', dataKey: 'requirement', width: 26, align: 'left' },
          { header: 'Lost Reason', dataKey: 'reason', width: 36, align: 'left' },
          { header: 'Winning Competitor', dataKey: 'competitor', width: 34, align: 'left' },
          { header: 'Sales Person', dataKey: 'salesExecutive', width: 28, align: 'left' },
        ],
        rows: filteredRecords.map((item) => ({
          name: extractCustomerName(item),
          customerType: extractCustomerType(item),
          phone: extractPhone(item),
          requirement: extractRequirement(item),
          reason: item.reason || item.lostReason || 'Price High',
          competitor: item.competitor || 'Local Competitor',
          salesExecutive: extractSalesperson(item),
        })),
      };
    }

    // Staff Performance Matrix (No unconfirmed amount columns)
    const totalTeamDeals = filteredRecords.reduce(
      (acc, r) => acc + (Number(r.wonDeals) || 0),
      0
    );
    const totalTeamLeads = filteredRecords.reduce(
      (acc, r) => acc + (Number(r.totalLeads) || 0),
      0
    );
    const avgConversion =
      totalTeamLeads > 0 ? ((totalTeamDeals / totalTeamLeads) * 100).toFixed(1) + '%' : '0%';

    return {
      summaryCards: [
        { label: 'Total Active Staff', value: filteredRecords.length, color: '#0EA5E9' },
        { label: 'Total Team Deals Won', value: totalTeamDeals, color: '#059669' },
        { label: 'Avg Team Conversion', value: avgConversion, color: '#2563EB' },
      ],
      columns: [
        { header: 'Staff Name', dataKey: 'name', width: 44, align: 'left' },
        { header: 'Role', dataKey: 'role', width: 36, align: 'left' },
        { header: 'Assigned Leads', dataKey: 'totalLeads', width: 34, align: 'center' },
        { header: 'Deals Won', dataKey: 'wonDeals', width: 34, align: 'center' },
        { header: 'Conversion Rate', dataKey: 'conversionRate', width: 38, align: 'center' },
      ],
      rows: filteredRecords.map((item) => ({
        name: item.name,
        role: item.role,
        totalLeads: item.totalLeads,
        wonDeals: item.wonDeals,
        conversionRate: item.conversionRate,
      })),
    };
  }, [
    activeReportId,
    filteredRecords,
    selectedStatus,
    selectedCustomerType,
    selectedStaff,
  ]);

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
      selectedCustomerType !== 'all' ? `Type: ${selectedCustomerType}` : null,
      selectedStatus !== 'all' ? `Status: ${selectedStatus}` : null,
      selectedRequirement !== 'all' ? `Req: ${selectedRequirement}` : null,
      selectedLeadSource !== 'all' ? `Source: ${selectedLeadSource}` : null,
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

          {/* Customer Type Filter */}
          {(activeReportId === 'executive' || activeReportId === 'customers') && (
            <div className="filter-item">
              <label className="filter-label">
                <Users size={13} />
                <span>Customer Type</span>
              </label>
              <select
                value={selectedCustomerType}
                onChange={(e) => setSelectedCustomerType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Customer Types</option>
                <option value="Building Owner">Building Owner</option>
                <option value="Mason">Mason</option>
                <option value="Architect">Architect</option>
                <option value="Engineer">Engineer</option>
                <option value="Contractor">Contractor</option>
                <option value="Builder">Builder</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          {(activeReportId === 'customers' || activeReportId === 'executive' || activeReportId === 'followups' || activeReportId === 'lost') && (
            <div className="filter-item">
              <label className="filter-label">
                <Filter size={13} />
                <span>{activeReportId === 'followups' ? 'Priority' : activeReportId === 'lost' ? 'Lost Reason' : 'Pipeline Status'}</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All {activeReportId === 'followups' ? 'Priorities' : activeReportId === 'lost' ? 'Reasons' : 'Statuses'}</option>
                {(activeReportId === 'customers' || activeReportId === 'executive') && (
                  <>
                    <option value="New Lead">New Lead</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Lost">Lost</option>
                    <option value="Future Requirement">Future Requirement</option>
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

          {/* Requirement Filter */}
          {(activeReportId === 'executive' || activeReportId === 'customers') && (
            <div className="filter-item">
              <label className="filter-label">
                <Layers size={13} />
                <span>Requirement</span>
              </label>
              <select
                value={selectedRequirement}
                onChange={(e) => setSelectedRequirement(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Requirements</option>
                <option value="Tiles">Tiles</option>
                <option value="Sanitary">Sanitary</option>
                <option value="Adhesive / Epoxy">Adhesive / Epoxy</option>
                <option value="CP Fittings">CP Fittings</option>
              </select>
            </div>
          )}

          {/* Lead Source Filter */}
          {(activeReportId === 'executive' || activeReportId === 'customers') && (
            <div className="filter-item">
              <label className="filter-label">
                <Compass size={13} />
                <span>Lead Source</span>
              </label>
              <select
                value={selectedLeadSource}
                onChange={(e) => setSelectedLeadSource(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Lead Sources</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Existing Customer">Existing Customer</option>
                <option value="Engineer">Engineer</option>
                <option value="Contractor">Contractor</option>
                <option value="Builder">Builder</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
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
              setSelectedCustomerType('all');
              setSelectedLeadSource('all');
              setSelectedRequirement('all');
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
              {selectedCustomerType !== 'all' && (
                <div className="hub-param-tag">
                  <Users size={12} />
                  <span>Type: {selectedCustomerType}</span>
                </div>
              )}
              {selectedStatus !== 'all' && (
                <div className="hub-param-tag">
                  <Filter size={12} />
                  <span>Status: {selectedStatus}</span>
                </div>
              )}
              {selectedRequirement !== 'all' && (
                <div className="hub-param-tag">
                  <Layers size={12} />
                  <span>Req: {selectedRequirement}</span>
                </div>
              )}
              {selectedLeadSource !== 'all' && (
                <div className="hub-param-tag">
                  <Compass size={12} />
                  <span>Source: {selectedLeadSource}</span>
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
