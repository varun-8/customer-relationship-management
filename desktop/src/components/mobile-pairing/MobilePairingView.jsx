import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Trash2,
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
            `New device paired: ${newest.deviceName || 'Mobile Phone'} (${newest.userProfile?.name || 'Staff'})`
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
  const allAvailableIps = pairingData?.allIps || pairingData?.networkInterfaces?.map((n) => n.ip) || [selectedIp || '127.0.0.1'];

  const dynamicQrPayload = JSON.stringify({
    type: 'VASANTHAM_CRM_PAIR',
    v: 1,
    appName: 'Vasantham CRM',
    serverIp: selectedIp || '127.0.0.1',
    allIps: [...new Set([selectedIp, ...allAvailableIps].filter(Boolean))],
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

  const [firewallStatus, setFirewallStatus] = useState(null);

  const handleFixFirewall = async () => {
    try {
      setFirewallStatus('Launching elevation prompt...');
      const res = await api.fixWindowsFirewall();
      setFirewallStatus(res.message || 'Click "Yes" on your PC screen to allow phone Wi-Fi connection.');
      setTimeout(() => setFirewallStatus(null), 8000);
    } catch (err) {
      alert('Firewall fix warning: ' + (err.message || 'Could not launch firewall prompt.'));
      setFirewallStatus(null);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '24px' }}>
      {/* Toast alert if firewall setup clicked */}
      {firewallStatus && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#1E40AF',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          <ShieldCheck size={18} color="#2563EB" />
          <span style={{ flex: 1 }}>{firewallStatus}</span>
          <button
            type="button"
            onClick={() => setFirewallStatus(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E40AF', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast alert if a new device pairs */}
      {newPairAlert && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#065F46',
            fontWeight: '600',
            fontSize: '13.5px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
          }}
        >
          <Sparkles size={18} color="#10B981" />
          <span style={{ flex: 1 }}>{newPairAlert}</span>
          <button
            type="button"
            onClick={() => setNewPairAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

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
          <RefreshCw size={32} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '14px', color: '#64748B', fontWeight: '600', fontSize: '14px' }}>
            Fetching network interfaces & connection info...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '16px',
            padding: '24px',
            color: '#991B1B',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginTop: 0 }}>Network Error</h3>
          <p style={{ fontSize: '13.5px', margin: '6px 0 14px 0' }}>{error}</p>
          <button
            type="button"
            onClick={fetchPairingInfo}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        /* Minimalist 2-Column Layout */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          
          {/* LEFT COLUMN: Clean QR Code & API Endpoint */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                    Pairing QR Code
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Scan with Vasantham Mobile App camera
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleFixFirewall}
                    style={{
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#2563EB',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                    title="Allow incoming phone connections in Windows Firewall"
                  >
                    <ShieldCheck size={13} color="#2563EB" /> Fix Firewall
                  </button>

                  <button
                    type="button"
                    onClick={fetchPairingInfo}
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#64748B',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                    title="Refresh network interfaces"
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {/* Minimalist Centered QR Code Container */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <QRCodeSVG
                    value={dynamicQrPayload}
                    size={190}
                    level="H"
                    includeMargin={false}
                    fgColor="#0F172A"
                  />
                </div>

                {/* Live Readiness Pill */}
                <div
                  style={{
                    marginTop: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ADE80',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#4ADE80',
                      boxShadow: '0 0 6px #4ADE80',
                    }}
                  />
                  Ready for instant scan
                </div>
              </div>

              {/* Single Copyable Endpoint Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                  SERVER API ENDPOINT
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={currentApiUrl}
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      fontSize: '12.5px',
                      fontFamily: 'monospace',
                      fontWeight: '600',
                      color: '#1E293B',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    style={{
                      backgroundColor: copied ? '#059669' : '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 14px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Network Settings Selectors (Subtle Inline Grid) */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid #F1F5F9',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                      PC WI-FI IP
                    </label>
                    <select
                      value={selectedIp}
                      onChange={(e) => setSelectedIp(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {pairingData?.networkInterfaces?.map((net, idx) => {
                        const targetIp = net.ip || net.address;
                        return (
                          <option key={idx} value={targetIp}>
                            {targetIp} ({net.name || 'Network'})
                          </option>
                        );
                      })}
                      {!pairingData?.networkInterfaces?.length && (
                        <option value="127.0.0.1">127.0.0.1 (Localhost)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                      PORT
                    </label>
                    <input
                      type="number"
                      value={customPort}
                      onChange={(e) => setCustomPort(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Paired Mobile Devices Section */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                      Paired Devices
                    </h3>
                    <span
                      style={{
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {devices.length}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Active sessions connected to desktop CRM
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#047857',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                    }}
                  />
                  Live Syncing
                </div>
              </div>

              {/* Connected Devices List */}
              {devices.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '14px',
                    border: '1px dashed #CBD5E1',
                    padding: '40px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '220px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <Smartphone size={20} color="#2563EB" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                    No Devices Paired Yet
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '280px', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    Scan the QR code on the left with Vasantham Mobile App to link your phone.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '340px' }}>
                  {devices.map((device) => {
                    const isOnlineNow = device.isOnline || device.status === 'active';
                    const isIdle = device.status === 'idle';
                    const profile = device.userProfile;

                    const statusBg = isOnlineNow ? '#ECFDF5' : isIdle ? '#FFFBEB' : '#F1F5F9';
                    const statusColor = isOnlineNow ? '#047857' : isIdle ? '#B45309' : '#64748B';
                    const statusDot = isOnlineNow ? '#10B981' : isIdle ? '#F59E0B' : '#94A3B8';
                    const statusText = isOnlineNow ? 'Active' : device.statusLabel || 'Offline';

                    return (
                      <div
                        key={device.deviceId || device._id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: isOnlineNow ? '#EFF6FF' : '#F8FAFC',
                              border: `1px solid ${isOnlineNow ? '#BFDBFE' : '#E2E8F0'}`,
                              color: isOnlineNow ? '#2563EB' : '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Smartphone size={18} />
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h4
                                style={{
                                  fontSize: '13.5px',
                                  fontWeight: '700',
                                  color: '#0F172A',
                                  margin: 0,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {device.deviceName || 'Mobile Phone'}
                              </h4>
                              <span
                                style={{
                                  backgroundColor: statusBg,
                                  color: statusColor,
                                  fontSize: '9.5px',
                                  fontWeight: '700',
                                  padding: '1.5px 6px',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3.5px',
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    width: '4.5px',
                                    height: '4.5px',
                                    borderRadius: '50%',
                                    backgroundColor: statusDot,
                                  }}
                                />
                                {statusText}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '11.5px',
                                color: '#64748B',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <span>{profile?.name || 'Staff Member'}</span>
                              <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                              <span>{profile?.roleTitle || profile?.role || 'Sales Executive'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Unpair Action */}
                        <button
                          type="button"
                          onClick={() => handleDisconnect(device.deviceId)}
                          disabled={disconnectingId === device.deviceId}
                          style={{
                            backgroundColor: '#F8FAFC',
                            color: '#64748B',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '5px 9px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF2F2';
                            e.currentTarget.style.borderColor = '#FECDD3';
                            e.currentTarget.style.color = '#DC2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.color = '#64748B';
                          }}
                          title="Unpair this device"
                        >
                          {disconnectingId === device.deviceId ? (
                            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>Unpair</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Security Note */}
            <div
              style={{
                marginTop: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #F1F5F9',
                borderRadius: '10px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={15} color="#10B981" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                <strong style={{ color: '#334155' }}>Encrypted Sync:</strong> Direct private Wi-Fi communication enabled.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
