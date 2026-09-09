import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';

export function LogoutVectorIcon({ size = 18, color = '#DC2626' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Door frame */}
      <View
        style={{
          position: 'absolute',
          left: 1,
          top: 1,
          bottom: 1,
          width: size * 0.45,
          borderWidth: 1.8,
          borderColor: color,
          borderRightWidth: 0,
          borderRadius: 2.5,
        }}
      />
      {/* Arrow stem */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.28,
          width: size * 0.52,
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      {/* Arrow top head */}
      <View
        style={{
          position: 'absolute',
          right: 1.5,
          top: size * 0.5 - 4.5,
          width: 5.5,
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Arrow bottom head */}
      <View
        style={{
          position: 'absolute',
          right: 1.5,
          bottom: size * 0.5 - 4.5,
          width: 5.5,
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

export function MobileSettingsModal({
  visible,
  onClose,
  serverHost,
  setServerHost,
  isOnline,
  currentProfile,
  onOpenQrScanner,
  onAutoDetect,
  autoDetecting,
  onTestConnection,
  testingConn,
  connectionStatus,
  onSwitchProfile,
  onDisconnectServer,
  onReloadData,
  onLogout,
  branding,
}) {
  const [clearingCache, setClearingCache] = useState(false);
  const [reloadingData, setReloadingData] = useState(false);

  if (!visible) return null;

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Local Cache',
      'This will reset temporary offline forms and caches. Your server connection remains saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              await AsyncStorage.multiRemove([
                'vasantham_cached_form_schema',
                'vasantham_cached_customers',
                'vasantham_cached_staff_profiles',
                'vasantham_cached_followups',
                '@offline_kpi_reports',
              ]);
              Alert.alert('Cache Cleared', 'Local offline cache has been reset.');
            } catch (e) {
              Alert.alert('Error', 'Could not clear cache.');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const handleForceReload = async () => {
    setReloadingData(true);
    try {
      if (onReloadData) {
        await onReloadData();
      }
      Alert.alert('CRM Synced', 'Live customer forms, branding and profiles refreshed.');
    } catch (e) {
      Alert.alert('Sync Warning', 'Could not refresh live data. Check server connection.');
    } finally {
      setReloadingData(false);
    }
  };

  const handleConfirmDisconnect = () => {
    Alert.alert(
      'Disconnect Server',
      'Unpair from Desktop CRM? You can reconnect anytime via QR scan or auto-detection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (onDisconnectServer) {
              await onDisconnectServer();
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Sheet Drag Handle */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Minimalist Native Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTextRow}>
                <View style={styles.headerCogBadge}>
                  <View style={styles.cogCenterRing} />
                </View>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={[styles.statusCapsule, isOnline ? styles.statusCapsuleOnline : styles.statusCapsuleOffline]}>
                  <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                  <Text style={[styles.statusCapsuleText, isOnline ? styles.statusCapsuleTextOnline : styles.statusCapsuleTextOffline]}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                Showroom Network & Mobile CRM Control
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScrollView} showsVerticalScrollIndicator={false}>
            {/* Section 1: Active Connection Status Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTagBadge}>
                  <Text style={styles.heroTagBadgeText}>SERVER ENDPOINT</Text>
                </View>
                <View style={[styles.pingBadge, isOnline ? styles.pingBadgeOnline : styles.pingBadgeOffline]}>
                  <View style={[styles.pingDot, isOnline ? styles.pingDotOnline : styles.pingDotOffline]} />
                  <Text style={[styles.pingBadgeText, isOnline ? styles.pingBadgeTextOnline : styles.pingBadgeTextOffline]}>
                    {isOnline ? 'Connected' : 'Unreachable'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroHostText} numberOfLines={1}>
                {serverHost || 'http://localhost:5000/api'}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaItem}>
                  <Text style={styles.heroMetaLabel}>DATABASE</Text>
                  <Text style={styles.heroMetaVal}>Showroom Database</Text>
                </View>
                <View style={styles.heroMetaDivider} />
                <View style={styles.heroMetaItem}>
                  <Text style={styles.heroMetaLabel}>SYNC ENGINE</Text>
                  <Text style={[styles.heroMetaVal, { color: isOnline ? '#059669' : '#DC2626' }]}>
                    {isOnline ? 'Live Desktop Sync' : 'Offline Cache'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2: Fast Pairing Options (Mobile Grouped Inset) */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>PAIRING & DISCOVERY</Text>
            </View>

            <View style={styles.groupedCard}>
              {/* Option A: Scan QR Code */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => {
                  onClose();
                  if (onOpenQrScanner) onOpenQrScanner();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#EEF2FF' }]}>
                  <View style={styles.qrIconShape}>
                    <View style={styles.qrCornerTopLeft} />
                    <View style={styles.qrCornerTopRight} />
                    <View style={styles.qrCornerBottomLeft} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Scan Desktop QR Code</Text>
                  <Text style={styles.rowSubtitle}>Instant auto-pair in 1 second</Text>
                </View>
                <Text style={styles.chevronText}>›</Text>
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              {/* Option B: Auto-Detect Server */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={onAutoDetect}
                disabled={autoDetecting}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#ECFDF5' }]}>
                  {autoDetecting ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <View style={styles.radarIconShape}>
                      <View style={styles.radarOuterRing} />
                      <View style={styles.radarCenterDot} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {autoDetecting ? 'Scanning Local Wi-Fi...' : 'Auto-Detect Local Server'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {autoDetecting ? 'Searching LAN subnets' : 'Discover CRM server on showroom Wi-Fi'}
                  </Text>
                </View>
                <Text style={styles.chevronText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Manual Endpoint Configuration */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>MANUAL SERVER CONFIGURATION</Text>
            </View>

            <View style={styles.manualCard}>
              <Text style={styles.inputMicroLabel}>SERVER API URL</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={serverHost}
                  onChangeText={setServerHost}
                  placeholder="http://192.168.1.xxx:5000/api"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {connectionStatus && (
                <View
                  style={[
                    styles.statusAlert,
                    connectionStatus.success ? styles.statusAlertSuccess : styles.statusAlertError,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusAlertText,
                      connectionStatus.success ? styles.statusAlertTextSuccess : styles.statusAlertTextError,
                    ]}
                  >
                    {connectionStatus.message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.testConnectBtn, testingConn && { opacity: 0.7 }]}
                onPress={onTestConnection}
                disabled={testingConn || autoDetecting}
                activeOpacity={0.85}
              >
                {testingConn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.testConnectBtnText}>Test & Connect Server</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Section 4: Staff Profile & Account */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>SHOWROOM ACCOUNT</Text>
            </View>

            <View style={styles.groupedCard}>
              <View style={styles.profileHeaderRow}>
                <View style={styles.profileAvatarBox}>
                  <Text style={styles.profileAvatarText}>
                    {currentProfile?.name ? currentProfile.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {currentProfile?.name || 'Showroom Staff'}
                  </Text>
                  <Text style={styles.profileRole}>
                    {currentProfile?.role === 'owner' ? 'Showroom Owner / Admin' : 'Sales Executive'}
                  </Text>
                </View>
              </View>

              <View style={styles.groupedDivider} />

              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#FEF2F2' }]}>
                  <LogoutVectorIcon size={17} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Log Out Account</Text>
                  <Text style={styles.rowSubtitle}>End session and return to login</Text>
                </View>
                <Text style={[styles.chevronText, { color: '#F87171' }]}>›</Text>
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleConfirmDisconnect}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#FEF2F2' }]}>
                  <View style={styles.disconnectIconShape} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Unpair Server</Text>
                  <Text style={styles.rowSubtitle}>Disconnect from current desktop host</Text>
                </View>
                <Text style={[styles.chevronText, { color: '#F87171' }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Section 5: Data & System Maintenance */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>DATA & MAINTENANCE</Text>
            </View>

            <View style={styles.groupedCard}>
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleForceReload}
                disabled={reloadingData}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#F0F9FF' }]}>
                  <View style={styles.refreshIconShape} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Refresh Showroom Data</Text>
                  <Text style={styles.rowSubtitle}>Reload customer forms and branding</Text>
                </View>
                {reloadingData ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text style={styles.actionLinkText}>Sync</Text>
                )}
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleClearCache}
                disabled={clearingCache}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#FEF2F2' }]}>
                  <View style={styles.trashIconShape} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Clear Offline Cache</Text>
                  <Text style={styles.rowSubtitle}>Reset cached forms and queues</Text>
                </View>
                {clearingCache ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={[styles.actionLinkText, { color: '#DC2626' }]}>Clear</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* App Footer */}
            <View style={styles.footerBox}>
              <Text style={styles.footerBrandText}>
                {branding?.brandName || 'Vasantham CRM'} Enterprise Mobile
              </Text>
              <Text style={styles.footerVersionText}>Version 2.4.0 • Showroom Architecture</Text>
            </View>
          </ScrollView>

          {/* Minimalist Footer Action */}
          <View style={styles.footerBar}>
            <TouchableOpacity style={styles.footerDoneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.footerDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#F8FAFC',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCogBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cogCenterRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  headerTitle: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusCapsuleOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusCapsuleOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusDotOffline: {
    backgroundColor: '#EF4444',
  },
  statusCapsuleText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  statusCapsuleTextOnline: {
    color: '#047857',
  },
  statusCapsuleTextOffline: {
    color: '#B91C1C',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '800',
  },
  bodyScrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F8FAFC',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTagBadge: {
    backgroundColor: '#ECFEF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  heroTagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.8,
  },
  pingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pingBadgeOnline: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pingBadgeOffline: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pingDotOnline: {
    backgroundColor: '#059669',
  },
  pingDotOffline: {
    backgroundColor: '#DC2626',
  },
  pingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pingBadgeTextOnline: {
    color: '#047857',
  },
  pingBadgeTextOffline: {
    color: '#DC2626',
  },
  heroHostText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroMetaItem: {
    flex: 1,
  },
  heroMetaLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  heroMetaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  heroMetaDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  sectionHeadingRow: {
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  groupedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 58,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIconShape: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: 6,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 6,
    height: 6,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  radarIconShape: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarOuterRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#059669',
    position: 'absolute',
  },
  radarCenterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
  },
  userIconShape: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  disconnectIconShape: {
    width: 12,
    height: 2,
    backgroundColor: '#DC2626',
    borderRadius: 1,
  },
  refreshIconShape: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderTopColor: 'transparent',
  },
  trashIconShape: {
    width: 10,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderTopWidth: 0,
    borderRadius: 1,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1.5,
  },
  chevronText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputMicroLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  textInput: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusAlert: {
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  statusAlertSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusAlertError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusAlertText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusAlertTextSuccess: {
    color: '#047857',
  },
  statusAlertTextError: {
    color: '#B91C1C',
  },
  testConnectBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 13,
    paddingVertical: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 5,
    elevation: 3,
  },
  testConnectBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  profileAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  profileAvatarText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2563EB',
  },
  profileName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  footerBox: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  footerBrandText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  footerVersionText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  footerBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerDoneBtn: {
    paddingVertical: 13.5,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
  },
  footerDoneBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
