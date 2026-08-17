import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Hash,
  Clock,
  Sparkles,
  Upload,
  Image,
  Check,
  RotateCcw,
  Monitor,
  Smartphone,
  Box,
  Save,
} from 'lucide-react';
import { useBranding, BRAND_ICONS } from '../../context/BrandingContext';
import { FormBuilderView } from '../form-builder/FormBuilderView';
import { SequenceConfigModal } from './SequenceConfigModal';
import { FormVersionHistoryModal } from './FormVersionHistoryModal';

export const SettingsView = ({ initialTab = 'branding' }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState(initialTab);

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

  // Branding Form State
  const [appName, setAppName] = useState(currentAppName);
  const [appShortName, setAppShortName] = useState(currentAppShortName);
  const [tagline, setTagline] = useState(currentTagline);
  const [logoType, setLogoType] = useState(currentLogoType);
  const [logoIcon, setLogoIcon] = useState(currentLogoIcon);
  const [logoImage, setLogoImage] = useState(currentLogoImage);
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const PRESET_COLORS = [
    { label: 'Royal Blue', hex: '#2563EB' },
    { label: 'Emerald Teal', hex: '#059669' },
    { label: 'Violet Luxe', hex: '#7C3AED' },
    { label: 'Amber Gold', hex: '#D97706' },
    { label: 'Crimson Rose', hex: '#E11D48' },
    { label: 'Dark Slate', hex: '#0F172A' },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo image must be under 2MB.');
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
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setError(res.message || 'Failed to update branding settings.');
    }
  };

  const handleResetDefaults = () => {
    setAppName('BuildCRM');
    setAppShortName('BuildCRM');
    setTagline('Tiles & Sanitary Wares CRM');
    setLogoType('icon');
    setLogoIcon('Box');
    setLogoImage('');
    setPrimaryColor('#2563EB');
  };

  const tabs = [
    { id: 'branding', label: 'App Name & Logo Branding', icon: Palette },
    { id: 'builder', label: 'CRM Form Schema (23 Fields)', icon: Layers },
    { id: 'sequence', label: 'Customer ID Sequence', icon: Hash },
    { id: 'versions', label: 'Version History', icon: Clock },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Settings Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#FFFFFF',
          padding: '6px',
          borderRadius: '10px',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xs)',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Branding & Identity Editor */}
      {activeSettingsTab === 'branding' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xs)',
            padding: '24px',
            maxWidth: '860px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                App Name & Showroom Logo Branding
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Changes made here immediately update the desktop sidebar and sync to all mobile devices on your network.
              </p>
            </div>

            {savedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ECFDF5', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px' }}>
                <Check size={14} />
                <span>Saved & Synced!</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          {/* Live Preview Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#0B1120',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Live Software Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${primaryColor}, #1D4ED8)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: `0 4px 12px ${primaryColor}66`,
                  }}
                >
                  {logoType === 'image' && logoImage ? (
                    <img src={logoImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    (() => {
                      const IconComp = BRAND_ICONS[logoIcon]?.icon || Box;
                      return <IconComp size={20} color="#FFFFFF" strokeWidth={2.5} />;
                    })()
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {appShortName || appName || 'BuildCRM'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {tagline || 'Tiles & Sanitary Wares CRM'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Monitor size={13} />
                <span>Desktop Sidebar</span>
              </div>
              <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={13} />
                <span>Mobile App</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Software Full Name *
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Vasantham CRM, BuildCRM"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  padding: '0 12px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Sidebar Short Title
              </label>
              <input
                type="text"
                value={appShortName}
                onChange={(e) => setAppShortName(e.target.value)}
                placeholder="e.g. BuildCRM"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  padding: '0 12px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Tiles & Sanitary Wares CRM"
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                padding: '0 12px',
                fontSize: '13.5px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Logo Mode Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Showroom Logo Mode
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setLogoType('icon')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: logoType === 'icon' ? '2px solid #2563EB' : '1px solid var(--border-default)',
                  background: logoType === 'icon' ? '#EFF6FF' : '#FFFFFF',
                  color: logoType === 'icon' ? '#2563EB' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={16} />
                <span>Vector Brand Icon</span>
              </button>

              <button
                type="button"
                onClick={() => setLogoType('image')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: logoType === 'image' ? '2px solid #2563EB' : '1px solid var(--border-default)',
                  background: logoType === 'image' ? '#EFF6FF' : '#FFFFFF',
                  color: logoType === 'image' ? '#2563EB' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Image size={16} />
                <span>Upload Custom Showroom Image</span>
              </button>
            </div>

            {/* Icon Picker */}
            {logoType === 'icon' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
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
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563EB' : '1px solid var(--border-default)',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        color: isSelected ? '#2563EB' : 'var(--text-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
                      <span style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '500', textAlign: 'center' }}>
                        {key}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Image Upload Area */
              <div
                style={{
                  border: '2px dashed var(--border-default)',
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                }}
              >
                {logoImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={logoImage}
                      alt="Uploaded Logo"
                      style={{ height: '70px', maxWidth: '200px', objectFit: 'contain', borderRadius: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        Change Logo
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setLogoImage('')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Upload Showroom PNG, SVG, or JPG Logo
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 14px' }}>
                      Recommended: Transparent background, 256x256 or landscape
                    </p>
                    <label
                      style={{
                        display: 'inline-block',
                        padding: '8px 18px',
                        borderRadius: '6px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Browse Files
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accent Color Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Brand Theme Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setPrimaryColor(c.hex)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: c.hex,
                    border: primaryColor === c.hex ? '3px solid #0F172A' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: primaryColor === c.hex ? '0 0 0 2px #FFFFFF' : 'none',
                  }}
                  title={c.label}
                >
                  {primaryColor === c.hex && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '10px 24px',
                fontSize: '13.5px',
                borderRadius: '8px',
                backgroundColor: primaryColor,
              }}
            >
              <Save size={15} />
              <span>{saving ? 'Saving to Database...' : savedSuccess ? '✓ Saved to Database!' : 'Save & Sync Branding'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Form Builder */}
      {activeSettingsTab === 'builder' && <FormBuilderView />}

      {/* Tab 3: Customer Sequence */}
      {activeSettingsTab === 'sequence' && <SequenceConfigModal />}

      {/* Tab 4: Version History */}
      {activeSettingsTab === 'versions' && <FormVersionHistoryModal />}
    </div>
  );
};
