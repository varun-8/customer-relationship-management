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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Hero Brand Header Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>📱</Text>
              </View>
              <View style={styles.heroTextGroup}>
                <View style={styles.appBadgeChip}>
                  <View style={styles.statusDot} />
                  <Text style={styles.appBadgeText}>MOBILE CRM PAIRING</Text>
                </View>
                <Text style={styles.heroTitle}>Connect to Desktop CRM</Text>
                <Text style={styles.heroSubtitle}>
                  Pair over showroom Wi-Fi to sync live leads, quotations, and call logs.
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Action Card: Option 1 Scan QR Code */}
          <View style={styles.primaryActionCard}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>⚡ RECOMMENDED (FASTEST)</Text>
            </View>

            <View style={styles.cardHeaderRow}>
              <View style={styles.optionIconBox}>
                <Text style={{ fontSize: 22 }}>📷</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Option 1: Instant QR Code Scan</Text>
                <Text style={styles.cardDesc}>
                  Point your phone camera at the QR code on your Desktop CRM screen.
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

          {/* Option 2: Wi-Fi Auto-Detect */}
          <View style={styles.secondaryCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.optionIconBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={{ fontSize: 22 }}>📡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Option 2: Wi-Fi Auto-Detect</Text>
                <Text style={styles.cardDesc}>
                  Automatically search your local Wi-Fi network for running CRM servers.
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
                {autoScanning ? 'Scanning Wi-Fi Subnet...' : 'Auto-Detect Desktop CRM'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Option 3: Manual Server Address */}
          <View style={styles.manualCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.optionIconBox, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                <Text style={{ fontSize: 22 }}>⌨️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Option 3: Manual Server Address</Text>
                <Text style={styles.cardDesc}>
                  Enter your PC local IP address (e.g. 192.168.1.100 or 10.0.0.5)
                </Text>
              </View>
            </View>

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
                {testing ? 'Pinging Server...' : 'Test & Connect Server'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Message Box */}
          {statusText ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : null}

          {/* Helpful Tips Banner */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 Wi-Fi Pairing Tips:</Text>
            <Text style={styles.tipsText}>• Open Desktop CRM on your PC and click "Mobile Scanner".</Text>
            <Text style={styles.tipsText}>• Ensure your Phone & PC are on the exact same Wi-Fi network.</Text>
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
    padding: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextGroup: {
    flex: 1,
  },
  appBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  appBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 16,
  },
  primaryActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  recommendedBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  recommendedBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBtnText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
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
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  connectBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  tipsBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
    marginTop: 2,
  },
});
