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
import { FormBuilderView } from './components/form-builder/FormBuilderView';
import { SequenceConfigModal } from './components/settings/SequenceConfigModal';
import { FormVersionHistoryModal } from './components/settings/FormVersionHistoryModal';
import { BrandingSettingsModal } from './components/settings/BrandingSettingsModal';
import { SettingsView } from './components/settings/SettingsView';
import { MobileSimulatorModal } from './components/mobile-simulator/MobileSimulatorModal';
import { DailyKpiView } from './components/kpi/DailyKpiView';
import { LostSalesView } from './components/lost-sales/LostSalesView';
import { ExecutiveDashboardView } from './components/dashboard/ExecutiveDashboardView';
import { FollowupSheetView } from './components/followups/FollowupSheetView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { MobilePairingModal } from './components/mobile-pairing/MobilePairingModal';
import { MobilePairingView } from './components/mobile-pairing/MobilePairingView';
import { api } from './services/api';

const MainAppContent = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Server health monitoring
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  const { isOwner } = useAuth();
  const { deleteCustomer } = useCustomer();

  // Periodic and on-demand server connectivity check
  const verifyServerConnection = useCallback(async (manual = false) => {
    if (manual) setIsCheckingServer(true);
    try {
      const health = await api.checkHealth();
      if (health.online) {
        if (!isOnline) {
          toast.success('Connected to CRM backend server & MongoDB Atlas', 'Back Online');
        }
        setIsOnline(true);
      } else {
        if (isOnline) {
          toast.warning('Cannot reach CRM server. Check your local backend.', 'Server Offline');
        }
        setIsOnline(false);
      }
    } catch (e) {
      if (isOnline) {
        toast.warning('Server unreachable. Running with local cache.', 'Server Offline');
      }
      setIsOnline(false);
    } finally {
      if (manual) setIsCheckingServer(false);
    }
  }, [isOnline, toast]);

  useEffect(() => {
    // Check initial health
    verifyServerConnection(false);

    // Watchdog ping every 20 seconds
    const interval = setInterval(() => {
      verifyServerConnection(false);
    }, 20000);

    return () => clearInterval(interval);
  }, [verifyServerConnection]);

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Executive Dashboard',
          subtitle: 'Live showroom revenue, conversion funnel, and salesperson quota tracking',
        };
      case 'customers':
        return {
          title: 'Customers',
          subtitle: 'Manage and track all customer interactions',
        };
      case 'kpi':
        return {
          title: 'Daily KPI Performance Hub',
          subtitle: 'Track showroom footfall, quotation funnel, follow-ups, and daily sales value',
        };
      case 'followups':
        return {
          title: 'Follow-up Sheet & Lead Nurturing',
          subtitle: 'Today, upcoming 7 days & overdue calling schedule with Hot/Warm priority tracking',
        };
      case 'lost':
        return {
          title: 'Lost Sales & Competitor Intelligence',
          subtitle: 'Analyze lost deal root causes, competitor pricing gaps, and product leakage',
        };
      case 'employees':
        return {
          title: 'Showroom Staff & Mobile Logins',
          subtitle: 'Manage sales staff credentials, assign showroom roles, and control access',
        };
      case 'mobile-pairing':
        return {
          title: 'Mobile Sync & QR Pairing Center',
          subtitle: 'Connect mobile phones to desktop CRM server, view network IP, and monitor live paired devices',
        };
      case 'settings':
        return {
          title: 'Settings & Administration',
          subtitle: 'App branding, showroom logo, CRM form schema, and sequence configuration',
        };
      case 'builder':
        return {
          title: 'Customer Form Builder',
          subtitle: 'Configure dynamic schema fields and publish updates to mobile app',
        };
      case 'sequence':
        return {
          title: 'Customer ID Sequence',
          subtitle: 'Sequential Customer ID configuration (e.g. CUS-000001)',
        };
      case 'versions':
        return {
          title: 'Schema Version History',
          subtitle: 'Published form version logs and changelog audits',
        };
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
        onOpenBrandingModal={() => setShowBrandingModal(true)}
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

            {activeTab === 'kpi' && <DailyKpiView />}
            {activeTab === 'followups' && (
              <FollowupSheetView onEditCustomer={(customer) => setEditingCustomer(customer)} />
            )}
            {activeTab === 'lost' && <LostSalesView />}
            {activeTab === 'employees' && <EmployeeManagementView />}
            {activeTab === 'mobile-pairing' && <MobilePairingView />}
            {activeTab === 'builder' && <FormBuilderView />}

            {activeTab === 'settings' && <SettingsView onOpenPairingModal={() => setActiveTab('mobile-pairing')} />}
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

      {showBrandingModal && (
        <BrandingSettingsModal onClose={() => setShowBrandingModal(false)} />
      )}

      {showPairingModal && (
        <MobilePairingModal onClose={() => setShowPairingModal(false)} />
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
