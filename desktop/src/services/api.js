const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = async (forceRefresh = false) => {
  let token = forceRefresh ? null : localStorage.getItem('vasantham_crm_token');
  if (!token) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@vasantham.com', password: 'admin123' }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        token = data.data.token;
        localStorage.setItem('vasantham_crm_token', token);
      }
    } catch (e) {
      console.warn('Auto auth error:', e);
    }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Resilient Central Request Handler with Timeout, Network Error Translation & Structured Errors
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const timeoutMs = options.timeout || 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeaders = options.skipAuth ? { 'Content-Type': 'application/json' } : await getAuthHeaders();
    const finalHeaders = {
      ...authHeaders,
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers: finalHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Auto-refresh token if 401 Unauthorized
    if (res.status === 401 && !options._retried && !options.skipAuth) {
      localStorage.removeItem('vasantham_crm_token');
      await getAuthHeaders(true);
      return request(endpoint, { ...options, _retried: true });
    }

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { success: res.ok, message: text };
    }

    if (!res.ok) {
      const errMsg = data?.message || `Request failed with status ${res.status}`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      err.errors = data?.errors;
      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs / 1000}s. Server response delayed.`);
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const netErr = new Error(`Cannot reach CRM backend server (${API_BASE}). Please ensure the server is active.`);
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw error;
  }
};

export const api = {
  // Health Diagnostic
  async checkHealth() {
    try {
      const data = await request('/health', { timeout: 4000, skipAuth: true });
      return { online: true, data };
    } catch (e) {
      return { online: false, message: e.message };
    }
  },

  // Auth
  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  async getMe() {
    return request('/auth/me');
  },

  // Form Builder
  async getActiveForm() {
    return request('/customer-form');
  },

  async getDraftForm() {
    return request('/customer-form/draft');
  },

  async saveDraftForm(fields, name) {
    return request('/customer-form/draft', {
      method: 'POST',
      body: JSON.stringify({ fields, name }),
    });
  },

  async deleteDraftForm() {
    return request('/customer-form/draft', {
      method: 'DELETE',
    });
  },

  async publishForm(changelog = '') {
    return request('/customer-form/publish', {
      method: 'POST',
      body: JSON.stringify({ changelog }),
    });
  },

  async addField(fieldData) {
    return request('/customer-form/fields', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
  },

  async updateField(fieldId, fieldData) {
    return request(`/customer-form/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(fieldData),
    });
  },

  async deleteField(fieldId) {
    return request(`/customer-form/fields/${fieldId}`, {
      method: 'DELETE',
    });
  },

  async reorderFields(fieldIds) {
    return request('/customer-form/reorder', {
      method: 'PUT',
      body: JSON.stringify({ fieldIds }),
    });
  },

  async getFormVersions() {
    return request('/customer-form/versions');
  },

  // Customers
  async getCustomers(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all' && val !== 'undefined' && val !== 'null') {
        cleanParams[key] = val;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },

  async getCustomerById(id) {
    return request(`/customers/${id}`);
  },

  async createCustomer(customerData, notes = '') {
    return request('/customers', {
      method: 'POST',
      body: JSON.stringify({ data: customerData, notes }),
    });
  },

  async bulkImportCustomers(rows = []) {
    return request('/customers/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
      timeout: 30000,
    });
  },

  async updateCustomer(id, customerData, notes = '', status) {
    return request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: customerData, notes, status }),
    });
  },

  async deleteCustomer(id) {
    return request(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  async lookupCustomerByPhone(phone) {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    return request(`/customers/lookup-phone/${cleanPhone}`);
  },

  // Sequence Config
  async getSequenceConfig() {
    return request('/sequence/customer-id');
  },

  async updateSequenceConfig(config) {
    return request('/sequence/customer-id', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  // Branding
  async getBranding() {
    return request('/branding');
  },

  async updateBranding(brandingData) {
    return request('/branding', {
      method: 'PUT',
      body: JSON.stringify(brandingData),
    });
  },

  // Daily KPI
  async getDailyKPI(date, salesperson) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (salesperson) params.append('salesperson', salesperson);
    return request(`/kpi?${params.toString()}`);
  },

  async createOrUpdateKPI(kpiData) {
    return request('/kpi', {
      method: 'POST',
      body: JSON.stringify(kpiData),
    });
  },

  async getKPISummary(params = {}) {
    const query = typeof params === 'string' ? `period=${params}` : new URLSearchParams(params).toString();
    return request(`/kpi/summary${query ? `?${query}` : ''}`);
  },

  async getDayPerformance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/kpi/day-performance${query ? `?${query}` : ''}`);
  },

  async getDailyTrends(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/kpi/daily-trends${query ? `?${query}` : ''}`);
  },

  async getKPIAutoFill(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/kpi/auto-fill${query ? `?${query}` : ''}`);
  },

  // Lost Sales
  async getLostSales(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/lost-sales${query ? `?${query}` : ''}`);
  },

  async getLostSalesList(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/lost-sales${query ? `?${query}` : ''}`);
  },

  async createLostSale(lostSaleData) {
    return request('/lost-sales', {
      method: 'POST',
      body: JSON.stringify(lostSaleData),
    });
  },

  async updateLostSale(id, lostSaleData) {
    return request(`/lost-sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lostSaleData),
    });
  },

  async deleteLostSale(id) {
    return request(`/lost-sales/${id}`, {
      method: 'DELETE',
    });
  },

  async reopenLostSale(id, winBackNotes = '') {
    return request(`/lost-sales/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ winBackNotes }),
    });
  },

  async getLostSalesAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/lost-sales/analytics${query ? `?${query}` : ''}`);
  },

  // Dashboard
  async getExecutiveDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/metrics${query ? `?${query}` : ''}`);
  },

  async getDashboardMetrics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/metrics${query ? `?${query}` : ''}`);
  },

  async updateSalesTargets(targetData) {
    return request('/dashboard/targets', {
      method: 'PUT',
      body: JSON.stringify(targetData),
    });
  },

  // Followups
  async getFollowupsList(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return request(`/followups${query ? `?${query}` : ''}`);
  },

  async logFollowupActivity(id, activityData) {
    return request(`/followups/${id}/log`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  },

  // Users & Staff Management
  async getUsers() {
    return request('/users');
  },

  async createUser(userData) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id, userData) {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Developer Database Wipe
  async wipeAllData(devKey) {
    return request('/settings/wipe-data', {
      method: 'POST',
      body: JSON.stringify({ devKey }),
    });
  },

  // Mobile App QR Pairing & Network Info
  async getMobilePairingInfo() {
    return request('/settings/mobile-pairing');
  },

  // Connected Mobile Devices Tracking
  async getConnectedDevices() {
    return request('/settings/connected-devices');
  },

  async disconnectDevice(deviceId) {
    return request(`/settings/connected-devices/${deviceId}`, {
      method: 'DELETE',
    });
  },

  // Showroom Branding & Logo Config
  async getBranding() {
    return request('/branding');
  },

  async updateBranding(brandingData) {
    return request('/branding', {
      method: 'PUT',
      body: JSON.stringify(brandingData),
    });
  },

  // Daily Auto-Backup & Retention Policy APIs
  async getBackupConfig() {
    return request('/backup/config');
  },

  async updateBackupConfig(data) {
    return request('/backup/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async runAutoBackup(force = false) {
    return request('/backup/run', {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  },
};
