import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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

const MainAppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const { isOwner } = useAuth();
  const { deleteCustomer } = useCustomer();

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
      />

      <main className="app-main">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onAddCustomer={() => setShowAddCustomerModal(true)}
        />

        <div className="app-content">
          <div className="workspace-section">
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

            {(activeTab === 'settings' || activeTab === 'builder') && <SettingsView />}
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

      {showMobileSimulator && (
        <MobileSimulatorModal onClose={() => setShowMobileSimulator(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <CustomerProvider>
          <FormBuilderProvider>
            <MainAppContent />
          </FormBuilderProvider>
        </CustomerProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}
