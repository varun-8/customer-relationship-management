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
import { Ionicons } from '@expo/vector-icons';

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
              <Text style={styles.headerTitle}>Workspace Settings</Text>
              <View style={[styles.statusBadge, isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                <Text style={[styles.statusBadgeText, isOnline ? styles.statusBadgeTextOnline : styles.statusBadgeTextOffline]}>
                  {isOnline ? 'Connected' : 'Offline'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={17} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScrollView} showsVerticalScrollIndicator={false}>
            {/* Section 1: Executive Profile Banner Card */}
            <View style={styles.profileHeroCard}>
              <View style={styles.profileHeroRow}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {currentProfile?.name ? currentProfile.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>

                <View style={styles.profileInfoCol}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {currentProfile?.name || 'Showroom Executive'}
                    </Text>
                    <View style={styles.roleChip}>
                      <Text style={styles.roleChipText}>
                        {isOwner ? 'Owner' : 'Sales Team'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {currentProfile?.email || currentProfile?.phone || 'Showroom Authorized Personnel'}
                  </Text>

                  <View style={styles.sessionStatusRow}>
                    <View style={styles.sessionDot} />
                    <Text style={styles.sessionStatusText}>Active Showroom Session</Text>
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
                <View style={styles.iconSquircle}>
                  <Ionicons name="business-outline" size={18} color="#0F766E" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>
                    {branding?.appName || branding?.brandName || 'Vasantham CRM'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {branding?.tagline || 'Showroom & Client Operations'}
                  </Text>
                </View>
              </View>

              <View style={styles.groupedDivider} />

              {/* Connected Workstation */}
              <View style={styles.groupedRow}>
                <View style={styles.iconSquircle}>
                  <Ionicons name="desktop-outline" size={18} color="#0F766E" />
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
                <View style={styles.iconSquircle}>
                  {syncing ? (
                    <ActivityIndicator size="small" color="#0F766E" />
                  ) : (
                    <Ionicons name="sync-outline" size={18} color="#0F766E" />
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
                <View style={styles.iconSquircle}>
                  <Ionicons name="qr-code-outline" size={18} color="#0F766E" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Scan Desktop QR Code</Text>
                  <Text style={styles.rowSubtitle}>Instant 1-second camera pairing</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              {/* Option B: Auto-Discovery */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={onAutoDetect}
                disabled={autoDetecting}
                activeOpacity={0.7}
              >
                <View style={styles.iconSquircle}>
                  {autoDetecting ? (
                    <ActivityIndicator size="small" color="#0F766E" />
                  ) : (
                    <Ionicons name="wifi-outline" size={18} color="#0F766E" />
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
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              {/* Option C: Advanced IP */}
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => {
                  setCustomHost(serverHost || '');
                  setShowAdvancedIpModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconSquircle}>
                  <Ionicons name="options-outline" size={18} color="#0F766E" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Workstation Network Settings</Text>
                  <Text style={styles.rowSubtitle}>Custom terminal address or manual IP</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            {/* Section 4: Security & Compliance */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SECURITY & SYSTEM</Text>
            </View>

            <View style={styles.groupedCard}>
              <View style={styles.groupedRow}>
                <View style={styles.iconSquircle}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#0F766E" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Direct Showroom Encryption</Text>
                  <Text style={styles.rowSubtitle}>Local isolated network transmission</Text>
                </View>
                <View style={styles.badgeProtectedPill}>
                  <Text style={styles.badgeProtectedText}>Protected</Text>
                </View>
              </View>

              <View style={styles.groupedDivider} />

              <View style={styles.groupedRow}>
                <View style={styles.iconSquircle}>
                  <Ionicons name="phone-portrait-outline" size={18} color="#0F766E" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Enterprise Mobile CRM</Text>
                  <Text style={styles.rowSubtitle}>Build 2.4.0 • Production Architecture</Text>
                </View>
              </View>
            </View>

            {/* Section 5: Account & Terminal Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TERMINAL & SESSION</Text>
            </View>

            <View style={styles.groupedCard}>
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleConfirmDisconnect}
                activeOpacity={0.7}
              >
                <View style={styles.iconSquircle}>
                  <Ionicons name="swap-horizontal-outline" size={18} color="#475569" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>Change Workstation Terminal</Text>
                  <Text style={styles.rowSubtitle}>Unpair from current showroom PC</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.groupedDivider} />

              <TouchableOpacity
                style={styles.groupedRow}
                onPress={handleConfirmLogout}
                activeOpacity={0.7}
              >
                <View style={[styles.iconSquircle, styles.iconSquircleDanger]}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                </View>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Sign Out of Workspace</Text>
                  <Text style={styles.rowSubtitle}>Exit active session on this device</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
              </TouchableOpacity>
            </View>

            {/* Minimalist Corporate Footer */}
            <View style={styles.footerNoteWrapper}>
              <Text style={styles.footerBrand}>
                {branding?.appName || branding?.brandName || 'Vasantham CRM'} Enterprise
              </Text>
              <Text style={styles.footerSub}>
                Crafted for showroom operations & client relationship management.
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

      {/* Clean Modal for Advanced Workstation IP */}
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
              <TouchableOpacity
                onPress={() => setShowAdvancedIpModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color="#64748B" />
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
                placeholder="http://<Desktop-PC-IP>:5000/api"
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
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
    paddingHorizontal: 18,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
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
    fontWeight: '700',
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
  bodyScrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    flex: 1,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
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
    backgroundColor: '#059669',
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  sectionHeader: {
    marginTop: 2,
    marginBottom: 7,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
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
    shadowOffset: { width: 0, height: 1 },
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
    marginLeft: 54,
  },
  iconSquircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquircleDanger: {
    backgroundColor: '#FEF2F2',
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  actionChevron: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
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
  badgeProtectedPill: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  badgeProtectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  footerNoteWrapper: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  footerBrand: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  footerSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 20,
    lineHeight: 14,
  },
  bottomActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  doneBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  // Dialog / Advanced IP Modal Styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
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
    color: '#059669',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
