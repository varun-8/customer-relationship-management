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
import { useToast } from './ToastContext';

import logoImg from '../assets/logo.png';

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
  const toast = useToast();
  const [branding, setBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('vasantham_crm_branding');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      appName: 'Vasantham Tiles & Sanitary Wares',
      appShortName: 'Vasantham CRM',
      tagline: 'Tiles, Sanitary Wares, CP Fittings & Adhesives',
      address: '124, Bypass Road, Near Bus Stand, Madurai, Tamil Nadu - 625001',
      phone: '+91 98401 23456',
      gstin: '33AAAAA0000A1Z5',
      logoType: 'image',
      logoIcon: 'Box',
      logoImage: logoImg,
      primaryColor: '#2563EB',
    };
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await api.getBranding();
      if (res && res.success && res.data) {
        setBranding(res.data);
        localStorage.setItem('vasantham_crm_branding', JSON.stringify(res.data));
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
      // 1. Instant local update & localStorage persistence
      setBranding(updatedData);
      localStorage.setItem('vasantham_crm_branding', JSON.stringify(updatedData));

      // 2. Persist to MongoDB backend
      const res = await api.updateBranding(updatedData);
      if (res && res.success && res.data) {
        setBranding(res.data);
        localStorage.setItem('vasantham_crm_branding', JSON.stringify(res.data));
      }
      toast.success('Showroom branding and logo updated successfully.', 'Branding Saved');
      return { success: true, data: updatedData };
    } catch (e) {
      console.warn('Backend branding sync notice:', e.message);
      toast.success('Branding saved locally!', 'Branding Updated');
      return { success: true, data: updatedData };
    }
  };

  // Render brand logo component
  const renderLogo = (size = 20, color = '#FFFFFF') => {
    const logoSrc = (branding.logoType === 'image' && branding.logoImage)
      ? branding.logoImage
      : '/logo.png';

    if (logoSrc) {
      return (
        <img
          src={logoSrc}
          alt={branding.appName || 'Showroom Logo'}
          style={{
            width: typeof size === 'number' ? `${size}px` : size,
            height: typeof size === 'number' ? `${size}px` : size,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '6px',
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
        appName: branding.appName || 'Vasantham Tiles & Sanitary Wares',
        appShortName: branding.appShortName || 'Vasantham CRM',
        tagline: branding.tagline || 'Tiles & Sanitary Wares CRM',
        address: branding.address || '124, Bypass Road, Near Bus Stand, Madurai, Tamil Nadu - 625001',
        phone: branding.phone || '+91 98401 23456',
        gstin: branding.gstin || '33AAAAA0000A1Z5',
        logoType: branding.logoType || 'image',
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
