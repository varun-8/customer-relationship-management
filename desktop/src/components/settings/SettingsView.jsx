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
  const [appName, setAppName] = useState(currentAppName || 'BuildCRM');
  const [appShortName, setAppShortName] = useState(currentAppShortName || 'BuildCRM');
  const [tagline, setTagline] = useState(currentTagline || 'Tiles & Sanitary Wares CRM');
  const [logoType, setLogoType] = useState(currentLogoType || 'icon');
  const [logoIcon, setLogoIcon] = useState(currentLogoIcon || 'Box');
  const [logoImage, setLogoImage] = useState(currentLogoImage || '');
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor || '#2563EB');
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
    { id: 'branding', label: '🎨 Showroom Branding & Theme', icon: Palette },
    { id: 'sequence', label: '🔢 Customer ID Sequence', icon: Hash },
    { id: 'builder', label: '🛠️ CRM Form Schema Fields', icon: Layers },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Modern Minimalist Tab Dock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#FFFFFF',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          width: 'fit-content',
          flexWrap: 'wrap',
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
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
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
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Showroom Brand Name & Visual Theme
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                Customize your showroom software name, upload your custom logo, or choose from brand icons. Updates sync instantly across desktop and mobile devices.
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
                    {appShortName || appName || 'BuildCRM'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '1px' }}>
                    {tagline || 'Tiles & Sanitary Wares CRM'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Monitor size={14} color="#60A5FA" />
                <span>Desktop App</span>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Smartphone size={14} color="#34D399" />
                <span>Mobile App</span>
              </div>
            </div>
          </div>

          {/* Section 1: Logo Upload & Vector Icon Selection */}
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Showroom Logo & Icon Selection
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
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

            {/* Option A: Image Upload Box */}
            {logoType === 'image' ? (
              <div
                style={{
                  border: '2px dashed #93C5FD',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                }}
              >
                {logoImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '12px',
                        background: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        display: 'inline-flex',
                      }}
                    >
                      <img
                        src={logoImage}
                        alt="Uploaded Logo"
                        style={{ height: '80px', maxWidth: '240px', objectFit: 'contain' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <label
                        className="btn btn-primary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                        }}
                      >
                        <Upload size={14} />
                        <span>Upload Different Logo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setLogoImage('');
                          setLogoType('icon');
                        }}
                        className="btn btn-danger"
                        style={{
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <Upload size={24} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                      Upload Showroom PNG, SVG, or JPG Logo
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 16px' }}>
                      Recommended: Transparent background PNG or SVG (Max 3MB).
                    </p>

                    <label
                      className="btn btn-primary"
                      style={{
                        padding: '9px 20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '800',
                        borderRadius: '8px',
                      }}
                    >
                      <Upload size={15} />
                      <span>Select Logo File</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              /* Option B: Vector Brand Icon Selection Grid */
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Select Showroom Brand Icon:
                </div>
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
                          padding: '14px 10px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          color: isSelected ? '#2563EB' : '#0F172A',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                        }}
                      >
                        <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
                        <span style={{ fontSize: '11.5px', fontWeight: isSelected ? '800' : '600', textAlign: 'center' }}>
                          {key}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: App Name & Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Software Full Name</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Vasantham Tiles & Sanitary Wares"
                style={{ borderRadius: '8px' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>Displayed on report headers, mobile login, and customer WhatsApp summaries.</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                <span>Sidebar Short Title</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={appShortName}
                onChange={(e) => setAppShortName(e.target.value)}
                placeholder="e.g. Vasantham CRM"
                style={{ borderRadius: '8px' }}
              />
              <span className="form-help" style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>Compact title shown on the desktop sidebar and mobile header.</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
              <span>Showroom Tagline / Subtitle</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Tiles, Sanitary Wares, CP Fittings & Adhesives"
              style={{ borderRadius: '8px' }}
            />
          </div>

          {/* Section 3: Theme Accent Color */}
          <div>
            <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
              <span>Theme Accent Color Palette</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => {
                const isSelected = primaryColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setPrimaryColor(c.hex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${c.hex}` : '1px solid #E2E8F0',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? '800' : '600',
                      color: '#0F172A',
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        display: 'inline-block',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                    <span>{c.label}</span>
                    {isSelected && <Check size={13} color={c.hex} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #F1F5F9',
              paddingTop: '20px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '8px' }}
            >
              <RotateCcw size={14} />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving & Syncing...' : '✓ Save Branding & Sync to Mobile'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Sequence Generator */}
      {activeSettingsTab === 'sequence' && <SequenceConfigModal />}

      {/* Tab 3: CRM Form Schema Builder */}
      {activeSettingsTab === 'builder' && <FormBuilderView />}
    </div>
  );
};
