import React, { useState, useEffect, useCallback } from 'react';
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
  Easing,
  Dimensions,
} from 'react-native';
import { colors } from './src/theme/colors';
import { apiClient, FALLBACK_SCHEMA } from './src/api/client';
import { DynamicFieldRenderer } from './src/components/DynamicFieldRenderer';
import { PROFILES, ProfileSelectorModal } from './src/components/profile/ProfileSelectorModal';
import { MobileFollowupSheet } from './src/components/followups/MobileFollowupSheet';
import { MobileFollowupLogModal } from './src/components/followups/MobileFollowupLogModal';
import { MobileLostSaleModal } from './src/components/lost-sales/MobileLostSaleModal';

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

  const data = customer?.data instanceof Map
    ? Object.fromEntries(customer.data)
    : (customer?.data || {});
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

  // Server IP Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [serverHost, setServerHost] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConn, setTestingConn] = useState(false);

  // Daily KPI State
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpiStaff, setKpiStaff] = useState('Karthik Raja');
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

  useEffect(() => {
    const loadHost = async () => {
      const currentHost = await apiClient.getApiBase();
      setServerHost(currentHost);
    };
    loadHost();
  }, []);

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
        setFormSchema(schema);
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
      setCustomers(list || []);
      setIsOnline(true);
    } catch (e) {
      console.warn('Customers fetch warning:', e.message);
      setIsOnline(false);
    }
  }, []);

  const loadFollowups = useCallback(async (
    tab = followupTab,
    temp = followupTempFilter,
    staff = (currentProfile.role === 'employee' ? currentProfile.name : ownerStaffFilter)
  ) => {
    setLoadingFollowups(true);
    try {
      const params = { tab };
      if (temp !== 'all') params.temperature = temp;
      if (staff !== 'all') params.salesperson = staff;
      const res = await apiClient.getFollowupsList(params);
      if (res && res.success) {
        setFollowups(res.data || []);
        if (res.counts) setFollowupCounts(res.counts);
      }
    } catch (e) {
      console.warn('Follow-ups fetch warning:', e.message);
    } finally {
      setLoadingFollowups(false);
    }
  }, [followupTab, followupTempFilter, currentProfile, ownerStaffFilter]);

  const initData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadBranding(), loadFormSchema(), loadCustomers(), loadFollowups()]);
    setLoading(false);
  }, [loadBranding, loadFormSchema, loadCustomers, loadFollowups]);

  useEffect(() => {
    initData();
  }, [initData]);

  // When profile or owner filter changes, re-fetch followups
  useEffect(() => {
    loadFollowups();
  }, [currentProfile, ownerStaffFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBranding(), loadFormSchema(), loadCustomers(search), loadFollowups()]);
    setRefreshing(false);
  };

  const handleSelectCustomer = (item) => {
    setSelectedCustomer(item);
    setActiveScreen('detail');
  };

  const openWhatsApp = (phone, customerName = '', requirement = '') => {
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
    const greetingName = customerName ? ` ${customerName}` : '';
    const brandTitle = branding.appShortName || branding.appName || 'Vasantham CRM';
    const textMsg = `Hello${greetingName}, greetings from ${brandTitle}! Regarding your requirement for ${requirement || 'Tiles & Sanitary Wares'}...`;

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
      setConnectionStatus({ success: true, message: 'Connected to MongoDB Atlas & Backend!' });
      setIsOnline(true);
      await apiClient.setApiBase(serverHost);
      await loadFormSchema();
      await loadCustomers();
    } else {
      setConnectionStatus({
        success: false,
        message: `Could not connect: ${res.error || 'Server unreachable'}. Verify your PC is on the same Wi-Fi.`,
      });
      setIsOnline(false);
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
      salesperson: formData.salesperson || (currentProfile.role === 'employee' ? currentProfile.name : 'Karthik Raja'),
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
        Alert.alert('Registration Failed', `Server validation error:\n• ${errorDetails}`);
      }
    } catch (e) {
      Alert.alert('Connection Error', `Failed to register lead: ${e.message}. Verify backend server connection.`);
    } finally {
      setSubmitting(false);
    }
  };

  const loadTodayMobileKpi = async (targetStaff = null) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const staffParam = targetStaff || (currentProfile.role === 'employee' ? currentProfile.name : (kpiStaff || 'Karthik Raja'));
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

  // Filter customers by type and profile assignment
  const filteredCustomers = customers.filter((c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    if (typeFilter !== 'all' && d.customerType !== typeFilter) return false;
    if (currentProfile.role === 'employee') {
      return (d.salesperson || '').toLowerCase().includes(currentProfile.name.toLowerCase());
    }
    if (ownerStaffFilter !== 'all') {
      return (d.salesperson || '').toLowerCase().includes(ownerStaffFilter.toLowerCase());
    }
    return true;
  });

  // Calculate Metrics
  const totalPipeline = customers.reduce((acc, c) => {
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
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

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      {/* Sleek Minimalist Executive Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.brandBadge,
              branding.logoImage && branding.logoImage.trim() !== ''
                ? { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', padding: 2 }
                : { backgroundColor: branding.primaryColor || '#2563EB' },
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
          <View style={{ justifyContent: 'center' }}>
            <Text style={styles.headerBrandTitle} numberOfLines={1}>
              {(branding.appShortName || branding.appName || 'BuildCRM').toUpperCase()}
            </Text>
            <View style={styles.headerStatusRow}>
              <View style={[styles.onlineStatusPill, { backgroundColor: isOnline ? '#ECFDF5' : '#FFFBEB', borderColor: isOnline ? '#A7F3D0' : '#FDE68A' }]}>
                <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
                <Text style={[styles.onlineStatusText, { color: isOnline ? '#047857' : '#B45309' }]}>
                  {isOnline ? 'Online' : 'Connecting'}
                </Text>
              </View>
              <Text style={styles.headerRoleDot}>•</Text>
              <Text style={styles.headerRoleSnippet} numberOfLines={1}>
                {currentProfile.role === 'owner' ? 'Showroom Owner' : currentProfile.name.split(' ')[0]}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Profile Switcher Pill */}
          <TouchableOpacity
            style={[styles.headerProfilePill, { backgroundColor: currentProfile.bg, borderColor: currentProfile.border }]}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13 }}>{currentProfile.icon}</Text>
            <Text style={[styles.headerProfilePillText, { color: currentProfile.color }]} numberOfLines={1}>
              {currentProfile.name.split(' ')[0]}
            </Text>
            <Text style={{ fontSize: 10, color: currentProfile.color, marginLeft: -2 }}>▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>⚙️</Text>
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

      {/* Screen: Customer List (Modern, Minimalist & High-Performance) */}
      {activeScreen === 'list' && (
        <View style={styles.screenBody}>
          {/* Search & Quick Add Action Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, phone, #ID..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  loadCustomers(text);
                }}
              />
              {search ? (
                <TouchableOpacity
                  onPress={() => { setSearch(''); loadCustomers(''); }}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.primaryAddBtn}
              activeOpacity={0.85}
              onPress={() => {
                const initial = {};
                activeFields.forEach((f) => {
                  if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
                    initial[f.name] = f.defaultValue;
                  }
                });
                if (!initial.entryDate) {
                  initial.entryDate = new Date().toISOString().split('T')[0];
                }
                if (!initial.status) {
                  initial.status = 'Newly Contacted';
                }
                if (!initial.customerType) {
                  initial.customerType = 'Building Owner';
                }
                setFormData(initial);
                setFormSection('contact');
                setErrors({});
                setActiveScreen('add');
              }}
            >
              <Text style={styles.primaryAddBtnText}>+ New Lead</Text>
            </TouchableOpacity>
          </View>

          {/* Executive Command Hub for Showroom Owner */}
          {currentProfile.role === 'owner' && (
            <View style={styles.ownerCommandCard}>
              {/* Top Banner Row */}
              <View style={styles.ownerCommandHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>👑</Text>
                  <Text style={styles.ownerCommandTitle}>SHOWROOM EXECUTIVE PULSE</Text>
                </View>
                <View style={styles.ownerStaffCountBadge}>
                  <Text style={styles.ownerStaffCountText}>4 Sales Executives</Text>
                </View>
              </View>

              {/* 3 Executive Stat Columns */}
              <View style={styles.ownerStatGrid}>
                <View style={styles.ownerStatBox}>
                  <Text style={styles.ownerStatLabel}>TOTAL PIPELINE</Text>
                  <Text style={styles.ownerStatValueGreen}>
                    ₹{totalPipeline >= 100000 ? `${(totalPipeline / 100000).toFixed(2)}L` : totalPipeline.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.ownerStatSubtext}>Live Deal Value</Text>
                </View>

                <View style={styles.ownerStatDivider} />

                <View style={styles.ownerStatBox}>
                  <Text style={styles.ownerStatLabel}>ACTIVE LEADS</Text>
                  <Text style={styles.ownerStatValueWhite}>{customers.length}</Text>
                  <Text style={styles.ownerStatSubtext}>Total Customers</Text>
                </View>

                <View style={styles.ownerStatDivider} />

                <View style={styles.ownerStatBox}>
                  <Text style={styles.ownerStatLabel}>URGENT CALLS</Text>
                  <Text style={[styles.ownerStatValueWhite, (followupCounts.overdue + followupCounts.today) > 0 && { color: '#F87171' }]}>
                    {followupCounts.overdue + followupCounts.today}
                  </Text>
                  <Text style={[styles.ownerStatSubtext, (followupCounts.overdue + followupCounts.today) > 0 && { color: '#FCA5A5' }]}>
                    {followupCounts.overdue > 0 ? `${followupCounts.overdue} Overdue` : 'Due Today'}
                  </Text>
                </View>
              </View>

              {/* Quick Staff Rep Allocation Ticker */}
              <View style={styles.ownerRepTickerRow}>
                <Text style={styles.ownerTickerTitle}>REP WORKLOAD:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                  {['Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar'].map((staff) => {
                    const count = customers.filter((c) => {
                      const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
                      return (d.salesperson || '').toLowerCase().includes(staff.toLowerCase());
                    }).length;
                    const isSelected = ownerStaffFilter === staff;

                    return (
                      <TouchableOpacity
                        key={staff}
                        onPress={() => setOwnerStaffFilter(isSelected ? 'all' : staff)}
                        style={[styles.ownerMiniStaffPill, isSelected && styles.ownerMiniStaffPillActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.ownerMiniStaffText, isSelected && styles.ownerMiniStaffTextActive]}>
                          {staff.split(' ')[0]}: <Text style={{ fontWeight: '900' }}>{count}</Text>
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Professional Theme-Cohesive Filter Bar */}
          <View style={styles.filterDockContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
              {/* Customer Segment Filter Capsules */}
              {['all', 'Building Owner', 'Architect', 'Mason'].map((type) => {
                const isSelected = typeFilter === type;
                const count = type === 'all'
                  ? (ownerStaffFilter === 'all' ? customers.length : filteredCustomers.length)
                  : customers.filter((c) => {
                      const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
                      const matchesStaff = ownerStaffFilter === 'all' || (d.salesperson || '').toLowerCase().includes(ownerStaffFilter.toLowerCase());
                      return d.customerType === type && matchesStaff;
                    }).length;

                const label = type === 'all' ? 'All Leads' : type === 'Building Owner' ? 'Building Owner' : type;
                const icon = type === 'all' ? '🏷️' : type === 'Building Owner' ? '🏢' : type === 'Architect' ? '📐' : '🧱';

                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTypeFilter(type)}
                    style={[styles.filterCapsule, isSelected && styles.filterCapsuleActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 12 }}>{icon}</Text>
                    <Text style={[styles.filterCapsuleText, isSelected && styles.filterCapsuleTextActive]}>
                      {label}
                    </Text>
                    <View style={[styles.filterCountBadge, isSelected && styles.filterCountBadgeActive]}>
                      <Text style={[styles.filterCountBadgeText, isSelected && styles.filterCountBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Showroom Owner Staff Filter Divider & Chips */}
              {currentProfile.role === 'owner' && (
                <>
                  <View style={styles.filterDividerVertical} />
                  {['all', 'Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar'].map((staff) => {
                    const isSelected = ownerStaffFilter === staff;
                    const staffCount = staff === 'all'
                      ? customers.length
                      : customers.filter((c) => {
                          const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
                          return (d.salesperson || '').toLowerCase().includes(staff.toLowerCase());
                        }).length;

                    return (
                      <TouchableOpacity
                        key={staff}
                        onPress={() => setOwnerStaffFilter(staff)}
                        style={[styles.filterCapsuleStaff, isSelected && styles.filterCapsuleStaffActive]}
                        activeOpacity={0.75}
                      >
                        <Text style={{ fontSize: 11 }}>👤</Text>
                        <Text style={[styles.filterCapsuleStaffText, isSelected && styles.filterCapsuleStaffTextActive]}>
                          {staff === 'all' ? 'All Reps' : staff.split(' ')[0]}
                        </Text>
                        <View style={[styles.filterStaffCountBadge, isSelected && styles.filterStaffCountBadgeActive]}>
                          <Text style={[styles.filterStaffCountBadgeText, isSelected && styles.filterStaffCountBadgeTextActive]}>
                            {staffCount}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>

          {/* High-Performance Customer FlatList */}
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
              contentContainerStyle={{ paddingBottom: 30 }}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
                  <Text style={styles.emptyTitle}>No Customers Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {search ? `No matches found for "${search}"` : 'Tap + New Lead above to register a customer.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const data = item.data instanceof Map ? Object.fromEntries(item.data) : (item.data || {});
                const initial = (data.customerName || 'C').charAt(0).toUpperCase();
                const badgeStyle = getBadgeStyle(data.customerType);
                const statusStyle = getStatusBadgeStyle(data.status);

                return (
                  <TouchableOpacity
                    style={[
                      styles.leadCard,
                      { borderLeftColor: statusStyle.dot || '#2563EB' },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    {/* Left: Avatar + Customer Name & Customer ID */}
                    <View style={styles.leadLeftGroup}>
                      <View style={[styles.leadAvatar, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                        <Text style={[styles.leadAvatarText, { color: badgeStyle.text }]}>{initial}</Text>
                      </View>

                      <View style={styles.leadInfoCol}>
                        <Text style={styles.leadName} numberOfLines={1}>
                          {data.customerName || 'Unnamed Customer'}
                        </Text>
                        <View style={styles.leadIdBadge}>
                          <Text style={styles.leadIdBadgeText}>#{item.customerId || 'CUS'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Right: Status Pill & Chevron */}
                    <View style={styles.leadRightGroup}>
                      <View
                        style={[
                          styles.leadStatusPill,
                          { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                        ]}
                      >
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
          counts={followupCounts}
          loading={loadingFollowups}
          refreshing={refreshing}
          onRefresh={onRefresh}
          activeTab={followupTab}
          onTabChange={(tab) => {
            setFollowupTab(tab);
            loadFollowups(tab, followupTempFilter);
          }}
          temperatureFilter={followupTempFilter}
          onTemperatureChange={(temp) => {
            setFollowupTempFilter(temp);
            loadFollowups(followupTab, temp);
          }}
          ownerStaffFilter={ownerStaffFilter}
          onOwnerStaffChange={(staff) => {
            setOwnerStaffFilter(staff);
            loadFollowups(followupTab, followupTempFilter, staff);
          }}
          currentProfile={currentProfile}
          onLogActivity={(item) => setLoggingFollowupItem(item)}
          onRecordLost={(item) => setMarkingLostItem(item)}
          openWhatsApp={openWhatsApp}
        />
      )}

      {/* Screen: Customer Add Form */}
      {activeScreen === 'add' && (
        <View style={styles.screenBody}>
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
          <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
            {/* Banner of Active Section */}
            <View style={styles.sectionBannerBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionBannerTitle}>
                  {SECTIONS[currentSectionIndex]?.icon}{' '}
                  {SECTIONS[currentSectionIndex]?.title}
                </Text>
                <Text style={styles.sectionStepCounter}>
                  Step {currentSectionIndex + 1} of {SECTIONS.length}
                </Text>
              </View>
              <Text style={styles.sectionBannerSubtitle}>
                {branding.appName || 'BuildCRM'} • Dynamic Schema (v{formSchema?.version || 1})
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
      )}

      {/* Screen: Customer Details (Ultra-Modern Executive Detail Screen) */}
      {activeScreen === 'detail' && selectedCustomer && (
        <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
          {(() => {
            const data = selectedCustomer.data instanceof Map
              ? Object.fromEntries(selectedCustomer.data)
              : (selectedCustomer.data || {});
            const initial = (data.customerName || 'C').charAt(0).toUpperCase();
            const badgeStyle = getBadgeStyle(data.customerType);
            const statusStyle = getStatusBadgeStyle(data.status);

            return (
              <View style={{ paddingBottom: 40 }}>
                {/* 1. Hero Executive Identity Card */}
                <View style={styles.detailHeroCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.detailAvatar}>
                      <Text style={styles.detailAvatarText}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailCustomerName}>{data.customerName || 'Customer Profile'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <View style={styles.detailIdPill}>
                          <Text style={styles.detailIdPillText}>{selectedCustomer.customerId}</Text>
                        </View>
                        {data.location ? (
                          <Text style={styles.detailLocationText}>📍 {data.location}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Badges Row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <View style={[styles.typePill, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                      <Text style={[styles.typePillText, { color: badgeStyle.text }]}>
                        {data.customerType || 'Building Owner'}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, paddingHorizontal: 9, paddingVertical: 3.5 }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                        {data.status || 'Follow-up'}
                      </Text>
                    </View>
                  </View>

                  {/* 1-Tap Action Call & WhatsApp Buttons */}
                  {data.phone ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                      <TouchableOpacity
                        style={styles.detailActionBtnCall}
                        onPress={() => Linking.openURL(`tel:${data.phone}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailActionBtnCallText}>📞 Call Customer</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailActionBtnWhatsApp}
                        onPress={() => openWhatsApp(data.phone, data.customerName, data.requirement)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailActionBtnWhatsAppText}>💬 WhatsApp Chat</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* 2. 4 Quick Stat Tiles (2x2 Grid) */}
                <View style={styles.statTilesGrid}>
                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>Quotation Value</Text>
                    <Text style={[styles.statTileValue, { color: '#D97706' }]}>
                      {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
                    </Text>
                  </View>

                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>Tile Budget</Text>
                    <Text style={[styles.statTileValue, { color: '#2563EB' }]}>
                      {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
                    </Text>
                  </View>

                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>House Stage</Text>
                    <Text style={[styles.statTileValue, { color: '#0F172A' }]} numberOfLines={1}>
                      {data.houseStage || 'Flooring Stage'}
                    </Text>
                  </View>

                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>Total Interactions</Text>
                    <Text style={[styles.statTileValue, { color: '#059669' }]}>
                      ⚡ {data.followUpCount || 0} Logged
                    </Text>
                  </View>
                </View>

                {/* 3. Structured Clean Cards: Contact & Material Specs */}
                {/* Card A: Contact & Profile */}
                <View style={styles.cleanDetailSectionCard}>
                  <View style={styles.cleanSectionHeader}>
                    <Text style={styles.cleanSectionTitle}>👤 1. Contact & Lead Profile</Text>
                  </View>
                  <View style={styles.cleanSectionBody}>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Mobile Number</Text>
                      <Text style={styles.cleanRowValueBold}>{data.phone || '—'}</Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Site / City Location</Text>
                      <Text style={styles.cleanRowValue}>{data.location || '—'}</Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Customer Type</Text>
                      <Text style={[styles.cleanRowValue, { color: badgeStyle.text, fontWeight: '700' }]}>
                        {data.customerType || 'Building Owner'}
                      </Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Lead Source</Text>
                      <Text style={styles.cleanRowValue}>{data.leadSource || 'Walk-in'}</Text>
                    </View>
                    <View style={[styles.cleanDetailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.cleanRowLabel}>Sales Executive</Text>
                      <Text style={[styles.cleanRowValueBold, { color: '#2563EB' }]}>
                        {data.salesperson || 'Showroom Team'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card B: Project & Material Specs */}
                <View style={styles.cleanDetailSectionCard}>
                  <View style={styles.cleanSectionHeader}>
                    <Text style={styles.cleanSectionTitle}>📐 2. Material & Project Specifications</Text>
                  </View>
                  <View style={styles.cleanSectionBody}>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Tile Requirement</Text>
                      <Text style={[styles.cleanRowValue, { flex: 1.3, textAlign: 'right' }]}>
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
                      <Text style={styles.cleanRowLabel}>Sanitary Ware Needs</Text>
                      <Text style={styles.cleanRowValue}>{data.sanitaryRequirement || '—'}</Text>
                    </View>
                    <View style={styles.cleanDetailRow}>
                      <Text style={styles.cleanRowLabel}>Adhesive & Grouts</Text>
                      <Text style={styles.cleanRowValue}>{data.adhesiveRequirement || '—'}</Text>
                    </View>
                    <View style={[styles.cleanDetailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.cleanRowLabel}>Cross-Sell Opportunities</Text>
                      <Text style={styles.cleanRowValue}>{data.crossSell || '—'}</Text>
                    </View>
                  </View>
                </View>

                {/* Card C: Latest Interaction Notes */}
                {data.lastReason ? (
                  <View style={styles.cleanDetailSectionCard}>
                    <View style={styles.cleanSectionHeader}>
                      <Text style={styles.cleanSectionTitle}>💬 3. Latest Follow-up Discussion</Text>
                    </View>
                    <View style={{ padding: 14 }}>
                      <Text style={{ fontSize: 13, color: '#1E293B', lineHeight: 18, fontStyle: 'italic' }}>
                        "{data.lastReason}"
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
                          Last Contacted: {data.lastFollowUp || 'Recently'}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: '#15803D', fontWeight: '700' }}>
                          Next: {data.nextFollowUp || 'Not Set'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                <View style={{ height: 50 }} />
              </View>
            );
          })()}
        </ScrollView>
      )}

      {/* Host IP & Diagnostic Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Backend Server Connection</Text>
            <Text style={styles.modalSubheading}>
              Connect your phone to your host PC running Node.js and MongoDB Atlas.
            </Text>

            <View style={{ marginVertical: 14 }}>
              <Text style={styles.modalInputLabel}>Host Machine API URL</Text>
              <TextInput
                style={styles.modalTextInput}
                value={serverHost}
                onChangeText={setServerHost}
                placeholder="http://10.169.195.176:5000/api"
                autoCapitalize="none"
              />
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                Current Wi-Fi IP: http://10.169.195.176:5000/api
              </Text>
            </View>

            {connectionStatus && (
              <View
                style={[
                  styles.statusAlert,
                  { backgroundColor: connectionStatus.success ? colors.emeraldBg : colors.roseBg, borderColor: connectionStatus.success ? colors.emeraldBorder : colors.roseBorder },
                ]}
              >
                <Text style={{ color: connectionStatus.success ? colors.emerald : colors.rose, fontSize: 12, fontWeight: '600' }}>
                  {connectionStatus.message}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleTestConnection}
                disabled={testingConn}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {testingConn ? 'Testing...' : 'Test & Save IP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deal Won & Order Confirmed Professional Celebration Modal */}
      <OrderConfirmedCelebrationModal
        visible={showOrderCelebration}
        customer={celebrationData?.customer}
        orderValue={celebrationData?.orderValue}
        onClose={() => setShowOrderCelebration(false)}
        branding={branding}
      />

      {/* Daily Shift Performance Snapshot for Mobile (Auto-Fetched) */}
      <Modal visible={showKpiModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%', padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.modalHeading}>📊 Today's KPI Performance</Text>
              <TouchableOpacity onPress={() => setShowKpiModal(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubheading}>
              Live performance metrics automatically calculated from CRM activity.
            </Text>

            {/* Showroom Owner Staff Switcher */}
            {currentProfile.role === 'owner' && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.kpiInputLabel}>Select Sales Rep</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 4 }}>
                  {['Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar'].map((staff) => {
                    const isSel = (kpiStaff || 'Karthik Raja') === staff;
                    return (
                      <TouchableOpacity
                        key={staff}
                        style={[styles.kpiStaffChip, isSel && styles.kpiStaffChipActive]}
                        onPress={() => {
                          setKpiStaff(staff);
                          loadTodayMobileKpi(staff);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.kpiStaffChipText, isSel && styles.kpiStaffChipTextActive]}>
                          👤 {staff.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {/* Sales Value Hero Card */}
              <View style={{ backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 14, padding: 14, marginBottom: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857', letterSpacing: 0.5 }}>
                  {currentProfile.role === 'owner' ? `${(kpiStaff || 'Karthik').split(' ')[0].toUpperCase()}'S REVENUE TODAY` : "TODAY'S CLOSED REVENUE"}
                </Text>
                <Text style={{ fontSize: 26, fontWeight: '900', color: '#065F46', marginVertical: 4 }}>
                  ₹{Number(kpiSalesValue || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                  {kpiTotalBills || 0} Bills Invoiced Today
                </Text>
              </View>

              {/* Showroom Funnel Grid */}
              <Text style={styles.kpiInputLabel}>Showroom Footfall & Conversion</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>Visits</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#2563EB' }}>{kpiVisits || 0}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>Quotes</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{kpiQuotes || 0}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>Orders</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#059669' }}>{kpiOrders || 0}</Text>
                </View>
              </View>

              {/* Follow-ups */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>Follow-ups Logged</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#7C3AED' }}>{kpiFollowups || 0} calls/chats</Text>
              </View>

              {/* Strategic Indicators */}
              <View style={[styles.kpiToggleRow, kpiOldCustomers && styles.kpiToggleRowActive]}>
                <Text style={styles.kpiToggleLabel}>Repeat / Old Customers Served</Text>
                <Text style={[styles.kpiToggleBadge, kpiOldCustomers && styles.kpiToggleBadgeActive]}>
                  {kpiOldCustomers ? '✓ Yes' : '✕ No'}
                </Text>
              </View>

              <View style={[styles.kpiToggleRow, kpiEngineerCalls && styles.kpiToggleRowActive]}>
                <Text style={styles.kpiToggleLabel}>Engineer / Architect Interactions</Text>
                <Text style={[styles.kpiToggleBadge, kpiEngineerCalls && styles.kpiToggleBadgeActive]}>
                  {kpiEngineerCalls ? '✓ Yes' : '✕ No'}
                </Text>
              </View>

              <View style={[styles.kpiToggleRow, kpiCrossSell && styles.kpiToggleRowActive]}>
                <Text style={styles.kpiToggleLabel}>Cross-sell Achieved</Text>
                <Text style={[styles.kpiToggleBadge, kpiCrossSell && styles.kpiToggleBadgeActive]}>
                  {kpiCrossSell ? '✓ Yes' : '✕ No'}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSaveBtn, { width: '100%', marginTop: 8 }]}
              onPress={() => setShowKpiModal(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Selector Modal (Owner vs Staff) */}
      <ProfileSelectorModal
        visible={showProfileModal}
        currentProfile={currentProfile}
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

      {/* Floating Modern Glassmorphic Bottom Navigation Bar */}
      {activeScreen !== 'detail' && activeScreen !== 'add' && (
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={[styles.bottomNavItem, activeScreen === 'list' && styles.bottomNavItemActive]}
            onPress={() => setActiveScreen('list')}
            activeOpacity={0.75}
          >
            <View style={[styles.bottomNavIconBox, activeScreen === 'list' && styles.bottomNavIconBoxActive]}>
              <Text style={{ fontSize: 17 }}>📋</Text>
            </View>
            <Text style={[styles.bottomNavLabel, activeScreen === 'list' && styles.bottomNavLabelActive]}>
              Leads
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomNavItem, activeScreen === 'followups' && styles.bottomNavItemActiveFollowup]}
            onPress={() => {
              setActiveScreen('followups');
              loadFollowups();
            }}
            activeOpacity={0.75}
          >
            <View style={{ position: 'relative' }}>
              <View style={[styles.bottomNavIconBox, activeScreen === 'followups' && styles.bottomNavIconBoxActiveFollowup]}>
                <Text style={{ fontSize: 17 }}>📞</Text>
              </View>
              {(followupCounts.overdue > 0 || followupCounts.today > 0) && (
                <View
                  style={[
                    styles.navBadge,
                    { backgroundColor: followupCounts.overdue > 0 ? '#EF4444' : '#2563EB' },
                  ]}
                >
                  <Text style={styles.navBadgeText}>
                    {followupCounts.overdue > 0 ? followupCounts.overdue : followupCounts.today}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.bottomNavLabel, activeScreen === 'followups' && styles.bottomNavLabelActiveFollowup]}>
              Follow-ups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => {
              loadTodayMobileKpi();
              setShowKpiModal(true);
            }}
            activeOpacity={0.75}
          >
            <View style={styles.bottomNavIconBox}>
              <Text style={{ fontSize: 17 }}>📊</Text>
            </View>
            <Text style={styles.bottomNavLabel}>KPI Shift</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  brandBadgeLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  headerBrandTitle: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  onlineDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  onlineStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerRoleDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  headerRoleSnippet: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    maxWidth: 100,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerProfilePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.emeraldBg,
    borderWidth: 1,
    borderColor: colors.emeraldBorder,
  },
  syncBtnText: {
    color: colors.emerald,
    fontSize: 11.5,
    fontWeight: '700',
  },
  screenBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  // Modern Sleek Search & Add Lead Action Bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  primaryAddBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 15,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  // Professional Theme-Cohesive Filter Dock
  filterDockContainer: {
    marginBottom: 10,
  },
  filterScrollContent: {
    gap: 7,
    paddingVertical: 2,
  },
  filterCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterCapsuleActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    shadowOpacity: 0.15,
  },
  filterCapsuleText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  filterCapsuleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  filterCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  filterCountBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  filterDividerVertical: {
    width: 1,
    height: 20,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginHorizontal: 3,
  },
  filterCapsuleStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterCapsuleStaffActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  filterCapsuleStaffText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  filterCapsuleStaffTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterStaffCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  filterStaffCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterStaffCountBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  filterStaffCountBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  // Showroom Owner Executive Command Card
  ownerCommandCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  ownerCommandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 10,
  },
  ownerCommandTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  ownerStaffCountBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ownerStaffCountText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  ownerStatGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  ownerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
  ownerStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ownerStatValueGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#34D399',
    marginTop: 2,
  },
  ownerStatValueWhite: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  ownerStatSubtext: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  ownerRepTickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  ownerTickerTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  ownerMiniStaffPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  ownerMiniStaffPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  ownerMiniStaffText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  ownerMiniStaffTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  kpiStaffChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiStaffChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  kpiStaffChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  kpiStaffChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  },
  // Ultra-Minimalist Modern Lead Record Card Styles
  leadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  leadLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  leadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  leadInfoCol: {
    marginLeft: 10,
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  leadIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 2,
  },
  leadIdBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  leadRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4.5,
  },
  leadStatusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  leadStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  leadChevron: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
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
  progressBarWrapper: {
    height: 4,
    backgroundColor: '#E2E8F0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sectionTabBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sectionTabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTabChipCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  sectionTabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  sectionTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionBannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionStepCounter: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionBannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  inputsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevSectionBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '800',
  },
  nextSectionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  nextSectionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  submitFinalBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitFinalBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  // Customer Detail Screen Styles
  detailScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  detailHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  detailAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  detailAvatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  detailCustomerName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  detailIdPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailIdPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  detailLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typePill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  detailActionBtnCall: {
    flex: 1,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailActionBtnCallText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12.5,
  },
  detailActionBtnWhatsApp: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailActionBtnWhatsAppText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  statTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statTileItem: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  statTileLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statTileValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  // Follow-up & Stage Log Action Hub Styles
  followUpActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  followUpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  followUpBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  followUpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  followUpSubheading: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  selectedStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  selectedStatusBannerLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  fieldSectionMiniLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  statusPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statusPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillBtnText: {
    fontSize: 11.5,
    letterSpacing: 0.1,
  },
  followUpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
  snippetChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  snippetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  quickDateChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  quickDateChipText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  submitFollowUpBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitFollowUpBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  // Clean Structured Specs Sections
  cleanDetailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cleanSectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cleanSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cleanSectionBody: {
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  cleanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cleanRowLabel: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  cleanRowValue: {
    fontSize: 12.5,
    color: colors.text,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  cleanRowValueBold: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
    flex: 1.2,
    textAlign: 'right',
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
  // Bottom Navigation Bar Styles
  bottomNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  bottomNavItemActive: {},
  bottomNavItemActiveFollowup: {},
  bottomNavIconBox: {
    width: 38,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  bottomNavIconBoxActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bottomNavIconBoxActiveFollowup: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bottomNavLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  bottomNavLabelActiveFollowup: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  navBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
