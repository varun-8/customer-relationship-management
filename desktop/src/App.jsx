import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { FormBuilderProvider } from './context/FormBuilderContext';
import { BrandingProvider } from './context/BrandingContext';
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
import { api } from './services/api';

const MainAppContent = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Server health monitoring
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const { deleteCustomer } = useCustomer();

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
        />

        <div className="app-content">
          <div key={activeTab} className="tab-view-transition workspace-section">
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
            {activeTab === 'builder' && <SettingsView initialTab="builder" onOpenPairingModal={() => setActiveTab('mobile-pairing')} />}
            {activeTab === 'settings' && <SettingsView initialTab="branding" onOpenPairingModal={() => setActiveTab('mobile-pairing')} />}
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
    </ErrorBoundary>
  );
}
