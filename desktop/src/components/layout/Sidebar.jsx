import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  Target,
  Clock,
  FileX,
  UserCheck,
  Layers,
  Settings,
  Smartphone,
  Palette,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Plus,
  Building2,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useCustomer } from '../../context/CustomerContext';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  onOpenMobileSimulator,
  onOpenBrandingModal,
  onAddCustomer,
}) => {
  const { user, isOwner, logout } = useAuth();
  const { branding, appShortName, tagline, primaryColor, renderLogo } = useBranding();
  const { customers, pagination } = useCustomer();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic customer count badge
  const totalCustomers = pagination?.total || customers?.length || 0;

  const navigationGroups = [
    {
      groupTitle: 'Core Workspace',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Dashboard',
          shortLabel: 'Dashboard',
          icon: LayoutGrid,
        },
        {
          id: 'customers',
          label: 'Customers & Leads',
          shortLabel: 'Customers',
          icon: Users,
          badge: totalCustomers > 0 ? totalCustomers : null,
          badgeColor: '#2563EB',
        },
        {
          id: 'kpi',
          label: 'Daily Showroom KPI',
          shortLabel: 'Daily KPI',
          icon: Target,
        },
        {
          id: 'followups',
          label: 'Follow-up Sheet',
          shortLabel: 'Follow-ups',
          icon: Clock,
        },
        {
          id: 'lost',
          label: 'Lost Sales Intel',
          shortLabel: 'Lost Sales',
          icon: FileX,
        },
      ],
    },
    {
      groupTitle: 'Management',
      items: [
        {
          id: 'employees',
          label: 'Showroom Staff',
          shortLabel: 'Staff',
          icon: UserCheck,
        },
        {
          id: 'builder',
          label: 'CRM Form Builder',
          shortLabel: 'Builder',
          icon: Layers,
        },
        {
          id: 'settings',
          label: 'Settings & Config',
          shortLabel: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  // User Initials
  const userName = user?.name || (isOwner ? 'Vasantham Admin' : 'Showroom Staff');
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const userRole = user?.role === 'owner' ? 'Showroom Owner' : 'Sales Executive';

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'app-sidebar-collapsed' : ''}`}
      style={{
        width: isCollapsed ? '76px' : '260px',
        minWidth: isCollapsed ? '76px' : '260px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 1. Brand Header */}
      <div className="sidebar-brand-wrapper">
        <div
          className="sidebar-brand"
          onClick={onOpenBrandingModal}
          title={isCollapsed ? appShortName || 'BuildCRM' : 'Click to customize Brand & Logo'}
        >
          <div
            className="sidebar-brand-logo"
            style={{
              background:
                branding.logoType === 'image' && branding.logoImage
                  ? '#FFFFFF'
                  : `linear-gradient(135deg, ${primaryColor || '#2563EB'}, #1D4ED8)`,
              boxShadow: `0 4px 14px ${(primaryColor || '#2563EB')}55`,
            }}
          >
            {renderLogo(isCollapsed ? 24 : 26)}
          </div>

          {!isCollapsed && (
            <div className="sidebar-brand-text-block">
              <div className="sidebar-brand-title">
                {appShortName || 'BuildCRM'}
              </div>
              <div className="sidebar-brand-tagline">
                {tagline || 'Showroom CRM Suite'}
              </div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* 2. Quick Lead Action Button */}
      {onAddCustomer && (
        <div className="sidebar-action-container">
          <button
            type="button"
            className="sidebar-action-btn"
            onClick={onAddCustomer}
            title="Register New Customer Lead"
          >
            <Plus size={16} strokeWidth={2.5} />
            {!isCollapsed && <span>New Customer</span>}
          </button>
        </div>
      )}

      {/* 3. Grouped Navigation Scroll Area */}
      <div className="sidebar-scroll-area">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="sidebar-nav-group">
            {!isCollapsed && (
              <div className="sidebar-group-heading">
                {group.groupTitle}
              </div>
            )}

            <nav className="sidebar-nav-list">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="sidebar-nav-item-indicator" />
                    <div className="sidebar-nav-icon-box">
                      <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                    </div>

                    {!isCollapsed && (
                      <span className="sidebar-nav-item-label">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge !== undefined && item.badge !== null && (
                      <span
                        className="sidebar-nav-badge"
                        style={{ backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)', color: isActive ? '#2563EB' : '#94A3B8' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {/* Tools Section */}
        <div className="sidebar-nav-group">
          {!isCollapsed && (
            <div className="sidebar-group-heading">
              Showroom Tools
            </div>
          )}

          <nav className="sidebar-nav-list">
            <button
              type="button"
              onClick={onOpenMobileSimulator}
              className="sidebar-nav-item sidebar-tool-item"
              title={isCollapsed ? 'Launch Mobile CRM App Preview' : undefined}
            >
              <span className="sidebar-nav-item-indicator" />
              <div className="sidebar-nav-icon-box">
                <Smartphone size={18} color="#38BDF8" strokeWidth={1.9} />
              </div>
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span className="sidebar-nav-item-label">Mobile App View</span>
                  <span className="sidebar-tool-pill">SIMULATOR</span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenBrandingModal}
              className="sidebar-nav-item sidebar-tool-item"
              title={isCollapsed ? 'Customize Showroom Branding' : undefined}
            >
              <span className="sidebar-nav-item-indicator" />
              <div className="sidebar-nav-icon-box">
                <Palette size={18} color="#F472B6" strokeWidth={1.9} />
              </div>
              {!isCollapsed && (
                <span className="sidebar-nav-item-label">App Branding</span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* 4. Desktop Sidebar Footer: Real User Identity Card */}
      <div className="sidebar-footer-wrapper">
        <div
          className={`sidebar-profile-card ${isCollapsed ? 'sidebar-profile-card-collapsed' : ''}`}
          title={isCollapsed ? `${userName} (${userRole})` : undefined}
        >
          <div className="sidebar-avatar-circle">
            <span>{userInitials}</span>
          </div>

          {!isCollapsed && (
            <div className="sidebar-profile-meta">
              <div className="sidebar-profile-name">{userName}</div>
              <div className="sidebar-profile-role">
                <Shield size={10} color="#38BDF8" />
                <span>{userRole}</span>
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="sidebar-logout-btn"
              title="Sign Out / Switch Profile"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
