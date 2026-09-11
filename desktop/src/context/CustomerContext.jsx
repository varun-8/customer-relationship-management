import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const CustomerContext = createContext(null);

export const CustomerProvider = ({ children }) => {
  const toast = useToast();
  const [activeForm, setActiveForm] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sequenceConfig, setSequenceConfig] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [followupCounts, setFollowupCounts] = useState({ today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0 });

  // Load Active Form Schema
  const fetchActiveForm = useCallback(async () => {
    try {
      const res = await api.getActiveForm();
      if (res.success && res.data) {
        setActiveForm(res.data);
      }
    } catch (err) {
      console.warn('Error fetching active form schema:', err.message);
    }
  }, []);

  // Load Sequence Settings
  const fetchSequenceConfig = useCallback(async () => {
    try {
      const res = await api.getSequenceConfig();
      if (res.success && res.data) {
        setSequenceConfig(res.data);
      }
    } catch (err) {
      console.warn('Error fetching sequence config:', err.message);
    }
  }, []);

  // Fetch Follow-up Counts automatically for real-time badges
  const fetchFollowupCounts = useCallback(async () => {
    try {
      const res = await api.getFollowupsList({ tab: 'today' });
      if (res && res.success && res.counts) {
        setFollowupCounts(res.counts);
      }
    } catch (err) {
      console.warn('Error fetching follow-up counts:', err.message);
    }
  }, []);

  const retryTimeoutRef = React.useRef(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Load Customers
  const fetchCustomers = useCallback(async (isAutoRetry = false, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setFetchError(null);
    try {
      const res = await api.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        customerType: customerType === 'all' ? '' : customerType,
        status: status === 'all' ? '' : status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setCustomers(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Error fetching customer list:', err.message);
      setFetchError(err.message);

      // Auto retry once after 2.5 seconds if server is initializing on startup
      if (!isAutoRetry) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          fetchCustomers(true);
        }, 2500);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, customerType, status, startDate, endDate, sortBy, sortOrder]);

  const refreshAll = useCallback(async (isSilent = false) => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        fetchCustomers(false, isSilent),
        fetchActiveForm(),
        fetchSequenceConfig(),
        fetchFollowupCounts(),
      ]);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCustomers, fetchActiveForm, fetchSequenceConfig, fetchFollowupCounts]);

  useEffect(() => {
    fetchActiveForm();
    fetchSequenceConfig();
    fetchFollowupCounts();
  }, [fetchActiveForm, fetchSequenceConfig, fetchFollowupCounts]);

  useEffect(() => {
    fetchCustomers();
    return () => clearTimeout(retryTimeoutRef.current);
  }, [fetchCustomers]);

  // Real-time automatic synchronization: poll every 5 seconds so mobile phone additions/updates and follow-up counts appear instantly on desktop
  useEffect(() => {
    const syncTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchCustomers(true, true);
        fetchFollowupCounts();
      }
    }, 5000);
    return () => clearInterval(syncTimer);
  }, [fetchCustomers, fetchFollowupCounts]);

  const createCustomer = async (data, notes = '') => {
    try {
      const res = await api.createCustomer(data, notes);
      if (res.success) {
        toast.success(
          `Customer ${res.data?.customerId || ''} registered successfully!`,
          'Lead Saved'
        );
        await fetchCustomers();
        await fetchSequenceConfig();
        return { success: true, customer: res.data };
      }
      toast.error(res.message || 'Could not save customer', 'Registration Failed');
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.errors?.length
        ? err.errors.map((e) => e.msg || e.message).join(', ')
        : err.message || 'Failed to create customer';
      toast.error(msg, 'Registration Failed');
      return { success: false, message: msg, errors: err.errors };
    }
  };

  const updateCustomer = async (id, data, notes = '', statusVal) => {
    try {
      const res = await api.updateCustomer(id, data, notes, statusVal);
      if (res.success) {
        toast.success(
          `Customer details updated successfully.`,
          'Changes Saved'
        );
        await fetchCustomers();
        if (selectedCustomer && selectedCustomer._id === id) {
          setSelectedCustomer(res.data);
        }
        return { success: true, customer: res.data };
      }
      toast.error(res.message || 'Could not update customer', 'Update Failed');
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.errors?.length
        ? err.errors.map((e) => e.msg || e.message).join(', ')
        : err.message || 'Failed to update customer';
      toast.error(msg, 'Update Failed');
      return { success: false, message: msg, errors: err.errors };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const res = await api.deleteCustomer(id);
      if (res.success) {
        toast.info('Customer lead permanently deleted', 'Deleted');
        await fetchCustomers();
        if (selectedCustomer && selectedCustomer._id === id) {
          setSelectedCustomer(null);
        }
        return { success: true };
      }
      toast.error(res.message || 'Could not delete customer', 'Delete Failed');
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer', 'Delete Failed');
      return { success: false, message: err.message };
    }
  };

  const updateSequence = async (newConfig) => {
    try {
      const res = await api.updateSequenceConfig(newConfig);
      if (res && res.success) {
        setSequenceConfig(res.data);
        toast.success('Sequential Customer ID format saved.', 'Sequence Updated');
        return { success: true, data: res.data };
      }
      toast.error(res?.message || 'Failed to update sequence', 'Sequence Error');
      return { success: false, message: res?.message || 'Failed to update sequence' };
    } catch (err) {
      toast.error(err.message || 'Network error updating sequence', 'Sequence Error');
      return { success: false, message: err.message || 'Network error updating sequence' };
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        activeForm,
        customers,
        pagination,
        setPagination,
        search,
        setSearch,
        customerType,
        setCustomerType,
        status,
        setStatus,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        loading,
        fetchError,
        selectedCustomer,
        setSelectedCustomer,
        sequenceConfig,
        followupCounts,
        fetchFollowupCounts,
        fetchCustomers,
        fetchActiveForm,
        refreshAll,
        isRefreshing,
        lastSyncTime,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        updateSequence,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within a CustomerProvider');
  return context;
};
