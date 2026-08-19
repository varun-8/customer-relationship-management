import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Current active development host
const CURRENT_LAN_IP = '10.169.195.189';
const DEFAULT_HOST = `http://${CURRENT_LAN_IP}:5000/api`;
const HOST_STORAGE_KEY = 'vasantham_api_host_url';
const SCHEMA_CACHE_KEY = 'vasantham_cached_form_schema';
const CUSTOMERS_CACHE_KEY = 'vasantham_cached_customers';
const USERS_CACHE_KEY = 'vasantham_cached_staff_profiles';
const FOLLOWUPS_CACHE_KEY = 'vasantham_cached_followups';
const BRANDING_CACHE_KEY = 'vasantham_mobile_branding';
const TOKEN_KEY = 'vasantham_mobile_jwt';

// Helper to format Date to 'YYYY-MM-DD'
const toDateString = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  return dateObj.toISOString().split('T')[0];
};

// Candidate host list for automatic discovery
const getCandidateHosts = () => {
  const candidates = [];

  // Extract host from React Native bundle URL if available
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    try {
      const match = scriptURL.match(/https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        candidates.push(`http://${match[1]}:5000/api`);
      }
    } catch (e) {}
  }

  candidates.push(DEFAULT_HOST);
  candidates.push('http://localhost:5000/api');
  candidates.push('http://10.0.2.2:5000/api'); // Android emulator fallback
  candidates.push('http://127.0.0.1:5000/api');

  return [...new Set(candidates)];
};

let cachedWorkingHost = null;

// Fallback schema if network is unreachable
export const FALLBACK_SCHEMA = {
  name: 'Vasantham 23-Field CRM Form',
  version: 1,
  fields: [
    { id: 'field_customer_id', name: 'customerId', label: 'Customer ID', type: 'auto_number', active: true, order: 0 },
    { id: 'field_date', name: 'entryDate', label: 'Date', type: 'date', required: true, active: true, order: 1 },
    { id: 'field_customer_number', name: 'customerName', label: 'Customer Number / Name', type: 'text', required: true, active: true, order: 2 },
    { id: 'field_mobile_number', name: 'phone', label: 'Mobile Number', type: 'phone', required: true, active: true, order: 3 },
    { id: 'field_location', name: 'location', label: 'Location', type: 'text', active: true, order: 4 },
    {
      id: 'field_lead_source',
      name: 'leadSource',
      label: 'Lead Source',
      type: 'select',
      active: true,
      order: 5,
      options: [
        { label: 'Walk-in', value: 'Walk-in' },
        { label: 'Existing Customer', value: 'Existing Customer' },
        { label: 'Engineer', value: 'Engineer' },
        { label: 'Contractor', value: 'Contractor' },
        { label: 'Builder', value: 'Builder' },
        { label: 'Referral', value: 'Referral' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      id: 'field_salesperson',
      name: 'salesperson',
      label: 'Salesperson',
      type: 'select',
      active: true,
      order: 6,
      options: [],
    },
    {
      id: 'field_customer_type',
      name: 'customerType',
      label: 'Customer Type',
      type: 'select',
      required: true,
      active: true,
      order: 7,
      options: [
        { label: 'Building Owner', value: 'Building Owner' },
        { label: 'Mason', value: 'Mason' },
        { label: 'Architect', value: 'Architect' },
      ],
    },
    {
      id: 'field_house_stage',
      name: 'houseStage',
      label: 'House Stage',
      type: 'select',
      active: true,
      order: 8,
      options: [
        { label: 'Foundation', value: 'Foundation' },
        { label: 'Brickwork', value: 'Brickwork' },
        { label: 'Plastering', value: 'Plastering' },
        { label: 'Painting', value: 'Painting' },
        { label: 'Building Completion', value: 'Building Completion' },
      ],
    },
    {
      id: 'field_requirement',
      name: 'requirement',
      label: 'Requirement',
      type: 'multiselect',
      active: true,
      order: 9,
      options: [
        { label: 'Tiles', value: 'Tiles' },
        { label: 'Sanitary', value: 'Sanitary' },
        { label: 'Adhesive', value: 'Adhesive' },
        { label: 'Clipping', value: 'Clipping' },
      ],
    },
    { id: 'field_approx_quantity', name: 'approxQuantity', label: 'Approx. Quantity (Sq.Ft / Units)', type: 'number', active: true, order: 10 },
    { id: 'field_tile_budget', name: 'tileBudget', label: 'Tile Budget (₹)', type: 'currency', active: true, order: 11 },
    { id: 'field_sanitary_req', name: 'sanitaryRequirement', label: 'Sanitary Requirement', type: 'radio', active: true, order: 12, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
    { id: 'field_adhesive_req', name: 'adhesiveRequirement', label: 'Adhesive Requirement', type: 'radio', active: true, order: 13, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
    { id: 'field_quotation_val', name: 'quotationValue', label: 'Quotation Value (₹)', type: 'currency', active: true, order: 14 },
    { id: 'field_quotation_date', name: 'quotationDate', label: 'Quotation Date', type: 'date', active: true, order: 15 },
    {
      id: 'field_status',
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      active: true,
      order: 16,
      options: [
        { label: 'Newly Contacted', value: 'Newly Contacted' },
        { label: 'Walk-in', value: 'Walk-in' },
        { label: 'Quotation', value: 'Quotation' },
        { label: 'Follow-up', value: 'Follow-up' },
        { label: 'Negotiation', value: 'Negotiation' },
        { label: 'Order Confirmed', value: 'Order Confirmed' },
        { label: 'Lost', value: 'Lost' },
        { label: 'Future Requirement', value: 'Future Requirement' },
      ],
    },
    { id: 'field_next_follow_up', name: 'nextFollowUp', label: 'Next Follow-up', type: 'date', active: true, order: 17 },
    { id: 'field_last_follow_up', name: 'lastFollowUp', label: 'Last Follow-up', type: 'date', active: true, order: 18 },
    { id: 'field_follow_up_count', name: 'followUpCount', label: 'Follow-up Count', type: 'number', active: true, order: 19 },
    { id: 'field_order_value', name: 'orderValue', label: 'Order Value (₹)', type: 'currency', active: true, order: 20 },
    { id: 'field_last_reason', name: 'lastReason', label: 'Last Reason / Notes', type: 'text', active: true, order: 21 },
    {
      id: 'field_cross_sell',
      name: 'crossSell',
      label: 'Cross-sell Products',
      type: 'multiselect',
      active: true,
      order: 22,
      options: [
        { label: 'Grout & Epoxy', value: 'Grout & Epoxy' },
        { label: 'Tile Spacers & Levellers', value: 'Tile Spacers & Levellers' },
        { label: 'Waterproofing Chemicals', value: 'Waterproofing Chemicals' },
        { label: 'Bath Fittings & Faucets', value: 'Bath Fittings & Faucets' },
        { label: 'Kitchen Sinks', value: 'Kitchen Sinks' },
        { label: 'Mirror Cabinets & Vanity', value: 'Mirror Cabinets & Vanity' },
      ],
    },
  ],
};

// Helper to calculate offline followups list from local customer cache
function computeOfflineFollowups(customersList = [], params = {}) {
  const {
    tab = 'today',
    temperature = 'all',
    salesperson = 'all',
    search = '',
  } = params;

  const todayStr = toDateString(new Date());
  const next7DaysDate = new Date();
  next7DaysDate.setDate(next7DaysDate.getDate() + 7);
  const next7DaysStr = toDateString(next7DaysDate);

  const allFollowups = [];
  let todayCount = 0;
  let upcomingCount = 0;
  let overdueCount = 0;
  let hotCount = 0;
  let totalPipelineValue = 0;

  customersList.forEach((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c || {});
    
    // Status check
    const status = d.status || c.status || 'Newly Contacted';
    const statusLower = status.toLowerCase();
    if (status === 'Order Confirmed' || statusLower.includes('lost') || status === 'archived') return;

    const qVal = Number(d.quotationValue) || Number(d.orderValue) || Number(d.tileBudget) || 0;
    totalPipelineValue += qVal;

    let temp = d.leadTemperature || d.temperature;
    if (!temp) {
      if (status === 'Negotiation' || qVal >= 100000) temp = 'Hot';
      else if (status === 'Quotation' || status === 'Follow-up') temp = 'Warm';
      else temp = 'Future';
    }
    if (temp === 'Hot') hotCount += 1;

    const nextFollowUp = d.nextFollowUp || '';
    let bucket = 'upcoming';
    let daysDiff = 0;

    if (!nextFollowUp) {
      bucket = 'today';
    } else if (nextFollowUp < todayStr) {
      bucket = 'overdue';
      const diffTime = Math.abs(new Date(todayStr) - new Date(nextFollowUp));
      daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (nextFollowUp === todayStr) {
      bucket = 'today';
      daysDiff = 0;
    } else if (nextFollowUp > todayStr && nextFollowUp <= next7DaysStr) {
      bucket = 'upcoming';
      const diffTime = Math.abs(new Date(nextFollowUp) - new Date(todayStr));
      daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      bucket = 'future';
      const diffTime = Math.abs(new Date(nextFollowUp) - new Date(todayStr));
      daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (bucket === 'today') todayCount += 1;
    if (bucket === 'upcoming' || bucket === 'future') upcomingCount += 1;
    if (bucket === 'overdue') overdueCount += 1;

    allFollowups.push({
      _id: c._id || `offline_${c.customerId || Math.random()}`,
      customerId: c.customerId || d.customerId || 'CUS',
      customerName: d.customerName || c.customerName || 'Customer',
      phone: d.phone || c.phone || '',
      customerType: d.customerType || c.customerType || 'Building Owner',
      status,
      salesperson: d.salesperson || c.salesperson || 'Showroom Staff',
      requirement: d.requirement || c.requirement || 'Tiles & Sanitary',
      approxQuantity: d.approxQuantity || c.approxQuantity || '',
      quotationValue: qVal,
      nextFollowUp,
      lastFollowUp: d.lastFollowUp || '',
      lastReason: d.lastReason || '',
      leadTemperature: temp,
      notes: d.notes || c.notes || '',
      followUpCount: d.followUpCount || c.followUpCount || 1,
      bucket,
      daysDiff,
    });
  });

  // Filter by Tab
  let filtered = allFollowups;
  if (tab === 'today') {
    filtered = filtered.filter((f) => f.bucket === 'today');
  } else if (tab === 'overdue') {
    filtered = filtered.filter((f) => f.bucket === 'overdue');
  } else if (tab === 'upcoming') {
    filtered = filtered.filter((f) => f.bucket === 'upcoming' || f.bucket === 'future');
  }

  // Filter by Temperature
  if (temperature && temperature !== 'all') {
    filtered = filtered.filter((f) => f.leadTemperature === temperature);
  }

  // Filter by Salesperson
  if (salesperson && salesperson !== 'all') {
    const target = salesperson.trim().toLowerCase();
    filtered = filtered.filter((f) => {
      const staff = String(f.salesperson || '').trim().toLowerCase();
      return staff === target || staff.includes(target) || target.includes(staff);
    });
  }

  // Filter by Search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((f) => {
      const name = String(f.customerName || '').toLowerCase();
      const phone = String(f.phone || '');
      const id = String(f.customerId || '').toLowerCase();
      const reqStr = Array.isArray(f.requirement) ? f.requirement.join(' ').toLowerCase() : String(f.requirement || '').toLowerCase();
      const reason = String(f.lastReason || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q) || reqStr.includes(q) || reason.includes(q);
    });
  }

  // Sort
  if (tab === 'overdue') {
    filtered.sort((a, b) => b.daysDiff - a.daysDiff);
  } else if (tab === 'today') {
    filtered.sort((a, b) => (b.leadTemperature === 'Hot' ? 1 : 0) - (a.leadTemperature === 'Hot' ? 1 : 0) || b.quotationValue - a.quotationValue);
  } else {
    filtered.sort((a, b) => (a.nextFollowUp || '9999').localeCompare(b.nextFollowUp || '9999'));
  }

  return {
    success: true,
    data: filtered,
    counts: {
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount,
      hot: hotCount,
      total: allFollowups.length,
      totalPipelineValue,
    },
    offline: true,
  };
}

export const apiClient = {
  async getApiBase() {
    if (cachedWorkingHost) return cachedWorkingHost;

    const custom = await AsyncStorage.getItem(HOST_STORAGE_KEY);
    // Ignore outdated stale test IPs in storage
    if (custom && (custom.includes('10.169.195.176') || custom.includes('10.169.195.237') || custom.includes('10.169.195.152') || custom.includes('10.169.195.222'))) {
      await AsyncStorage.removeItem(HOST_STORAGE_KEY);
    } else if (custom) {
      cachedWorkingHost = custom;
      return custom;
    }

    cachedWorkingHost = DEFAULT_HOST;
    return DEFAULT_HOST;
  },

  async setApiBase(url) {
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl += '/api';
    }
    cachedWorkingHost = cleanUrl;
    await AsyncStorage.setItem(HOST_STORAGE_KEY, cleanUrl);
    return cleanUrl;
  },

  async setToken(token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async getHeaders() {
    let token = await this.getToken();
    if (!token) {
      try {
        const loginRes = await this.login('owner@vasantham.com', 'admin123');
        if (loginRes && loginRes.success && loginRes.data?.token) {
          token = loginRes.data.token;
          await this.setToken(token);
        }
      } catch (e) {
        // silent auto-auth fallback
      }
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Test connection to backend
  async testConnection(customBase = null) {
    const candidates = customBase ? [customBase] : getCandidateHosts();
    for (const host of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${host}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          cachedWorkingHost = host;
          await AsyncStorage.setItem(HOST_STORAGE_KEY, host);
          return { success: true, host, data };
        }
      } catch (e) {
        // Try next candidate
      }
    }
    return { success: false, error: 'Cannot connect to backend API server. Verify backend is running.' };
  },

  // Fetch active form configuration with offline fallback
  async getActiveForm() {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${base}/customer-form`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data) {
        await AsyncStorage.setItem(SCHEMA_CACHE_KEY, JSON.stringify(data.data));
        return data.data;
      }
    } catch (e) {
      // offline fallback
    }

    const cached = await AsyncStorage.getItem(SCHEMA_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return FALLBACK_SCHEMA;
  },

  // Instant offline cache readers
  async getCachedCustomers() {
    try {
      const cached = await AsyncStorage.getItem(CUSTOMERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },

  async getCachedUsers() {
    try {
      const cached = await AsyncStorage.getItem(USERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },

  async getCachedFollowups() {
    try {
      const cached = await AsyncStorage.getItem(FOLLOWUPS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  },

  // Fetch customers list with Stale-While-Revalidate caching
  async getCustomers(search = '') {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}/customers?search=${encodeURIComponent(search)}`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        if (!search) {
          if (data.data.length === 0) {
            // When backend is wiped and returns 0 records, purge local AsyncStorage customer & followup caches
            await AsyncStorage.multiRemove([CUSTOMERS_CACHE_KEY, FOLLOWUPS_CACHE_KEY]);
          } else {
            await AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(data.data));
          }
        }
        return data.data;
      }
    } catch (e) {
      // Fall through to offline cache
    }

    try {
      const cached = await this.getCachedCustomers();
      if (search && cached.length > 0) {
        const q = search.toLowerCase();
        return cached.filter((c) => {
          const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c || {});
          return (
            (c.customerId && String(c.customerId).toLowerCase().includes(q)) ||
            (d.customerName && String(d.customerName).toLowerCase().includes(q)) ||
            (d.phone && String(d.phone).includes(q)) ||
            (d.location && String(d.location).toLowerCase().includes(q))
          );
        });
      }
      return cached || [];
    } catch (cacheErr) {
      return [];
    }
  },

  // Create customer
  async createCustomer(formData) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${base}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: formData }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.data) {
        // Update local cache
        const cached = await this.getCachedCustomers();
        await AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify([data.data, ...cached]));
      }
      return data;
    } catch (e) {
      // Save locally in offline cache
      try {
        const newOfflineCustomer = {
          _id: `offline_${Date.now()}`,
          customerId: `OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
          data: formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOfflineSaved: true,
        };
        const cached = await this.getCachedCustomers();
        await AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify([newOfflineCustomer, ...cached]));
        return {
          success: true,
          offline: true,
          message: 'Saved locally in offline mode (will sync with server)',
          data: newOfflineCustomer,
        };
      } catch (cacheErr) {
        return { success: false, message: `Offline save failed: ${cacheErr.message}` };
      }
    }
  },

  // Update customer
  async updateCustomer(id, formData, notes = '') {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${base}/customers/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: formData, notes }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}. Check your server settings.` };
    }
  },

  // Fetch and cache dynamic branding & logo
  async getBranding() {
    let cachedBranding = null;
    try {
      const cached = await AsyncStorage.getItem(BRANDING_CACHE_KEY);
      if (cached) cachedBranding = JSON.parse(cached);
    } catch (e) {}

    try {
      const base = await this.getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${base}/branding`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data) {
        await AsyncStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(data.data));
        return data.data;
      }
    } catch (e) {}

    if (cachedBranding) return cachedBranding;

    return {
      appName: 'Vasantham CRM',
      appShortName: 'Vasantham',
      tagline: 'Tiles & Sanitary Wares CRM',
      logoType: 'icon',
      logoIcon: 'Box',
      logoImage: '',
      primaryColor: '#2563EB',
    };
  },

  // Login
  async login(email, password) {
    try {
      const base = await this.getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data?.token) {
        await this.setToken(data.data.token);
      }
      return data;
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  // Daily KPI Tracking
  async createOrUpdateKPI(kpiData) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const res = await fetch(`${base}/kpi`, {
        method: 'POST',
        headers,
        body: JSON.stringify(kpiData),
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async getKPISummary(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${base}/kpi/summary${query ? `?${query}` : ''}`, {
        headers,
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async getKPIAutoFill(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${base}/kpi/auto-fill${query ? `?${query}` : ''}`, {
        headers,
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async getKPIList(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${base}/kpi${query ? `?${query}` : ''}`, {
        headers,
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  // Lost Sales Tracking
  async createLostSale(lostSaleData) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const res = await fetch(`${base}/lost-sales`, {
        method: 'POST',
        headers,
        body: JSON.stringify(lostSaleData),
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async getLostSalesList(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${base}/lost-sales${query ? `?${query}` : ''}`, {
        headers,
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async getLostSalesAnalytics(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${base}/lost-sales/analytics${query ? `?${query}` : ''}`, {
        headers,
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  // Follow-up Sheet with full offline scheduler fallback
  async getFollowupsList(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}/followups${query ? `?${query}` : ''}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success) {
        if (!query || query.includes('tab=today')) {
          await AsyncStorage.setItem(FOLLOWUPS_CACHE_KEY, JSON.stringify(data));
        }
        return { ...data, offline: false };
      }
    } catch (e) {
      // Fallback to offline calculation
    }

    // Dynamic offline computation from cached leads
    try {
      const cachedCustomers = await this.getCachedCustomers();
      if (Array.isArray(cachedCustomers) && cachedCustomers.length > 0) {
        return computeOfflineFollowups(cachedCustomers, params);
      }
    } catch (cacheErr) {}

    // Try last saved raw followups response
    try {
      const cached = await this.getCachedFollowups();
      if (cached && (cached.data || cached.success)) {
        return { ...cached, offline: true };
      }
    } catch (e) {}

    return {
      success: true,
      data: [],
      counts: { today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0, totalPipelineValue: 0 },
      offline: true,
      message: 'Working in offline mode',
    };
  },

  // Log Follow-up Activity (with offline persistence)
  async logFollowupActivity(id, activityData) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(`${base}/followups/${id}/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify(activityData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success) {
        // Refresh local cache with updated customer
        const cached = await this.getCachedCustomers();
        const updated = cached.map((c) => {
          if (c._id === id || c.customerId === id) {
            const currentData = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
            currentData.lastFollowUp = toDateString(new Date());
            if (activityData.nextFollowUp) currentData.nextFollowUp = toDateString(activityData.nextFollowUp);
            if (activityData.leadTemperature) currentData.leadTemperature = activityData.leadTemperature;
            if (activityData.statusUpdate) currentData.status = activityData.statusUpdate;
            if (activityData.quotationValue) currentData.quotationValue = activityData.quotationValue;
            currentData.lastReason = `[${toDateString(new Date())}] ${activityData.outcome}: ${activityData.discussionNotes}`;
            return { ...c, data: currentData, updatedAt: new Date().toISOString() };
          }
          return c;
        });
        await AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(updated));
        return data;
      }
    } catch (e) {
      // Offline fallback update
    }

    // Persist locally in offline cache
    try {
      const cached = await this.getCachedCustomers();
      const updated = cached.map((c) => {
        if (c._id === id || c.customerId === id) {
          const currentData = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
          currentData.lastFollowUp = toDateString(new Date());
          if (activityData.nextFollowUp) currentData.nextFollowUp = toDateString(activityData.nextFollowUp);
          if (activityData.leadTemperature) currentData.leadTemperature = activityData.leadTemperature;
          if (activityData.statusUpdate) currentData.status = activityData.statusUpdate;
          if (activityData.quotationValue) currentData.quotationValue = activityData.quotationValue;
          currentData.lastReason = `[${toDateString(new Date())}] ${activityData.outcome}: ${activityData.discussionNotes}`;
          return { ...c, data: currentData, updatedAt: new Date().toISOString(), isOfflineUpdated: true };
        }
        return c;
      });
      await AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(updated));

      return {
        success: true,
        offline: true,
        message: 'Follow-up saved locally in offline mode (will sync when online)',
      };
    } catch (cacheErr) {
      return { success: false, message: `Could not save offline: ${cacheErr.message}` };
    }
  },

  // Lookup existing customer by mobile number
  async lookupCustomerByPhone(phone) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: true, exists: false };
    }

    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${base}/customers/lookup-phone/${cleanPhone}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    } catch (e) {}

    // Check offline cache if server is unreachable
    try {
      const cached = await this.getCachedCustomers();
      const matched = cached.find((c) => {
        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
        const p = String(d.phone || c.phone || '').replace(/[^0-9]/g, '');
        return p === cleanPhone || (cleanPhone.length >= 10 && p.endsWith(cleanPhone.slice(-10)));
      });
      if (matched) {
        const d = matched.data instanceof Map ? Object.fromEntries(matched.data) : (matched.data || {});
        return {
          success: true,
          exists: true,
          customer: {
            customerId: matched.customerId,
            customerName: d.customerName || matched.customerName,
            salesperson: d.salesperson || matched.salesperson,
            status: d.status || matched.status,
            entryDate: d.entryDate || matched.entryDate,
          },
        };
      }
    } catch (cacheErr) {}

    return { success: true, exists: false };
  },

  // Get live showroom employees & mobile logins with caching
  async getUsers() {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${base}/users`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        await AsyncStorage.setItem(USERS_CACHE_KEY, JSON.stringify(data.data));
        return data;
      }
    } catch (e) {}

    try {
      const cached = await this.getCachedUsers();
      if (Array.isArray(cached) && cached.length > 0) {
        return { success: true, data: cached, offline: true };
      }
    } catch (cacheErr) {}

    return { success: false, data: [], message: 'Offline mode' };
  },

  // Purge all offline caches (used when database is wiped or on clean reset)
  async clearAllLocalData() {
    try {
      await AsyncStorage.multiRemove([
        CUSTOMERS_CACHE_KEY,
        FOLLOWUPS_CACHE_KEY,
        USERS_CACHE_KEY,
      ]);
      return true;
    } catch (e) {
      console.warn('Error clearing local data:', e);
      return false;
    }
  },

  // Get Today's Live Auto-Calculated Shift KPI from CRM
  async getKPIAutoFill(params = {}) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const query = new URLSearchParams(params).toString();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}/kpi/auto-fill?${query}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    } catch (e) {}

    // Offline computation from cached customers
    try {
      const cached = await this.getCachedCustomers();
      const todayStr = params.date || toDateString(new Date());
      const staff = params.staffName;

      const matched = cached.filter((c) => {
        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
        const dateMatch = (d.entryDate || toDateString(c.createdAt)) === todayStr;
        const staffMatch = !staff || staff === 'all' || (d.salesperson || '').toLowerCase().includes(staff.toLowerCase());
        return dateMatch && staffMatch;
      });

      let visits = matched.length;
      let quotes = matched.filter((c) => {
        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
        return d.status === 'Quotation' || d.status === 'Negotiation' || Number(d.quotationValue) > 0;
      }).length;
      let orders = matched.filter((c) => {
        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
        return d.status === 'Order Confirmed';
      }).length;
      let salesValue = matched.reduce((acc, c) => {
        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
        if (d.status === 'Order Confirmed') {
          return acc + (Number(d.orderValue) || Number(d.quotationValue) || 0);
        }
        return acc;
      }, 0);

      return {
        success: true,
        offline: true,
        data: {
          autoValues: {
            walkins: { visits, quotes, orders },
            followUpsCount: 0,
            ordersCount: orders,
            salesValue,
            oldCustomers: matched.some((c) => {
              const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
              return d.leadSource === 'Existing Customer';
            }),
            engineerCalls: matched.some((c) => {
              const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
              return ['Engineer', 'Architect', 'Mason'].includes(d.customerType) || ['Engineer', 'Architect'].includes(d.leadSource);
            }),
            crossSell: matched.some((c) => {
              const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
              return Boolean(d.crossSell);
            }),
          },
        },
      };
    } catch (err) {}

    return { success: false, message: 'Could not fetch KPI' };
  },

  // Save / Submit Daily Shift KPI
  async submitDailyKPI(kpiData) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${base}/kpi`, {
        method: 'POST',
        headers,
        body: JSON.stringify(kpiData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: e.message || 'Error submitting KPI' };
    }
  },
};
