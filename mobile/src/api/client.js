import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const HOST_STORAGE_KEY = 'vasantham_api_host_url';
const TOKEN_KEY = 'vasantham_mobile_jwt';
const USER_STORAGE_KEY = 'vasantham_mobile_user';
const DEVICE_ID_STORAGE_KEY = 'vasantham_mobile_device_id';
let cachedDeviceId = null;
let cachedWorkingHost = null;

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

// Helper to dynamically extract host from Metro / Dev server bundle URL or Web window
const getMetroHost = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    try {
      const match = scriptURL.match(/https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    } catch (e) {}
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname;
    }
  }
  return null;
};

// Dynamically determine default API host without any hardcoded IP
const getDynamicDefaultHost = () => {
  // 1. Check Expo public environment variables if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    let clean = process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';
    return clean;
  }
  if (process.env.EXPO_PUBLIC_SERVER_IP) {
    return `http://${process.env.EXPO_PUBLIC_SERVER_IP.trim()}:5000/api`;
  }

  // 2. Extract dynamically from Metro packager host IP
  const metroHost = getMetroHost();
  if (metroHost) {
    return `http://${metroHost}:5000/api`;
  }

  // 3. Android emulator alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  // 4. Default localhost loopback
  return 'http://localhost:5000/api';
};

// Candidate host list for automatic discovery (100% dynamic)
const getCandidateHosts = () => {
  const candidates = [];

  // 1. Dynamic host extracted from active Metro packager URL
  const metroHost = getMetroHost();
  if (metroHost) {
    candidates.push(`http://${metroHost}:5000/api`);
  }

  // 2. Env variables if configured
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(process.env.EXPO_PUBLIC_API_URL);
  }
  if (process.env.EXPO_PUBLIC_SERVER_IP) {
    candidates.push(`http://${process.env.EXPO_PUBLIC_SERVER_IP}:5000/api`);
  }

  // 3. Dynamic default
  candidates.push(getDynamicDefaultHost());

  // 4. Platform-specific local candidates
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:5000/api');
  }
  candidates.push('http://localhost:5000/api');
  candidates.push('http://127.0.0.1:5000/api');

  return [...new Set(candidates.filter(Boolean))];
};

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
        { label: 'Adhesive / Epoxy', value: 'Adhesive / Epoxy' },
        { label: 'CP Fittings', value: 'CP Fittings' },
      ],
    },
    { id: 'field_approx_quantity', name: 'approxQuantity', label: 'Approx. Quantity (Sq.Ft / Units)', type: 'number', active: true, order: 10 },
    { id: 'field_tile_budget', name: 'tileBudget', label: 'Tile Budget', type: 'currency', active: true, order: 11 },
    { id: 'field_adhesive_req', name: 'adhesiveRequirement', label: 'Adhesive Requirement', type: 'radio', active: true, order: 12, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
    { id: 'field_quotation_val', name: 'quotationValue', label: 'Quotation Value', type: 'currency', active: true, order: 13 },
    { id: 'field_quotation_date', name: 'quotationDate', label: 'Quotation Date', type: 'date', active: true, order: 14 },
    {
      id: 'field_status',
      name: 'status',
      label: 'Pipeline Status',
      type: 'select',
      required: true,
      active: true,
      order: 15,
      options: [
        { label: 'New Lead', value: 'New Lead' },
        { label: 'Quotation', value: 'Quotation' },
        { label: 'Follow-up', value: 'Follow-up' },
        { label: 'Negotiation', value: 'Negotiation' },
        { label: 'Order Confirmed', value: 'Order Confirmed' },
        { label: 'Lost', value: 'Lost' },
        { label: 'Future Requirement', value: 'Future Requirement' },
      ],
    },
    { id: 'field_order_value', name: 'orderValue', label: 'Order Value', type: 'currency', active: true, order: 16 },
    {
      id: 'field_cross_sell',
      name: 'crossSell',
      label: 'Cross-sell Products',
      type: 'multiselect',
      active: true,
      order: 17,
      options: [
        { label: 'Grout & Epoxy', value: 'Grout & Epoxy' },
        { label: 'Tile Spacers & Levellers', value: 'Tile Spacers & Levellers' },
        { label: 'Waterproofing Chemicals', value: 'Waterproofing Chemicals' },
        { label: 'Bath Fittings & Faucets', value: 'Bath Fittings & Faucets' },
        { label: 'Kitchen Sinks', value: 'Kitchen Sinks' },
        { label: 'Mirror Cabinets & Vanity', value: 'Mirror Cabinets & Vanity' },
      ],
    },
    { id: 'field_next_follow_up', name: 'nextFollowUp', label: 'Next Follow-up', type: 'date', active: true, order: 18 },
    { id: 'field_last_follow_up', name: 'lastFollowUp', label: 'Last Follow-up', type: 'date', active: true, readOnly: true, order: 19 },
    { id: 'field_follow_up_count', name: 'followUpCount', label: 'Follow-up Count', type: 'number', active: true, readOnly: true, order: 20 },
    { id: 'field_last_reason', name: 'lastReason', label: 'Last Reason / Notes', type: 'text', active: true, order: 21 },
  ],
};

export const apiClient = {
  async getApiBase() {
    if (cachedWorkingHost) return cachedWorkingHost;

    try {
      const custom = await AsyncStorage.getItem(HOST_STORAGE_KEY);
      if (custom && custom.trim() !== '') {
        const cleanHost = custom.trim().replace(/\/+$/, '');
        const fullApiUrl = cleanHost.endsWith('/api') ? cleanHost : `${cleanHost}/api`;
        cachedWorkingHost = fullApiUrl;
        return fullApiUrl;
      }
    } catch (e) {}

    const dynamicHost = getDynamicDefaultHost();
    cachedWorkingHost = dynamicHost;
    return dynamicHost;
  },

  async setApiBase(url) {
    if (!url) return null;
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl += '/api';
    }
    cachedWorkingHost = cleanUrl;
    await AsyncStorage.setItem(HOST_STORAGE_KEY, cleanUrl);
    await AsyncStorage.setItem('vasantham_is_paired', 'true');
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

  async login(identifier, password) {
    try {
      const base = await this.getApiBase();
      const deviceId = await this.getDeviceId();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({
          username: (identifier || '').trim(),
          email: (identifier || '').trim(),
          password: password || '',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok && data.success && data.data?.token) {
        await this.setToken(data.data.token);
        await this.setSavedUser(data.data);
        const role = (data.data.role === 'owner' || data.data.role === 'admin') ? 'owner' : 'employee';
        await this.setSavedAuthRole(role);
        return { success: true, data: data.data };
      }
      return { success: false, message: data.message || 'Invalid username or password' };
    } catch (e) {
      return { success: false, message: e.message || 'Unable to connect to server' };
    }
  },

  async getSavedUser() {
    try {
      const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async setSavedUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {}
  },

  async logout() {
    try {
      await this.removeToken();
      await this.setSavedUser(null);
      await this.setSavedAuthRole(null);
    } catch (e) {}
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
        if (Array.isArray(parsed.allHostUrls) && parsed.allHostUrls.length > 0) {
          return parsed.allHostUrls;
        }
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

  // Check if mobile app is already paired & desktop server is reachable with automatic IP self-healing
  async checkIsPairedAndOnline() {
    try {
      // 1. Try stored host first
      const storedHost = await AsyncStorage.getItem(HOST_STORAGE_KEY);
      if (storedHost && storedHost.trim() !== '') {
        const cleanHost = storedHost.trim().replace(/\/+$/, '');
        const baseApi = cleanHost.endsWith('/api') ? cleanHost : `${cleanHost}/api`;
        const healthUrl = `${baseApi}/health`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        try {
          const res = await fetch(healthUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            cachedWorkingHost = baseApi;
            await AsyncStorage.setItem(HOST_STORAGE_KEY, baseApi);
            await AsyncStorage.setItem('vasantham_is_paired', 'true');
            return { isPaired: true, host: baseApi, data };
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
        }
      }

      // 2. Self-Healing: Try auto-discovering candidate hosts (Metro bundle URL, ENV IP, LAN defaults)
      const testResult = await this.testConnection();
      if (testResult && testResult.success) {
        return { isPaired: true, host: testResult.host, data: testResult.data };
      }

      // 3. Subnet Auto-Detection: Scan local network subnets automatically
      const autoResult = await this.autoDetectServer();
      if (autoResult && autoResult.success) {
        return { isPaired: true, host: autoResult.host, data: autoResult.data };
      }
    } catch (e) {}

    return { isPaired: false, host: null, reason: 'Server unreachable' };
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

  // Test connection to backend via parallel candidate URL pings (Ethernet & Wi-Fi supported)
  async testConnection(customBase = null) {
    const candidates = [];
    if (Array.isArray(customBase)) {
      customBase.forEach((u) => {
        if (u && typeof u === 'string') {
          let clean = u.trim().replace(/\/+$/, '');
          if (!clean.endsWith('/api')) clean += '/api';
          candidates.push(clean);
        }
      });
    } else if (customBase && typeof customBase === 'string') {
      let clean = customBase.trim().replace(/\/+$/, '');
      if (!clean.endsWith('/api')) clean += '/api';
      candidates.push(clean);
    } else {
      const stored = await AsyncStorage.getItem(HOST_STORAGE_KEY);
      if (stored) {
        let cleanStored = stored.trim().replace(/\/+$/, '');
        if (!cleanStored.endsWith('/api')) cleanStored += '/api';
        candidates.push(cleanStored);
      }
      candidates.push(...getCandidateHosts());
    }

    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    // Execute parallel pings for fast multi-interface connection matching
    const pingPromises = uniqueCandidates.map((host) => {
      return new Promise(async (resolve) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const res = await fetch(`${host}/health`, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            resolve({ success: true, host, data });
            return;
          }
        } catch (e) {}
        resolve(null);
      });
    });

    const results = await Promise.all(pingPromises);
    const winner = results.find((r) => r && r.success);
    if (winner) {
      cachedWorkingHost = winner.host;
      await AsyncStorage.setItem(HOST_STORAGE_KEY, winner.host);
      await AsyncStorage.setItem('vasantham_is_paired', 'true');
      return winner;
    }

    return { success: false, error: 'Cannot connect to backend API server. Verify Desktop CRM is running.' };
  },

  // Auto-detect Desktop CRM Server across local subnets with dynamic subnet extraction (zero hardcoded IPs)
  async autoDetectServer(onProgress) {
    const candidateSubnets = [];
    const priorityOctets = [];

    // 1. Extract host and subnet dynamically from Metro dev packager scriptURL or web
    const metroHost = getMetroHost();
    if (metroHost) {
      const match = metroHost.match(/^(\d+\.\d+\.\d+)\.(\d+)$/);
      if (match && match[1]) {
        candidateSubnets.push(match[1]);
        priorityOctets.push(parseInt(match[2], 10));
      }
    }

    // 2. Extract subnet from stored host
    try {
      const stored = await AsyncStorage.getItem(HOST_STORAGE_KEY);
      if (stored) {
        const match = stored.match(/https?:\/\/(\d+\.\d+\.\d+)\.(\d+)/);
        if (match && match[1]) {
          candidateSubnets.push(match[1]);
          priorityOctets.push(parseInt(match[2], 10));
        }
      }
    } catch (e) {}

    // 3. Extract subnet from env if present
    if (process.env.EXPO_PUBLIC_SERVER_IP) {
      const match = process.env.EXPO_PUBLIC_SERVER_IP.match(/^(\d+\.\d+\.\d+)\.(\d+)$/);
      if (match && match[1]) {
        candidateSubnets.push(match[1]);
        priorityOctets.push(parseInt(match[2], 10));
      }
    }

    // 4. Standard common private LAN subnets (RFC 1918)
    candidateSubnets.push(
      '192.168.1',
      '192.168.0',
      '192.168.29',
      '192.168.137',
      '10.0.0',
      '10.0.1',
      '172.20.10'
    );

    const uniqueSubnets = [...new Set(candidateSubnets.filter(Boolean))];
    const uniquePriorityOctets = [...new Set(priorityOctets.filter((o) => !isNaN(o) && o >= 1 && o <= 254))];

    for (const subnet of uniqueSubnets) {
      if (onProgress) onProgress(`Scanning ${subnet}.* for Desktop CRM...`);

      // Priority host octets followed by common router / static / DHCP allocation pools
      const ipBatches = [
        [...new Set([...uniquePriorityOctets, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 100, 101, 102, 103, 104, 105, 110, 120, 150, 200])],
      ];

      for (const batch of ipBatches) {
        const promises = batch.map((lastOctet) => {
          const targetUrl = `http://${subnet}.${lastOctet}:5000/api`;
          return new Promise(async (resolve) => {
            try {
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 1200);
              const r = await fetch(`${targetUrl}/health`, { signal: ctrl.signal });
              clearTimeout(tid);
              if (r.ok) {
                const data = await r.json();
                if (data.online || data.status === 'online' || data.status === 'ok' || data.service) {
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
          await AsyncStorage.setItem('vasantham_is_paired', 'true');
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

  async updateLostSale(id, data) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const res = await fetch(`${base}/lost-sales/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async reopenLostSale(id, winBackNotes = '') {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const res = await fetch(`${base}/lost-sales/${id}/reopen`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ winBackNotes }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: `Connection error: ${e.message}` };
    }
  },

  async deleteLostSale(id) {
    try {
      const base = await this.getApiBase();
      const headers = await this.getHeaders();
      const res = await fetch(`${base}/lost-sales/${id}`, {
        method: 'DELETE',
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
