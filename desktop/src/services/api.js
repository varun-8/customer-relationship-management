const API_BASE = '/api';

const getAuthHeaders = async () => {
  let token = localStorage.getItem('vasantham_crm_token');
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

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getMe() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch user');
    return data;
  },

  // Form Builder
  async getActiveForm() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch active form');
    return data;
  },

  async getDraftForm() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/draft`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch draft form');
    return data;
  },

  async saveDraftForm(fields, name) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/draft`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save draft form');
    return data;
  },

  async deleteDraftForm() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/draft`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete draft form');
    return data;
  },

  async publishForm(changelog = '') {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/publish`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ changelog }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to publish form');
    return data;
  },

  async addField(fieldData) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/fields`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add field');
    return data;
  },

  async updateField(fieldId, fieldData) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/fields/${fieldId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(fieldData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update field');
    return data;
  },

  async deleteField(fieldId) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/fields/${fieldId}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete field');
    return data;
  },

  async reorderFields(fieldIds) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/reorder`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fieldIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to reorder fields');
    return data;
  },

  async getFormVersions() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customer-form/versions`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch form versions');
    return data;
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
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customers${query ? `?${query}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch customers');
    return data;
  },

  async getCustomerById(id) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch customer');
    return data;
  },

  async createCustomer(customerData, notes = '') {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: customerData, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to create customer');
      err.errors = data.errors;
      throw err;
    }
    return data;
  },

  async updateCustomer(id, customerData, notes = '', status) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ data: customerData, notes, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to update customer');
      err.errors = data.errors;
      throw err;
    }
    return data;
  },

  async deleteCustomer(id) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete customer');
    return data;
  },

  // Sequence Config
  async getSequenceConfig() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/sequence/customer-id`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch sequence settings');
    return data;
  },

  async updateSequenceConfig(config) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/sequence/customer-id`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update sequence settings');
    return data;
  },

  // Branding & Identity
  async getBranding() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/branding`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch branding');
    return data;
  },

  async updateBranding(brandingData) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/branding`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(brandingData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update branding');
    return data;
  },

  // Daily KPI Tracking
  async createOrUpdateKPI(kpiData) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/kpi`, {
      method: 'POST',
      headers,
      body: JSON.stringify(kpiData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save Daily KPI');
    return data;
  },

  async getKPIList(params = {}) {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/kpi${query ? `?${query}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch Daily KPI records');
    return data;
  },

  async getKPISummary(params = {}) {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/kpi/summary${query ? `?${query}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch KPI summary analytics');
    return data;
  },

  async getKPIAutoFill(params = {}) {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/kpi/auto-fill${query ? `?${query}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to auto-calculate CRM metrics');
    return data;
  },

  async getDayPerformance(params = {}) {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/kpi/day-performance${query ? `?${query}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch day performance breakdown');
    return data;
  },

  async getDailyTrends(params = {}) {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/kpi/daily-trends${query ? `?${query}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch daily trends matrix');
    return data;
  },

  async deleteKPI(id) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/kpi/${id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete KPI record');
    return data;
  },
};
