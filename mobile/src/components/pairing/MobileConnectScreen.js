import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
          'Connection Failed',
          `Could not connect to Desktop server at:\n${cleanUrl}\n\n1. Make sure Desktop CRM is running on PC.\n2. Ensure Phone & PC are connected to the same Wi-Fi network.\n3. Try scanning the Desktop QR Code directly.`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      setStatusText('');
      Alert.alert('Connection Error', e.message || 'Failed to ping host.');
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
        setStatusText(`Server detected at ${result.host}!`);
        await apiClient.setApiBase(result.host);
        await apiClient.setPairedStatus(true);
        setTimeout(() => {
          onConnected(result.host);
        }, 600);
      } else {
        setStatusText('');
        Alert.alert(
          'Server Not Found',
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
                <Ionicons name="desktop-outline" size={24} color="#0F766E" />
              </View>
              <View style={styles.heroTextGroup}>
                <View style={styles.appBadgeChip}>
                  <View style={styles.statusDot} />
                  <Text style={styles.appBadgeText}>SHOWROOM WORKSTATION PAIRING</Text>
                </View>
                <Text style={styles.heroTitle}>Connect to Desktop CRM</Text>
                <Text style={styles.heroSubtitle}>
                  Pair over local showroom Wi-Fi to synchronize client records, follow-ups, and orders.
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Action Card: Option 1 Scan QR Code */}
          <View style={styles.primaryActionCard}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>RECOMMENDED METHOD</Text>
            </View>

            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Option 1: Instant QR Code Scan</Text>
                <Text style={styles.cardDesc}>
                  Point your phone camera at the QR code displayed on the desktop workstation.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              activeOpacity={0.85}
              onPress={onOpenQrScanner}
            >
              <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.scanBtnText}>Scan Desktop QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* Option 2: Wi-Fi Auto-Detect */}
          <View style={styles.secondaryCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Option 2: Wi-Fi Auto-Detect</Text>
                <Text style={styles.cardDesc}>
                  Automatically search your local Wi-Fi network for active showroom CRM servers.
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
                <ActivityIndicator size="small" color="#0F766E" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="wifi-outline" size={17} color="#334155" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.autoBtnText}>
                {autoScanning ? 'Scanning Wi-Fi Subnet...' : 'Auto-Detect Desktop CRM'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Option 3: Manual Server Address */}
          <View style={styles.manualCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Option 3: Manual Server Address</Text>
                <Text style={styles.cardDesc}>
                  Enter the static showroom IP address assigned to the PC.
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
              <ActivityIndicator size="small" color="#0F766E" style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : null}

          {/* Helpful Tips Banner */}
          <View style={styles.tipsBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={16} color="#475569" />
              <Text style={styles.tipsTitle}>Pairing Guidelines</Text>
            </View>
            <Text style={styles.tipsText}>• Ensure phone and workstation are connected to the same showroom Wi-Fi.</Text>
            <Text style={styles.tipsText}>• Open Desktop CRM on your PC and click "Pair Mobile".</Text>
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
    padding: 16,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextGroup: {
    flex: 1,
  },
  appBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0F766E',
  },
  appBadgeText: {
    color: '#0F766E',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  primaryActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  recommendedBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14.5,
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
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  autoBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700',
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  connectBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  statusText: {
    color: '#0F766E',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  tipsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  tipsText: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
});
