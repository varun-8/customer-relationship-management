import React from 'react';
import {
  LayoutGrid,
  Users,
  Target,
  Clock,
  FileX,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

export const Sidebar = ({ activeTab, setActiveTab, onOpenMobileSimulator, onOpenBrandingModal }) => {
  const { user, isOwner } = useAuth();
  const { appShortName, primaryColor, renderLogo } = useBranding();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'kpi', label: 'Daily KPI', icon: Target },
    { id: 'followups', label: 'Follow-ups', icon: Clock },
    { id: 'lost', label: 'Lost Sales', icon: FileX },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Logo Header with Dynamic Customization */}
      <div
        className="sidebar-brand"
        onClick={onOpenBrandingModal}
        style={{ cursor: 'pointer' }}
        title="Click to customize App Name & Logo"
      >
        <div
          className="sidebar-brand-logo"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, #1D4ED8)`,
            boxShadow: `0 4px 12px ${primaryColor}66`,
          }}
        >
          {renderLogo(18)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
          <div className="sidebar-brand-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {appShortName || 'BuildCRM'}
          </div>
          <Palette size={13} color="var(--sidebar-text)" style={{ opacity: 0.6 }} />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Card & Exit Button */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sidebar-user-avatar">
              <span>KR</span>
            </div>
            <div>
              <div className="sidebar-user-name">Karthik Raja</div>
              <div className="sidebar-user-role">Sales Manager</div>
            </div>
          </div>
          <ChevronDown size={15} color="var(--sidebar-text)" style={{ cursor: 'pointer' }} />
        </div>

        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onOpenMobileSimulator}
            className="btn-icon"
            style={{ color: 'var(--sidebar-text)', padding: '6px' }}
            title="Open Mobile App Simulator"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
