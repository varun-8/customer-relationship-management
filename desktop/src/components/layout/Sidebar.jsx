import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Users,
  Target,
  Clock,
  FileX,
  UserCheck,
  Settings,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  QrCode,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useCustomer } from '../../context/CustomerContext';
import { useToneDown } from '../../context/ToneDownContext';
import { LogoutConfirmationModal } from '../auth/LogoutConfirmationModal';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  onOpenMobileSimulator,
}) => {
  const { user, isOwner, isEmployee, logout } = useAuth();
  const { branding, appShortName, tagline, primaryColor, renderLogo } = useBranding();
  const { customers, pagination, followupCounts } = useCustomer();
  const { isToneDown } = useToneDown();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Dynamic customer count badge
  const totalCustomers = pagination?.total || customers?.length || 0;

  const allowedEmployeeTabIds = ['customers', 'followups', 'mobile-pairing', 'lost'];

  const rawNavigationGroups = [
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
          badgeColor: isToneDown ? '#000000' : '#2563EB',
        },
        {
          id: 'reports',
          label: 'Reports & PDF Center',
          shortLabel: 'Reports',
          icon: FileText,
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
          badge: (followupCounts?.overdue > 0 || followupCounts?.today > 0)
            ? (followupCounts.overdue > 0 ? `${followupCounts.overdue} overdue` : followupCounts.today)
            : null,
          badgeColor: followupCounts?.overdue > 0 ? '#DC2626' : (isToneDown ? '#000000' : '#2563EB'),
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
          id: 'mobile-pairing',
          label: 'Mobile App Scanner',
          shortLabel: 'Mobile Scanner',
          icon: QrCode,
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

  const navigationGroups = isEmployee
    ? rawNavigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => allowedEmployeeTabIds.includes(item.id)),
        }))
        .filter((group) => group.items.length > 0)
    : rawNavigationGroups;

  // User Initials
  const userName = user?.name || (isOwner ? 'Vasantham Admin' : 'Showroom Staff');
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const userRole = user?.role === 'owner' ? 'Showroom Owner' : 'Sales Executive';

  // Keyboard shortcut (Ctrl+B / Cmd+B) to expand/shorten navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          title={appShortName || 'Vasantham CRM'}
          onClick={() => isCollapsed && setIsCollapsed(false)}
          style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
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
                {appShortName || 'Vasantham CRM'}
              </div>
              <div className="sidebar-brand-tagline">
                {tagline || 'Showroom CRM Suite'}
              </div>
            </div>
          )}
        </div>

        {/* Top Collapse / Expand Toggle Button */}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Navigation Bar (Ctrl+B)' : 'Shorten Navigation Bar (Ctrl+B)'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* 2. Grouped Navigation Scroll Area */}
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
      </div>

      {/* Dedicated Bottom Expand / Shorten Control Bar */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '100%',
            padding: isCollapsed ? '9px 0' : '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#94A3B8',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            transition: 'all 0.2s ease',
          }}
          className="sidebar-bottom-toggle-btn"
          title={isCollapsed ? 'Expand Navigation Bar (Ctrl+B)' : 'Shorten Navigation Bar (Ctrl+B)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCollapsed ? <ChevronRight size={16} color="#38BDF8" /> : <ChevronLeft size={16} color="#38BDF8" />}
            {!isCollapsed && <span style={{ color: '#E2E8F0' }}>Shorten Navigation</span>}
          </div>
          {!isCollapsed && (
            <span style={{ fontSize: '9.5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '4px', color: '#94A3B8', fontWeight: '800' }}>
              Ctrl+B
            </span>
          )}
        </button>
      </div>

      {/* 3. Desktop Sidebar Footer: Real User Identity Card & Logout Action */}
      <div className="sidebar-footer-wrapper" style={{ padding: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div
          className={`sidebar-profile-card ${isCollapsed ? 'sidebar-profile-card-collapsed' : ''}`}
          title={isCollapsed ? `${userName} (${userRole})` : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '10px',
            padding: isCollapsed ? '8px 4px' : '10px 12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <div
              className="sidebar-avatar-circle"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: primaryColor || '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              <span>{userInitials}</span>
            </div>

            {!isCollapsed && (
              <div className="sidebar-profile-meta" style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="sidebar-profile-name"
                  style={{
                    color: '#F8FAFC',
                    fontSize: '13px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userName}
                </div>
                <div
                  className="sidebar-profile-role"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#94A3B8',
                    fontSize: '11px',
                  }}
                >
                  <Shield size={10} color="#38BDF8" />
                  <span>{userRole}</span>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="sidebar-logout-btn"
              title="Sign Out / Logout"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#FCA5A5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#FCA5A5';
              }}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>

        {/* Dedicated Full-Width Logout Button when Collapsed */}
        {isCollapsed && (
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            title="Log Out (Sign Out)"
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '9px 0',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#FCA5A5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#FCA5A5';
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Executive Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />
    </aside>
  );
};
