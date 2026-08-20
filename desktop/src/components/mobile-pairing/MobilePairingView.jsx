import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  QrCode,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  Server,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Info,
  Trash2,
  Activity,
  User,
  Radio,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';

export const MobilePairingView = ({ isModal = false, onClose = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pairingData, setPairingData] = useState(null);
  const [selectedIp, setSelectedIp] = useState('');
  const [customPort, setCustomPort] = useState('');
  const [copied, setCopied] = useState(false);

  // Connected Devices Live State
  const [devices, setDevices] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState(null);
  const prevDeviceCountRef = useRef(0);
  const [newPairAlert, setNewPairAlert] = useState(null);

  const fetchPairingInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMobilePairingInfo();
      if (res && res.success && res.data) {
        setPairingData(res.data);
        setSelectedIp(res.data.serverIp || '127.0.0.1');
        setCustomPort(String(res.data.port || 5000));
      } else {
        setError('Could not retrieve network pairing information from backend server.');
      }
    } catch (err) {
      console.error('Error fetching mobile pairing info:', err);
      setError(err.message || 'Failed to fetch network information.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedDevices = async () => {
    try {
      const res = await api.getConnectedDevices();
      if (res && res.success && Array.isArray(res.data)) {
        setDevices(res.data);
        setActiveCount(res.activeCount || 0);

        if (res.data.length > prevDeviceCountRef.current && prevDeviceCountRef.current > 0) {
          const newest = res.data[0];
          setNewPairAlert(
            `🎉 New device paired: ${newest.deviceName || 'Mobile Phone'} (${newest.userProfile?.name || 'Staff'})`
          );
          setTimeout(() => setNewPairAlert(null), 5000);
        }
        prevDeviceCountRef.current = res.data.length;
      }
    } catch (err) {
      console.warn('Connected devices fetch warning:', err.message);
    }
  };

  const handleDisconnect = async (deviceId) => {
    try {
      setDisconnectingId(deviceId);
      await api.disconnectDevice(deviceId);
      await fetchConnectedDevices();
    } catch (err) {
      alert('Failed to disconnect device: ' + (err.message || 'Unknown error'));
    } finally {
      setDisconnectingId(null);
    }
  };

  useEffect(() => {
    fetchPairingInfo();
    fetchConnectedDevices();

    const pollInterval = setInterval(() => {
      fetchConnectedDevices();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  const currentApiUrl = `http://${selectedIp || '127.0.0.1'}:${customPort || 5000}/api`;

  const dynamicQrPayload = JSON.stringify({
    type: 'VASANTHAM_CRM_PAIR',
    v: 1,
    appName: 'Vasantham CRM',
    serverIp: selectedIp || '127.0.0.1',
    port: Number(customPort) || 5000,
    apiBaseUrl: currentApiUrl,
    healthUrl: `http://${selectedIp || '127.0.0.1'}:${customPort || 5000}/api/health`,
    ts: Date.now(),
  });

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentApiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Alert notification if a new device pairs */}
      {newPairAlert && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1.5px solid #6EE7B7',
            borderRadius: '16px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#065F46',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
          }}
        >
          <Sparkles size={20} color="#10B981" />
          <span style={{ flex: 1 }}>{newPairAlert}</span>
          <button
            type="button"
            onClick={() => setNewPairAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Stats Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
            }}
          >
            <QrCode size={28} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                Mobile App Scanner & Pairing Hub
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ADE80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#4ADE80',
                  }}
                />
                SERVER ONLINE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Scan the QR code below using Vasantham Mobile App to link phone to this Desktop CRM.
            </p>
          </div>
        </div>

        {/* Quick Stats Pill Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Wifi size={18} color="#38BDF8" />
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active IP
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                {selectedIp || 'Scanning...'}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Smartphone size={18} color="#A78BFA" />
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Paired Devices
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                {devices.length} Connected ({activeCount} Active)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading or Error State */}
      {loading ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          }}
        >
          <RefreshCw size={36} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#64748B', fontWeight: '600' }}>
            Fetching network interfaces & device pairing settings...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '20px',
            padding: '28px',
            color: '#991B1B',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0 }}>⚠️ Network Error</h3>
          <p style={{ fontSize: '14px', margin: '8px 0 16px 0' }}>{error}</p>
          <button
            type="button"
            onClick={fetchPairingInfo}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Retry Fetching Connection Info
          </button>
        </div>
      ) : (
        /* Main 2-Column Grid Layout */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* LEFT COLUMN: Modern QR Code & IP Configuration Panel */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    1. Scan QR with Mobile App
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Point camera from phone app to auto-pair host IP
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchPairingInfo}
                  style={{
                    backgroundColor: '#F1F5F9',
                    border: 'none',
                    color: '#475569',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  title="Refresh local network IP addresses"
                >
                  <RefreshCw size={14} /> Refresh IP
                </button>
              </div>

              {/* Dynamic Ultra-Professional QR Display Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  borderRadius: '24px',
                  padding: '30px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  marginBottom: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {/* High Contrast QR Code Container */}
                <div style={{ position: 'relative', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}>
                  <QRCodeSVG
                    value={dynamicQrPayload}
                    size={220}
                    level="H"
                    includeMargin={false}
                    fgColor="#0F172A"
                    imageSettings={{
                      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%232563EB"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
                      x: undefined,
                      y: undefined,
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                </div>

                {/* Instant Pairing Status Pulse & Copy Badge */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      background: 'rgba(37, 99, 235, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#93C5FD',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 10px #3B82F6' }} />
                    READY FOR INSTANT PHONE SCAN
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#E2E8F0',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '5px 14px',
                        borderRadius: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.02em',
                      }}
                    >
                      http://{selectedIp}:{customPort}/api
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '10px',
                        background: copied ? '#059669' : 'rgba(37, 99, 235, 0.3)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Network Interface & Port Selectors */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '18px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: '0 0 12px 0' }}>
                  ⚙️ Network Interface Configuration
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                      SELECT PC LOCAL WI-FI IP
                    </label>
                    <select
                      value={selectedIp}
                      onChange={(e) => setSelectedIp(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {pairingData?.networkInterfaces?.map((net, idx) => (
                        <option key={idx} value={net.address}>
                          {net.address} ({net.name || 'Network'})
                        </option>
                      ))}
                      {!pairingData?.networkInterfaces?.length && (
                        <option value="127.0.0.1">127.0.0.1 (Localhost)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                      PORT
                    </label>
                    <input
                      type="number"
                      value={customPort}
                      onChange={(e) => setCustomPort(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                {/* Copy URL Button */}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  style={{
                    width: '100%',
                    backgroundColor: copied ? '#059669' : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'API Endpoint Copied to Clipboard!' : 'Copy API URL to Manual Input'}
                </button>
              </div>
            </div>

            {/* Visual Step-by-Step Guide */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '10px 6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563EB' }}>Step 1</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Open Mobile App</div>
                </div>
                <div style={{ backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '10px 6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563EB' }}>Step 2</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Tap Scan QR</div>
                </div>
                <div style={{ backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '10px 6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563EB' }}>Step 3</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Point & Connect</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Connected Devices Live Grid & Management */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  2. Paired Mobile Devices ({devices.length})
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Live sessions & mobile app heartbeats connected to this server
                </p>
              </div>

              <span
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Activity size={14} color="#10B981" /> Live Poll (3s)
              </span>
            </div>

            {/* Connected Devices List */}
            {devices.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderRadius: '20px',
                  border: '2px dashed #CBD5E1',
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Smartphone size={30} color="#64748B" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', margin: 0 }}>
                  No Mobile Devices Connected Yet
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '320px', margin: '8px 0 0 0' }}>
                  Open the Vasantham Mobile App on your smartphone and scan the QR code on the left to link your device.
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {devices.map((device) => {
                  const isOnlineNow = device.isOnline;
                  const profile = device.userProfile;

                  return (
                    <div
                      key={device.deviceId || device._id}
                      style={{
                        backgroundColor: isOnlineNow ? '#F0F9FF' : '#F8FAFC',
                        border: `1.5px solid ${isOnlineNow ? '#BAE6FD' : '#E2E8F0'}`,
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            backgroundColor: isOnlineNow ? '#0284C7' : '#64748B',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '18px',
                            boxShadow: isOnlineNow ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                          }}
                        >
                          {profile?.icon || (device.platform === 'ios' ? '🍎' : '📱')}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                              {device.deviceName || 'Mobile Smartphone'}
                            </h4>
                            <span
                              style={{
                                backgroundColor: isOnlineNow ? '#DCFCE7' : '#F1F5F9',
                                color: isOnlineNow ? '#15803D' : '#64748B',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: isOnlineNow ? '#22C55E' : '#94A3B8',
                                }}
                              />
                              {isOnlineNow ? 'ACTIVE NOW' : 'IDLE'}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>👤 {profile?.name || 'Staff Member'} ({profile?.roleTitle || 'Sales Executive'})</span>
                            <span>•</span>
                            <span style={{ fontFamily: 'monospace' }}>ID: {device.deviceId ? device.deviceId.slice(0, 14) : 'dev_...'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Disconnect Action */}
                      <button
                        type="button"
                        onClick={() => handleDisconnect(device.deviceId)}
                        disabled={disconnectingId === device.deviceId}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background 0.2s ease',
                        }}
                        title="Disconnect this mobile device"
                      >
                        {disconnectingId === device.deviceId ? (
                          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Disconnect
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Security Info Box */}
            <div
              style={{
                marginTop: '20px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={20} color="#059669" />
              <div style={{ fontSize: '12px', color: '#475569' }}>
                <strong style={{ color: '#0F172A' }}>Encrypted Local Sync:</strong> Data is synchronized directly over your private Wi-Fi network without relying on cloud transit.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
