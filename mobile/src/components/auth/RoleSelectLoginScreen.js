import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PROFILES } from '../profile/ProfileSelectorModal';
import { apiClient } from '../../api/client';

export const RoleSelectLoginScreen = ({
  onSelectRole,
  onDisconnectServer,
  serverHost,
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState('executive'); // 'executive' | 'customer'
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(PROFILES[0]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleExecutiveLogin = async () => {
    setLoggingIn(true);
    try {
      await apiClient.setSavedAuthRole('sales_executive');
      await apiClient.sendDeviceHeartbeat(selectedStaffProfile, 'Executive Login');
      onSelectRole({
        role: 'sales_executive',
        profile: selectedStaffProfile,
      });
    } catch (e) {
      Alert.alert('Error', e.message || 'Executive login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCustomerLogin = async () => {
    if (!customerPhone.trim() && !customerId.trim()) {
      Alert.alert('Required', 'Please enter your Mobile Number or Customer ID to log in.');
      return;
    }

    setLoggingIn(true);
    try {
      // Fetch customer records or verify existence
      const searchVal = customerPhone.trim() || customerId.trim();
      const customers = await apiClient.getCustomers(searchVal);

      let matchedCustomer = null;
      if (Array.isArray(customers) && customers.length > 0) {
        matchedCustomer = customers[0];
      }

      const customerProfile = {
        name: matchedCustomer ? matchedCustomer.customerName : `Client (${searchVal})`,
        phone: customerPhone.trim() || matchedCustomer?.phone || '',
        customerId: matchedCustomer ? matchedCustomer.customerId : customerId.trim() || 'CUS-GUEST',
        role: 'customer',
      };

      await apiClient.setSavedAuthRole('customer');
      await apiClient.sendDeviceHeartbeat(
        { name: customerProfile.name, role: 'customer', icon: '👤' },
        'Customer Portal Login'
      );

      onSelectRole({
        role: 'customer',
        customer: customerProfile,
        data: matchedCustomer,
      });
    } catch (e) {
      Alert.alert('Customer Login Error', e.message || 'Unable to load customer portal.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Top Server Connected Pill Bar */}
        <View style={styles.serverBar}>
          <View style={styles.serverStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.serverHostText} numberOfLines={1}>
              Paired to PC: {serverHost || 'Desktop Server'}
            </Text>
          </View>

          <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnectServer}>
            <Text style={styles.disconnectBtnText}>Re-pair QR</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Branding */}
        <View style={styles.heroSection}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🏢</Text>
          <Text style={styles.appTitle}>Vasantham CRM</Text>
          <Text style={styles.appSubtitle}>Tiles, Sanitary & Construction Material Management</Text>
        </View>

        {/* Segmented Role Selector Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedRoleTab === 'executive' && styles.activeTabBtn]}
            onPress={() => setSelectedRoleTab('executive')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16, marginRight: 6 }}>💼</Text>
            <Text style={[styles.tabBtnText, selectedRoleTab === 'executive' && styles.activeTabBtnText]}>
              Sales Executive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, selectedRoleTab === 'customer' && styles.activeTabBtn]}
            onPress={() => setSelectedRoleTab('customer')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16, marginRight: 6 }}>👤</Text>
            <Text style={[styles.tabBtnText, selectedRoleTab === 'customer' && styles.activeTabBtnText]}>
              Customer Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* SALES EXECUTIVE LOGIN TAB */}
        {selectedRoleTab === 'executive' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sales Staff & Owner Portal</Text>
            <Text style={styles.cardSubtitle}>
              Select your staff member profile to access lead management, follow-ups, and daily KPI tracking.
            </Text>

            <Text style={styles.fieldLabel}>SELECT STAFF PROFILE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileList}>
              {PROFILES.map((p) => {
                const isSelected = selectedStaffProfile.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.profileChip,
                      { backgroundColor: p.bg, borderColor: isSelected ? p.color : p.border },
                      isSelected && styles.profileChipSelected,
                    ]}
                    onPress={() => setSelectedStaffProfile(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 22 }}>{p.icon}</Text>
                    <Text style={[styles.profileName, { color: p.color }]}>{p.name}</Text>
                    <Text style={styles.profileRoleTitle}>{p.roleTitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.selectedProfileBanner}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>{selectedStaffProfile.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedProfileName}>{selectedStaffProfile.name}</Text>
                <Text style={styles.selectedProfileDesc}>{selectedStaffProfile.subtitle}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.85}
              onPress={handleExecutiveLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.loginBtnText}>
                {loggingIn ? 'Logging In...' : `Enter CRM as ${selectedStaffProfile.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* CUSTOMER PORTAL LOGIN TAB */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Portal Login</Text>
            <Text style={styles.cardSubtitle}>
              Enter your mobile number or Customer ID to view your quotation status, order updates, and product requirements.
            </Text>

            <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94A3B8"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>CUSTOMER ID (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CUS-000001"
              placeholderTextColor="#94A3B8"
              value={customerId}
              onChangeText={setCustomerId}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: '#059669' }]}
              activeOpacity={0.85}
              onPress={handleCustomerLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.loginBtnText}>
                {loggingIn ? 'Connecting...' : 'Open Customer Portal'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  serverBar: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  serverHostText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  disconnectBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  disconnectBtnText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTabBtn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabBtnText: {
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
  },
  profileList: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileChip: {
    width: 110,
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  profileChipSelected: {
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  profileRoleTitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  selectedProfileBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedProfileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedProfileDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
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
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
