import AsyncStorage from '@react-native-async-storage/async-storage';

// Default host set to local network IP for physical devices, with fallback to emulator/localhost
const DEFAULT_HOST = 'http://10.169.195.176:5000/api';
const HOST_STORAGE_KEY = 'vasantham_api_host_url';
const SCHEMA_CACHE_KEY = 'vasantham_cached_form_schema';
const TOKEN_KEY = 'vasantham_mobile_jwt';

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
      options: [
        { label: 'Karthik Raja', value: 'Karthik Raja' },
        { label: 'Senthil Kumar', value: 'Senthil Kumar' },
        { label: 'Priya Dharshini', value: 'Priya Dharshini' },
      ],
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

export const apiClient = {
  async getApiBase() {
    const custom = await AsyncStorage.getItem(HOST_STORAGE_KEY);
    if (custom && (custom.includes('10.169.195.237') || custom.includes('10.169.195.152') || custom.includes('192.168.1.5'))) {
      await AsyncStorage.removeItem(HOST_STORAGE_KEY);
      return DEFAULT_HOST;
    }
    return custom || DEFAULT_HOST;
  },

  async setApiBase(url) {
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl += '/api';
    }
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
        const loginRes = await this.login('employee@vasantham.com', 'employee123');
        if (loginRes.success && loginRes.data?.token) {
          token = loginRes.data.token;
        }
      } catch (e) {
        console.warn('Auto auth error:', e.message);
      }
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Test connection to backend
  async testConnection(customBase = null) {
    try {
      const base = customBase || await this.getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${base}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      return { success: res.ok, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Fetch active form configuration with offline fallback
  async getActiveForm() {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${base}/customer-form`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data) {
        await AsyncStorage.setItem(SCHEMA_CACHE_KEY, JSON.stringify(data.data));
        return data.data;
      }
    } catch (e) {
      console.warn('Network error loading schema, checking offline cache:', e.message);
      const cached = await AsyncStorage.getItem(SCHEMA_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    return FALLBACK_SCHEMA;
  },

  // Fetch customers list
  async getCustomers(search = '') {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${base}/customers?search=${encodeURIComponent(search)}`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      return data.success ? data.data : [];
    } catch (e) {
      console.warn('Error fetching customers on mobile:', e.message);
      return [];
    }
  },

  // Create customer
  async createCustomer(formData) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const res = await fetch(`${base}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: formData }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}. Check your server IP settings.` };
    }
  },

  // Update customer (e.g. status update, follow-up log)
  async updateCustomer(id, formData, notes = '') {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const res = await fetch(`${base}/customers/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: formData, notes }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}. Check your server IP settings.` };
    }
  },

  // Fetch dynamic branding
  async getBranding() {
    try {
      const base = await this.getApiBase();
      const res = await fetch(`${base}/branding`);
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (e) {
      console.warn('Error fetching branding on mobile:', e.message);
    }
    return {
      appName: 'BuildCRM',
      appShortName: 'BuildCRM',
      tagline: 'Tiles & Sanitary Wares CRM',
      logoType: 'icon',
      logoIcon: 'Box',
      primaryColor: '#2563EB',
    };
  },

  // Login
  async login(email, password) {
    try {
      const base = await this.getApiBase();
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
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
};
