import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Current active development host
const CURRENT_LAN_IP = '10.169.195.189';
const DEFAULT_HOST = `http://${CURRENT_LAN_IP}:5000/api`;
const HOST_STORAGE_KEY = 'vasantham_api_host_url';
const TOKEN_KEY = 'vasantham_mobile_jwt';
const DEVICE_ID_STORAGE_KEY = 'vasantham_mobile_device_id';
let cachedDeviceId = null;

// Purge any legacy cached data keys on startup
(async () => {
  try {
    await AsyncStorage.multiRemove([
      'vasantham_cached_form_schema',
      'vasantham_cached_customers',
      'vasantham_cached_staff_profiles',
      'vasantham_cached_followups',
      'vasantham_mobile_branding',
    ]);
  } catch (e) {}
})();

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

export const apiClient = {
  async getApiBase() {
    if (cachedWorkingHost) return cachedWorkingHost;

    const custom = await AsyncStorage.getItem(HOST_STORAGE_KEY);
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

  async getDeviceId() {
    if (cachedDeviceId) return cachedDeviceId;
    let id = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    }
    cachedDeviceId = id;
    return id;
  },

  getDeviceName() {
    if (Platform.OS === 'ios') {
      return `Apple iPhone (${Platform.isPad ? 'iPad' : 'iOS'})`;
    }
    return `Android Smartphone (${Platform.constants?.Brand || 'Device'})`;
  },

  async getHeaders() {
    let token = await this.getToken();
    const deviceId = await this.getDeviceId();
    if (!token) {
      try {
        const loginRes = await this.login('owner@vasantham.com', 'admin123');
        if (loginRes && loginRes.success && loginRes.data?.token) {
          token = loginRes.data.token;
          await this.setToken(token);
        }
      } catch (e) {}
    }
    return {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Record live Mobile Device Heartbeat on Desktop CRM
  async sendDeviceHeartbeat(userProfile = null, action = 'Active Session') {
    try {
      const base = await this.getApiBase();
      const deviceId = await this.getDeviceId();
      const deviceName = this.getDeviceName();
      const headers = await this.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${base}/settings/device-heartbeat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deviceId,
          deviceName,
          platform: Platform.OS || 'android',
          appVersion: '1.0.0',
          userProfile: userProfile ? {
            name: userProfile.name,
            role: userProfile.role,
            icon: userProfile.icon,
            email: userProfile.email || '',
          } : null,
          action,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Parse QR code payload safely
  parsePairingPayload(payloadStr) {
    if (!payloadStr || typeof payloadStr !== 'string') return null;
    const trimmed = payloadStr.trim();

    // 1. Check if JSON payload from Desktop QR
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.apiBaseUrl) {
          return parsed.apiBaseUrl;
        }
        if (parsed.serverIp) {
          const port = parsed.port || 5000;
          return `http://${parsed.serverIp}:${port}/api`;
        }
      }
    } catch (e) {}

    // 2. Check if direct URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      let cleanUrl = trimmed;
      if (!cleanUrl.endsWith('/api') && !cleanUrl.includes('/api/')) {
        cleanUrl = cleanUrl.replace(/\/+$/, '') + '/api';
      }
      return cleanUrl;
    }

    // 3. Check if IP:Port string (e.g. "192.168.1.5:5000" or "192.168.1.5")
    const ipMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?$/);
    if (ipMatch) {
      const ip = ipMatch[1];
      const port = ipMatch[2] || '5000';
      return `http://${ip}:${port}/api`;
    }

    return null;
  },

  // Check if mobile app is already paired & desktop server is reachable
  async checkIsPairedAndOnline() {
    try {
      const storedHost = await AsyncStorage.getItem(HOST_STORAGE_KEY);
      if (!storedHost) {
        return { isPaired: false, host: null, reason: 'No paired host stored' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const cleanHost = storedHost.trim().replace(/\/+$/, '');
      const healthUrl = cleanHost.endsWith('/api') ? `${cleanHost}/health` : `${cleanHost}/api/health`;

      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        cachedWorkingHost = cleanHost.endsWith('/api') ? cleanHost : `${cleanHost}/api`;
        await AsyncStorage.setItem('vasantham_is_paired', 'true');
        return { isPaired: true, host: cachedWorkingHost, data };
      }
    } catch (e) {}

    return { isPaired: false, host: cachedWorkingHost, reason: 'Server unreachable' };
  },

  async setPairedStatus(isPaired) {
    if (isPaired) {
      await AsyncStorage.setItem('vasantham_is_paired', 'true');
    } else {
      await AsyncStorage.removeItem('vasantham_is_paired');
    }
  },

  async getSavedAuthRole() {
    try {
      return await AsyncStorage.getItem('vasantham_auth_role');
    } catch (e) {
      return null;
    }
  },

  async setSavedAuthRole(role) {
    try {
      if (role) {
        await AsyncStorage.setItem('vasantham_auth_role', role);
      } else {
        await AsyncStorage.removeItem('vasantham_auth_role');
      }
    } catch (e) {}
  },

  async clearPairing() {
    try {
      cachedWorkingHost = null;
      await AsyncStorage.removeItem(HOST_STORAGE_KEY);
      await AsyncStorage.removeItem('vasantham_is_paired');
      await AsyncStorage.removeItem('vasantham_auth_role');
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
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
          await AsyncStorage.setItem('vasantham_is_paired', 'true');
          return { success: true, host, data };
        }
      } catch (e) {}
    }
    return { success: false, error: 'Cannot connect to backend API server. Verify backend is running.' };
  },

  // Auto-detect Desktop CRM Server across local subnets
  async autoDetectServer(onProgress) {
    // Collect seed subnet roots
    const candidateSubnets = [];

    // Check scriptURL if running on physical device via Metro
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/(\d+\.\d+\.\d+)\.\d+/);
      if (match && match[1]) {
        candidateSubnets.push(match[1]);
      }
    }

    // Current default subnet
    candidateSubnets.push(CURRENT_LAN_IP.split('.').slice(0, 3).join('.'));
    candidateSubnets.push('192.168.1');
    candidateSubnets.push('192.168.0');
    candidateSubnets.push('192.168.29');
    candidateSubnets.push('10.0.0');

    const uniqueSubnets = [...new Set(candidateSubnets)];

    // 1. Fast-check candidate hosts first
    const primaryTest = await this.testConnection();
    if (primaryTest.success) {
      return primaryTest;
    }

    // 2. Parallel sweep across candidate subnets
    for (const subnet of uniqueSubnets) {
      if (onProgress) onProgress(`Scanning ${subnet}.x subnet for CRM desktop server...`);

      // Build target list for this subnet (common host numbers first)
      const priorityHosts = [1, 2, 100, 101, 102, 150, 176, 189, 200, 254];
      const allHosts = Array.from({ length: 254 }, (_, i) => i + 1);
      const orderedHostList = [...new Set([...priorityHosts, ...allHosts])];

      // Scan in parallel batches of 25 to avoid socket exhaustion
      const batchSize = 25;
      for (let i = 0; i < orderedHostList.length; i += batchSize) {
        const batch = orderedHostList.slice(i, i + batchSize);
        const promises = batch.map((hostNum) => {
          const targetUrl = `http://${subnet}.${hostNum}:5000/api`;
          return new Promise(async (resolve) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 900);
              const res = await fetch(`${targetUrl}/health`, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                if (data && data.status === 'healthy') {
                  resolve({ success: true, host: targetUrl, data });
                  return;
                }
              }
            } catch (e) {}
            resolve(null);
          });
        });

        const results = await Promise.all(promises);
        const found = results.find((r) => r && r.success);
        if (found) {
          cachedWorkingHost = found.host;
          await AsyncStorage.setItem(HOST_STORAGE_KEY, found.host);
          return found;
        }
      }
    }

    return { success: false, error: 'No Desktop CRM server found on local network. Try scanning the QR code.' };
  },

  // Fetch active form configuration live from server
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
        return data.data;
      }
    } catch (e) {}

    return FALLBACK_SCHEMA;
  },

  // Fetch customers list LIVE from server (no local cache)
  async getCustomers(search = '') {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}/customers?search=${encodeURIComponent(search)}&limit=500`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // Create customer LIVE on server
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
      return data;
    } catch (e) {
      return { success: false, message: `Server error: ${e.message}. Check backend connection.` };
    }
  },

  // Update customer LIVE on server
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

  // Fetch dynamic branding & logo LIVE from server
  async getBranding() {
    try {
      const base = await this.getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${base}/branding`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (e) {}

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

  // Daily KPI Tracking LIVE
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
      return { success: false, message: 'Could not fetch KPI' };
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

  // Lost Sales Tracking LIVE
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

  // Follow-up Queue LIVE from server (no offline cache)
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
        return { ...data, offline: false };
      }
      return {
        success: true,
        data: [],
        counts: { today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0, totalPipelineValue: 0 },
        offline: false,
      };
    } catch (e) {
      return {
        success: false,
        data: [],
        counts: { today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0, totalPipelineValue: 0 },
        offline: true,
        message: 'Server unreachable',
      };
    }
  },

  // Log Follow-up Activity LIVE
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
      return data;
    } catch (e) {
      return { success: false, message: `Server error: ${e.message}` };
    }
  },

  // Lookup existing customer by mobile number LIVE
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

    return { success: true, exists: false };
  },

  // Get live showroom employees LIVE from server
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
        return data;
      }
      return { success: false, data: [] };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  // Save / Submit Daily Shift KPI LIVE
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
