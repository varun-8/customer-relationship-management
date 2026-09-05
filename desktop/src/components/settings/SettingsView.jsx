import React, { useState, useEffect } from 'react';
import {
  Palette,
  Layers,
  Hash,
  Upload,
  Image as ImageIcon,
  Check,
  Building2,
  Database,
  Download,
  FileSpreadsheet,
  Phone,
  MapPin,
  Server,
  RefreshCw,
  AlertTriangle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  MessageSquare,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { api } from '../../services/api';
import { useBranding } from '../../context/BrandingContext';
import { useCustomer } from '../../context/CustomerContext';
import { useToneDown } from '../../context/ToneDownContext';
import { FormBuilderView } from '../form-builder/FormBuilderView';
import { SequenceConfigModal } from './SequenceConfigModal';
import { DataImportModal } from './DataImportModal';
import {
  getStatusTemplates,
  saveStatusTemplates,
  DEFAULT_STATUS_TEMPLATES,
} from '../../utils/whatsappHelper';

export const SettingsView = ({
  initialTab = 'branding',
  onOpenPairingModal,
  devModeUnlocked = false,
  onUnlockDevMode,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState(initialTab);
  const [importModalMode, setImportModalMode] = useState(null); // 'csv' | 'json' | null

  const {
    branding,
    updateBranding,
    appName: currentAppName,
    appShortName: currentAppShortName,
    tagline: currentTagline,
    logoImage: currentLogoImage,
    primaryColor: currentPrimaryColor,
    renderLogo,
  } = useBranding();

  const { customers, sequenceConfig, activeForm } = useCustomer();
  const { isToneDown, toggleToneDown } = useToneDown();

  // Branding Form State
  const [appName, setAppName] = useState(currentAppName || 'Vasantham Tiles & Sanitary Wares');
  const [appShortName, setAppShortName] = useState(currentAppShortName || 'Vasantham CRM');
  const [tagline, setTagline] = useState(currentTagline || 'Tiles, Sanitary Wares, CP Fittings & Adhesives');
  const [logoImage, setLogoImage] = useState(currentLogoImage || '');
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor || '#2563EB');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Business Profile & WhatsApp State
  const [storeAddress, setStoreAddress] = useState(branding?.address || '124, Bypass Road, Near Bus Stand, Madurai, Tamil Nadu - 625001');
  const [gstin, setGstin] = useState(branding?.gstin || '33AAAAA0000A1Z5');
  const [storePhone, setStorePhone] = useState(branding?.phone || '+91 98401 23456');
  const [businessSavedSuccess, setBusinessSavedSuccess] = useState(false);

  // Sync state if branding loads asynchronously
  useEffect(() => {
    if (branding?.address) setStoreAddress(branding.address);
    if (branding?.phone) setStorePhone(branding.phone);
    if (branding?.gstin) setGstin(branding.gstin);
  }, [branding]);

  // Status-Specific WhatsApp Message Templates
  const [waTemplates, setWaTemplates] = useState(() => getStatusTemplates());
  const [activeWaStatusKey, setActiveWaStatusKey] = useState('followup');

  // Developer Key Database Wipe State
  const [devKeyInput, setDevKeyInput] = useState('');
  const [showDevKey, setShowDevKey] = useState(false);
  const [wipingData, setWipingData] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [wipeSuccess, setWipeSuccess] = useState('');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Daily Auto-Backup & 30-Day Retention Policy State
  const [backupConfig, setBackupConfig] = useState(null);
  const [backupPathInput, setBackupPathInput] = useState('');
  const [savingBackupPath, setSavingBackupPath] = useState(false);
  const [runningAutoBackup, setRunningAutoBackup] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState('');

  const fetchBackupConfig = async () => {
    try {
      const res = await api.getBackupConfig();
      if (res && res.success && res.data) {
        setBackupConfig(res.data);
        setBackupPathInput(res.data.backupDir || '');
      }
    } catch (e) {
      console.warn('Backup config fetch error:', e);
    }
  };

  useEffect(() => {
    if (activeSettingsTab === 'backup') {
      fetchBackupConfig();
    }
  }, [activeSettingsTab]);

  const handleUpdateBackupPath = async () => {
    if (!backupPathInput.trim()) return;
    setSavingBackupPath(true);
    setBackupSuccessMsg('');
    try {
      const res = await api.updateBackupConfig({ backupDir: backupPathInput.trim() });
      if (res && res.success) {
        setBackupSuccessMsg('Backup storage folder location updated successfully!');
        fetchBackupConfig();
      }
    } catch (e) {
      alert(e.message || 'Failed to update backup directory path');
    } finally {
      setSavingBackupPath(false);
    }
  };

  const handleRunManualAutoBackup = async () => {
    setRunningAutoBackup(true);
    setBackupSuccessMsg('');
    try {
      const res = await api.runAutoBackup(true);
      if (res && res.success) {
        setBackupSuccessMsg(`🎉 ${res.message || 'Full backup completed!'}`);
        fetchBackupConfig();
      }
    } catch (e) {
      alert(e.message || 'Failed to run backup');
    } finally {
      setRunningAutoBackup(false);
    }
  };

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
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      gstin: gstin.trim(),
      logoType: logoImage ? 'image' : 'icon',
      logoIcon: 'Box',
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

  const handleSaveBusinessProfile = async (e) => {
    e.preventDefault();
    saveStatusTemplates(waTemplates);
    await updateBranding({
      ...branding,
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      gstin: gstin.trim(),
    });
    setBusinessSavedSuccess(true);
    setTimeout(() => setBusinessSavedSuccess(false), 3000);
  };

  const handleInsertTag = (tag) => {
    const currentText = waTemplates[activeWaStatusKey] || '';
    setWaTemplates({
      ...waTemplates,
      [activeWaStatusKey]: currentText + ` ${tag} `,
    });
  };

  const handleResetWaTemplate = () => {
    setWaTemplates({
      ...waTemplates,
      [activeWaStatusKey]: DEFAULT_STATUS_TEMPLATES[activeWaStatusKey],
    });
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
      app: 'Vasantham CRM',
      exportedAt: new Date().toISOString(),
      branding,
      sequenceConfig,
      formSchema: activeForm,
      whatsappTemplates: waTemplates,
      customersCount: customers?.length || 0,
      customers: customers || [],
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vasantham_CRM_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'branding', label: 'Showroom Branding', icon: Palette },
    { id: 'builder', label: 'Form Builder', icon: Layers },
    { id: 'sequence', label: 'ID Sequence', icon: Hash },
    { id: 'business', label: 'Business & WhatsApp', icon: Building2 },
    { id: 'backup', label: 'Data Backup & System', icon: Database },
    ...(devModeUnlocked ? [{ id: 'dev', label: 'Developer Mode', icon: Terminal }] : []),
  ];

  const waStatusOptions = [
    { key: 'followup', label: '👋 New Lead / Follow-up', color: '#2563EB', bg: '#EFF6FF' },
    { key: 'quotation', label: '📄 Quotation Shared', color: '#0369A1', bg: '#E0F2FE' },
    { key: 'negotiation', label: '🤝 Price Negotiation', color: '#B45309', bg: '#FEF3C7' },
    { key: 'order_confirmed', label: '🎉 Order Confirmed', color: '#15803D', bg: '#DCFCE7' },
    { key: 'lost', label: '🌸 Deal Lost / Re-engagement', color: '#991B1B', bg: '#FEE2E2' },
  ];

  // Dynamic next customer ID display
  const seqVal = sequenceConfig?.currentValue || customers?.length || 10;
  const prefix = sequenceConfig?.prefix || 'CUS-';
  const padding = sequenceConfig?.padding || 6;
  const nextFormattedId = `${prefix}${String(seqVal + 1).padStart(padding, '0')}`;

  // Live preview message computation
  const previewTemplate = waTemplates[activeWaStatusKey] || DEFAULT_STATUS_TEMPLATES[activeWaStatusKey];
  const sampleRenderedMsg = previewTemplate
    .replace(/\{customerName\}/g, 'Sivaraman Builders')
    .replace(/\{appName\}/g, appName || 'Vasantham Tiles & Sanitary Wares')
    .replace(/\{storePhone\}/g, storePhone || '9840123456')
    .replace(/\{phone\}/g, storePhone || '9840123456')
    .replace(/\{requirement\}/g, 'Italian Marble Vitrified Tiles, Kohler Sanitaryware')
    .replace(/\{products\}/g, 'Italian Marble Vitrified Tiles, Kohler Sanitaryware')
    .replace(/\{quoteValue\}/g, '₹2,45,000');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Card 1: Branding */}
        <div
          onClick={onUnlockDevMode}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title="Settings & System Configuration — Click 5 times on title to toggle Developer Mode"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SHOWROOM IDENTITY {devModeUnlocked ? ' (DEV UNLOCKED)' : ''}
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: devModeUnlocked ? '#FEF3C7' : '#EFF6FF', color: devModeUnlocked ? '#D97706' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {devModeUnlocked ? <Terminal size={16} /> : <Palette size={16} />}
            </div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appShortName || 'Vasantham CRM'}
          </div>
          <div style={{ fontSize: '12px', color: devModeUnlocked ? '#D97706' : '#64748B', marginTop: '2px', fontWeight: devModeUnlocked ? '700' : '400' }}>
            {devModeUnlocked ? '🔓 Developer Mode Unlocked' : logoImage ? 'Custom Logo Uploaded' : 'System Icon Theme'}
          </div>
        </div>

        {/* Card 2: Next Customer ID */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NEXT CUSTOMER ID</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={16} />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#7C3AED', marginTop: '6px', fontFamily: 'monospace' }}>
            {nextFormattedId}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Auto-increment sequence
          </div>
        </div>

        {/* Card 3: Form Schema */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>FORM SCHEMA</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '17px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
            {activeForm?.fields ? `${activeForm.fields.filter((f) => f.active).length} Active Fields` : '23 Active Fields'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {activeForm?.name ? `${activeForm.name} (v${activeForm.version || 1})` : 'Showroom specification'}
          </div>
        </div>

        {/* Card 4: Database Status */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DATABASE ENGINE</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={16} />
            </div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#D97706', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Local MongoDB</span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            127.0.0.1:27017 (Embedded)
          </div>
        </div>
      </div>

      {/* 2. Accessible Navigation Tab Dock */}
      <div
        role="tablist"
        aria-label="Settings Navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#FFFFFF',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveSettingsTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                outline: 'none',
                boxShadow: isActive ? '0 2px 10px rgba(37, 99, 235, 0.25)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SHOWROOM BRANDING */}
      {activeSettingsTab === 'branding' && (
        <div
          role="tabpanel"
          id="panel-branding"
          aria-labelledby="tab-branding"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Showroom Brand Identity & Visual Theme
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                Configure software branding title, tagline, logo image upload, and accent styling.
              </p>
            </div>

            {savedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '12.5px' }}>
                <Check size={16} />
                <span>Saved & Synced Live!</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          {/* Live Preview Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Live Software Branding Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: logoImage ? '#FFFFFF' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: logoImage ? '4px' : 0,
                  }}
                >
                  {logoImage ? (
                    <img src={logoImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    renderLogo(24)
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF' }}>
                    {appName || 'Vasantham Tiles & Sanitary Wares'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    {tagline || 'Tiles, Sanitary Wares, CP Fittings & Adhesives'}
                  </div>
                </div>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.1)', color: '#38BDF8', padding: '4px 10px', borderRadius: '8px' }}>
              App Header & Mobile Sync Ready
            </span>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                SHOWROOM BRAND TITLE *
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Vasantham Tiles & Sanitary Wares"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                SHORT APP NAME (NAVBAR)
              </label>
              <input
                type="text"
                value={appShortName}
                onChange={(e) => setAppShortName(e.target.value)}
                placeholder="e.g. Vasantham CRM"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', outline: 'none' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                TAGLINE / SUBTITLE
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Tiles, Sanitary Wares, CP Fittings & Adhesives"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', outline: 'none' }}
              />
            </div>

            {/* Logo Image Upload */}
            <div style={{ gridColumn: 'span 2', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                SHOWROOM LOGO IMAGE UPLOAD
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {logoImage && (
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '4px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={logoImage} alt="Uploaded logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}

                <label
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px dashed #2563EB',
                    color: '#2563EB',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={15} />
                  <span>{logoImage ? 'Change Uploaded Logo Image' : 'Upload Showroom Logo File (PNG/JPG)'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                {logoImage && (
                  <button
                    type="button"
                    onClick={() => setLogoImage('')}
                    style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', color: '#991B1B', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Remove Custom Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Save size={15} />
              <span>{saving ? 'Saving Branding...' : 'Save Branding & Theme'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CRM FORM BUILDER */}
      {activeSettingsTab === 'builder' && (
        <div role="tabpanel" id="panel-builder" aria-labelledby="tab-builder">
          <FormBuilderView />
        </div>
      )}

      {/* TAB 3: CUSTOMER ID SEQUENCE */}
      {activeSettingsTab === 'sequence' && (
        <div role="tabpanel" id="panel-sequence" aria-labelledby="tab-sequence" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <SequenceConfigModal isEmbedded={true} />
        </div>
      )}

      {/* TAB 4: BUSINESS PROFILE & STATUS-SPECIFIC WHATSAPP TEMPLATES */}
      {activeSettingsTab === 'business' && (
        <form role="tabpanel" id="panel-business" aria-labelledby="tab-business" onSubmit={handleSaveBusinessProfile} style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Showroom Business Profile & Customized WhatsApp Copy per Status
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                GST details, contact phone, and custom high-conversion WhatsApp sales templates for each lead status.
              </p>
            </div>

            {businessSavedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '12.5px' }}>
                <Check size={16} />
                <span>Saved Business & WhatsApp Templates!</span>
              </div>
            )}
          </div>

          {/* Business Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                SHOWROOM STORE PHONE / HELPLINE
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                SHOWROOM GSTIN NUMBER
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                SHOWROOM STORE ADDRESS
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A' }}
              />
            </div>
          </div>

          {/* Status-Driven WhatsApp Template Editor */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '18px', border: '1.5px solid #CBD5E1', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#166534" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                  Custom WhatsApp Sales Templates by Lead Status
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetWaTemplate}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Reset selected status template to high-conversion default"
              >
                <RotateCcw size={12} />
                <span>Reset to Default</span>
              </button>
            </div>

            {/* Status Pills Selector */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {waStatusOptions.map((opt) => {
                const isActive = activeWaStatusKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setActiveWaStatusKey(opt.key)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: isActive ? `2px solid ${opt.color}` : '1px solid #CBD5E1',
                      backgroundColor: isActive ? opt.bg : '#FFFFFF',
                      color: isActive ? opt.color : '#475569',
                      fontWeight: isActive ? '800' : '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Insert Dynamic Tag Pills */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                CLICK TO INSERT DYNAMIC CRM TAGS:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['{customerName}', '{appName}', '{requirement}', '{quoteValue}', '{storePhone}'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    style={{ fontSize: '11.5px', fontWeight: '800', fontFamily: 'monospace', backgroundColor: '#FFFFFF', border: '1px solid #2563EB', color: '#2563EB', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Editor Textarea */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                EDIT MESSAGE TEMPLATE FOR STATUS: <span style={{ color: '#2563EB' }}>{waStatusOptions.find(o => o.key === activeWaStatusKey)?.label}</span>
              </label>
              <textarea
                rows={7}
                value={waTemplates[activeWaStatusKey] || ''}
                onChange={(e) => setWaTemplates({ ...waTemplates, [activeWaStatusKey]: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontFamily: 'monospace', backgroundColor: '#FFFFFF' }}
              />
            </div>

            {/* Live Rendered Message Preview Box */}
            <div style={{ backgroundColor: '#DCFCE7', borderRadius: '14px', border: '1px solid #86EFAC', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                💬 Live WhatsApp Message Preview (WhatsApp Render):
              </div>
              <div style={{ fontSize: '12.5px', color: '#14532D', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {sampleRenderedMsg}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Save size={15} />
              <span>Save Business Profile & WhatsApp Templates</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: DATA BACKUP & SYSTEM */}
      {activeSettingsTab === 'backup' && (
        <div role="tabpanel" id="panel-backup" aria-labelledby="tab-backup" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Daily Auto-Backup & 30-Day Retention Policy Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={18} color="#2563EB" />
                  <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Daily Auto-Backup & Retention Policy (Max 30 Backups)
                  </h2>
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Automatic daily backup triggers once when desktop app opens. Retains up to 30 backups; older files are automatically purged.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: '8px' }}>
                  Retention: Max 30 Backups
                </span>
                {backupConfig?.lastAutoBackupDate === new Date().toISOString().split('T')[0] && (
                  <span style={{ fontSize: '11.5px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '4px 10px', borderRadius: '8px' }}>
                    ✓ Backed Up Today
                  </span>
                )}
              </div>
            </div>

            {backupSuccessMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontSize: '12.5px', fontWeight: '700' }}>
                {backupSuccessMsg}
              </div>
            )}

            {/* Configurable Backup Storage Directory */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block' }}>
                BACKUP STORAGE FOLDER LOCATION (CONFIGURABLE)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  value={backupPathInput}
                  onChange={(e) => setBackupPathInput(e.target.value)}
                  placeholder="e.g. C:\Vasantham_CRM_Backups"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontFamily: 'monospace', backgroundColor: '#FFFFFF' }}
                />
                <button
                  type="button"
                  onClick={handleUpdateBackupPath}
                  disabled={savingBackupPath}
                  style={{ backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {savingBackupPath ? 'Saving...' : 'Set Storage Path'}
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
                All customer records, follow-ups, lost sales, KPIs, schemas, branding, and staff metrics are written to this folder.
              </p>
            </div>

            {/* Manual Run & History List */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#334155', fontWeight: '700' }}>
                Total Retained Auto-Backups: <span style={{ color: '#2563EB', fontWeight: '900' }}>{backupConfig?.totalBackupsCount || 0} / 30</span>
              </div>

              <button
                type="button"
                onClick={handleRunManualAutoBackup}
                disabled={runningAutoBackup}
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <RotateCcw size={15} className={runningAutoBackup ? 'spin-anim' : ''} />
                <span>{runningAutoBackup ? 'Running Backup...' : 'Run Auto-Backup Now'}</span>
              </button>
            </div>

            {/* Backup Files History Table */}
            {backupConfig?.backups && backupConfig.backups.length > 0 && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginTop: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569' }}>Backup File Name</th>
                      <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569' }}>File Size</th>
                      <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569' }}>Created Date</th>
                      <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Retention Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupConfig.backups.slice(0, 10).map((b, idx) => (
                      <tr key={b.name} style={{ borderBottom: idx < backupConfig.backups.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: '700', color: '#0F172A' }}>
                          📄 {b.name}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569', fontWeight: '600' }}>
                          {b.sizeFormatted}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748B' }}>
                          {new Date(b.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                            Retained ({idx + 1}/30)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Backup & Export Options */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Data Export & Database Backup
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                Export your showroom records to CSV or create full JSON database snapshots for offline backup and migration.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <button
                type="button"
                onClick={handleExportCustomersCSV}
                style={{ padding: '16px', borderRadius: '14px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Export Customers CSV</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Download Excel spreadsheet file of customer lead database</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportJSONBackup}
                style={{ padding: '16px', borderRadius: '14px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Download size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Export JSON Database Snapshot</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Full database backup file including schemas and settings</div>
                </div>
              </button>
            </div>

            {/* Import Launchers */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setImportModalMode('csv')}
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={15} />
                <span>Import Customers from CSV File</span>
              </button>

              <button
                type="button"
                onClick={() => setImportModalMode('json')}
                style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', borderRadius: '10px', padding: '10px 18px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={15} />
                <span>Restore JSON Backup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DEVELOPER MODE (DATA WIPE & PURGE UTILITIES) */}
      {devModeUnlocked && activeSettingsTab === 'dev' && (
        <div role="tabpanel" id="panel-dev" aria-labelledby="tab-dev" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Developer Mode Banner */}
          <div style={{ backgroundColor: '#1E293B', color: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#334155', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Terminal size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#F8FAFC', margin: 0 }}>
                      Developer Mode
                    </h2>
                    <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#0284C7', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px' }}>
                      DEV UNLOCKED
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '4px 0 0' }}>
                    Activated via 5-click sequence on Settings & System Configuration header. Allows developer database purge and environment operations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tone Down Mode Control Card */}
          <div
            style={{
              backgroundColor: isToneDown ? '#F1F5F9' : '#FFFFFF',
              borderRadius: '20px',
              border: isToneDown ? '2px solid #000000' : '1.5px solid #E2E8F0',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: isToneDown ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: isToneDown ? '#000000' : '#F1F5F9',
                    color: isToneDown ? '#FFFFFF' : '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '15px',
                  }}
                >
                  B/W
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Tone Down Mode
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: isToneDown ? '#000000' : '#E2E8F0',
                        color: isToneDown ? '#FFFFFF' : '#475569',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {isToneDown ? 'ACTIVE (DEFAULT ON)' : 'INACTIVE (OFF)'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0', maxWidth: '600px' }}>
                    Removes all colors, transitions, and animations; strips navigation to simple black & white; hides showroom revenue goal cards, stats, and heavy record tables for a raw minimal view.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleToneDown()}
                style={{
                  backgroundColor: isToneDown ? '#000000' : '#2563EB',
                  color: '#FFFFFF',
                  border: isToneDown ? '2px solid #000000' : 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isToneDown ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <span>{isToneDown ? 'Turn Tone Down OFF (Restore Theme)' : 'Turn Tone Down ON'}</span>
              </button>
            </div>
          </div>

          {/* Developer Reset Danger Zone */}
          <div style={{ backgroundColor: '#FEF2F2', borderRadius: '20px', border: '1.5px solid #FECDD3', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#991B1B', margin: 0 }}>
                  Developer Database Reset & Data Wipe Zone
                </h3>
                <p style={{ fontSize: '12px', color: '#991B1B', margin: '2px 0 0' }}>
                  Requires developer security key configured in backend `.env` file (<code style={{ backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>vasantham_dev_secret_wipe_key_2026</code>).
                </p>
              </div>
            </div>

            {wipeSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontSize: '12.5px', fontWeight: '700' }}>
                {wipeSuccess}
              </div>
            )}

            {wipeError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEE2E2', border: '1px solid #FECDD3', color: '#DC2626', fontSize: '12.5px', fontWeight: '700' }}>
                {wipeError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '520px' }}>
              <input
                type={showDevKey ? 'text' : 'password'}
                placeholder="Enter DEV_KEY to authorize"
                value={devKeyInput}
                onChange={(e) => setDevKeyInput(e.target.value)}
                style={{ flex: 1, padding: '9.5px 14px', borderRadius: '10px', border: '1px solid #FECDD3', fontSize: '13px', color: '#0F172A', backgroundColor: '#FFFFFF' }}
              />
              <button
                type="button"
                onClick={() => setShowDevKey(!showDevKey)}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #FECDD3', color: '#991B1B', borderRadius: '10px', padding: '9.5px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
              >
                {showDevKey ? 'Hide Key' : 'Show Key'}
              </button>
              <button
                type="button"
                onClick={handleWipeDatabase}
                disabled={wipingData}
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9.5px 18px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)', whiteSpace: 'nowrap' }}
              >
                {wipingData ? 'Purging Data...' : 'Purge Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalMode && (
        <DataImportModal
          mode={importModalMode}
          onClose={() => setImportModalMode(null)}
          onImportSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};
