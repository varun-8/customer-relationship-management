import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Linking,
  StatusBar,
  Easing,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.70, 260);

// Optical centering math: balance the top floating bar and bottom control deck
const TOP_HEADER_SPACE = Platform.OS === 'ios' ? 104 : 88;
const BOTTOM_DECK_HEIGHT = Platform.OS === 'ios' ? 178 : 162;
const AVAILABLE_HEIGHT = Math.max(SCREEN_HEIGHT - TOP_HEADER_SPACE - BOTTOM_DECK_HEIGHT, SCAN_FRAME_SIZE + 60);
const TOP_MASK_HEIGHT = TOP_HEADER_SPACE + Math.max(Math.round((AVAILABLE_HEIGHT - SCAN_FRAME_SIZE) / 2) - 16, 20);
const BOTTOM_MASK_HEIGHT = Math.max(SCREEN_HEIGHT - TOP_MASK_HEIGHT - SCAN_FRAME_SIZE, BOTTOM_DECK_HEIGHT + 40);

const BARCODE_SETTINGS = {
  barcodeTypes: ['qr'],
};

export const MobileQrScannerModal = ({
  visible,
  onClose,
  onConnected,
  isMainScreen = false,
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);

  // Manual IP & Auto-detect state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualHost, setManualHost] = useState('');
  const [quickHost, setQuickHost] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Concurrency guard to prevent rapid duplicate scans
  const isProcessingRef = useRef(false);

  // Animation values
  const scanLaserAnim = useRef(new Animated.Value(0)).current;
  const cornerPulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  // Direct imperative camera permission check & request
  const checkAndRequestCamera = useCallback(async () => {
    try {
      if (Camera && Camera.getCameraPermissionsAsync) {
        const statusRes = await Camera.getCameraPermissionsAsync();
        if (statusRes && statusRes.granted) {
          setHasPermission(true);
          setCameraError(null);
          return true;
        }
      }
      if (Camera && Camera.requestCameraPermissionsAsync) {
        const reqRes = await Camera.requestCameraPermissionsAsync();
        if (reqRes && reqRes.granted) {
          setHasPermission(true);
          setCameraError(null);
          return true;
        }
        setHasPermission(false);
        return false;
      }
      // If Camera object is not available, default to true to allow CameraView native mount
      setHasPermission(true);
      return true;
    } catch (e) {
      console.warn('Camera permission check error:', e);
      setHasPermission(true);
      return true;
    }
  }, []);

  // Viewfinder Corner Breathing Animation
  useEffect(() => {
    if (visible && !scanned) {
      const breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(cornerPulseAnim, {
            toValue: 1.025,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cornerPulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      breathing.start();
      return () => breathing.stop();
    }
  }, [visible, scanned]);

  // Smooth Laser Scanning Animation
  useEffect(() => {
    if (visible && !scanned && !connecting) {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLaserAnim, {
            toValue: 1,
            duration: 1900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLaserAnim, {
            toValue: 0,
            duration: 1900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.start();
      return () => scanLoop.stop();
    } else {
      scanLaserAnim.setValue(0);
    }
  }, [visible, scanned, connecting]);

  // Reset scan state on reopen and request camera permissions
  useEffect(() => {
    if (visible) {
      isProcessingRef.current = false;
      setScanned(false);
      setConnecting(false);
      setStatusMessage('');
      setCameraError(null);
      setShowManualInput(false);
      setTorchOn(false);
      setCameraReady(false);
      successScaleAnim.setValue(0);

      checkAndRequestCamera();

      apiClient.getApiBase().then((base) => {
        if (base) {
          setManualHost(base);
          setQuickHost(base);
        }
      });
    }
  }, [visible, checkAndRequestCamera]);

  const handleMountError = useCallback((error) => {
    console.warn('Camera Mount Error:', error);
    setCameraError(error?.message || 'Camera preview could not be started on this device.');
  }, []);

  const handleRequestPermission = async () => {
    try {
      const granted = await checkAndRequestCamera();
      if (!granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Camera access is disabled. Please enable it in Settings to scan the Desktop QR code.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
          ]
        );
      }
    } catch (e) {
      Linking.openSettings().catch(() => {});
    }
  };

  const handleSmoothClose = () => {
    if (onClose) onClose();
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (!data || scanned || connecting || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanned(true);

    const parsedApiUrl = apiClient.parsePairingPayload(data);
    if (!parsedApiUrl) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code does not contain a valid Vasantham CRM server payload.',
        [
          {
            text: 'Scan Again',
            onPress: () => {
              isProcessingRef.current = false;
              setScanned(false);
            },
          },
        ]
      );
      return;
    }

    // Trigger smooth verified lock animation
    Animated.spring(successScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    setConnecting(true);
    setStatusMessage(`Verifying ${parsedApiUrl}...`);

    try {
      const testRes = await apiClient.testConnection(parsedApiUrl);
      if (testRes.success) {
        setStatusMessage('Desktop Workstation Paired');
        setTimeout(() => {
          if (onConnected) onConnected(parsedApiUrl);
          if (onClose) onClose();
        }, 500);
      } else {
        Alert.alert(
          'Connection Failed',
          `Could not reach Desktop CRM at:\n${parsedApiUrl}\n\n1. Ensure phone & desktop are on the same Wi-Fi.\n2. Verify Desktop CRM is running.`,
          [
            {
              text: 'Scan Again',
              onPress: () => {
                isProcessingRef.current = false;
                setScanned(false);
                setConnecting(false);
                setStatusMessage('');
                successScaleAnim.setValue(0);
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
              isProcessingRef.current = false;
              setScanned(false);
              setConnecting(false);
              setStatusMessage('');
              successScaleAnim.setValue(0);
            },
          },
        ]
      );
    }
  };

  const handleManualConnect = async (targetHost = null) => {
    const hostToUse = (typeof targetHost === 'string' && targetHost.trim())
      ? targetHost.trim()
      : (manualHost.trim() || quickHost);

    if (!hostToUse) {
      Alert.alert('Required', 'Please enter your Desktop CRM IP address or URL.');
      return;
    }

    setConnecting(true);
    setStatusMessage(`Connecting to ${hostToUse}...`);
    try {
      const testRes = await apiClient.testConnection(hostToUse);
      if (testRes.success) {
        setStatusMessage('Connected!');
        setTimeout(() => {
          if (onConnected) onConnected(hostToUse);
          if (onClose) onClose();
        }, 350);
      } else {
        Alert.alert('Connection Failed', testRes.error || testRes.message || 'Could not reach server.');
      }
    } catch (e) {
      Alert.alert('Connection Error', e.message || 'Could not reach server.');
    } finally {
      setConnecting(false);
    }
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setStatusMessage('Scanning Wi-Fi for Desktop CRM...');
    try {
      const detected = await apiClient.autoDetectServer();
      if (detected && detected.success && detected.host) {
        setStatusMessage('Found Desktop CRM!');
        setTimeout(() => {
          if (onConnected) onConnected(detected.host);
          if (onClose) onClose();
        }, 400);
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

  const isCameraActive = hasPermission && !cameraError;

  const content = (
    <View style={styles.container}>
      <StatusBar
        barStyle={isCameraActive ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Main Camera Viewport */}
      {hasPermission === false && !cameraReady ? (
        <View style={styles.fallbackBox}>
          <View style={styles.fallbackCard}>
            <View style={styles.permissionBadge}>
              <Ionicons name="camera-outline" size={32} color="#0F766E" />
            </View>
            <Text style={styles.fallbackTitle}>Camera Access Required</Text>
            <Text style={styles.fallbackDesc}>
              Camera permission is required to pair this phone with your Desktop CRM showroom workstation.
            </Text>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleRequestPermission}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Grant Camera Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => {
                setCameraError(null);
                setHasPermission(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryActionBtnText}>Start Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { marginTop: 8 }]}
              onPress={() => handleManualConnect(quickHost)}
              activeOpacity={0.85}
            >
              <Ionicons name="flash-outline" size={16} color="#0F766E" style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryActionBtnText, { color: '#0F766E' }]}>
                Direct Connect ({quickHost.replace(/^https?:\/\//, '').replace(/\/api$/, '')})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : cameraError ? (
        <View style={styles.fallbackBox}>
          <View style={styles.fallbackCard}>
            <View style={styles.permissionBadge}>
              <Ionicons name="alert-circle-outline" size={32} color="#0F766E" />
            </View>
            <Text style={styles.fallbackTitle}>Camera Preview Unavailable</Text>
            <Text style={styles.fallbackDesc}>{cameraError}</Text>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                setCameraError(null);
                setHasPermission(true);
                checkAndRequestCamera();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>Retry Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => handleManualConnect(quickHost)}
              activeOpacity={0.85}
            >
              <Ionicons name="flash-outline" size={16} color="#0F766E" style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryActionBtnText, { color: '#0F766E' }]}>
                Direct Connect ({quickHost.replace(/^https?:\/\//, '').replace(/\/api$/, '')})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={BARCODE_SETTINGS}
            onBarcodeScanned={scanned || connecting ? undefined : handleBarcodeScanned}
            onMountError={handleMountError}
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Optical Scrim Mask (Disciplined Charcoal Tint) */}
          <View style={styles.overlayContainer} pointerEvents="box-none">
            {/* Top Scrim */}
            <View style={styles.maskTop} />

            {/* Middle Row with Viewfinder */}
            <View style={styles.maskMiddle}>
              <View style={styles.maskSide} />

              {/* Central Viewfinder Reticle */}
              <Animated.View
                style={[
                  styles.viewfinderFrame,
                  {
                    transform: [{ scale: cornerPulseAnim }],
                    borderColor: scanned ? '#059669' : 'rgba(255, 255, 255, 0.25)',
                  },
                ]}
              >
                {/* 4 Precision Corner Brackets */}
                <View style={[styles.bracket, styles.bTopLeft, scanned && styles.bracketSuccess]} />
                <View style={[styles.bracket, styles.bTopRight, scanned && styles.bracketSuccess]} />
                <View style={[styles.bracket, styles.bBottomLeft, scanned && styles.bracketSuccess]} />
                <View style={[styles.bracket, styles.bBottomRight, scanned && styles.bracketSuccess]} />

                {/* Subtle Crosshair Reticle Center Marks */}
                <View style={styles.crosshairH} />
                <View style={styles.crosshairV} />

                {/* Animated Laser Scanning Beam */}
                {!scanned && !connecting && (
                  <Animated.View
                    style={[
                      styles.laserContainer,
                      {
                        transform: [
                          {
                            translateY: scanLaserAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [12, SCAN_FRAME_SIZE - 16],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(15, 118, 110, 0.85)', '#0F766E', 'rgba(15, 118, 110, 0.85)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.laserGradient}
                    />
                  </Animated.View>
                )}

                {/* Success Lock Confirmation Icon */}
                {scanned && (
                  <Animated.View
                    style={[
                      styles.successLockRing,
                      {
                        transform: [{ scale: successScaleAnim }],
                        opacity: successScaleAnim,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-sharp" size={38} color="#059669" />
                  </Animated.View>
                )}
              </Animated.View>

              <View style={styles.maskSide} />
            </View>

            {/* Bottom Scrim with Guidance Pill */}
            <View style={styles.maskBottom}>
              <View style={[styles.guidancePill, scanned && styles.guidancePillSuccess]}>
                <Ionicons
                  name={scanned ? 'checkmark-circle' : 'qr-code-outline'}
                  size={16}
                  color={scanned ? '#059669' : '#0F766E'}
                  style={{ marginRight: 7 }}
                />
                <Text style={[styles.guidanceText, scanned && styles.guidanceTextSuccess]}>
                  {scanned ? 'Workstation Verified' : 'Align desktop QR code inside frame'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Floating Top Bar (Clean Frosted Card) */}
      <View style={styles.floatingTopBar}>
        <View style={styles.topBarCard}>
          {/* Back / Dismiss Button */}
          {!isMainScreen && onClose ? (
            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={handleSmoothClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={19} color="#334155" />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandBadgeIcon}>
              <Ionicons name="scan-outline" size={18} color="#0F766E" />
            </View>
          )}

          {/* Central Live HUD Indicator */}
          <View style={styles.centerHudBadge}>
            <View style={[styles.hudDot, scanned && { backgroundColor: '#059669' }]} />
            <Text style={styles.hudBadgeText}>SCAN WORKSTATION QR</Text>
          </View>

          {/* Flashlight / Torch Toggle */}
          <TouchableOpacity
            style={[styles.circleActionBtn, torchOn && styles.circleActionBtnActive]}
            onPress={() => setTorchOn((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={17}
              color={torchOn ? '#FFFFFF' : '#475569'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connecting Notification Pill */}
      {(connecting || autoDetecting) && (
        <View style={styles.connectingToast}>
          <ActivityIndicator size="small" color="#0F766E" style={{ marginRight: 10 }} />
          <Text style={styles.connectingToastText}>
            {statusMessage || 'Connecting to workstation...'}
          </Text>
        </View>
      )}

      {/* Bottom Deck (Executive White Card) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomDeckWrapper}
      >
        <View style={styles.bottomDeckCard}>
          {showManualInput ? (
            <View style={styles.manualInputDeck}>
              <View style={styles.manualHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="desktop-outline" size={15} color="#0F766E" />
                  <Text style={styles.manualTitle}>WORKSTATION API ADDRESS</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowManualInput(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.manualCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.manualInputField}
                value={manualHost}
                onChangeText={setManualHost}
                placeholder="http://192.168.1.xxx:5000/api"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <TouchableOpacity
                style={styles.manualConnectBtn}
                onPress={() => handleManualConnect()}
                disabled={connecting}
                activeOpacity={0.85}
              >
                {connecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.manualConnectBtnText}>Connect to Workstation</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.defaultDeck}>
              {/* Quick 1-Tap Connect Hero Button */}
              <TouchableOpacity
                style={styles.quickPairHeroBtn}
                onPress={() => handleManualConnect(quickHost)}
                disabled={connecting}
                activeOpacity={0.85}
              >
                <View style={styles.quickPairHeroSolid}>
                  <Ionicons name="flash-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.quickPairHeroText}>
                    1-Tap Connect ({quickHost.replace(/^https?:\/\//, '').replace(/\/api$/, '')})
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Secondary Actions: Auto-Detect & Manual IP */}
              <View style={styles.secondaryActionRow}>
                <TouchableOpacity
                  style={styles.secondaryPill}
                  onPress={handleAutoDetect}
                  disabled={autoDetecting}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={autoDetecting ? 'sync-outline' : 'wifi-outline'}
                    size={15}
                    color="#334155"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.secondaryPillText}>
                    {autoDetecting ? 'Scanning...' : 'Auto-Detect'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryPill}
                  onPress={() => setShowManualInput(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="keypad-outline" size={15} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryPillText}>Manual IP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  if (isMainScreen) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleSmoothClose}
    >
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {content}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fallbackBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  fallbackCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  permissionBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  fallbackDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  primaryActionBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  maskTop: {
    height: TOP_MASK_HEIGHT,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  maskMiddle: {
    height: SCAN_FRAME_SIZE,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  maskBottom: {
    height: BOTTOM_MASK_HEIGHT,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    paddingTop: 20,
  },
  viewfinderFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 22,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#0F766E',
  },
  bracketSuccess: {
    borderColor: '#059669',
  },
  bTopLeft: {
    top: -1.5,
    left: -1.5,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 20,
  },
  bTopRight: {
    top: -1.5,
    right: -1.5,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 20,
  },
  bBottomLeft: {
    bottom: -1.5,
    left: -1.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 20,
  },
  bBottomRight: {
    bottom: -1.5,
    right: -1.5,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomLeftRadius: 20,
  },
  crosshairH: {
    position: 'absolute',
    width: 20,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    borderRadius: 1,
  },
  crosshairV: {
    position: 'absolute',
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    borderRadius: 1,
  },
  laserContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  laserGradient: {
    width: '90%',
    height: 2.5,
    borderRadius: 1.5,
  },
  successLockRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  guidancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  guidancePillSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  guidanceText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  guidanceTextSuccess: {
    color: '#059669',
    fontWeight: '800',
  },
  floatingTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 34),
    left: 16,
    right: 16,
    zIndex: 25,
  },
  topBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActionBtnActive: {
    backgroundColor: '#0F766E',
  },
  brandBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  hudBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  connectingToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 88,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    zIndex: 30,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  connectingToastText: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
  },
  bottomDeckWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 25,
  },
  bottomDeckCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  defaultDeck: {
    gap: 10,
  },
  quickPairHeroBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  quickPairHeroSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  quickPairHeroText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryPillText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  manualInputDeck: {
    gap: 10,
  },
  manualHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  manualCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  manualInputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  manualConnectBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },
  manualConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
