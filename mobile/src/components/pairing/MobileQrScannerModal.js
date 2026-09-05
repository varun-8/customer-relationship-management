import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { apiClient } from '../../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.68, 260);

export const MobileQrScannerModal = ({
  visible,
  onClose,
  onConnected,
  isMainScreen = false,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [scanLaserAnim] = useState(new Animated.Value(0));

  // Manual IP & Auto-detect state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualHost, setManualHost] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Laser animation effect
  useEffect(() => {
    if (visible && !scanned && !connecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLaserAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLaserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLaserAnim.setValue(0);
    }
  }, [visible, scanned, connecting]);

  // Reset scan state on reopen
  useEffect(() => {
    if (visible) {
      setScanned(false);
      setConnecting(false);
      setStatusMessage('');
      setShowManualInput(false);
      apiClient.getApiBase().then((base) => {
        if (base) setManualHost(base);
      });
    }
  }, [visible]);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || connecting) return;
    setScanned(true);

    const parsedApiUrl = apiClient.parsePairingPayload(data);
    if (!parsedApiUrl) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code does not contain a valid Vasantham CRM server payload.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    setConnecting(true);
    setStatusMessage(`Connecting to ${parsedApiUrl}...`);

    try {
      const testRes = await apiClient.testConnection(parsedApiUrl);
      if (testRes.success) {
        setStatusMessage('Connected to Desktop Server');
        setTimeout(() => {
          if (onConnected) onConnected(parsedApiUrl);
          if (onClose) onClose();
        }, 500);
      } else {
        Alert.alert(
          'Connection Failed',
          `Could not reach Desktop CRM at:\n${parsedApiUrl}\n\n1. Ensure phone and PC are on the same Wi-Fi network.\n2. Ensure Desktop CRM is running.`,
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanned(false);
                setConnecting(false);
                setStatusMessage('');
              },
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        'Connection Error',
        err.message || 'Failed to connect to the scanned address.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setConnecting(false);
              setStatusMessage('');
            },
          },
        ]
      );
    }
  };

  const handleManualConnect = async () => {
    if (!manualHost.trim()) {
      Alert.alert('Required', 'Please enter your Desktop CRM IP address or URL.');
      return;
    }

    setConnecting(true);
    setStatusMessage(`Connecting to ${manualHost}...`);
    try {
      const testRes = await apiClient.testConnection(manualHost.trim());
      if (testRes.success) {
        setStatusMessage('Connected!');
        setTimeout(() => {
          if (onConnected) onConnected(manualHost.trim());
          if (onClose) onClose();
        }, 400);
      } else {
        Alert.alert('Connection Failed', testRes.message || 'Could not reach server.');
      }
    } catch (e) {
      Alert.alert('Connection Error', e.message || 'Could not reach server.');
    } finally {
      setConnecting(false);
    }
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setStatusMessage('Scanning local Wi-Fi for Desktop CRM...');
    try {
      const detected = await apiClient.autoDetectServer();
      if (detected && detected.success && detected.host) {
        setStatusMessage('Found Desktop CRM!');
        setTimeout(() => {
          if (onConnected) onConnected(detected.host);
          if (onClose) onClose();
        }, 500);
      } else {
        Alert.alert(
          'No Server Found',
          'Could not automatically detect Desktop CRM on local Wi-Fi. Please scan the QR code or enter the IP manually.'
        );
      }
    } catch (e) {
      Alert.alert('Scan Failed', e.message || 'Auto-detect failed.');
    } finally {
      setAutoDetecting(false);
      setStatusMessage('');
    }
  };

  if (!visible) return null;

  const content = (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>Pair Desktop CRM</Text>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTagText}>SCANNER</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Scan the QR code on your Desktop CRM screen
          </Text>
        </View>

        {!isMainScreen && onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Camera Viewport / Permission Handling */}
      {!permission ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0F766E" />
          <Text style={styles.statusText}>Checking camera...</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.permissionBox}>
          <View style={styles.permissionIconBadge}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#0F766E' }} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            Vasantham CRM uses the camera to scan your Desktop screen for automatic 1-second server pairing.
          </Text>

          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.grantBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setShowManualInput(!showManualInput)}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Enter IP Address Manually</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />

          {/* Viewfinder Target Mask */}
          <View style={styles.overlay}>
            <View style={styles.scanTarget}>
              {/* 4 Corner Markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Animated Laser Scanning Line */}
              {!scanned && !connecting && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      transform: [
                        {
                          translateY: scanLaserAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, SCAN_FRAME_SIZE - 8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>
          </View>

          {/* Status / Connecting Notification Banner */}
          {(connecting || autoDetecting) && (
            <View style={styles.connectingBanner}>
              <ActivityIndicator size="small" color="#0F766E" style={{ marginRight: 8 }} />
              <Text style={styles.connectingText}>{statusMessage || 'Verifying Connection...'}</Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Control & Help Deck */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.footerDeck}
      >
        {showManualInput ? (
          <View style={styles.manualInputCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.manualLabel}>ENTER DESKTOP API URL</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.manualTextInput}
              value={manualHost}
              onChangeText={setManualHost}
              placeholder="http://192.168.1.xxx:5000/api"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.manualConnectBtn}
              onPress={handleManualConnect}
              disabled={connecting}
              activeOpacity={0.85}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.manualConnectBtnText}>Connect to Server</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footerContent}>
            <View style={styles.instructionBadge}>
              <Text style={styles.instructionText}>
                In Desktop CRM, click <Text style={{ fontWeight: '800', color: '#0F172A' }}>"Pair Mobile"</Text> at the top to display the pairing QR code.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={handleAutoDetect}
                disabled={autoDetecting}
                activeOpacity={0.75}
              >
                <Text style={styles.actionChipText}>
                  {autoDetecting ? 'Scanning Wi-Fi...' : 'Auto-Detect Wi-Fi'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => setShowManualInput(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.actionChipText}>Manual IP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );

  if (isMainScreen) {
    return content;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFEF8',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F766E',
  },
  liveTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '800',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTarget: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 18,
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.50)',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#0F766E',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    height: 2.5,
    width: SCAN_FRAME_SIZE - 20,
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 1.5,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  connectingBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  connectingText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F8FAFC',
  },
  permissionIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ECFEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  grantBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  grantBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: -0.2,
  },
  footerDeck: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  footerContent: {
    gap: 10,
  },
  instructionBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionChipText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  manualInputCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  manualTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 11,
  },
  manualConnectBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  manualConnectBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
