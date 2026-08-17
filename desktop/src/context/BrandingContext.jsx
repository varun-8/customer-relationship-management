import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Building2,
  Layers,
  Sparkles,
  Shield,
  Crown,
  Gem,
  Store,
  Compass,
  Hexagon,
} from 'lucide-react';
import { api } from '../services/api';

const BrandingContext = createContext(null);

export const BRAND_ICONS = {
  Box: { name: 'Box (3D Cube)', icon: Box },
  Building2: { name: 'Building (Showroom)', icon: Building2 },
  Layers: { name: 'Layers (Tiles & Stack)', icon: Layers },
  Sparkles: { name: 'Sparkles (Premium)', icon: Sparkles },
  Store: { name: 'Store (Retail Counter)', icon: Store },
  Shield: { name: 'Shield (Trusted Brand)', icon: Shield },
  Crown: { name: 'Crown (Luxury)', icon: Crown },
  Gem: { name: 'Gem (Prestige)', icon: Gem },
  Compass: { name: 'Compass (Architecture)', icon: Compass },
  Hexagon: { name: 'Hexagon (Modern Tile)', icon: Hexagon },
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    appName: 'BuildCRM',
    appShortName: 'BuildCRM',
    tagline: 'Tiles & Sanitary Wares CRM',
    logoType: 'icon',
    logoIcon: 'Box',
    logoImage: '',
    primaryColor: '#2563EB',
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await api.getBranding();
      if (res.success && res.data) {
        setBranding(res.data);
      }
    } catch (e) {
      console.warn('Error loading branding config:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const updateBranding = async (updatedData) => {
    try {
      const res = await api.updateBranding(updatedData);
      if (res.success && res.data) {
        setBranding(res.data);
        return { success: true, data: res.data };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Render brand logo component
  const renderLogo = (size = 20, color = '#FFFFFF') => {
    if (branding.logoType === 'image' && branding.logoImage) {
      return (
        <img
          src={branding.logoImage}
          alt={branding.appName || 'Showroom Logo'}
          style={{
            width: typeof size === 'number' ? `${size}px` : size,
            height: typeof size === 'number' ? `${size}px` : size,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '4px',
            display: 'block',
          }}
        />
      );
    }

    const IconComponent = BRAND_ICONS[branding.logoIcon]?.icon || Box;
    return <IconComponent size={size} color={color} strokeWidth={2.5} />;
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        updateBranding,
        fetchBranding,
        loading,
        appName: branding.appName || 'BuildCRM',
        appShortName: branding.appShortName || 'BuildCRM',
        tagline: branding.tagline || 'Tiles & Sanitary Wares CRM',
        logoType: branding.logoType || 'icon',
        logoIcon: branding.logoIcon || 'Box',
        logoImage: branding.logoImage || '',
        primaryColor: branding.primaryColor || '#2563EB',
        renderLogo,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
