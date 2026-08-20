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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { apiClient } from '../../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);

export const MobileQrScannerModal = ({ visible, onClose, onConnected }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [scanLaserAnim] = useState(new Animated.Value(0));

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
    }
  }, [visible]);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || connecting) return;
    setScanned(true);

    const parsedApiUrl = apiClient.parsePairingPayload(data);
    if (!parsedApiUrl) {
      Alert.alert(
        '⚠️ Invalid QR Code',
        'This QR code does not contain a valid Vasantham CRM server address.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    setConnecting(true);
    setStatusMessage(`Connecting to ${parsedApiUrl}...`);

    try {
      const testRes = await apiClient.testConnection(parsedApiUrl);
      if (testRes.success) {
        setStatusMessage('✓ Connected to Desktop Server!');
        setTimeout(() => {
          if (onConnected) onConnected(parsedApiUrl);
          onClose();
        }, 600);
      } else {
        Alert.alert(
          '📡 Connection Failed',
          `Could not reach Desktop server at:\n${parsedApiUrl}\n\n1. Ensure PC and Phone are on the same Wi-Fi.\n2. Ensure CRM server is running on the PC.`,
          [
            { text: 'Scan Again', onPress: () => { setScanned(false); setConnecting(false); setStatusMessage(''); } },
            { text: 'Cancel', onPress: onClose, style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        '⚠️ Error',
        err.message || 'Failed to connect to the scanned address.',
        [{ text: 'Try Again', onPress: () => { setScanned(false); setConnecting(false); setStatusMessage(''); } }]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Scan Desktop QR Code</Text>
            <Text style={styles.headerSubtitle}>Point camera at the QR code on your Desktop CRM screen</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Camera Scanner Body */}
        {!permission ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.statusText}>Checking camera permissions...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionDesc}>
              Vasantham CRM needs camera permission to scan the Desktop QR code and automatically detect the server IP.
            </Text>

            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission} activeOpacity={0.8}>
              <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Enter IP Manually</Text>
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

            {/* Target Scanning Overlay */}
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
                              outputRange: [10, SCAN_FRAME_SIZE - 10],
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
            {connecting && (
              <View style={styles.connectingBanner}>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.connectingText}>{statusMessage || 'Verifying Connection...'}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Help Instructions */}
        <View style={styles.footer}>
          <View style={styles.instructionRow}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.instructionText}>On Desktop CRM, click <Text style={{ fontWeight: '700', color: '#1E293B' }}>"📱 Pair Mobile"</Text> at the top.</Text>
          </View>

          <View style={styles.instructionRow}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.instructionText}>Point your phone at the QR code until it scans automatically.</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={styles.footerSecondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.footerSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTarget: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  laserLine: {
    height: 2.5,
    width: SCAN_FRAME_SIZE - 20,
    marginLeft: 10,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  connectingBanner: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  connectingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '800',
    marginRight: 10,
  },
  instructionText: {
    fontSize: 12.5,
    color: '#475569',
    flex: 1,
  },
  footerSecondaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  footerSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#0F172A',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  grantBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    width: '100%',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
