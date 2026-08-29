import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Linking,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  AppState,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { apiClient, FALLBACK_SCHEMA } from './src/api/client';
import { DynamicFieldRenderer } from './src/components/DynamicFieldRenderer';
import { PROFILES, ProfileSelectorModal } from './src/components/profile/ProfileSelectorModal';
import { MobileFollowupSheet } from './src/components/followups/MobileFollowupSheet';
import { MobileFollowupLogModal } from './src/components/followups/MobileFollowupLogModal';
import { MobileLostSaleModal } from './src/components/lost-sales/MobileLostSaleModal';
import { WhatsAppTemplateModal } from './src/components/WhatsAppTemplateModal';
import { MobileShiftKpiModal } from './src/components/kpi/MobileShiftKpiModal';
import { MobileQrScannerModal } from './src/components/pairing/MobileQrScannerModal';
import { RoleSelectLoginScreen } from './src/components/auth/RoleSelectLoginScreen';
import { CustomerPortalView } from './src/components/customer-portal/CustomerPortalView';
import { MobileSettingsModal } from './src/components/settings/MobileSettingsModal';

const CONFETTI_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316', '#EAB308', '#06B6D4'];
const CONFETTI_PIECES = Array.from({ length: 26 }).map((_, i) => ({
  id: i,
  left: (i * 3.7) + (Math.sin(i) * 3),
  width: (i % 3 === 0) ? 10 : (i % 2 === 0 ? 8 : 6),
  height: (i % 2 === 0) ? 14 : 9,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rot: ((i * 53) % 360) + 180,
  radius: (i % 3 === 0) ? 2 : 4,
}));

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (months[monthIndex]) {
        return `${day} ${months[monthIndex]}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

const formatStatusLabel = (status) => {
  if (!status) return 'Follow-up';
  if (status === 'Future Requirement') return 'Future Req.';
  return status;
};

const getBrandingIconEmoji = (iconName) => {
  switch (iconName) {
    case 'Box': return '📦';
    case 'Layers': return '📚';
    case 'Building': return '🏢';
    case 'Sparkles': return '✨';
    case 'Gem': return '💎';
    case 'ShoppingBag': return '🛍️';
    case 'Store': return '🏬';
    case 'Briefcase': return '💼';
    case 'Shield': return '🛡️';
    default: return '🏢';
  }
};

// Premium Vector-Style Line-Art Navigation Icons
const LeadsNavIcon = ({ active, color }) => (
  <View style={{ width: 26, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Main Left User */}
    <View style={{
      position: 'absolute',
      left: 3,
      top: 1,
      width: 9,
      height: 9,
      borderRadius: 4.5,
      borderWidth: active ? 2.2 : 1.8,
      borderColor: color,
      backgroundColor: active ? color : 'transparent',
    }} />
    <View style={{
      position: 'absolute',
      left: 0,
      bottom: 1,
      width: 15,
      height: 8,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      borderWidth: active ? 2.2 : 1.8,
      borderBottomWidth: 0,
      borderColor: color,
    }} />
    {/* Right Offset Secondary User */}
    <View style={{
      position: 'absolute',
      right: 2,
      top: 3,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      borderWidth: active ? 2 : 1.6,
      borderColor: color,
      backgroundColor: active ? color : 'transparent',
    }} />
    <View style={{
      position: 'absolute',
      right: 1,
      bottom: 2,
      width: 10,
      height: 6,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
      borderWidth: active ? 2 : 1.6,
      borderBottomWidth: 0,
      borderColor: color,
    }} />
  </View>
);

const FollowupsNavIcon = ({ active, color }) => (
  <View style={{ width: 26, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Top Binder Pins */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 12, position: 'absolute', top: 1, zIndex: 2 }}>
      <View style={{ width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
    </View>
    {/* Calendar Box */}
    <View style={{
      width: 20,
      height: 17,
      borderRadius: 4.5,
      borderWidth: active ? 2.2 : 1.8,
      borderColor: color,
      backgroundColor: active ? '#F1F5F9' : 'transparent',
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 10, color: color, fontWeight: '900', marginTop: 1 }}>✓</Text>
    </View>
  </View>
);

const ShiftKpiNavIcon = ({ active, color }) => (
  <View style={{ width: 26, height: 22, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3, paddingBottom: 2 }}>
    {/* Rising Bar 1 */}
    <View style={{ width: active ? 4.2 : 3.8, height: 8, backgroundColor: color, borderRadius: 2 }} />
    {/* Rising Bar 2 */}
    <View style={{ width: active ? 4.2 : 3.8, height: 13, backgroundColor: color, borderRadius: 2 }} />
    {/* Rising Bar 3 */}
    <View style={{ width: active ? 4.2 : 3.8, height: 18, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

const SettingsNavIcon = ({ active, color }) => (
  <View style={{ width: 26, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Outer Gear Teeth */}
    <View style={{ position: 'absolute', width: 3.5, height: 18, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ position: 'absolute', width: 18, height: 3.5, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ position: 'absolute', width: 3.5, height: 18, backgroundColor: color, borderRadius: 1.5, transform: [{ rotate: '45deg' }] }} />
    <View style={{ position: 'absolute', width: 3.5, height: 18, backgroundColor: color, borderRadius: 1.5, transform: [{ rotate: '-45deg' }] }} />
    {/* Gear Body Circle */}
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FFFFFF',
        borderWidth: active ? 2.2 : 1.8,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Center Axle Hole */}
      <View
        style={{
          width: 4.5,
          height: 4.5,
          borderRadius: 2.25,
          backgroundColor: active ? color : 'transparent',
          borderWidth: active ? 0 : 1.5,
          borderColor: color,
        }}
      />
    </View>
  </View>
);

const FunnelIcon = ({ color = '#64748B' }) => (
  <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 15, height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 9, height: 2, backgroundColor: color, borderRadius: 1, marginTop: 3 }} />
    <View style={{ width: 4, height: 2, backgroundColor: color, borderRadius: 1, marginTop: 3 }} />
  </View>
);

const SECTIONS = [
  {
    id: 'contact',
    title: 'Profile & Contact',
    shortTitle: '1. Contact',
    icon: '👤',
    fieldNames: ['customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType'],
  },
  {
    id: 'requirements',
    title: 'Project Requirements',
    shortTitle: '2. Project',
    icon: '📐',
    fieldNames: ['houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement'],
  },
  {
    id: 'quotation',
    title: 'Quotation & Financials',
    shortTitle: '3. Quotation',
    icon: '💰',
    fieldNames: ['quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell'],
  },
  {
    id: 'followup',
    title: 'Follow-up & Notes',
    shortTitle: '4. Follow-up',
    icon: '📅',
    fieldNames: ['nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason'],
  },
];

// Professional Order Confirmed Celebration Modal Component
function OrderConfirmedCelebrationModal({ visible, customer, orderValue, onClose, branding }) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const confettiAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
      pulseAnim.setValue(1);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [visible]);

  if (!visible) return null;

  const customerData = customer ? (customer.data || customer) : null;
  const data = (customerData instanceof Map)
    ? Object.fromEntries(customerData)
    : (customerData || {});
  const name = data.customerName || 'Valued Client';
  const val = orderValue || data.orderValue || data.quotationValue;
  const phone = data.phone;

  const handleShareWhatsApp = () => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number is registered for this customer.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `🎉 *Order Confirmed - ${branding?.appName || 'Vasantham CRM'}*\n\nDear *${name}*,\n\nWe are delighted to confirm your order${val ? ` of *₹ ${Number(val).toLocaleString('en-IN')}*` : ''}!\n\nThank you for choosing ${branding?.appName || 'Vasantham Tiles & Sanitary Wares'}. Our delivery team is preparing your materials.`;
    const url = `whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`);
      })
      .catch(() => Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.celebrationOverlay, { opacity: opacityAnim }]}>
        {/* Animated Confetti Particles */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {CONFETTI_PIECES.map((piece, i) => {
            const translateY = confettiAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-40, 680 + (i * 15)],
            });
            const rotate = confettiAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${piece.rot}deg`],
            });
            const opacity = confettiAnim.interpolate({
              inputRange: [0, 0.1, 0.8, 1],
              outputRange: [0, 1, 1, 0],
            });

            return (
              <Animated.View
                key={piece.id}
                style={[
                  styles.confettiPiece,
                  {
                    left: `${piece.left}%`,
                    width: piece.width,
                    height: piece.height,
                    backgroundColor: piece.color,
                    borderRadius: piece.radius,
                    opacity,
                    transform: [{ translateY }, { rotate }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Center Celebration Card */}
        <Animated.View style={[styles.celebrationCard, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glowing Animated Trophy Circle */}
          <View style={styles.celebrationTrophyBox}>
            <Animated.View style={[styles.celebrationAura, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.celebrationTrophyCircle}>
              <Text style={{ fontSize: 44 }}>🏆</Text>
            </View>
          </View>

          {/* Deal Tag */}
          <View style={styles.celebrationBadgeChip}>
            <Text style={styles.celebrationBadgeChipText}>🎉 DEAL WON • ORDER BOOKED</Text>
          </View>

          <Text style={styles.celebrationMainTitle}>Order Confirmed!</Text>
          <Text style={styles.celebrationSubtitleText}>
            Congratulations! Order successfully registered and locked into pipeline.
          </Text>

          {/* Snapshot Summary Box */}
          <View style={styles.celebrationSnapshotCard}>
            <View style={styles.celebrationDataRow}>
              <Text style={styles.celebrationRowLabel}>Client</Text>
              <Text style={styles.celebrationRowValueBold} numberOfLines={1}>
                {name}
              </Text>
            </View>

            <View style={styles.celebrationDataRow}>
              <Text style={styles.celebrationRowLabel}>Customer ID</Text>
              <Text style={styles.celebrationIdText}>
                {customer?.customerId || 'CUS-LEAD'}
              </Text>
            </View>

            {val ? (
              <View style={[styles.celebrationDataRow, { borderBottomWidth: 0, paddingTop: 10 }]}>
                <Text style={styles.celebrationRowLabel}>Booking Amount</Text>
                <Text style={styles.celebrationAmountText}>
                  ₹ {Number(val).toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 10, width: '100%', marginTop: 6 }}>
            {phone ? (
              <TouchableOpacity
                style={styles.celebrationWhatsAppActionBtn}
                activeOpacity={0.8}
                onPress={handleShareWhatsApp}
              >
                <Text style={styles.celebrationWhatsAppActionBtnText}>💬 Share Receipt via WhatsApp</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.celebrationContinueBtn}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={styles.celebrationContinueBtnText}>✓ Continue to CRM</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function App() {
  // Mobile Startup Connection & Role Authentication State
  const [isPairedState, setIsPairedState] = useState(null); // null (checking) | true | false
  const [authRoleState, setAuthRoleState] = useState(null); // null (role select) | 'sales_executive' | 'customer'
  const [customerUserSession, setCustomerUserSession] = useState(null);

  const [activeScreen, setActiveScreen] = useState('list'); // 'list' | 'followups' | 'add' | 'detail'
  const [formSection, setFormSection] = useState('contact');
  const [formSchema, setFormSchema] = useState(FALLBACK_SCHEMA);
  const [branding, setBranding] = useState({
    appName: 'BuildCRM',
    appShortName: 'BuildCRM',
    tagline: 'Tiles & Sanitary Wares CRM',
    logoType: 'icon',
    logoIcon: 'Box',
    logoImage: '',
    primaryColor: '#2563EB',
  });
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [existingCustomerAlert, setExistingCustomerAlert] = useState(null);
  const [checkingMobilePhone, setCheckingMobilePhone] = useState(false);

  // Active Staff / Owner Profile State
  const [profiles, setProfiles] = useState(PROFILES);
  const [currentProfile, setCurrentProfile] = useState(PROFILES[0]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [ownerStaffFilter, setOwnerStaffFilter] = useState('all');

  // Follow-up Management State
  const [followups, setFollowups] = useState([]);
  const [followupCounts, setFollowupCounts] = useState({ today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0 });
  const [followupTab, setFollowupTab] = useState('today');
  const [followupTempFilter, setFollowupTempFilter] = useState('all');
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [loggingFollowupItem, setLoggingFollowupItem] = useState(null);
  const [markingLostItem, setMarkingLostItem] = useState(null);

  // Celebration Animation Modal State
  const [showOrderCelebration, setShowOrderCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [whatsAppModalCustomer, setWhatsAppModalCustomer] = useState(null);

  // Server IP & Diagnostic Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [serverHost, setServerHost] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConn, setTestingConn] = useState(false);

  // Daily KPI State
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpiStaff, setKpiStaff] = useState('');
  const [kpiVisits, setKpiVisits] = useState('0');
  const [kpiQuotes, setKpiQuotes] = useState('0');
  const [kpiOrders, setKpiOrders] = useState('0');
  const [kpiFollowups, setKpiFollowups] = useState('0');
  const [kpiTotalBills, setKpiTotalBills] = useState('0');
  const [kpiSalesValue, setKpiSalesValue] = useState('0');
  const [kpiOldCustomers, setKpiOldCustomers] = useState(false);
  const [kpiEngineerCalls, setKpiEngineerCalls] = useState(false);
  const [kpiCrossSell, setKpiCrossSell] = useState(false);
  const [kpiNotes, setKpiNotes] = useState('');
  const [submittingKpi, setSubmittingKpi] = useState(false);

  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadCustomers(text);
    }, 250);
  };

  // Initial connection check on app startup
  useEffect(() => {
    let isMounted = true;
    const checkInitialPairing = async () => {
      try {
        const checkRes = await apiClient.checkIsPairedAndOnline();
        if (checkRes && checkRes.isPaired) {
          if (checkRes.host) setServerHost(checkRes.host);
          if (isMounted) {
            setIsPairedState(true);
            setIsOnline(true);
            setShowQrScanner(false);
          }
          const savedRole = await apiClient.getSavedAuthRole();
          if (savedRole && isMounted) {
            setAuthRoleState(savedRole);
          }
        } else {
          // If connection is not made on startup, open scanner automatically
          if (isMounted) {
            setIsPairedState(false);
            setIsOnline(false);
            setShowQrScanner(true);
          }
        }
      } catch (e) {
        if (isMounted) {
          setIsPairedState(false);
          setIsOnline(false);
          setShowQrScanner(true);
        }
      }
    };
    checkInitialPairing();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConnectedServer = async (connectedHost) => {
    if (connectedHost) {
      setServerHost(connectedHost);
      await apiClient.setApiBase(connectedHost);
      await apiClient.setPairedStatus(true);
    }
    setIsPairedState(true);
    setIsOnline(true);
    setShowQrScanner(false);
    const savedRole = await apiClient.getSavedAuthRole();
    if (savedRole) {
      setAuthRoleState(savedRole);
    }
    await initData(true);
  };

  const handleSelectRole = ({ role, profile, customer, data }) => {
    setAuthRoleState(role);
    if (role === 'sales_executive' && profile) {
      setCurrentProfile(profile);
    } else if (role === 'customer') {
      setCustomerUserSession({
        customer,
        data,
        name: customer?.name,
        phone: customer?.phone,
        customerId: customer?.customerId,
      });
    }
  };

  const handleDisconnectServer = async () => {
    await apiClient.clearPairing();
    setIsPairedState(false);
    setAuthRoleState(null);
    setCustomerUserSession(null);
  };

  const handleLogoutRole = async () => {
    await apiClient.setSavedAuthRole(null);
    setAuthRoleState(null);
    setCustomerUserSession(null);
  };

  // Periodic Device Heartbeat Registration on Desktop Server
  useEffect(() => {
    apiClient.sendDeviceHeartbeat(currentProfile, 'Mobile CRM Online');

    const interval = setInterval(() => {
      if (isOnline) {
        apiClient.sendDeviceHeartbeat(currentProfile, 'Active Session');
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [currentProfile, isOnline]);

  const loadBranding = useCallback(async () => {
    try {
      const b = await apiClient.getBranding();
      if (b && b.appName) {
        setBranding(b);
      }
    } catch (e) {
      console.warn('Branding fetch warning:', e.message);
    }
  }, []);

  const loadFormSchema = useCallback(async () => {
    try {
      const schema = await apiClient.getActiveForm();
      if (schema && schema.fields && schema.fields.length > 0) {
        const uniqueFields = schema.fields.filter(
          (f, idx, self) => self.findIndex((x) => x.name === f.name) === idx
        );
        setFormSchema({ ...schema, fields: uniqueFields });
        setIsOnline(true);
      }
    } catch (e) {
      console.warn('Schema fetch warning:', e.message);
      setIsOnline(false);
    }
  }, []);

  const loadCustomers = useCallback(async (searchQuery = '') => {
    try {
      const list = await apiClient.getCustomers(searchQuery);
      const safeList = list || [];
      setCustomers(safeList);
      if (safeList.length === 0 && !searchQuery) {
        setFollowups([]);
        setFollowupCounts({ today: 0, upcoming: 0, overdue: 0, hot: 0, total: 0, totalPipelineValue: 0 });
      }
      setIsOnline(true);
    } catch (e) {
      console.warn('Customers fetch warning:', e.message);
      setIsOnline(false);
    }
  }, []);

  const loadFollowups = useCallback(async (
    tab = followupTab,
    temp = 'all',
    staff = (currentProfile?.role === 'owner' ? 'all' : (currentProfile?.name || 'all'))
  ) => {
    setLoadingFollowups(true);
    try {
      const params = { tab };
      if (temp && temp !== 'all') params.temperature = temp;
      if (staff && staff !== 'all') params.salesperson = staff;
      const res = await apiClient.getFollowupsList(params);
      if (res && res.success) {
        // Ensure lost sales are hidden from the active follow-up queue
        const activeList = (res.data || []).filter((f) => {
          const s = (f.status || '').toLowerCase();
          return !s.includes('lost');
        });
        setFollowups(activeList);
        if (res.counts) setFollowupCounts(res.counts);
        if (res.offline !== undefined) {
          setIsOnline(!res.offline);
        }
      }
    } catch (e) {
      console.warn('Follow-ups fetch warning:', e.message);
    } finally {
      setLoadingFollowups(false);
    }
  }, [followupTab, currentProfile]);

  const loadStaffProfiles = useCallback(async () => {
    try {
      const res = await apiClient.getUsers();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const rawUsers = res.data;
        const colorPalette = [
          { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
          { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
          { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
          { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
          { color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
          { color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
        ];

        const mappedProfiles = [];

        // 1. Ensure Showroom Owner is at the top
        const ownerUser = rawUsers.find((u) => u.role === 'owner');
        mappedProfiles.push({
          id: ownerUser ? ownerUser._id : 'owner',
          name: ownerUser ? ownerUser.name : 'Showroom Owner',
          email: ownerUser ? ownerUser.email : 'owner@vasantham.com',
          role: 'owner',
          icon: '👑',
          roleTitle: 'Showroom Owner',
          subtitle: 'All Showroom Leads & Team Control',
          color: '#D97706',
          bg: '#FEF3C7',
          border: '#FDE68A',
        });

        // 2. Add all active employees
        const employeeUsers = rawUsers.filter((u) => u.role !== 'owner' && u.active !== false);
        employeeUsers.forEach((u, idx) => {
          const theme = colorPalette[idx % colorPalette.length];
          mappedProfiles.push({
            id: u._id,
            name: u.name,
            email: u.email,
            role: 'employee',
            icon: '👤',
            roleTitle: 'Sales Executive',
            subtitle: u.phone ? `📞 ${u.phone}` : 'Assigned Pipeline',
            color: theme.color,
            bg: theme.bg,
            border: theme.border,
          });
        });

        setProfiles(mappedProfiles);

        // If current profile was updated or deleted
        setCurrentProfile((prev) => {
          if (!prev) return mappedProfiles[0];
          const matched = mappedProfiles.find(
            (p) => p.id === prev.id || p.email === prev.email || p.name === prev.name
          );
          if (!matched) return mappedProfiles[0];
          if (prev.id === matched.id && prev.name === matched.name && prev.role === matched.role) {
            return prev;
          }
          return matched;
        });

        // Dynamically update salesperson options in form schema
        const staffOptions = employeeUsers.map((u) => ({ label: u.name, value: u.name }));
        if (staffOptions.length > 0) {
          setFormSchema((prevSchema) => {
            if (!prevSchema || !prevSchema.fields) return prevSchema;
            const updatedFields = prevSchema.fields.map((field) => {
              if (field.name === 'salesperson') {
                return {
                  ...field,
                  options: staffOptions,
                };
              }
              return field;
            });
            return { ...prevSchema, fields: updatedFields };
          });
        }
      }
    } catch (e) {
      console.warn('Staff profiles fetch warning:', e.message);
    }
  }, []);

  const initData = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    try {
      const results = await Promise.allSettled([
        loadBranding(),
        loadFormSchema(),
        loadStaffProfiles(),
        loadCustomers(),
        loadFollowups(),
      ]);
      const anySuccess = results.some((r) => r.status === 'fulfilled');
      setIsOnline(anySuccess);
    } catch (err) {
      console.warn('Background sync warning:', err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [loadBranding, loadFormSchema, loadStaffProfiles, loadCustomers, loadFollowups]);

  useEffect(() => {
    // 1. Fetch live data from backend server on initial app startup
    initData(true);

    // 2. Auto-sync whenever the app is opened or brought back into foreground
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        initData(false);
      }
    });

    // 3. Periodic background sync polling every 15s to capture real-time desktop updates / wipes
    const pollInterval = setInterval(() => {
      initData(false);
    }, 15000);

    return () => {
      appStateSub.remove();
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  // When profile changes, re-fetch followups for that staff member
  const currentStaffKey = `${currentProfile?.role}_${currentProfile?.id || currentProfile?.name || 'all'}`;
  useEffect(() => {
    loadFollowups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStaffKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        loadBranding(),
        loadFormSchema(),
        loadStaffProfiles(),
        loadCustomers(search),
        loadFollowups(),
      ]);
      const anySuccess = results.some((r) => r.status === 'fulfilled');
      setIsOnline(anySuccess);
    } catch (err) {
      console.warn('Pull-to-refresh note:', err.message);
      setIsOnline(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectCustomer = (item) => {
    setSelectedCustomer(item);
    setActiveScreen('detail');
  };

  const openWhatsApp = (phoneOrCustomer, customerName = '', requirement = '', extraInfo = {}) => {
    if (typeof phoneOrCustomer === 'object' && phoneOrCustomer !== null) {
      setWhatsAppModalCustomer(phoneOrCustomer);
      return;
    }

    let phone = '';
    let name = '';
    let req = '';
    let customerId = '';
    let approxQuantity = '';
    let quotationValue = '';
    let tileBudget = '';
    let sanitaryRequirement = '';
    let adhesiveRequirement = '';
    let salesperson = '';
    let nextFollowUp = '';
    let status = '';

    if (typeof phoneOrCustomer === 'object' && phoneOrCustomer !== null) {
      const c = phoneOrCustomer;
      const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
      phone = d.phone || c.phone || '';
      name = d.customerName || c.customerName || '';
      customerId = d.customerId || c.customerId || '';
      req = d.requirement || c.requirement || '';
      approxQuantity = d.approxQuantity || c.approxQuantity || '';
      quotationValue = d.quotationValue || c.quotationValue || '';
      tileBudget = d.tileBudget || c.tileBudget || '';
      sanitaryRequirement = d.sanitaryRequirement || c.sanitaryRequirement || '';
      adhesiveRequirement = d.adhesiveRequirement || c.adhesiveRequirement || '';
      salesperson = d.salesperson || c.salesperson || currentProfile?.name || '';
      nextFollowUp = d.nextFollowUp || c.nextFollowUp || '';
      status = d.status || c.status || '';
    } else {
      phone = phoneOrCustomer || '';
      name = customerName || '';
      req = requirement || '';
      if (typeof extraInfo === 'object' && extraInfo !== null) {
        customerId = extraInfo.customerId || '';
        approxQuantity = extraInfo.approxQuantity || '';
        quotationValue = extraInfo.quotationValue || '';
        tileBudget = extraInfo.tileBudget || '';
        sanitaryRequirement = extraInfo.sanitaryRequirement || '';
        adhesiveRequirement = extraInfo.adhesiveRequirement || '';
        salesperson = extraInfo.salesperson || currentProfile?.name || '';
        nextFollowUp = extraInfo.nextFollowUp || '';
        status = extraInfo.status || '';
      }
    }

    if (!phone) {
      Alert.alert('No Phone Number', 'This customer record does not have a phone number.');
      return;
    }
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please provide a valid 10-digit mobile number.');
      return;
    }
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const brandName = branding.appName || branding.appShortName || 'BuildCRM Showroom';
    const brandTagline = branding.tagline || 'Excellence in Tiles & Sanitary Solutions';

    // Construct professional, structured showroom business message
    const lines = [
      `🏛️ *${brandName}*`,
      `✨ _${brandTagline}_`,
      '',
      `Dear *${name || 'Valued Customer'}*${customerId ? ` (Ref: #${customerId})` : ''},`,
      '',
      `Thank you for connecting with *${brandName}*! Here is the summary of your project & inquiry details:`,
      '',
    ];

    if (req) {
      lines.push(`📌 *Tile Requirements:* ${req}${approxQuantity ? ` (${approxQuantity} sq.ft)` : ''}`);
    }
    if (sanitaryRequirement) {
      lines.push(`🚿 *Sanitary Ware:* ${sanitaryRequirement}`);
    }
    if (adhesiveRequirement) {
      lines.push(`🧱 *Adhesives & Grouts:* ${adhesiveRequirement}`);
    }
    if (quotationValue && Number(quotationValue) > 0) {
      lines.push(`💰 *Quotation Shared:* ₹${Number(quotationValue).toLocaleString('en-IN')}`);
    } else if (tileBudget && Number(tileBudget) > 0) {
      lines.push(`💵 *Estimated Budget:* ₹${Number(tileBudget).toLocaleString('en-IN')}`);
    }
    if (status) {
      lines.push(`🏷️ *Current Stage:* ${status}`);
    }
    if (nextFollowUp) {
      lines.push(`📅 *Next Follow-up / Appointment:* ${nextFollowUp}`);
    }
    if (salesperson) {
      lines.push(`👨‍💼 *Dedicated Sales Representative:* ${salesperson}`);
    }

    lines.push('');
    lines.push(`We invite you to experience our live showroom displays and premium mockups.`);
    lines.push(`Please feel free to reply directly here for samples, catalogue links, or pricing inquiries.`);
    lines.push('');
    lines.push(`Warm regards,`);
    lines.push(`*${brandName} Team*`);

    const textMsg = lines.join('\n');
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMsg)}`;
    Linking.openURL(waUrl).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(textMsg)}`);
    });
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnectionStatus(null);
    const res = await apiClient.testConnection(serverHost);
    setTestingConn(false);
    if (res.success) {
      setConnectionStatus({ success: true, message: 'Connected to Desktop Server!' });
      setIsOnline(true);
      setIsPairedState(true);
      setShowQrScanner(false);
      await apiClient.setApiBase(res.host || serverHost);
      await apiClient.setPairedStatus(true);
      await loadFormSchema();
      await loadCustomers();
      await loadBranding();
      await loadStaffProfiles();
    } else {
      setConnectionStatus({
        success: false,
        message: `Could not connect: ${res.error || 'Server unreachable'}. Verify your PC is on the same Wi-Fi.`,
      });
      setIsOnline(false);
    }
  };

  const handleQrConnected = async (scannedUrl) => {
    setServerHost(scannedUrl);
    await apiClient.setApiBase(scannedUrl);
    await apiClient.setPairedStatus(true);
    setIsPairedState(true);
    setIsOnline(true);
    setShowQrScanner(false);
    setShowSettingsModal(false);
    setConnectionStatus({ success: true, message: `Connected to Desktop Server at ${scannedUrl}!` });
    apiClient.sendDeviceHeartbeat(currentProfile, 'Paired via QR Code');
    Alert.alert(
      '🎉 Paired Successfully!',
      `Mobile CRM is now connected to your Desktop server at:\n${scannedUrl}\n\nConnection saved. You will connect automatically next time!`,
      [{ text: 'Great!', style: 'default' }]
    );
    await initData(true);
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setConnectionStatus({ success: false, message: '🔍 Scanning local Wi-Fi subnets for Desktop CRM...' });
    try {
      const res = await apiClient.autoDetectServer((statusText) => {
        setConnectionStatus({ success: false, message: statusText });
      });
      if (res.success) {
        setServerHost(res.host);
        await apiClient.setApiBase(res.host);
        await apiClient.setPairedStatus(true);
        setIsOnline(true);
        setIsPairedState(true);
        setShowQrScanner(false);
        setShowSettingsModal(false);
        setConnectionStatus({ success: true, message: `✓ Found Desktop CRM at ${res.host}!` });
        apiClient.sendDeviceHeartbeat(currentProfile, 'Auto-Discovered & Paired');
        Alert.alert(
          '🎯 Desktop Server Discovered!',
          `Automatically connected to CRM server at:\n${res.host}\n\nConnection saved!`,
          [{ text: 'Sync Now', onPress: () => initData(true) }]
        );
        await initData(true);
      } else {
        setConnectionStatus({ success: false, message: res.error || 'Desktop server not found on Wi-Fi.' });
        Alert.alert(
          '📡 Auto-Detection Result',
          'Could not find the Desktop server on this subnet. Please open Desktop CRM and scan the pairing QR code.',
          [
            { text: 'Scan QR Code', onPress: () => { setShowSettingsModal(false); setShowQrScanner(true); } },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (e) {
      setConnectionStatus({ success: false, message: e.message || 'Auto-detection failed.' });
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'phone') {
      const clean = String(value).replace(/[^0-9]/g, '');
      if (clean.length >= 10) {
        setCheckingMobilePhone(true);
        apiClient.lookupCustomerByPhone(clean)
          .then((res) => {
            setCheckingMobilePhone(false);
            if (res && res.success && res.exists && res.customer) {
              setExistingCustomerAlert(res.customer);
            } else {
              setExistingCustomerAlert(null);
            }
          })
          .catch(() => {
            setCheckingMobilePhone(false);
          });
      } else {
        setExistingCustomerAlert(null);
      }
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCreateCustomer = async () => {
    const activeFields = (formSchema?.fields || []).filter((f) => f.active);
    const newErrors = {};

    const payload = {
      ...formData,
      entryDate: formData.entryDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'Newly Contacted',
      customerType: formData.customerType || 'Building Owner',
      salesperson: formData.salesperson || (currentProfile.role === 'employee' ? currentProfile.name : (profiles.find((p) => p.role === 'employee')?.name || '')),
    };

    let firstFailingSection = null;

    activeFields.forEach((field) => {
      const val = payload[field.name];
      const isMissing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (field.required && isMissing && field.type !== 'auto_number') {
        newErrors[field.name] = `${field.label || field.name} is required`;
        if (!firstFailingSection) {
          const sec = SECTIONS.find((s) => s.fieldNames.includes(field.name));
          if (sec) firstFailingSection = sec.id;
        }
      }

      // Phone digit validation if provided
      if (field.name === 'phone' && val) {
        const clean = String(val).replace(/[^0-9]/g, '');
        if (clean.length < 10) {
          newErrors[field.name] = 'Mobile number must contain at least 10 digits';
          if (!firstFailingSection) firstFailingSection = 'contact';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (firstFailingSection) {
        setFormSection(firstFailingSection);
      }
      const errorList = Object.values(newErrors).join('\n• ');
      Alert.alert('Required Fields Missing', `Please fill in the highlighted fields:\n• ${errorList}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.createCustomer(payload);
      if (res && res.success && res.data) {
        if (payload.status === 'Order Confirmed') {
          setCelebrationData({
            customer: res.data,
            orderValue: payload.orderValue || payload.quotationValue || payload.tileBudget,
          });
          setShowOrderCelebration(true);
        } else {
          Alert.alert(
            '✓ Customer Registered',
            `Lead #${res.data?.customerId || 'New'} for "${payload.customerName || 'Customer'}" successfully saved to MongoDB Atlas.`
          );
        }
        setFormData({});
        setErrors({});
        setExistingCustomerAlert(null);
        setActiveScreen('list');
        await loadCustomers();
        await loadFollowups();
      } else {
        const isConnErr = (res?.message || '').toLowerCase().includes('connection') || (res?.message || '').toLowerCase().includes('network');
        if (isConnErr) {
          Alert.alert(
            '📡 Server Connection Error',
            `Could not reach the CRM backend server to register "${payload.customerName || 'Lead'}". Your form entries have been preserved safely.\n\nPlease check your Wi-Fi or server IP in Settings.`,
            [
              { text: 'Server Settings', onPress: () => setShowSettingsModal(true) },
              { text: 'Try Again', onPress: handleCreateCustomer },
              { text: 'OK', style: 'cancel' },
            ]
          );
        } else {
          const serverErrors = res?.errors || {};
          if (Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
            const firstErrKey = Object.keys(serverErrors)[0];
            const sec = SECTIONS.find((s) => s.fieldNames.includes(firstErrKey));
            if (sec) setFormSection(sec.id);
          }
          const errorDetails = Object.keys(serverErrors).length > 0
            ? Object.values(serverErrors).join('\n• ')
            : (res?.message || 'Could not register customer');
          Alert.alert('Registration Failed', `Validation message:\n• ${errorDetails}`);
        }
      }
    } catch (e) {
      Alert.alert(
        '📡 Network Error',
        `Connection failed: ${e.message}. Your form entries have been preserved safely.`,
        [
          { text: 'Server Settings', onPress: () => setShowSettingsModal(true) },
          { text: 'Try Again', onPress: handleCreateCustomer },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadTodayMobileKpi = async (targetStaff = null) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const defaultStaff = profiles.find((p) => p.role === 'employee')?.name || '';
      const staffParam = targetStaff || (currentProfile.role === 'employee' ? currentProfile.name : (kpiStaff || defaultStaff));
      const res = await apiClient.getKPIAutoFill({ date: today, staffName: staffParam });
      if (res && res.success && res.data) {
        const auto = res.data.autoValues || {};
        setKpiVisits(String(auto.walkins?.visits || 0));
        setKpiQuotes(String(auto.walkins?.quotes || 0));
        setKpiOrders(String(auto.walkins?.orders || 0));
        setKpiFollowups(String(auto.followUpsCount || 0));
        setKpiTotalBills(String(auto.ordersCount || 0));
        setKpiSalesValue(String(auto.salesValue || 0));
        setKpiOldCustomers(Boolean(auto.oldCustomers));
        setKpiEngineerCalls(Boolean(auto.engineerCalls));
        setKpiCrossSell(Boolean(auto.crossSell));
      }
    } catch (e) {
      console.warn('KPI auto-fetch error:', e.message);
    }
  };

  const activeFields = (formSchema?.fields || []).filter((f) => f.active);

  // Filter customers by employee (for Owner) or type (for Employee), lost leads hidden
  const filteredCustomers = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
    
    // Hide lost leads from active mobile list
    const status = (d.status || c.status || '').toLowerCase();
    if (status.includes('lost')) return false;

    // For Owner: Filter based on the selected employee/salesperson
    if (currentProfile.role === 'owner') {
      if (ownerStaffFilter !== 'all') {
        return (d.salesperson || '').toLowerCase().includes(ownerStaffFilter.toLowerCase());
      }
      return true;
    }

    // For Employee: Filter by assigned leads and customer type
    if (currentProfile.role === 'employee') {
      const isAssigned = (d.salesperson || '').toLowerCase().includes(currentProfile.name.toLowerCase());
      if (!isAssigned) return false;
      if (typeFilter !== 'all' && d.customerType !== typeFilter) return false;
      return true;
    }

    return true;
  });

  // Calculate Metrics from active non-lost pipeline
  const totalPipeline = customers.reduce((acc, c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
    const s = (d.status || c.status || '').toLowerCase();
    if (s.includes('lost')) return acc;
    return acc + (Number(d.quotationValue) || Number(d.tileBudget) || 0);
  }, 0);

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'Building Owner': return { bg: colors.emeraldBg, text: colors.emerald, border: colors.emeraldBorder };
      case 'Architect': return { bg: colors.blueBg, text: colors.blue, border: colors.blueBorder };
      case 'Mason': return { bg: colors.purpleBg, text: colors.purple, border: colors.purpleBorder };
      default: return { bg: colors.goldBg, text: colors.gold, border: colors.goldBorder };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Order Confirmed':
        return { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', dot: '#16A34A', icon: '🎉' };
      case 'Negotiation':
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', dot: '#D97706', icon: '🤝' };
      case 'Quotation':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', dot: '#2563EB', icon: '📄' };
      case 'Follow-up':
        return { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', dot: '#4F46E5', icon: '📞' };
      case 'Newly Contacted':
        return { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', dot: '#0284C7', icon: '✨' };
      case 'Walk-in':
        return { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E', dot: '#0D9488', icon: '🚶' };
      case 'Lost':
        return { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', dot: '#64748B', icon: '✕' };
      case 'Future Requirement':
        return { bg: '#FAF5FF', border: '#DDD6FE', text: '#7E22CE', dot: '#9333EA', icon: '⏳' };
      default:
        return { bg: '#F8FAFC', border: '#E2E8F0', text: '#334155', dot: '#64748B', icon: '●' };
    }
  };

  const currentSectionIndex = SECTIONS.findIndex((s) => s.id === formSection);

  // 1. Loading check on app startup
  if (isPairedState === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 14, fontSize: 14, fontWeight: '700', color: '#475569' }}>
          Checking Desktop Server Connection...
        </Text>
      </View>
    );
  }

  // 2. If NOT paired/connected to Desktop -> Show Minimalist QR Scanner Directly
  if (isPairedState === false) {
    return (
      <MobileQrScannerModal
        visible={true}
        isMainScreen={true}
        onConnected={handleConnectedServer}
      />
    );
  }

  // 3. If Paired but NO Role Selected -> Show Role Select / Login Gate
  if (authRoleState === null) {
    return (
      <>
        <RoleSelectLoginScreen
          onSelectRole={handleSelectRole}
          onDisconnectServer={handleDisconnectServer}
          serverHost={serverHost}
        />
        <MobileQrScannerModal
          visible={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onConnected={handleConnectedServer}
        />
      </>
    );
  }

  // 4. Customer Role -> Render Customer Portal View
  if (authRoleState === 'customer') {
    return (
      <CustomerPortalView
        customerInfo={customerUserSession}
        onLogoutRole={handleLogoutRole}
        branding={branding}
      />
    );
  }

  // 5. Sales Executive Role -> Render Full CRM Application
  return (
    <SafeAreaProvider>
      <View style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />

      {/* Top Universal Showroom Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Line-Art Minimalist Menu Button */}
          <TouchableOpacity
            style={styles.headerHamburgerBtn}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.hamburgerLine} />
            <View style={[styles.hamburgerLine, { width: 12 }]} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>

          {/* Premium Squircle Brand Logo */}
          <View
            style={[
              styles.brandBadge,
              branding.logoImage && branding.logoImage.trim() !== ''
                ? { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 2 }
                : { backgroundColor: branding.primaryColor || '#0F172A' },
            ]}
          >
            {branding.logoImage && branding.logoImage.trim() !== '' ? (
              <Image
                source={{ uri: branding.logoImage }}
                style={styles.brandBadgeLogoImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.brandBadgeText}>
                {getBrandingIconEmoji(branding.logoIcon)}
              </Text>
            )}
          </View>

          {/* Brand Title & Live Online Status Capsule */}
          <View style={{ justifyContent: 'center', flexShrink: 1, marginLeft: 9 }}>
            <Text style={styles.headerBrandTitle} numberOfLines={1}>
              {branding.appShortName || branding.appName || 'Vasantham'}
            </Text>
            <TouchableOpacity
              style={[
                styles.headerStatusPill,
                isOnline ? styles.headerStatusPillOnline : styles.headerStatusPillOffline,
              ]}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <View style={[styles.onlineDot, !isOnline && { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.onlineStatusText, !isOnline && { color: '#B91C1C' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Profile Switcher Capsule */}
          <TouchableOpacity
            style={styles.headerProfilePill}
            onPress={() => {
              loadStaffProfiles();
              setShowProfileModal(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.profileAvatarMini}>
              <Text style={{ fontSize: 11 }}>{currentProfile.icon || '👑'}</Text>
            </View>
            <Text style={styles.headerProfilePillText} numberOfLines={1}>
              {currentProfile.name.split(' ')[0]}
            </Text>
            <Text style={styles.headerProfileDropdownIcon}>▾</Text>
          </TouchableOpacity>

          {activeScreen === 'add' || activeScreen === 'detail' ? (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setActiveScreen('list')}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBackBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Offline Disconnected Alert Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 13 }}>⚠️</Text>
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Offline ({serverHost ? serverHost.replace('http://', '').replace('/api', '') : 'No Server'})
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={styles.offlineBannerQrBtn}
              onPress={() => setShowQrScanner(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.offlineBannerQrBtnText}>📷 Scan QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offlineBannerActionBtn}
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.offlineBannerAction}>⚙️ Fix IP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeScreen === 'list' && (
        <View style={styles.screenBody}>

          {/* ── Search Bar ── */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, phone, ID…"
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={handleSearchChange}
              />
              {search ? (
                <TouchableOpacity
                  onPress={() => { setSearch(''); loadCustomers(''); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.searchClearBtn}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '800' }}>✕</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => { loadStaffProfiles(); setShowProfileModal(true); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <FunnelIcon color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Stat Tiles ── */}
          {(() => {
            const isOwner = currentProfile.role === 'owner';
            const roleCustomers = isOwner
              ? customers
              : customers.filter((c) => {
                  const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
                  return (d.salesperson || '').toLowerCase().includes(currentProfile.name.toLowerCase());
                });
            const displayPipeline = roleCustomers.reduce((sum, c) => {
              const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
              const val = Number(d.orderValue || d.quotationValue || d.tileBudget || 0);
              return sum + (isNaN(val) ? 0 : val);
            }, 0);
            const urgentCount = followupCounts.overdue + followupCounts.today;
            const pipelineStr = displayPipeline >= 100000
              ? `₹${(displayPipeline / 100000).toFixed(1)}L`
              : `₹${displayPipeline.toLocaleString('en-IN')}`;
            return (
              <View style={styles.statTileRow}>
                <View style={styles.statTile}>
                  <Text style={styles.statTileIcon}>💰</Text>
                  <Text style={styles.statTileValue} numberOfLines={1}>{pipelineStr}</Text>
                  <Text style={styles.statTileLabel}>{isOwner ? 'Pipeline' : 'My Pipeline'}</Text>
                </View>
                <View style={[styles.statTile, styles.statTileAccentBlue]}>
                  <Text style={styles.statTileIcon}>👥</Text>
                  <Text style={[styles.statTileValue, styles.statTileValueBlue]}>{roleCustomers.length}</Text>
                  <Text style={styles.statTileLabel}>{isOwner ? 'Active Leads' : 'My Leads'}</Text>
                </View>
                <View style={[styles.statTile, urgentCount > 0 ? styles.statTileAccentRed : styles.statTileAccentGray]}>
                  <Text style={styles.statTileIcon}>{urgentCount > 0 ? '🔥' : '📞'}</Text>
                  <Text style={[styles.statTileValue, urgentCount > 0 ? styles.statTileValueRed : styles.statTileValueGray]}>{urgentCount}</Text>
                  <Text style={styles.statTileLabel}>
                    {urgentCount > 0
                      ? (followupCounts.overdue > 0 ? `${followupCounts.overdue} Overdue` : 'Due Today')
                      : 'Due Calls'}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* ── Filter Tab Bar ── */}
          <View style={styles.filterTabBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabBarContent}>
              {currentProfile.role === 'owner' ? (
                ['all', ...profiles.filter((p) => p.role === 'employee').map((p) => p.name)].map((staff) => {
                  const isSelected = ownerStaffFilter === staff;
                  const count = staff === 'all'
                    ? customers.filter((c) => {
                        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
                        return !(d.status || c.status || '').toLowerCase().includes('lost');
                      }).length
                    : customers.filter((c) => {
                        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
                        const s = (d.status || c.status || '').toLowerCase();
                        return !s.includes('lost') && (d.salesperson || '').toLowerCase().includes(staff.toLowerCase());
                      }).length;
                  return (
                    <TouchableOpacity
                      key={staff}
                      onPress={() => setOwnerStaffFilter(staff)}
                      style={[styles.filterTab, isSelected && styles.filterTabActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                        {staff === 'all' ? 'All Staff' : staff.split(' ')[0]}
                      </Text>
                      <View style={[styles.filterTabBadge, isSelected && styles.filterTabBadgeActive]}>
                        <Text style={[styles.filterTabBadgeText, isSelected && styles.filterTabBadgeTextActive]}>{count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                [['all', 'All', ''], ['Building Owner', 'Owner', '🏢'], ['Architect', 'Architect', '📐'], ['Mason', 'Mason', '🧱']].map(([type, label, icon]) => {
                  const isSelected = typeFilter === type;
                  const count = type === 'all'
                    ? filteredCustomers.length
                    : customers.filter((c) => {
                        const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || c);
                        const s = (d.status || c.status || '').toLowerCase();
                        return !s.includes('lost')
                          && d.customerType === type
                          && (d.salesperson || '').toLowerCase().includes(currentProfile.name.toLowerCase());
                      }).length;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTypeFilter(type)}
                      style={[styles.filterTab, isSelected && styles.filterTabActive]}
                      activeOpacity={0.75}
                    >
                      {icon ? <Text style={{ fontSize: 12, marginRight: 4 }}>{icon}</Text> : null}
                      <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>{label}</Text>
                      <View style={[styles.filterTabBadge, isSelected && styles.filterTabBadgeActive]}>
                        <Text style={[styles.filterTabBadgeText, isSelected && styles.filterTabBadgeTextActive]}>{count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* ── Customer List ── */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching showroom database...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item, index) => item._id || String(index)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 110 }}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>{isOnline ? '📋' : '📡'}</Text>
                  <Text style={styles.emptyTitle}>
                    {isOnline ? (search ? 'No Matches Found' : 'No Customers Yet') : 'Cannot Reach Server'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {isOnline
                      ? (search ? `No results for "${search}"` : 'Tap + below to register your first customer.')
                      : `Check that Desktop CRM is running on your Wi-Fi network.`}
                  </Text>
                  {!isOnline && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <TouchableOpacity
                        style={[styles.retryConnectionBtn, { backgroundColor: '#2563EB' }]}
                        onPress={() => setShowQrScanner(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.retryConnectionBtnText}>📷 Scan QR Code</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.retryConnectionBtn, { backgroundColor: '#0F172A' }]}
                        onPress={() => setShowSettingsModal(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.retryConnectionBtnText}>⚙️ Server IP</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const data = item.data instanceof Map ? Object.fromEntries(item.data) : (item.data || item);
                const initial = (data.customerName || 'C').charAt(0).toUpperCase();
                const statusStyle = getStatusBadgeStyle(data.status);
                const phone = data.mobilePhone || data.phone || '';
                const customerType = data.customerType || '';

                return (
                  <TouchableOpacity
                    style={styles.leadCard}
                    activeOpacity={0.72}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    {/* Avatar */}
                    <View style={[styles.leadAvatar, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.leadAvatarText, { color: statusStyle.dot }]}>{initial}</Text>
                    </View>

                    {/* Info block */}
                    <View style={styles.leadInfoCol}>
                      <Text style={styles.leadName} numberOfLines={1}>
                        {data.customerName || 'Unnamed Customer'}
                      </Text>
                      <View style={styles.leadMetaRow}>
                        {customerType ? (
                          <View style={styles.leadTypeBadge}>
                            <Text style={styles.leadTypeBadgeText}>{customerType}</Text>
                          </View>
                        ) : null}
                        {phone ? (
                          <Text style={styles.leadPhone} numberOfLines={1}>{phone}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.leadIdText}>#{item.customerId || 'CUS-000000'}</Text>
                    </View>

                    {/* Right — status + chevron */}
                    <View style={styles.leadRightGroup}>
                      <View style={[styles.leadStatusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                        <View style={[styles.leadStatusDot, { backgroundColor: statusStyle.dot }]} />
                        <Text style={[styles.leadStatusText, { color: statusStyle.text }]}>
                          {formatStatusLabel(data.status)}
                        </Text>
                      </View>
                      <Text style={styles.leadChevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Screen: Follow-up & Lead Nurturing Hub */}
      {activeScreen === 'followups' && (
        <MobileFollowupSheet
          followups={followups}
          customers={customers}
          counts={followupCounts}
          loading={loadingFollowups}
          refreshing={refreshing}
          onRefresh={onRefresh}
          activeTab={followupTab}
          onTabChange={(tab) => {
            setFollowupTab(tab);
            loadFollowups(tab);
          }}
          currentProfile={currentProfile}
          onLogActivity={(item) => setLoggingFollowupItem(item)}
          onRecordLost={(item) => setMarkingLostItem(item)}
          openWhatsApp={openWhatsApp}
          isOnline={isOnline}
        />
      )}

      {/* Screen: Customer Add Form */}
      {activeScreen === 'add' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.screenBody}>
            {/* Top Form Header Bar */}
            <View style={styles.formTopHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.formHeaderIconCircle}>
                  <Text style={{ fontSize: 14 }}>📝</Text>
                </View>
                <View>
                  <Text style={styles.formHeaderTitle}>Add New Customer</Text>
                  <Text style={styles.formHeaderSub}>{branding.appName || 'Vasantham CRM'} • Step {currentSectionIndex + 1} of {SECTIONS.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.formCloseBtn}
                onPress={() => setActiveScreen('list')}
                activeOpacity={0.75}
              >
                <Text style={styles.formCloseBtnText}>✕ Exit</Text>
              </TouchableOpacity>
            </View>

            {/* Form Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((currentSectionIndex + 1) / SECTIONS.length) * 100}%` },
                ]}
              />
            </View>

            {/* Section Step Chips */}
            <View style={styles.sectionTabBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
                {SECTIONS.map((sec, idx) => {
                  const isActive = sec.id === formSection;
                  const isCompleted = idx < currentSectionIndex;

                  return (
                    <TouchableOpacity
                      key={sec.id}
                      onPress={() => setFormSection(sec.id)}
                      style={[
                        styles.sectionTabChip,
                        isActive && styles.sectionTabChipActive,
                        isCompleted && styles.sectionTabChipCompleted,
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.sectionTabChipText,
                          isActive && styles.sectionTabChipTextActive,
                          isCompleted && styles.sectionTabChipTextCompleted,
                        ]}
                      >
                        {isCompleted ? '✓ ' : ''}{sec.shortTitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active Section Form Fields */}
            <ScrollView
              style={styles.formScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Banner of Active Section */}
              <View style={styles.sectionBannerBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.sectionBannerTitle}>
                    {SECTIONS[currentSectionIndex]?.icon}{' '}
                    {SECTIONS[currentSectionIndex]?.title}
                  </Text>
                  <View style={styles.sectionStepCounterBadge}>
                    <Text style={styles.sectionStepCounterText}>
                      Step {currentSectionIndex + 1} of {SECTIONS.length}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionBannerSubtitle}>
                  Please fill the required details below to record this lead.
                </Text>
              </View>

              {/* Real-time Existing Customer Auto-Detection Banner */}
              {existingCustomerAlert && (
                <View style={styles.existingCustomerBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 22 }}>🔄</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.existingCustomerBannerTitle}>
                        Existing Customer Detected!
                      </Text>
                      <Text style={styles.existingCustomerBannerSubtitle} numberOfLines={1}>
                        {existingCustomerAlert.customerName} (#{existingCustomerAlert.customerId}) • {existingCustomerAlert.customerType}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.autoFillProfileBtn}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        customerName: existingCustomerAlert.customerName || prev.customerName,
                        customerType: existingCustomerAlert.customerType || prev.customerType,
                        location: existingCustomerAlert.location || prev.location,
                        leadSource: 'Existing Customer',
                        salesperson: existingCustomerAlert.salesperson || prev.salesperson,
                        isRepeatCustomer: true,
                      }));
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.autoFillProfileBtnText}>⚡ Auto-fill</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Dynamic Field Inputs for this Section */}
              <View style={styles.inputsCard}>
                {(() => {
                  const currentSec = SECTIONS.find((s) => s.id === formSection);
                  const allMappedFieldNames = SECTIONS.flatMap((s) => s.fieldNames);
                  let sectionFields = activeFields.filter((f) => currentSec?.fieldNames.includes(f.name));

                  // Append any dynamically added custom fields on the final section so they are never missed
                  if (currentSec?.id === 'followup') {
                    const unmappedFields = activeFields.filter((f) => !allMappedFieldNames.includes(f.name));
                    sectionFields = [...sectionFields, ...unmappedFields];
                  }

                  return sectionFields.map((field) => (
                    <DynamicFieldRenderer
                      key={field.id || field.name}
                      field={field}
                      value={formData[field.name]}
                      error={errors[field.name]}
                      onChange={(val) => handleFieldChange(field.name, val)}
                    />
                  ));
                })()}
              </View>

              {/* Navigation Buttons for Form */}
              <View style={styles.formNavButtonsRow}>
                {currentSectionIndex > 0 ? (
                  <TouchableOpacity
                    style={styles.prevSectionBtn}
                    onPress={() => setFormSection(SECTIONS[currentSectionIndex - 1].id)}
                  >
                    <Text style={styles.prevSectionBtnText}>← Previous</Text>
                  </TouchableOpacity>
                ) : null}

                {currentSectionIndex < SECTIONS.length - 1 ? (
                  <TouchableOpacity
                    style={styles.nextSectionBtn}
                    onPress={() => setFormSection(SECTIONS[currentSectionIndex + 1].id)}
                  >
                    <Text style={styles.nextSectionBtnText}>Next Section →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.submitFinalBtn}
                    onPress={handleCreateCustomer}
                    disabled={submitting}
                  >
                    <Text style={styles.submitFinalBtnText}>
                      {submitting ? 'Saving to MongoDB Atlas...' : '✓ Register Customer'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Screen: Customer Details (Ultra-Modern Executive Detail Screen) */}
      {/* Screen: Customer Details (Ultra-Modern Executive Detail Screen) */}
      {activeScreen === 'detail' && selectedCustomer && (
        <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {(() => {
            const data = selectedCustomer.data instanceof Map
              ? Object.fromEntries(selectedCustomer.data)
              : (selectedCustomer.data || selectedCustomer);
            const initial = (data.customerName || 'C').charAt(0).toUpperCase();
            const badgeStyle = getBadgeStyle(data.customerType);
            const statusStyle = getStatusBadgeStyle(data.status);
            const phone = data.mobilePhone || data.phone || '';

            // Parse discussion history to construct a vertical activity timeline
            const notesStr = data.notes || '';
            const lines = notesStr.split('\n');
            const activityTimeline = [];
            lines.forEach((line) => {
              if (!line.trim()) return;
              const match = line.match(/^\[([\d-]+)\]\s*(.*?):\s*(.*)$/);
              if (match) {
                activityTimeline.push({
                  date: match[1],
                  outcome: match[2],
                  notes: match[3],
                });
              } else {
                activityTimeline.push({
                  date: '',
                  outcome: 'Activity Logged',
                  notes: line,
                });
              }
            });
            activityTimeline.reverse();

            const formatTimelineDate = (dateStr) => {
              if (!dateStr) return '';
              try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const monthIndex = parseInt(parts[1], 10) - 1;
                  const day = parseInt(parts[2], 10);
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  if (months[monthIndex]) {
                    return `${day} ${months[monthIndex]} ${parts[0]}`;
                  }
                }
                return dateStr;
              } catch (e) {
                return dateStr;
              }
            };

            return (
              <View>
                {/* 1. Top Navigation Bar with Back Button & Quick Action Shortcuts */}
                <View style={styles.detailNavBar}>
                  <TouchableOpacity
                    style={styles.detailNavBackBtn}
                    onPress={() => setActiveScreen('list')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.detailNavBackIcon}>‹</Text>
                    <Text style={styles.detailNavBackText}>Back to Leads</Text>
                  </TouchableOpacity>

                  <View style={styles.detailNavRightGroup}>
                    {phone ? (
                      <TouchableOpacity
                        style={styles.detailNavIconBtn}
                        onPress={() => Linking.openURL(`tel:${phone}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 15 }}>📞</Text>
                      </TouchableOpacity>
                    ) : null}
                    {phone ? (
                      <TouchableOpacity
                        style={[styles.detailNavIconBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
                        onPress={() => openWhatsApp(data)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 15 }}>💬</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* 2. Hero Customer Identity Card */}
                <View style={styles.detailHeroCard}>
                  <View style={styles.detailHeroHeaderRow}>
                    <View style={[styles.detailAvatar, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.detailAvatarText, { color: statusStyle.dot }]}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailCustomerName} numberOfLines={1}>
                        {data.customerName || 'Customer Profile'}
                      </Text>
                      <View style={styles.detailIdLocationRow}>
                        <View style={styles.detailIdPill}>
                          <Text style={styles.detailIdPillText}>#{selectedCustomer.customerId || 'CUS-000000'}</Text>
                        </View>
                        {data.location ? (
                          <Text style={styles.detailLocationText} numberOfLines={1}>📍 {data.location}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Dual Badges Flow */}
                  <View style={styles.detailBadgesRow}>
                    <View style={[styles.typePill, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                      <Text style={[styles.typePillText, { color: badgeStyle.text }]}>
                        {data.customerType || 'Building Owner'}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                        {formatStatusLabel(data.status)}
                      </Text>
                    </View>
                  </View>

                  {/* 1-Tap Action Call & WhatsApp Buttons */}
                  {phone ? (
                    <View style={styles.detailHeroActionsRow}>
                      <TouchableOpacity
                        style={styles.detailActionBtnCall}
                        onPress={() => Linking.openURL(`tel:${phone}`)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.detailActionBtnCallIcon}>📞</Text>
                        <Text style={styles.detailActionBtnCallText}>Call {phone}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailActionBtnWhatsApp}
                        onPress={() => openWhatsApp(data)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.detailActionBtnWhatsAppIcon}>💬</Text>
                        <Text style={styles.detailActionBtnWhatsAppText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* 3. 4 Key Financial & Deal Metrics (2x2 Grid) */}
                <View style={styles.statTilesGrid}>
                  <View style={[styles.statTileItem, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <View style={styles.statTileHeaderRow}>
                      <Text style={styles.statTileEmoji}>💰</Text>
                      <Text style={[styles.statTileLabel, { color: '#92400E' }]}>QUOTATION VALUE</Text>
                    </View>
                    <Text style={[styles.statTileValue, { color: '#B45309' }]} numberOfLines={1}>
                      {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
                    </Text>
                    <Text style={styles.statTileSubtext}>Estimated Deal</Text>
                  </View>

                  <View style={[styles.statTileItem, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <View style={styles.statTileHeaderRow}>
                      <Text style={styles.statTileEmoji}>🧱</Text>
                      <Text style={[styles.statTileLabel, { color: '#1E40AF' }]}>TILE BUDGET</Text>
                    </View>
                    <Text style={[styles.statTileValue, { color: '#1D4ED8' }]} numberOfLines={1}>
                      {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
                    </Text>
                    <Text style={styles.statTileSubtext}>Client Budget</Text>
                  </View>

                  <View style={[styles.statTileItem, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <View style={styles.statTileHeaderRow}>
                      <Text style={styles.statTileEmoji}>📐</Text>
                      <Text style={[styles.statTileLabel, { color: '#166534' }]}>APPROX AREA</Text>
                    </View>
                    <Text style={[styles.statTileValue, { color: '#15803D' }]} numberOfLines={1}>
                      {data.approxQuantity ? `${data.approxQuantity} sq.ft` : '—'}
                    </Text>
                    <Text style={styles.statTileSubtext}>Flooring Area</Text>
                  </View>

                  <View style={[styles.statTileItem, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                    <View style={styles.statTileHeaderRow}>
                      <Text style={styles.statTileEmoji}>🏗️</Text>
                      <Text style={[styles.statTileLabel, { color: '#475569' }]}>HOUSE STAGE</Text>
                    </View>
                    <Text style={[styles.statTileValue, { color: '#0F172A' }]} numberOfLines={1}>
                      {data.houseStage || 'Flooring Stage'}
                    </Text>
                    <Text style={styles.statTileSubtext}>Current Phase</Text>
                  </View>
                </View>

                {/* 4. Structured Sections: Contact & Project Info */}
                {/* Section A: Contact & Profile */}
                <View style={styles.cleanDetailSectionCard}>
                  <View style={styles.cleanSectionHeader}>
                    <Text style={styles.cleanSectionIcon}>👤</Text>
                    <Text style={styles.cleanSectionTitle}>Contact & Profile</Text>
                  </View>
                  <View style={styles.cleanSectionBody}>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Mobile Phone</Text>
                      <Text style={styles.cleanRowValueBold}>{phone || '—'}</Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Site / Location</Text>
                      <Text style={styles.cleanRowValue}>{data.location || '—'}</Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Customer Type</Text>
                      <Text style={[styles.cleanRowValue, { color: badgeStyle.text, fontWeight: '800' }]}>
                        {data.customerType || 'Building Owner'}
                      </Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Lead Source</Text>
                      <Text style={styles.cleanRowValue}>{data.leadSource || 'Showroom Walk-in'}</Text>
                    </View>
                    <View style={[styles.cleanDetailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.cleanRowLabel}>Sales Executive</Text>
                      <Text style={[styles.cleanRowValueBold, { color: '#2563EB' }]}>
                        👤 {data.salesperson || 'Showroom Team'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Section B: Material & Project Specs */}
                <View style={styles.cleanDetailSectionCard}>
                  <View style={styles.cleanSectionHeader}>
                    <Text style={styles.cleanSectionIcon}>📐</Text>
                    <Text style={styles.cleanSectionTitle}>Material & Project Specs</Text>
                  </View>
                  <View style={styles.cleanSectionBody}>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Tile Requirement</Text>
                      <Text style={[styles.cleanRowValue, { flex: 1.5, textAlign: 'right' }]}>
                        {data.requirement || '—'}
                      </Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Approx Area</Text>
                      <Text style={styles.cleanRowValueBold}>
                        {data.approxQuantity ? `${data.approxQuantity} sq.ft` : '—'}
                      </Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Sanitary Ware</Text>
                      <Text style={styles.cleanRowValue}>{data.sanitaryRequirement || '—'}</Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Adhesive & Grouts</Text>
                      <Text style={styles.cleanRowValue}>{data.adhesiveRequirement || '—'}</Text>
                    </View>
                    <View style={[styles.cleanDetailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.cleanRowLabel}>Cross-Sell Interest</Text>
                      <Text style={styles.cleanRowValue}>{data.crossSell || '—'}</Text>
                    </View>
                  </View>
                </View>

                {/* Section B.5: Dynamic Custom Schema Fields */}
                {(() => {
                  const standardKeys = [
                    'customerId', 'entryDate', 'customerName', 'phone', 'location', 'leadSource', 'salesperson', 'customerType',
                    'houseStage', 'requirement', 'approxQuantity', 'tileBudget', 'sanitaryRequirement', 'adhesiveRequirement',
                    'quotationValue', 'quotationDate', 'status', 'orderValue', 'crossSell',
                    'nextFollowUp', 'lastFollowUp', 'followUpCount', 'lastReason',
                  ];
                  const customFields = activeFields.filter((f) => !standardKeys.includes(f.name));
                  if (customFields.length === 0) return null;

                  return (
                    <View style={styles.cleanDetailSectionCard}>
                      <View style={styles.cleanSectionHeader}>
                        <Text style={styles.cleanSectionIcon}>🏷️</Text>
                        <Text style={styles.cleanSectionTitle}>Custom Specifications & Fields</Text>
                      </View>
                      <View style={styles.cleanSectionBody}>
                        {customFields.map((cf, idx) => {
                          const val = data[cf.name];
                          let displayVal = '—';
                          if (val !== undefined && val !== null && val !== '') {
                            if (cf.type === 'checkbox') displayVal = val ? '✓ Yes' : '✕ No';
                            else if (cf.type === 'currency') displayVal = `₹ ${Number(val).toLocaleString('en-IN')}`;
                            else if (Array.isArray(val)) displayVal = val.join(', ');
                            else displayVal = String(val);
                          }
                          return (
                            <View
                              key={cf.id || cf.name}
                              style={[
                                styles.cleanDetailRow,
                                idx === customFields.length - 1 && { borderBottomWidth: 0 },
                              ]}
                            >
                              <Text style={styles.cleanRowLabel}>{cf.label}</Text>
                              <Text style={styles.cleanRowValue}>{displayVal}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                {/* Section C: Activity Timeline (Vertical History List) */}
                <View style={styles.cleanDetailSectionCard}>
                  <View style={styles.cleanSectionHeader}>
                    <Text style={styles.cleanSectionIcon}>⏳</Text>
                    <Text style={styles.cleanSectionTitle}>Activity Timeline</Text>
                  </View>

                  {activityTimeline.length > 0 ? (
                    <View style={styles.timelineContainer}>
                      <View style={styles.timelineVerticalLine} />

                      {activityTimeline.map((act, index) => {
                        const outcomeLower = act.outcome.toLowerCase();
                        const isPositive = outcomeLower.includes('won') || outcomeLower.includes('confirmed') || outcomeLower.includes('order');
                        const isNegative = outcomeLower.includes('lost') || outcomeLower.includes('postponed');
                        const dotColor = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#3B82F6';
                        const dotBg = isPositive ? '#ECFDF5' : isNegative ? '#FEF2F2' : '#EFF6FF';

                        return (
                          <View key={index} style={styles.timelineItem}>
                            <View style={[styles.timelineBullet, { backgroundColor: dotBg, borderColor: dotColor }]}>
                              <View style={[styles.timelineBulletInner, { backgroundColor: dotColor }]} />
                            </View>

                            <View style={styles.timelineContent}>
                              <View style={styles.timelineHeaderRow}>
                                <Text style={[styles.timelineTitle, { color: dotColor }]}>
                                  {act.outcome}
                                </Text>
                                {act.date ? (
                                  <Text style={styles.timelineDate}>
                                    🕒 {formatTimelineDate(act.date)}
                                  </Text>
                                ) : null}
                              </View>
                              <Text style={styles.timelineNotes}>"{act.notes.trim()}"</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>
                        No history notes logged yet. Log callbacks or visits to begin your customer activity timeline.
                      </Text>
                    </View>
                  )}

                  {data.lastReason && data.lastReason.trim() !== '' && (
                    <View style={styles.timelineObjectiveBox}>
                      <Text style={styles.timelineObjectiveLabel}>🎯 Latest Target Objective:</Text>
                      <Text style={styles.timelineObjectiveVal}>
                        {data.lastReason.split(': ').slice(1).join(': ') || data.lastReason}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bottom Dismiss / Back Button */}
                <TouchableOpacity
                  style={styles.detailBottomBackBtn}
                  onPress={() => setActiveScreen('list')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailBottomBackBtnText}>← Back to All Leads</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </ScrollView>
      )}

      {/* Modern Showroom System & Server Settings Modal */}
      <MobileSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        serverHost={serverHost}
        setServerHost={setServerHost}
        isOnline={isOnline}
        currentProfile={currentProfile}
        onOpenQrScanner={() => setShowQrScanner(true)}
        onAutoDetect={handleAutoDetect}
        autoDetecting={autoDetecting}
        onTestConnection={handleTestConnection}
        testingConn={testingConn}
        connectionStatus={connectionStatus}
        onSwitchProfile={() => setShowProfileModal(true)}
        onDisconnectServer={handleDisconnectServer}
        onReloadData={() => initData(true)}
        branding={branding}
      />

      {/* QR Code Scanner Viewfinder Modal */}
      <MobileQrScannerModal
        visible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onConnected={handleQrConnected}
      />

      {/* Deal Won & Order Confirmed Professional Celebration Modal */}
      <OrderConfirmedCelebrationModal
        visible={showOrderCelebration}
        customer={celebrationData?.customer}
        orderValue={celebrationData?.orderValue}
        onClose={() => setShowOrderCelebration(false)}
        branding={branding}
      />

      {/* Daily Shift Performance Snapshot for Mobile (Auto-Fetched) */}
      <MobileShiftKpiModal
        visible={showKpiModal}
        onClose={() => setShowKpiModal(false)}
        currentProfile={currentProfile}
        profiles={profiles}
        branding={branding}
      />

      {/* Profile Selector Modal (Owner vs Staff) */}
      <ProfileSelectorModal
        visible={showProfileModal}
        currentProfile={currentProfile}
        profiles={profiles}
        onSelectProfile={(p) => setCurrentProfile(p)}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Follow-up Activity Logger Modal */}
      <MobileFollowupLogModal
        visible={Boolean(loggingFollowupItem)}
        followUp={loggingFollowupItem}
        onClose={() => setLoggingFollowupItem(null)}
        onSaved={() => {
          loadFollowups();
          loadCustomers();
        }}
        onOpenLostSale={(item) => setMarkingLostItem(item)}
      />

      {/* Lost Sale & Competitor Analysis Modal */}
      <MobileLostSaleModal
        visible={Boolean(markingLostItem)}
        customer={markingLostItem}
        onClose={() => setMarkingLostItem(null)}
        onSaved={() => {
          loadFollowups();
          loadCustomers();
        }}
      />

      {/* WhatsApp Smart Message Templates Picker */}
      <WhatsAppTemplateModal
        visible={Boolean(whatsAppModalCustomer)}
        customer={whatsAppModalCustomer}
        branding={branding}
        onClose={() => setWhatsAppModalCustomer(null)}
      />

      {/* Floating Glassmorphic Dock */}
      {activeScreen !== 'detail' && activeScreen !== 'add' && (
        <View style={styles.floatingDockWrapper} pointerEvents="box-none">
          <View style={styles.floatingDockContainer}>
            {/* Tab 1: Leads Directory */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={() => setActiveScreen('list')}
              activeOpacity={0.75}
            >
              <View style={styles.dockItemCapsule}>
                <LeadsNavIcon active={activeScreen === 'list'} color={activeScreen === 'list' ? '#2563EB' : '#94A3B8'} />
                <Text style={[styles.dockTabLabel, activeScreen === 'list' && styles.dockTabLabelActive]}>
                  Leads
                </Text>
                {activeScreen === 'list' && <View style={styles.activeTabUnderline} />}
              </View>
            </TouchableOpacity>

            {/* Tab 2: Follow-ups Queue */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={() => {
                setActiveScreen('followups');
                loadFollowups();
              }}
              activeOpacity={0.75}
            >
              <View style={styles.dockItemCapsule}>
                <View style={{ position: 'relative' }}>
                  <FollowupsNavIcon active={activeScreen === 'followups'} color={activeScreen === 'followups' ? '#2563EB' : '#94A3B8'} />
                  {(followupCounts.overdue > 0 || followupCounts.today > 0) && (
                    <View
                      style={[
                        styles.dockBadge,
                        { backgroundColor: followupCounts.overdue > 0 ? '#EF4444' : '#2563EB' },
                      ]}
                    >
                      <Text style={styles.dockBadgeText}>
                        {followupCounts.overdue > 0 ? followupCounts.overdue : followupCounts.today}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.dockTabLabel, activeScreen === 'followups' && styles.dockTabLabelActive]}>
                  Follow-ups
                </Text>
              </View>
            </TouchableOpacity>

            {/* Center Elevated Hero Action Button: + New Lead */}
            <TouchableOpacity
              style={styles.dockCenterHeroBtn}
              onPress={() => {
                setFormData({});
                setErrors({});
                setFormSection('contact');
                setActiveScreen('add');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.dockCenterHeroCircle}>
                <Text style={styles.dockCenterHeroPlus}>+</Text>
              </View>
            </TouchableOpacity>

            {/* Tab 3: KPI Shift */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={() => {
                loadTodayMobileKpi();
                setShowKpiModal(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.dockItemCapsule}>
                <ShiftKpiNavIcon active={showKpiModal} color={showKpiModal ? '#2563EB' : '#94A3B8'} />
                <Text style={[styles.dockTabLabel, showKpiModal && styles.dockTabLabelActive]}>
                  Shift KPI
                </Text>
              </View>
            </TouchableOpacity>

            {/* Tab 4: Server Settings / Profile */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.75}
            >
              <View style={styles.dockItemCapsule}>
                <SettingsNavIcon active={showSettingsModal} color={showSettingsModal ? '#2563EB' : '#94A3B8'} />
                <Text style={[styles.dockTabLabel, showSettingsModal && styles.dockTabLabelActive]}>
                  Settings
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerHamburgerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  hamburgerLine: {
    height: 2,
    backgroundColor: '#334155',
    borderRadius: 1,
    marginVertical: 1.5,
    width: 15,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  brandBadgeLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
  },
  headerBrandTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15.5,
    letterSpacing: -0.3,
  },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginTop: 2,
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  headerStatusPillOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  headerStatusPillOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  onlineDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  profileAvatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfilePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerProfileDropdownIcon: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '800',
    marginLeft: 1,
  },
  headerBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  screenBody: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  // Search Bar
  searchRow: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Minimalist Floating Stat Tiles
  statTileRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statTileAccentBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  statTileAccentRed: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  statTileAccentGray: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statTileIcon: {
    fontSize: 18,
    marginBottom: 5,
  },
  statTileValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  statTileValueBlue: {
    color: '#2563EB',
  },
  statTileValueRed: {
    color: '#EF4444',
  },
  statTileValueGray: {
    color: '#94A3B8',
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  // Premium Filter Tab Bar
  filterTabBar: {
    marginBottom: 14,
  },
  filterTabBarContent: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterTabActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterTabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterTabBadgeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECDD3',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineBannerText: {
    fontSize: 11.5,
    color: '#991B1B',
    fontWeight: '700',
  },
  offlineBannerAction: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '800',
    marginLeft: 6,
  },
  retryConnectionBtn: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryConnectionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  // Lead Card — premium 2-row layout
  leadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFF3F8',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  leadAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leadAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
  leadInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  leadName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  leadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  leadTypeBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leadTypeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  leadPhone: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  leadIdText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  leadRightGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  leadStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  leadStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  leadStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  leadChevron: {
    fontSize: 20,
    color: '#CBD5E1',
    marginTop: 6,
  },
  activeTabUnderline: {
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#2563EB',
    marginTop: 2,
  },
  // Existing Customer Auto-Detection Banner (Mobile Form)
  existingCustomerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  existingCustomerBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
  },
  existingCustomerBannerSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    fontWeight: '600',
  },
  autoFillProfileBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  autoFillProfileBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardNextFollowUpPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cardNextFollowUpText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '700',
  },
  cardQuickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardQuickCallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardQuickWABtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardActionBtnLabelGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  // Form Screen Styles
  formTopHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 14 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  formHeaderIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  formHeaderSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  formCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formCloseBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  progressBarWrapper: {
    height: 3.5,
    backgroundColor: '#E2E8F0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  sectionTabBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTabChip: {
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  sectionTabChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTabChipCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  sectionTabChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  sectionTabChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  sectionTabChipTextCompleted: {
    color: '#059669',
    fontWeight: '800',
  },
  formScrollView: {
    flex: 1,
    padding: 14,
  },
  sectionBannerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionBannerTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionStepCounterBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  sectionStepCounterText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  sectionBannerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  inputsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formNavButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  prevSectionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevSectionBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nextSectionBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  nextSectionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  submitFinalBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#047857',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  submitFinalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  // Customer Detail Screen Styles — Ultra-Modern Mobile Overhaul
  detailScrollView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  detailNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailNavBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 4,
  },
  detailNavBackIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: -2,
  },
  detailNavBackText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailNavRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailNavIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  detailHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  detailAvatarText: {
    fontSize: 22,
    fontWeight: '900',
  },
  detailCustomerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  detailIdLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  detailIdPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailIdPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  detailLocationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  detailHeroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailActionBtnCall: {
    flex: 1.2,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailActionBtnCallIcon: {
    fontSize: 14,
  },
  detailActionBtnCallText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: -0.2,
  },
  detailActionBtnWhatsApp: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailActionBtnWhatsAppIcon: {
    fontSize: 14,
  },
  detailActionBtnWhatsAppText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 13,
  },
  statTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statTileItem: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statTileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  statTileEmoji: {
    fontSize: 13,
  },
  statTileLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statTileValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statTileSubtext: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  cleanDetailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cleanSectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cleanSectionIcon: {
    fontSize: 15,
  },
  cleanSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  cleanSectionBody: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  cleanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cleanRowLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  cleanRowValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1.3,
    textAlign: 'right',
  },
  cleanRowValueBold: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '800',
    flex: 1.3,
    textAlign: 'right',
  },
  discussionCardBody: {
    padding: 16,
  },
  discussionSpeechBubble: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  discussionSpeechText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  discussionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discussionMetaText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  detailBottomBackBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  detailBottomBackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Diagnostic Settings Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubheading: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
  },
  modalTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  statusAlert: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  // Celebration Modal Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  celebrationTrophyBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  celebrationAura: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  celebrationTrophyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBadgeChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 8,
  },
  celebrationBadgeChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },
  celebrationMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  celebrationSubtitleText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  celebrationSnapshotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    width: '100%',
    marginVertical: 16,
  },
  celebrationDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  celebrationRowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  celebrationRowValueBold: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
    maxWidth: '65%',
    textAlign: 'right',
  },
  celebrationIdText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  celebrationAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  celebrationWhatsAppActionBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationWhatsAppActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  celebrationContinueBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContinueBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
  },
  // Mobile KPI Modal Styles
  headerKpiBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 2,
  },
  headerKpiBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  kpiAutoFillBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 6,
  },
  kpiAutoFillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  kpiInputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 5,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  kpiSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  kpiNumberInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  kpiStaffChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiStaffChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kpiStaffChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  kpiStaffChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  kpiToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  kpiToggleRowActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  kpiToggleLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  kpiToggleBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kpiToggleBadgeActive: {
    color: '#059669',
    backgroundColor: '#DCFCE7',
  },
  // Profile Switcher Bar Styles
  profileBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileRoleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  profileRoleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  profileContextText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  profileSwitchPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileSwitchPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  // Floating Glassmorphic Dock Styles matching Mockup
  floatingDockWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
  },
  floatingDockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  dockTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dockItemCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 62,
  },
  dockTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  dockTabLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 11,
  },
  dockBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  dockBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dockCenterHeroBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dockCenterHeroCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  dockCenterHeroPlus: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 28,
  },
  // QR Code & Mobile Pairing Styles
  headerQrScanBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerQrBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  offlineBannerQrBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  offlineBannerActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3.5,
  },
  settingsQrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsQrIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsQrTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  settingsQrSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  settingsAutoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  settingsAutoDetectText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },

  /* ── Activity Timeline Styles ── */
  timelineContainer: {
    marginTop: 8,
    position: 'relative',
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 9,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  timelineBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginRight: 10,
  },
  timelineBulletInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  timelineDate: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  timelineNotes: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  timelineObjectiveBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  timelineObjectiveLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  timelineObjectiveVal: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
    lineHeight: 17,
  },
});
