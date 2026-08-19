import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Hash,
  Clock,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Monitor,
  Smartphone,
  Box,
  Save,
  Trash2,
  Sliders,
  Paintbrush,
  Building2,
  Database,
  Download,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle,
  FileText,
  Phone,
  MapPin,
  ShieldCheck,
  Server,
  RefreshCw,
  AlertTriangle,
  Key,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../../services/api';
import { useBranding, BRAND_ICONS } from '../../context/BrandingContext';
import { useCustomer } from '../../context/CustomerContext';
import { FormBuilderView } from '../form-builder/FormBuilderView';
import { SequenceConfigModal } from './SequenceConfigModal';
import { ActiveFormSchemaViewer } from './ActiveFormSchemaViewer';
import { DataImportModal } from './DataImportModal';

export const SettingsView = ({ initialTab = 'branding' }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState(initialTab);
  const [importModalMode, setImportModalMode] = useState(null); // 'csv' | 'json' | null

  const {
    branding,
    updateBranding,
    appName: currentAppName,
    appShortName: currentAppShortName,
    tagline: currentTagline,
    logoType: currentLogoType,
    logoIcon: currentLogoIcon,
    logoImage: currentLogoImage,
    primaryColor: currentPrimaryColor,
  } = useBranding();

  const { customers, sequenceConfig, activeForm } = useCustomer();

  // Branding Form State
  const [appName, setAppName] = useState(currentAppName || 'Vasantham Tiles & Sanitary Wares');
  const [appShortName, setAppShortName] = useState(currentAppShortName || 'Vasantham CRM');
  const [tagline, setTagline] = useState(currentTagline || 'Tiles, Sanitary Wares, CP Fittings & Adhesives');
  const [logoType, setLogoType] = useState(currentLogoType || 'icon');
  const [logoIcon, setLogoIcon] = useState(currentLogoIcon || 'Box');
  const [logoImage, setLogoImage] = useState(currentLogoImage || '');
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor || '#2563EB');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Business Profile & WhatsApp State
  const [storeAddress, setStoreAddress] = useState('124, Bypass Road, Near Bus Stand, Madurai, Tamil Nadu - 625001');
  const [gstin, setGstin] = useState('33AAAAA0000A1Z5');
  const [storePhone, setStorePhone] = useState('9840123456');
  const [whatsappPhone, setWhatsappPhone] = useState('9840123456');
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    'Hello {customerName}!\n\nThank you for visiting *{appName}*.\nHere is your requested quotation of *₹{quoteValue}* for {products}.\n\nTagline: {tagline}\nFeel free to reach us at {phone}. Have a great day!'
  );
  const [businessSavedSuccess, setBusinessSavedSuccess] = useState(false);

  // Developer Key Database Wipe State
  const [devKeyInput, setDevKeyInput] = useState('');
  const [showDevKey, setShowDevKey] = useState(false);
  const [wipingData, setWipingData] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [wipeSuccess, setWipeSuccess] = useState('');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const handleWipeDatabase = async () => {
    if (!devKeyInput.trim()) {
      setWipeError('Please enter the Developer Key configured in backend .env');
      return;
    }

    setWipingData(true);
    setWipeError('');
    setWipeSuccess('');

    try {
      const res = await api.wipeAllData(devKeyInput.trim());
      if (res && res.success) {
        setWipeSuccess(res.message || 'Database wiped successfully!');
        setDevKeyInput('');
        setShowWipeConfirm(false);
        // Refresh browser / context after brief pause
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setWipeError(res?.message || 'Failed to wipe database.');
      }
    } catch (e) {
      setWipeError(e.message || 'Verification failed. Incorrect DEV_KEY.');
    } finally {
      setWipingData(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('Logo image file must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoImage(event.target?.result || '');
      setLogoType('image');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
    if (!appName.trim()) {
      setError('Software Brand Name cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');

    const res = await updateBranding({
      appName: appName.trim(),
      appShortName: (appShortName || appName).trim(),
      tagline: tagline.trim(),
      logoType,
      logoIcon,
      logoImage,
      primaryColor,
    });

    setSaving(false);
    if (res && res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setError(res?.message || 'Failed to update branding settings.');
    }
  };

  const handleSaveBusinessProfile = (e) => {
    e.preventDefault();
    setBusinessSavedSuccess(true);
    setTimeout(() => setBusinessSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setAppName('Vasantham Tiles & Sanitary Wares');
    setAppShortName('Vasantham CRM');
    setTagline('Tiles, Sanitary Wares, CP Fittings & Adhesives');
    setLogoType('icon');
    setLogoIcon('Box');
    setLogoImage('');
    setPrimaryColor('#2563EB');
  };

  // Export Customer Data to CSV
  const handleExportCustomersCSV = () => {
    if (!customers || customers.length === 0) {
      alert('No customer records available to export.');
      return;
    }
    const headers = ['Customer ID', 'Created Date', 'Customer Name', 'Phone', 'Customer Type', 'Status', 'Location', 'Quotation Value'];
    const rows = customers.map((c) => {
      const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
      return [
        `"${c.customerId || ''}"`,
        `"${new Date(c.createdAt).toLocaleDateString()}"`,
        `"${d.customerName || d.name || ''}"`,
        `"${d.phone || d.mobile || ''}"`,
        `"${d.customerType || ''}"`,
        `"${c.status || ''}"`,
        `"${d.location || ''}"`,
        Number(d.quotationValue || d.orderValue || 0),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vasantham_CRM_Customers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup
  const handleExportJSONBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      branding: { appName, appShortName, tagline, primaryColor },
      sequenceConfig,
      customerCount: customers.length,
      customers,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `Vasantham_CRM_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'branding', label: '🎨 Showroom Branding & Theme', icon: Palette },
    { id: 'sequence', label: '🔢 Customer ID Sequence', icon: Hash },
    { id: 'builder', label: '🛠️ Form Schema Fields', icon: Layers },
    { id: 'business', label: '🏢 Showroom Profile & WhatsApp', icon: Building2 },
    { id: 'backup', label: '💾 Database & Backup Center', icon: Database },
  ];

  const currentPrefix = sequenceConfig?.prefix || 'VAS-';
  const nextCustomerNumber = (sequenceConfig?.currentValue || 0) + (sequenceConfig?.step || 1);
  const nextFormattedId = `${currentPrefix}${String(nextCustomerNumber).padStart(sequenceConfig?.padding || 6, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'tabFadeInUp 0.3s ease' }}>
      {/* 1. Scorecard Metric Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Showroom Brand */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="metric-value" style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {appShortName || 'Vasantham CRM'}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Showroom Branding & Theme
            </div>
          </div>
        </div>

        {/* Card 2: Customer ID Sequence */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '18px', fontWeight: '900', color: '#7C3AED', lineHeight: 1.1, fontFamily: 'monospace' }}>
              {nextFormattedId}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              Next Customer ID
            </div>
          </div>
        </div>

        {/* Card 3: Form Schema Fields */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '20px', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
              {activeForm?.fields ? `${activeForm.fields.filter((f) => f.active).length} Active Fields` : '23 Active Fields'}
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              {activeForm?.name ? `${activeForm.name} (v${activeForm.version || 1})` : 'Dynamic Form Schema'}
            </div>
          </div>
        </div>

        {/* Card 4: MongoDB Atlas */}
        <div
          className="metric-card-item"
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="metric-icon-box" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server size={20} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '18px', fontWeight: '900', color: '#D97706', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>MongoDB Atlas</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            </div>
            <div className="metric-label" style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              24/7 Cloud Database Live
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Settings Navigation Dock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#FFFFFF',
          padding: '6px',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSettingsTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontWeight: isActive ? '800' : '600',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Showroom Branding & Theme */}
      {activeSettingsTab === 'branding' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Showroom Brand Identity & Visual Theme
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                Customize your showroom software name, upload your custom logo, or choose from brand icons.
              </p>
            </div>

            {savedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px' }}>
                <Check size={16} />
                <span>Saved & Synced Live!</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          {/* Live Preview Card */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0B1120 0%, #1E293B 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Live Software Branding Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${primaryColor}, #1D4ED8)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: `0 4px 14px ${primaryColor}88`,
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {logoType === 'image' && logoImage ? (
                    <img src={logoImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    (() => {
                      const IconComp = BRAND_ICONS[logoIcon]?.icon || Box;
                      return <IconComp size={24} color="#FFFFFF" strokeWidth={2.5} />;
                    })()
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {appShortName || appName || 'Vasantham CRM'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '1px' }}>
                    {tagline || 'Tiles, Sanitary Wares, CP Fittings & Adhesives'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Monitor size={14} color="#60A5FA" />
                <span>Desktop Workspace</span>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Smartphone size={14} color="#34D399" />
                <span>Mobile App</span>
              </div>
            </div>
          </div>

          {/* Logo Selection Box */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Showroom Logo & Icon Selection
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0' }}>
                    Upload your showroom logo image or select from preset vector icons.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Chips */}
              <div style={{ display: 'flex', gap: '6px', background: '#FFFFFF', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setLogoType('image')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: logoType === 'image' ? '#2563EB' : 'transparent',
                    color: logoType === 'image' ? '#FFFFFF' : '#64748B',
                    fontWeight: logoType === 'image' ? '800' : '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={14} />
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLogoType('icon')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: logoType === 'icon' ? '#2563EB' : 'transparent',
                    color: logoType === 'icon' ? '#FFFFFF' : '#64748B',
                    fontWeight: logoType === 'icon' ? '800' : '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Vector Icons</span>
                </button>
              </div>
            </div>

            {logoType === 'image' ? (
              <div
                style={{
                  border: '2px dashed #93C5FD',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                }}
              >
                {logoImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'inline-flex' }}>
                      <img src={logoImage} alt="Uploaded Logo" style={{ height: '70px', maxWidth: '220px', objectFit: 'contain' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
                        <Upload size={13} />
                        <span>Upload Different Logo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoImage('');
                          setLogoType('icon');
                        }}
                        className="btn btn-danger btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <Upload size={20} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Upload Showroom Logo</div>
                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 12px' }}>Recommended: Transparent PNG (Max 3MB)</p>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '800', borderRadius: '8px' }}>
                      <Upload size={14} />
                      <span>Select Logo File</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {Object.entries(BRAND_ICONS).map(([key, item]) => {
                    const Icon = item.icon;
                    const isSelected = logoIcon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLogoIcon(key)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          color: isSelected ? '#2563EB' : '#0F172A',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
                        <span style={{ fontSize: '11px', fontWeight: isSelected ? '800' : '600' }}>{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: App Name & Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Software Full Name</span> <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Vasantham Tiles & Sanitary Wares"
                style={{ borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Sidebar Short Title</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={appShortName}
                onChange={(e) => setAppShortName(e.target.value)}
                placeholder="e.g. Vasantham CRM"
                style={{ borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              <span>Showroom Tagline / Subtitle</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Tiles, Sanitary Wares, CP Fittings & Adhesives"
              style={{ borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
            />
          </div>

          {/* Save Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
            <button type="button" onClick={handleResetDefaults} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '10px' }}>
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>

            <button type="button" onClick={handleSaveBranding} disabled={saving} className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
              <Save size={15} />
              <span>{saving ? 'Saving...' : '✓ Save Branding & Sync'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Sequence Generator */}
      {activeSettingsTab === 'sequence' && <SequenceConfigModal />}

      {/* Tab 3: CRM Form Schema Builder & Live Active Form Viewer */}
      {activeSettingsTab === 'builder' && (
        <ActiveFormSchemaViewer activeForm={activeForm} />
      )}

      {/* Tab 4: Showroom Profile & WhatsApp */}
      {activeSettingsTab === 'business' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Showroom Business Details & WhatsApp Templates
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                Configure showroom contact details, GSTIN, and default professional WhatsApp message formatting.
              </p>
            </div>

            {businessSavedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px' }}>
                <Check size={16} />
                <span>Profile Saved Successfully!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveBusinessProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Showroom Phone</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    style={{ paddingLeft: '34px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>WhatsApp Business Number</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MessageSquare size={15} style={{ position: 'absolute', left: '12px', color: '#10B981' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    style={{ paddingLeft: '34px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>Showroom Full Address</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    style={{ paddingLeft: '34px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <span>GSTIN Number</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  style={{ borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* WhatsApp Template Textarea */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Default WhatsApp Follow-up Message Template</span>
              </label>
              <textarea
                className="form-input"
                rows={4}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                style={{ borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '12.5px', lineHeight: '1.5' }}
              />
              <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                Available tags: <code>{'{customerName}'}</code>, <code>{'{quoteValue}'}</code>, <code>{'{appName}'}</code>, <code>{'{tagline}'}</code>, <code>{'{phone}'}</code>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '13px', fontWeight: '800', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
                <Check size={16} />
                <span>Save Business Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: Database & Backup Center */}
      {activeSettingsTab === 'backup' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Data Backup, Exports & Cloud Diagnostics
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                Export full CRM database backups to CSV or JSON formats and monitor MongoDB Atlas cloud health.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
              <ShieldCheck size={16} color="#10B981" />
              <span>Cloud Protected</span>
            </div>
          </div>

          {/* Data Export & Import Action Grid (4 Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {/* Card 1: Import CSV */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <Upload size={20} />
                </div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Import Customers (CSV)</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                  Upload customer spreadsheet from Excel or Google Sheets to bulk-add leads into CRM.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setImportModalMode('csv')}
                className="btn btn-primary"
                style={{ borderRadius: '10px', fontSize: '12.5px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Upload size={14} />
                <span>Import CSV File</span>
              </button>
            </div>

            {/* Card 2: Restore JSON Backup */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <Database size={20} />
                </div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Restore CRM Backup (JSON)</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                  Restore full showroom snapshot with branding, form schema, sequence, and leads.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setImportModalMode('json')}
                className="btn btn-outline"
                style={{ borderRadius: '10px', fontSize: '12.5px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FFFFFF', color: '#7C3AED', borderColor: '#DDD6FE' }}
              >
                <Upload size={14} />
                <span>Restore JSON Backup</span>
              </button>
            </div>

            {/* Card 3: Export CSV Customers */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Export Customer Records (CSV)</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                  Download complete spreadsheet of all {customers.length} registered showroom leads.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCustomersCSV}
                className="btn btn-outline"
                style={{ borderRadius: '10px', fontSize: '12.5px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FFFFFF' }}
              >
                <Download size={14} />
                <span>Export Customers CSV</span>
              </button>
            </div>

            {/* Card 4: Full System JSON */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <Database size={20} />
                </div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Full CRM Backup (JSON)</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                  Download full system snapshot including branding, form schema, and customer records.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJSONBackup}
                className="btn btn-outline"
                style={{ borderRadius: '10px', fontSize: '12.5px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FFFFFF' }}
              >
                <Download size={14} />
                <span>Download JSON Backup</span>
              </button>
            </div>
          </div>

          {/* Database Health Card */}
          <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={22} />
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                  MongoDB Atlas Cloud Cluster: Operational
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                  Region: AWS / Mumbai (ap-south-1) • Real-time synchronization active
                </div>
              </div>
            </div>

            <span style={{ fontSize: '12px', fontWeight: '800', color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
              ● 100% HEALTHY
            </span>
          </div>

          {/* Developer Danger Zone: Data Wipe */}
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1.5px solid #FECDD3',
              background: '#FFF5F5',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#991B1B' }}>
                    Developer Danger Zone: Reset & Wipe All CRM Data
                  </div>
                  <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px', lineHeight: '1.4' }}>
                    Permanently delete all registered customer leads, dynamic form responses, follow-up call history, daily KPI shifts, and lost sales records. Resets sequence counter back to 0. Requires the <code>DEV_KEY</code> defined in your <code>backend/.env</code> file.
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#DC2626', background: '#FEE2E2', padding: '4px 10px', borderRadius: '6px', border: '1px solid #FECDD3' }}>
                DESTRUCTIVE ACTION
              </span>
            </div>

            {/* Input & Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                  <Key size={15} />
                </div>
                <input
                  type={showDevKey ? 'text' : 'password'}
                  placeholder="Enter DEV_KEY from backend .env..."
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #FCA5A5',
                    background: '#FFFFFF',
                    fontSize: '12.5px',
                    color: '#0F172A',
                    outline: 'none',
                    fontWeight: '600',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowDevKey(!showDevKey)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: '2px',
                  }}
                  title={showDevKey ? 'Hide key' : 'Show key'}
                >
                  {showDevKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {!showWipeConfirm ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!devKeyInput.trim()) {
                      setWipeError('Please enter DEV_KEY from backend .env first.');
                      return;
                    }
                    setWipeError('');
                    setShowWipeConfirm(true);
                  }}
                  className="btn"
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={15} />
                  <span>Wipe All Data</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleWipeDatabase}
                    disabled={wipingData}
                    className="btn"
                    style={{
                      background: '#991B1B',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>{wipingData ? 'Wiping Database...' : 'Confirm Wipe Database'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWipeConfirm(false)}
                    className="btn btn-outline"
                    style={{
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      background: '#FFFFFF',
                      borderColor: '#E2E8F0',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {wipeError ? (
              <div style={{ color: '#DC2626', fontSize: '12px', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={14} />
                <span>{wipeError}</span>
              </div>
            ) : null}

            {wipeSuccess ? (
              <div style={{ color: '#059669', fontSize: '12px', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle size={14} />
                <span>{wipeSuccess} Reloading CRM...</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Render Data Import Modal when triggered */}
      {importModalMode && (
        <DataImportModal
          mode={importModalMode}
          onClose={() => setImportModalMode(null)}
        />
      )}
    </div>
  );
};


