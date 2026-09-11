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
  Platform,
} from 'react-native';

export function LogoutVectorIcon({ size = 18, color = '#DC2626' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
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

function StorefrontVectorIcon({ size = 18, color = '#0F766E' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: 2,
          width: size * 0.88,
          height: size * 0.32,
          borderWidth: 1.6,
          borderColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          width: size * 0.76,
          height: size * 0.44,
          borderWidth: 1.6,
          borderColor: color,
          borderTopWidth: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          width: size * 0.3,
          height: size * 0.28,
          borderWidth: 1.4,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
}

function SyncVectorIcon({ size = 18, color = '#2563EB' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: (size * 0.78) / 2,
          borderWidth: 1.8,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    </View>
  );
}

function QrVectorIcon({ size = 18, color = '#4F46E5' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 5.5,
          height: 5.5,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
          borderRightWidth: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 5.5,
          height: 5.5,
          borderWidth: 1.5,
          borderColor: color,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          left: 2,
          width: 5.5,
          height: 5.5,
          borderWidth: 1.5,
          borderColor: color,
          borderTopWidth: 0,
          borderRightWidth: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: 5.5,
          height: 5.5,
          borderWidth: 1.5,
          borderColor: color,
          borderTopWidth: 0,
          borderLeftWidth: 0,
        }}
      />
    </View>
  );
}

function WifiVectorIcon({ size = 18, color = '#059669' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: (size * 0.85) / 2,
          borderWidth: 1.6,
          borderColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          top: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.52,
          height: size * 0.52,
          borderRadius: (size * 0.52) / 2,
          borderWidth: 1.6,
          borderColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          top: 5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 3.5,
          height: 3.5,
          borderRadius: 2,
          backgroundColor: color,
          bottom: 3,
        }}
      />
    </View>
  );
}

function ShieldVectorIcon({ size = 18, color = '#64748B' }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.72,
          height: size * 0.85,
          borderWidth: 1.6,
          borderColor: color,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderBottomLeftRadius: size * 0.36,
          borderBottomRightRadius: size * 0.36,
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
  onDisconnectServer,
  onReloadData,
  onLogout,
  branding,
}) {
  const [syncing, setSyncing] = useState(false);
  const [showAdvancedIpModal, setShowAdvancedIpModal] = useState(false);
  const [customHost, setCustomHost] = useState(serverHost || '');

  if (!visible) return null;

  const isOwner = currentProfile?.role === 'owner';
  const cleanHost = (serverHost || 'Desktop Workstation')
    .replace(/^https?:\/\//, '')
    .replace(/\/api.*$/, '');

  const handleQuickSync = async () => {
    setSyncing(true);
    try {
      if (onReloadData) {
        await onReloadData();
      }
      Alert.alert('Showroom Synchronized', 'All catalog items, form configurations, and leads have been updated.');
    } catch (e) {
      Alert.alert('Sync Notice', 'Could not sync with the desktop workstation. Please check Wi-Fi.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out of Workspace',
      `Are you sure you want to sign out as ${currentProfile?.name || 'Staff'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  const handleConfirmDisconnect = () => {
    Alert.alert(
      'Change Workstation',
      'Unpair from the current showroom terminal? You can pair again anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            onClose();
            if (onDisconnectServer) {
              await onDisconnectServer();
            }
          },
        },
      ]
    );
  };

  const handleSaveAdvancedHost = () => {
    if (setServerHost) {
      setServerHost(customHost);
    }
    if (onTestConnection) {
      onTestConnection();
    }
    setShowAdvancedIpModal(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Subtle Bottom-Sheet Pull Handle */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Minimalist Executive Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Settings</Text>
              <View style={[styles.statusBadge, isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                <Text style={[styles.statusBadgeText, isOnline ? styles.statusBadgeTextOnline : styles.statusBadgeTextOffline]}>
                  {isOnline ? 'Workspace Live' : 'Offline'}
                </Text>
              </View>
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
            {/* Section 1: Executive Profile Banner Card */}
            <View style={styles.profileHeroCard}>
              <View style={styles.profileHeroRow}>
                <View
                  style={[
                    styles.profileAvatar,
                    { backgroundColor: isOwner ? '#FEF3C7' : '#ECFEF8', borderColor: isOwner ? '#FDE68A' : '#CCFBF1' },
                  ]}
                >
                  <Text style={[styles.profileAvatarText, { color: isOwner ? '#B45309' : '#0F766E' }]}>
                    {currentProfile?.name ? currentProfile.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>

                <View style={styles.profileInfoCol}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {currentProfile?.name || 'Showroom Executive'}
                    </Text>
                    <View
                      style={[
                        styles.roleChip,
                        { backgroundColor: isOwner ? '#FFFBEB' : '#F0FDFA', borderColor: isOwner ? '#FDE68A' : '#99F6E4' },
                      ]}
                    >
                      <Text style={[styles.roleChipText, { color: isOwner ? '#B45309' : '#0F766E' }]}>
                        {isOwner ? '👑 Owner' : '💼 Sales'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {currentProfile?.email || currentProfile?.phone || 'Showroom Authorized Personnel'}
                  </Text>

                  <View style={styles.sessionStatusRow}>
                    <View style={styles.sessionDot} />
                    <Text style={styles.sessionStatusText}>Showroom Active Session</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 2: Showroom & Workspace Overview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SHOWROOM & WORKSPACE</Text>
            </View>

            <View style={styles.groupedCard}>
              {/* Showroom Identity */}
              <View style={styles.groupedRow}>
                <View style={[styles.iconSquircle, { backgroundColor: '#F0FDFA' }]}>
                  <StorefrontVectorIcon size={17} color="#0F766E" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>
                    {branding?.appName || branding?.brandName || 'Vasantham CRM'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {branding?.tagline || 'Tiles & Sanitary Showroom'}
                  </Text>
                </View>
              </View>

              <View style={styles.groupedDivider} />

              {/* Connected Workstation */}
              <View style={styles.groupedRow}>
                <View style={[styles.iconSquircle, { backgroundColor: '#EFF6FF' }]}>
                  <View style={styles.terminalIcon}>
                    <View style={styles.terminalScreen} />
                    <View style={styles.terminalBase} />
                  </View>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Connected Workstation</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {cleanHost}
                  </Text>
                </View>
                <View style={[styles.linkPill, isOnline ? styles.linkPillOnline : styles.linkPillOffline]}>
                  <Text style={[styles.linkPillText, isOnline ? styles.linkPillTextOnline : styles.linkPillTextOffline]}>
                    {isOnline ? 'PAIRED' : 'OFFLINE'}
                  </Text>
                </View>
              </View>

              <View style={styles.groupedDivider} />

              {/* Quick Sync Action */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleQuickSync}
                disabled={syncing}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#EFF6FF' }]}>
                  {syncing ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <SyncVectorIcon size={17} color="#2563EB" />
                  )}
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Synchronize Workstation</Text>
                  <Text style={styles.rowSubtitle}>
                    {syncing ? 'Updating catalog & leads...' : 'Fetch latest showroom updates'}
                  </Text>
                </View>
                <Text style={styles.actionChevron}>Sync ›</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Workstation Connectivity */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>WORKSTATION PAIRING</Text>
            </View>

            <View style={styles.groupedCard}>
              {/* Option A: Scan QR */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => {
                  onClose();
                  if (onOpenQrScanner) onOpenQrScanner();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#EEF2FF' }]}>
                  <QrVectorIcon size={17} color="#4F46E5" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Scan Desktop QR Code</Text>
                  <Text style={styles.rowSubtitle}>Instant 1-second camera pairing</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              {/* Option B: Auto-Discovery */}
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
                    <WifiVectorIcon size={17} color="#059669" />
                  )}
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>
                    {autoDetecting ? 'Searching Wi-Fi...' : 'Discover Showroom Workstation'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {autoDetecting ? 'Scanning showroom Wi-Fi network' : 'Locate CRM terminal automatically'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              {/* Option C: Advanced IP (Minimalist Disclosure) */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => {
                  setCustomHost(serverHost || '');
                  setShowAdvancedIpModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={{ fontSize: 13 }}>⚙️</Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Workstation Network Settings</Text>
                  <Text style={styles.rowSubtitle}>Custom terminal address or manual Wi-Fi IP</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: Security & Compliance */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SECURITY & COMPLIANCE</Text>
            </View>

            <View style={styles.groupedCard}>
              <View style={styles.groupedRow}>
                <View style={[styles.iconSquircle, { backgroundColor: '#F8FAFC' }]}>
                  <ShieldVectorIcon size={17} color="#475569" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Direct Showroom Encryption</Text>
                  <Text style={styles.rowSubtitle}>Local isolated network transmission</Text>
                </View>
                <Text style={styles.badgeProtectedText}>Protected</Text>
              </View>

              <View style={styles.groupedDivider} />

              <View style={styles.groupedRow}>
                <View style={[styles.iconSquircle, { backgroundColor: '#F8FAFC' }]}>
                  <Text style={{ fontSize: 13 }}>📱</Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Enterprise Mobile CRM</Text>
                  <Text style={styles.rowSubtitle}>Build 2.4.0 • Showroom Architecture</Text>
                </View>
              </View>
            </View>

            {/* Section 5: Account & Terminal Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
            </View>

            <View style={styles.groupedCard}>
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleConfirmLogout}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#FEF2F2' }]}>
                  <LogoutVectorIcon size={17} color="#DC2626" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Sign Out of Workspace</Text>
                  <Text style={styles.rowSubtitle}>Exit active session on this device</Text>
                </View>
                <Text style={[styles.chevron, { color: '#F87171' }]}>›</Text>
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleConfirmDisconnect}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={{ fontSize: 13 }}>🔌</Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: '#64748B' }]}>Change Workstation Terminal</Text>
                  <Text style={styles.rowSubtitle}>Unpair from current showroom PC</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Minimalist Corporate Footer */}
            <View style={styles.footerNoteWrapper}>
              <Text style={styles.footerBrand}>
                {branding?.appName || branding?.brandName || 'Vasantham CRM'} Enterprise
              </Text>
              <Text style={styles.footerSub}>
                Crafted for premium showroom operations & client relationship management.
              </Text>
            </View>
          </ScrollView>

          {/* Clean Dismiss Button */}
          <View style={styles.bottomActionBar}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Clean Modal for Advanced Workstation IP (isolated, out of client sight) */}
      <Modal
        visible={showAdvancedIpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdvancedIpModal(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Workstation Address</Text>
              <TouchableOpacity onPress={() => setShowAdvancedIpModal(false)}>
                <Text style={styles.dialogCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.dialogDesc}>
              Enter the IP address of the Desktop CRM server if you are using an assigned static showroom IP.
            </Text>

            <View style={styles.dialogInputWrapper}>
              <TextInput
                style={styles.dialogInput}
                value={customHost}
                onChangeText={setCustomHost}
                placeholder="http://10.118.85.79:5000/api"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            {connectionStatus && (
              <View
                style={[
                  styles.dialogStatusBanner,
                  connectionStatus.success ? styles.dialogStatusSuccess : styles.dialogStatusError,
                ]}
              >
                <Text
                  style={[
                    styles.dialogStatusText,
                    connectionStatus.success ? styles.dialogStatusTextSuccess : styles.dialogStatusTextError,
                  ]}
                >
                  {connectionStatus.message}
                </Text>
              </View>
            )}

            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowAdvancedIpModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogSaveBtn, testingConn && { opacity: 0.7 }]}
                onPress={handleSaveAdvancedHost}
                disabled={testingConn}
                activeOpacity={0.85}
              >
                {testingConn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogSaveBtnText}>Save & Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.60)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusDotOnline: {
    backgroundColor: '#059669',
  },
  statusDotOffline: {
    backgroundColor: '#DC2626',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusBadgeTextOnline: {
    color: '#059669',
  },
  statusBadgeTextOffline: {
    color: '#DC2626',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '800',
  },
  bodyScrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfoCol: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
    flex: 1,
  },
  roleChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sessionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  sessionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  sessionStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  groupedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 56,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
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
  chevron: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  actionChevron: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  linkPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  linkPillOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  linkPillOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  linkPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  linkPillTextOnline: {
    color: '#059669',
  },
  linkPillTextOffline: {
    color: '#DC2626',
  },
  terminalIcon: {
    width: 17,
    height: 14,
    alignItems: 'center',
  },
  terminalScreen: {
    width: 17,
    height: 11,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  terminalBase: {
    width: 9,
    height: 2,
    backgroundColor: '#2563EB',
    borderRadius: 1,
    marginTop: 1,
  },
  badgeProtectedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  footerNoteWrapper: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  footerSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 20,
    lineHeight: 15,
  },
  bottomActionBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  // Dialog / Advanced IP Modal Styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  dialogCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    padding: 4,
  },
  dialogDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },
  dialogInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 12,
  },
  dialogInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dialogStatusBanner: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  dialogStatusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  dialogStatusError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dialogStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dialogStatusTextSuccess: {
    color: '#047857',
  },
  dialogStatusTextError: {
    color: '#DC2626',
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  dialogSaveBtn: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogSaveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
