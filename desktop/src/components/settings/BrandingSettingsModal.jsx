import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image,
  Check,
  RotateCcw,
  Smartphone,
  Monitor,
  Box,
  Palette,
} from 'lucide-react';
import { useBranding, BRAND_ICONS } from '../../context/BrandingContext';

export const BrandingSettingsModal = ({ onClose }) => {
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

  // Handle Logo Upload (File to Base64)
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

  const handleSave = async () => {
    if (!appName.trim()) {
      setError('App Name cannot be empty.');
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
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                App Name & Logo Branding
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Update app title and logo across Desktop and Mobile software
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {error}
            </div>
          )}

          {/* Live Preview Box */}
          <div
            style={{
              padding: '16px',
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
                Live App Preview (Desktop & Mobile)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Logo Box */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
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
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {appShortName || appName || 'BuildCRM'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                    {tagline || 'Tiles & Sanitary Wares CRM'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Monitor size={12} />
                <span>Desktop Ready</span>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Smartphone size={12} />
                <span>Mobile Synced</span>
              </div>
            </div>
          </div>

          {/* App Names Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Software Brand Name *
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

          {/* Logo Selection: Icon vs Image Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Logo Type
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
                <span>Upload Custom Image Logo</span>
              </button>
            </div>

            {/* If Icon Mode: Grid of Vector Icons */}
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
                        padding: '10px 6px',
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
                      <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                      <span style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '500', textAlign: 'center' }}>
                        {key}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* If Image Mode: Upload Box */
              <div
                style={{
                  border: '2px dashed var(--border-default)',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                }}
              >
                {logoImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={logoImage}
                      alt="Uploaded Logo"
                      style={{ height: '60px', maxWidth: '180px', objectFit: 'contain', borderRadius: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontSize: '12px',
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
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '12px',
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
                    <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Upload Showroom PNG or SVG Logo
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                      Recommended: Transparent background, 256x256 or landscape
                    </p>
                    <label
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
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
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-default)',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                borderRadius: '8px',
                backgroundColor: primaryColor,
              }}
            >
              {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Branding'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
