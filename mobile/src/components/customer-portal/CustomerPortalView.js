import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiClient } from '../../api/client';

export const CustomerPortalView = ({ customerInfo, onLogoutRole, branding }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customerData, setCustomerData] = useState(customerInfo?.data || null);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const searchVal = customerInfo?.phone || customerInfo?.customerId;
      if (searchVal) {
        const res = await apiClient.getCustomers(searchVal);
        if (Array.isArray(res) && res.length > 0) {
          setCustomerData(res[0]);
        }
      }
    } catch (e) {
      console.warn('Customer portal fetch warning:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomerDetails();
  };

  const handleCallShowroom = () => {
    Linking.openURL('tel:9876543210');
  };

  const handleWhatsAppShowroom = () => {
    const msg = `Hello ${branding?.appName || 'Vasantham CRM'}, I am checking my order/quotation status for Customer ID: ${customerData?.customerId || customerInfo?.customerId || 'CUS-001'}.`;
    Linking.openURL(`whatsapp://send?phone=919876543210&text=${encodeURIComponent(msg)}`).catch(() => {
      Linking.openURL(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`);
    });
  };

  const status = customerData?.status || 'Quotation';
  const quotationVal = customerData?.quotationValue || 0;
  const orderVal = customerData?.orderValue || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />}
      >
        {/* Top Navigation Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.portalTag}>CLIENT PORTAL</Text>
            <Text style={styles.welcomeTitle}>
              Welcome, {customerData?.customerName || customerInfo?.name || 'Valued Client'}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogoutRole}>
            <Text style={styles.logoutBtnText}>Switch Role</Text>
          </TouchableOpacity>
        </View>

        {/* Customer ID Snapshot Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontSize: 26 }}>👤</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.customerIdBadge}>
                  ID: {customerData?.customerId || customerInfo?.customerId || 'CUS-LEAD'}
                </Text>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>CONNECTED</Text>
                </View>
              </View>

              <Text style={styles.clientPhone}>
                📞 {customerData?.phone || customerInfo?.phone || 'Phone registered'}
              </Text>
              {customerData?.location ? (
                <Text style={styles.clientLocation}>📍 {customerData.location}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Order / Quotation Status Tracker Card */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionHeading}>📋 Quotation & Order Pipeline Status</Text>

          <View style={styles.statusProgressBox}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Stage:</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{status}</Text>
              </View>
            </View>

            {quotationVal > 0 ? (
              <View style={styles.valRow}>
                <Text style={styles.valLabel}>Quotation Amount:</Text>
                <Text style={styles.valAmount}>₹ {Number(quotationVal).toLocaleString('en-IN')}</Text>
              </View>
            ) : null}

            {orderVal > 0 ? (
              <View style={styles.valRow}>
                <Text style={styles.valLabel}>Confirmed Order Value:</Text>
                <Text style={[styles.valAmount, { color: '#059669' }]}>
                  ₹ {Number(orderVal).toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Direct Showroom Support Buttons */}
          <View style={styles.supportBtnRow}>
            <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.8} onPress={handleWhatsAppShowroom}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>💬</Text>
              <Text style={styles.whatsappBtnText}>WhatsApp Showroom</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8} onPress={handleCallShowroom}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>📞</Text>
              <Text style={styles.callBtnText}>Call Staff</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Requirements & Material Highlights */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>🧱 Material Requirements Summary</Text>

          <View style={styles.materialGrid}>
            <View style={styles.materialChip}>
              <Text style={{ fontSize: 20 }}>🏬</Text>
              <Text style={styles.materialTitle}>Tiles & Flooring</Text>
              <Text style={styles.materialStatus}>Selected</Text>
            </View>

            <View style={styles.materialChip}>
              <Text style={{ fontSize: 20 }}>🛁</Text>
              <Text style={styles.materialTitle}>Sanitary Wares</Text>
              <Text style={styles.materialStatus}>In Review</Text>
            </View>

            <View style={styles.materialChip}>
              <Text style={{ fontSize: 20 }}>🏗️</Text>
              <Text style={styles.materialTitle}>Tile Adhesives</Text>
              <Text style={styles.materialStatus}>Quoted</Text>
            </View>

            <View style={styles.materialChip}>
              <Text style={{ fontSize: 20 }}>✨</Text>
              <Text style={styles.materialTitle}>Fittings & Grout</Text>
              <Text style={styles.materialStatus}>Optional</Text>
            </View>
          </View>
        </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  portalTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerIdBadge: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  clientPhone: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  clientLocation: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  statusProgressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  valLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  valAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
  supportBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  materialChip: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  materialStatus: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
});
