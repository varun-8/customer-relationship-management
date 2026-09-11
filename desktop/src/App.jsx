import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { FormBuilderProvider } from './context/FormBuilderContext';
import { BrandingProvider } from './context/BrandingContext';
import { ToneDownProvider, useToneDown } from './context/ToneDownContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CustomerListTable } from './components/customer-crm/CustomerListTable';
import { CustomerFormModal } from './components/customer-crm/CustomerFormModal';
import { CustomerDetailModal } from './components/customer-crm/CustomerDetailModal';
import { SequenceConfigModal } from './components/settings/SequenceConfigModal';
import { FormVersionHistoryModal } from './components/settings/FormVersionHistoryModal';
import { SettingsView } from './components/settings/SettingsView';
import { MobileSimulatorModal } from './components/mobile-simulator/MobileSimulatorModal';
import { DailyKpiView } from './components/kpi/DailyKpiView';
import { LostSalesView } from './components/lost-sales/LostSalesView';
import { ExecutiveDashboardView } from './components/dashboard/ExecutiveDashboardView';
import { FollowupSheetView } from './components/followups/FollowupSheetView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { MobilePairingView } from './components/mobile-pairing/MobilePairingView';
import { ReportsView } from './components/reports/ReportsView';
import { AppLoadingScreen } from './components/common/AppLoadingScreen';
import { LoginPage } from './components/auth/LoginPage';
import { api } from './services/api';

const MainAppContent = () => {
  const toast = useToast();
  const { user, isEmployee, loading: authLoading } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadTakingLong, setLoadTakingLong] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Automatically enforce allowed tab for employees
  useEffect(() => {
    if (isEmployee) {
      const allowed = ['customers', 'followups', 'mobile-pairing', 'lost'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('customers');
      }
    }
  }, [isEmployee, activeTab]);

  // Server health monitoring
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const { deleteCustomer, refreshAll, isRefreshing, lastSyncTime } = useCustomer();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleManualRefresh = async () => {
    try {
      await refreshAll(false);
      setRefreshKey((prev) => prev + 1);
      toast.info('Showroom database synchronized successfully.', 'Refreshed');
    } catch (e) {
      toast.error('Could not refresh data: ' + e.message, 'Sync Error');
    }
  };

  // Manage smooth initial app loading transition
  useEffect(() => {
    const minTimer = setTimeout(() => {
      if (!authLoading) {
        setInitialLoading(false);
      }
    }, 800);

    const longTimer = setTimeout(() => {
      setLoadTakingLong(true);
    }, 6000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(longTimer);
    };
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  const verifyServerConnection = useCallback(async (isManualRetry = false) => {
    setIsCheckingServer(true);
    try {
      const res = await api.checkHealth();
      if (res && (res.online || res.status === 'ok' || res.data?.online || res.data?.status === 'online')) {
        setIsOnline(true);
        if (isManualRetry) {
          toast.success('Successfully connected to backend server!');
        }
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsCheckingServer(false);
    }
  }, [toast]);

  useEffect(() => {
    verifyServerConnection();
    const interval = setInterval(() => {
      verifyServerConnection();
    }, 30000);
    return () => clearInterval(interval);
  }, [verifyServerConnection]);

  // Automatic Daily Auto-Backup on Desktop App Launch (Runs once daily)
  useEffect(() => {
    const triggerStartupAutoBackup = async () => {
      try {
        const res = await api.runAutoBackup(false);
        if (res && res.success && !res.alreadyRanToday) {
          toast.success(`Daily Auto-Backup Completed! All records backed up to ${res.fileName}`);
        }
      } catch (err) {
        console.warn('Startup auto-backup error:', err);
      }
    };

    triggerStartupAutoBackup();
  }, [toast]);

  // Developer Mode is strictly hidden by default
  const [devModeUnlocked, setDevModeUnlocked] = useState(false);
  const [headerClickCount, setHeaderClickCount] = useState(0);

  const handleHeaderTitleClick = () => {
    if (activeTab === 'settings' || activeTab === 'builder') {
      const nextCount = headerClickCount + 1;
      setHeaderClickCount(nextCount);

      if (nextCount >= 5) {
        setDevModeUnlocked(true);
        toast.success(
          '🔓 Developer Mode Activated for this session! Developer & Database Reset tools are now unlocked.',
          'Developer Mode'
        );
        setHeaderClickCount(0);
      } else if (nextCount >= 2) {
        toast.info(
          `Click ${5 - nextCount} more times to unlock Developer Mode (${nextCount}/5)`,
          'Developer Mode'
        );
      }
    }
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Executive Dashboard', subtitle: 'Real-time sales revenue, conversion funnel, and team performance metrics' };
      case 'customers':
        return { title: 'Customer CRM & Leads', subtitle: 'Search, filter, and manage showroom customer profiles' };
      case 'reports':
        return { title: 'Reports & Export Center', subtitle: 'Generate, filter, preview, and export executive PDF reports' };
      case 'kpi':
        return { title: 'Daily Showroom KPI', subtitle: 'Track daily visitor footfall, quotations generated, and sales targets' };
      case 'followups':
        return { title: 'Follow-up Sheet', subtitle: 'Track pending customer follow-ups and schedule call logs' };
      case 'lost':
        return { title: 'Lost Sales Intel', subtitle: 'Analyze reasons for dropped quotations and competitor insights' };
      case 'employees':
        return { title: 'Showroom Staff Management', subtitle: 'Manage sales executive profiles and showroom team' };
      case 'mobile-pairing':
        return { title: 'Mobile App Scanner Hub', subtitle: 'Pair mobile phones with Desktop CRM via live QR code scan' };
      case 'builder':
      case 'settings':
        return { title: 'Settings & System Configuration', subtitle: 'Showroom branding, CRM form schema, ID sequence, and data backup' };
      default:
        return { title: 'Dashboard', subtitle: 'Live showroom revenue and conversion tracking' };
    }
  };

  const headerInfo = getHeaderInfo();

  if (initialLoading || authLoading) {
    return (
      <AppLoadingScreen
        statusMessage={
          isOnline
            ? 'Connecting to Vasantham CRM database...'
            : 'Starting local database & CRM services...'
        }
        isTakingLong={loadTakingLong}
        onRetry={() => verifyServerConnection(true)}
        onBypass={() => setInitialLoading(false)}
      />
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileSimulator={() => setShowMobileSimulator(true)}
        onOpenBrandingModal={() => setActiveTab('settings')}
        onOpenPairingModal={() => setActiveTab('mobile-pairing')}
        onAddCustomer={() => setShowAddCustomerModal(true)}
      />

      <main className="app-main">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          isOnline={isOnline}
          isChecking={isCheckingServer}
          onRetryConnection={() => verifyServerConnection(true)}
          onOpenPairingModal={() => setActiveTab('mobile-pairing')}
          onTitleClick={handleHeaderTitleClick}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          lastSyncTime={lastSyncTime}
        />

        <div className="app-content">
          <div key={`${activeTab}-${refreshKey}`} className="tab-view-transition workspace-section">
            {activeTab === 'dashboard' && <ExecutiveDashboardView />}

            {activeTab === 'customers' && (
              <CustomerListTable
                onAddCustomer={() => setShowAddCustomerModal(true)}
                onEditCustomer={(customer) => setEditingCustomer(customer)}
                onViewCustomer={(customer) => setViewingCustomer(customer)}
              />
            )}

            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'kpi' && <DailyKpiView />}
            {activeTab === 'followups' && (
              <FollowupSheetView onEditCustomer={(customer) => setEditingCustomer(customer)} />
            )}
            {activeTab === 'lost' && <LostSalesView />}
            {activeTab === 'employees' && <EmployeeManagementView />}
            {activeTab === 'mobile-pairing' && <MobilePairingView />}
            {activeTab === 'builder' && (
              <SettingsView
                initialTab="builder"
                onOpenPairingModal={() => setActiveTab('mobile-pairing')}
                devModeUnlocked={devModeUnlocked}
                onUnlockDevMode={() => setDevModeUnlocked(true)}
                onLockDevMode={() => {
                  setDevModeUnlocked(false);
                  toast.info('Developer Mode locked & hidden');
                }}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                initialTab="branding"
                onOpenPairingModal={() => setActiveTab('mobile-pairing')}
                devModeUnlocked={devModeUnlocked}
                onUnlockDevMode={() => setDevModeUnlocked(true)}
                onLockDevMode={() => {
                  setDevModeUnlocked(false);
                  toast.info('Developer Mode locked & hidden');
                }}
              />
            )}
            {activeTab === 'sequence' && <SequenceConfigModal />}
            {activeTab === 'versions' && <FormVersionHistoryModal />}
          </div>
        </div>
      </main>

      {(showAddCustomerModal || editingCustomer) && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => {
            setShowAddCustomerModal(false);
            setEditingCustomer(null);
          }}
          onSuccess={() => {
            setShowAddCustomerModal(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onEdit={(customer) => {
            setViewingCustomer(null);
            setEditingCustomer(customer);
          }}
          onDelete={(id) => deleteCustomer(id)}
        />
      )}

      {showMobileSimulator && (
        <MobileSimulatorModal onClose={() => setShowMobileSimulator(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToneDownProvider>
        <ToastProvider>
          <AuthProvider>
            <BrandingProvider>
              <CustomerProvider>
                <FormBuilderProvider>
                  <MainAppContent />
                </FormBuilderProvider>
              </CustomerProvider>
            </BrandingProvider>
          </AuthProvider>
        </ToastProvider>
      </ToneDownProvider>
    </ErrorBoundary>
  );
}
