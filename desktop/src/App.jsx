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
import { MobileSimulatorModal } from './components/mobile-simulator/MobileSimulatorModal';

const MainAppContent = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const { isOwner } = useAuth();
  const { deleteCustomer } = useCustomer();

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'customers':
        return {
          title: 'Customers',
          subtitle: 'Manage and track all customer interactions',
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
        return { title: 'Customers', subtitle: 'Manage and track all customer interactions' };
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
            {activeTab === 'customers' && (
              <CustomerListTable
                onAddCustomer={() => setShowAddCustomerModal(true)}
                onEditCustomer={(customer) => setEditingCustomer(customer)}
                onViewCustomer={(customer) => setViewingCustomer(customer)}
              />
            )}

            {activeTab === 'builder' && isOwner && <FormBuilderView />}
            {activeTab === 'sequence' && isOwner && <SequenceConfigModal />}
            {activeTab === 'versions' && isOwner && <FormVersionHistoryModal />}
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
