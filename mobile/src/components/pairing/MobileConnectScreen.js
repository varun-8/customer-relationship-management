import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';

export const MobileConnectScreen = ({ onConnected, onOpenQrScanner }) => {
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('5000');
  const [testing, setTesting] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleTestConnection = async (targetUrl = null) => {
    let cleanUrl = targetUrl;
    if (!cleanUrl) {
      if (!manualIp.trim()) {
        Alert.alert('Required', 'Please enter your Desktop PC IP address or scan the QR code.');
        return;
      }
      const ip = manualIp.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      cleanUrl = `http://${ip}:${manualPort.trim() || '5000'}/api`;
    }

    setTesting(true);
    setStatusText(`Pinging ${cleanUrl}...`);

    try {
      const res = await apiClient.testConnection(cleanUrl);
      if (res && res.success) {
        setStatusText('✓ Connected successfully!');
        await apiClient.setApiBase(cleanUrl);
        await apiClient.setPairedStatus(true);
        setTimeout(() => {
          onConnected(cleanUrl);
        }, 500);
      } else {
        setStatusText('');
        Alert.alert(
          '📡 Connection Failed',
          `Could not connect to Desktop server at:\n${cleanUrl}\n\n1. Make sure Desktop CRM is running on PC.\n2. Ensure Phone & PC are connected to the same Wi-Fi network.\n3. Try scanning the Desktop QR Code directly.`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      setStatusText('');
      Alert.alert('⚠️ Connection Error', e.message || 'Failed to ping host.');
    } finally {
      setTesting(false);
    }
  };

  const handleAutoDetect = async () => {
    setAutoScanning(true);
    setStatusText('Scanning local Wi-Fi subnet for Desktop CRM server...');
    try {
      const result = await apiClient.autoDetectServer((msg) => setStatusText(msg));
      if (result && result.success && result.host) {
        setStatusText(`✓ Server detected at ${result.host}!`);
        await apiClient.setApiBase(result.host);
        await apiClient.setPairedStatus(true);
        setTimeout(() => {
          onConnected(result.host);
        }, 600);
      } else {
        setStatusText('');
        Alert.alert(
          '🔍 Server Not Found',
          'Could not auto-detect Desktop CRM on your Wi-Fi network.\n\nPlease use "Scan Desktop QR Code" or enter your PC IP address manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      setStatusText('');
      Alert.alert('Error', e.message || 'Auto-detection failed.');
    } finally {
      setAutoScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Top Brand Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 36 }}>📱</Text>
            </View>

            <View style={styles.appBadgeChip}>
              <Text style={styles.appBadgeText}>VASANTHAM CRM • MOBILE LINK</Text>
            </View>

            <Text style={styles.title}>Connect Mobile to Desktop</Text>
            <Text style={styles.subtitle}>
              Link your mobile app with the Desktop CRM server over Wi-Fi to fetch leads, quotations, and sync updates live.
            </Text>
          </View>

          {/* Primary Action Card: Scan QR Code */}
          <View style={styles.primaryActionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 24 }}>📷</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>Option 1: Instant QR Code Scan</Text>
                <Text style={styles.cardDesc}>
                  Recommended. Point your camera at the QR code displayed on the Desktop CRM screen.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              activeOpacity={0.85}
              onPress={onOpenQrScanner}
            >
              <Text style={{ fontSize: 18, color: '#FFFFFF', marginRight: 8 }}>📷</Text>
              <Text style={styles.scanBtnText}>Scan Desktop QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* Secondary Action: Auto-Detect Server */}
          <View style={styles.secondaryCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 24 }}>📡</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>Option 2: Wi-Fi Auto-Detect</Text>
                <Text style={styles.cardDesc}>
                  Automatically search local Wi-Fi subnet for running CRM server.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.autoBtn}
              activeOpacity={0.8}
              onPress={handleAutoDetect}
              disabled={autoScanning || testing}
            >
              {autoScanning ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
              ) : (
                <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
              )}
              <Text style={styles.autoBtnText}>
                {autoScanning ? 'Scanning Wi-Fi Network...' : 'Auto-Detect Desktop CRM'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Option 3: Manual Host Input */}
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Option 3: Manual Server Address</Text>
            <Text style={styles.manualDesc}>
              Enter your PC local IP address (e.g., 192.168.1.100 or 10.0.0.5)
            </Text>

            <View style={styles.inputRow}>
              <View style={{ flex: 3 }}>
                <Text style={styles.inputLabel}>DESKTOP IP ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 192.168.1.5"
                  placeholderTextColor="#94A3B8"
                  value={manualIp}
                  onChangeText={setManualIp}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.inputLabel}>PORT</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5000"
                  placeholderTextColor="#94A3B8"
                  value={manualPort}
                  onChangeText={setManualPort}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.connectBtn}
              activeOpacity={0.8}
              onPress={() => handleTestConnection()}
              disabled={testing || autoScanning}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.connectBtnText}>
                {testing ? 'Pinging Server...' : 'Test & Connect'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Message Display */}
          {statusText ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : null}

          {/* Helpful Tips Banner */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 Connection Tips:</Text>
            <Text style={styles.tipsText}>• Open Desktop CRM on your PC and navigate to "Mobile Scanner".</Text>
            <Text style={styles.tipsText}>• Ensure Phone & PC are connected to the exact same Wi-Fi network.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroBanner: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  appBadgeChip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  appBadgeText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  primaryActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  scanBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  autoBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  manualTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  manualDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  connectBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  tipsBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
    marginTop: 2,
  },
});
