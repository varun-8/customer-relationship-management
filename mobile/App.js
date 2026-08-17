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
} from 'react-native';
import { colors } from './src/theme/colors';
import { apiClient, FALLBACK_SCHEMA } from './src/api/client';
import { DynamicFieldRenderer } from './src/components/DynamicFieldRenderer';

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

export default function App() {
  const [activeScreen, setActiveScreen] = useState('list'); // 'list' | 'add' | 'detail'
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

  // Server IP Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [serverHost, setServerHost] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConn, setTestingConn] = useState(false);

  // Quick Follow-up Action State
  const [followUpStatus, setFollowUpStatus] = useState('Follow-up');
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpNextDate, setFollowUpNextDate] = useState('');
  const [followUpOrderValue, setFollowUpOrderValue] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

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

  const initData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadBranding(), loadFormSchema(), loadCustomers()]);
    setLoading(false);
  }, [loadBranding, loadFormSchema, loadCustomers]);

  useEffect(() => {
    initData();
  }, [initData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBranding(), loadFormSchema(), loadCustomers(search)]);
    setRefreshing(false);
  };

  const handleSelectCustomer = (item) => {
    const d = item.data instanceof Map ? Object.fromEntries(item.data) : (item.data || {});
    setSelectedCustomer(item);
    setFollowUpStatus(d.status || 'Follow-up');
    setFollowUpReason(d.lastReason || '');
    setFollowUpNextDate(d.nextFollowUp || '');
    setFollowUpOrderValue(d.orderValue !== undefined && d.orderValue !== null ? String(d.orderValue) : '');
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

  const handleLogFollowUp = async () => {
    if (!selectedCustomer) return;
    const currentData = selectedCustomer.data instanceof Map
      ? Object.fromEntries(selectedCustomer.data)
      : (selectedCustomer.data || {});

    const currentCount = Number(currentData.followUpCount) || 0;
    const newCount = currentCount + 1;
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedData = {
      ...currentData,
      status: followUpStatus,
      lastReason: followUpReason.trim(),
      nextFollowUp: followUpNextDate.trim(),
      lastFollowUp: todayStr,
      followUpCount: newCount,
      ...(followUpOrderValue ? { orderValue: Number(followUpOrderValue) } : {}),
    };

    setSubmittingFollowUp(true);
    try {
      const res = await apiClient.updateCustomer(
        selectedCustomer._id || selectedCustomer.customerId,
        updatedData
      );
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        await loadCustomers(search);
        Alert.alert(
          '✓ Follow-up Recorded',
          `Follow-up #${newCount} logged successfully!\nStatus updated to "${followUpStatus}".\nLast follow-up set to today (${todayStr}).`
        );
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update customer');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingFollowUp(false);
    }
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
    };

    activeFields.forEach((field) => {
      const val = payload[field.name];
      const isMissing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (field.required && isMissing && field.type !== 'auto_number') {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorList = Object.values(newErrors).join('\n• ');
      Alert.alert('Mandatory Fields', `Please complete the following required fields:\n• ${errorList}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.createCustomer(payload);
      if (res.success) {
        Alert.alert('Customer Saved', `Customer ${res.data?.customerId || 'record'} registered to MongoDB Atlas!`);
        setFormData({});
        setActiveScreen('list');
        await loadCustomers();
      } else {
        const errorDetails = res.errors ? Object.values(res.errors).join('\n• ') : res.message;
        Alert.alert('Validation Error', `Please review the following:\n• ${errorDetails}`);
      }
    } catch (e) {
      Alert.alert('Connection Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFields = (formSchema?.fields || []).filter((f) => f.active);

  // Filter customers by type
  const filteredCustomers = customers.filter((c) => {
    if (typeFilter === 'all') return true;
    const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
    return d.customerType === typeFilter;
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
      case 'Order Confirmed': return { bg: '#DCFCE7', text: '#15803D' };
      case 'Negotiation':
      case 'Quotation': return { bg: '#FEF3C7', text: '#B45309' };
      case 'Follow-up': return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'Lost': return { bg: '#F1F5F9', text: '#64748B' };
      default: return { bg: '#F3E8FF', text: '#7E22CE' };
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

      {/* Modern Dynamic Executive Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.brandBadge,
              branding.logoType === 'image' && branding.logoImage
                ? { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 2 }
                : { backgroundColor: branding.primaryColor || '#2563EB' },
            ]}
          >
            {branding.logoType === 'image' && branding.logoImage ? (
              <Image
                source={{ uri: branding.logoImage }}
                style={{ width: '100%', height: '100%', borderRadius: 6, resizeMode: 'contain' }}
              />
            ) : (
              <Text style={styles.brandBadgeText}>
                {branding.logoIcon === 'Building2'
                  ? '🏢'
                  : branding.logoIcon === 'Store'
                  ? '🏪'
                  : branding.logoIcon === 'Sparkles'
                  ? '✨'
                  : branding.logoIcon === 'Crown'
                  ? '👑'
                  : branding.logoIcon === 'Shield'
                  ? '🛡️'
                  : branding.logoIcon === 'Layers'
                  ? '📚'
                  : branding.logoIcon === 'Gem'
                  ? '💎'
                  : branding.logoIcon === 'Compass'
                  ? '🧭'
                  : branding.logoIcon === 'Hexagon'
                  ? '⬡'
                  : '📦'}
              </Text>
            )}
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerBrandTitle}>
                {(branding.appShortName || branding.appName || 'BuildCRM').toUpperCase()}
              </Text>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
            </View>
            <Text style={styles.headerBrandSubtitle}>
              {branding.tagline || 'Tiles & Sanitary'} • Schema v{formSchema?.version || 1}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>⚙️</Text>
          </TouchableOpacity>

          {activeScreen !== 'list' ? (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setActiveScreen('list')}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBackBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Text style={styles.syncBtnText}>↻ Sync</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Screen: Customer List */}
      {activeScreen === 'list' && (
        <View style={styles.screenBody}>
          {/* Executive Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Leads</Text>
              <Text style={styles.statValue}>{customers.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Building Owners</Text>
              <Text style={[styles.statValue, { color: colors.emerald }]}>
                {customers.filter((c) => {
                  const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
                  return d.customerType === 'Building Owner';
                }).length}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={[styles.statBox, { flex: 1.3 }]}>
              <Text style={styles.statLabel}>Pipeline Value</Text>
              <Text style={[styles.statValue, { color: colors.gold, fontSize: 13 }]}>
                ₹ {totalPipeline.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Search & Add Action Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search ID, Name, Phone, Location..."
                placeholderTextColor={colors.textLight}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  loadCustomers(text);
                }}
              />
              {search ? (
                <TouchableOpacity onPress={() => { setSearch(''); loadCustomers(''); }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.primaryAddBtn}
              activeOpacity={0.8}
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
              <Text style={styles.primaryAddBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterChipsRow}>
            {['all', 'Building Owner', 'Mason', 'Architect'].map((type) => {
              const isSelected = typeFilter === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setTypeFilter(type)}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {type === 'all' ? 'All Customers' : type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Customer FlatList */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching showroom database from MongoDB Atlas...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item, index) => item._id || String(index)}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
                  <Text style={styles.emptyTitle}>No Customers Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {search ? `No matches for "${search}"` : 'Tap + Add above to register a showroom customer.'}
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
                    style={styles.customerCard}
                    activeOpacity={0.7}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    {/* Header Row: Avatar, Name, ID, Type Pill */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardAvatar}>
                        <Text style={styles.cardAvatarText}>{initial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardCustomerName} numberOfLines={1}>
                          {data.customerName || 'Unnamed Customer'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={styles.cardCustomerId}>{item.customerId || 'CUS-LEAD'}</Text>
                          <Text style={styles.cardDot}>•</Text>
                          <Text style={[styles.cardTypeLabel, { color: badgeStyle.text }]}>
                            {data.customerType || 'Building Owner'}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                          {data.status || 'Follow-up'}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Highlights Row: Location, Stage & Quotation */}
                    <View style={styles.cardHighlightsRow}>
                      <View style={{ flex: 1 }}>
                        {data.location ? (
                          <Text style={styles.cardLocationText} numberOfLines={1}>
                            📍 {data.location} {data.houseStage ? `• ${data.houseStage}` : ''}
                          </Text>
                        ) : data.houseStage ? (
                          <Text style={styles.cardLocationText}>
                            🏗️ {data.houseStage}
                          </Text>
                        ) : (
                          <Text style={styles.cardLocationText}>
                            🏢 Showroom Lead
                          </Text>
                        )}
                      </View>

                      {data.quotationValue ? (
                        <Text style={styles.cardPrice}>
                          ₹ {Number(data.quotationValue).toLocaleString('en-IN')}
                        </Text>
                      ) : (
                        <Text style={styles.cardFollowUpCountBadge}>
                          #{data.followUpCount || 0} Follow-ups
                        </Text>
                      )}
                    </View>

                    {/* Footer Row: Contact Action Buttons & Next Date */}
                    <View style={styles.cardActionFooterRow}>
                      {data.phone ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            style={styles.cardCallChip}
                            onPress={() => Linking.openURL(`tel:${data.phone}`)}
                          >
                            <Text style={styles.cardCallChipText}>📞 {data.phone}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cardWhatsAppChip}
                            onPress={() => openWhatsApp(data.phone, data.customerName, data.requirement)}
                          >
                            <Text style={styles.cardWhatsAppChipText}>💬 WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11.5, color: colors.textMuted }}>No Phone</Text>
                      )}

                      {data.nextFollowUp ? (
                        <Text style={styles.cardNextFollowUpText}>
                          📅 Next: {data.nextFollowUp}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
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
                  >
                    <Text
                      style={[
                        styles.sectionTabChipText,
                        isActive && styles.sectionTabChipTextActive,
                      ]}
                    >
                      {sec.shortTitle}
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

            {/* Dynamic Field Inputs for this Section */}
            <View style={styles.inputsCard}>
              {(() => {
                const currentSec = SECTIONS.find((s) => s.id === formSection);
                const sectionFields = activeFields.filter((f) => currentSec?.fieldNames.includes(f.name));

                return sectionFields.map((field) => (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={formData[field.name]}
                    error={errors[field.name]}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, [field.name]: val }));
                      if (errors[field.name]) {
                        setErrors((prev) => {
                          const updated = { ...prev };
                          delete updated[field.name];
                          return updated;
                        });
                      }
                    }}
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
                    <View style={[styles.typePill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusStyle.text }} />
                      <Text style={[styles.typePillText, { color: statusStyle.text }]}>
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
                    <Text style={styles.statTileLabel}>QUOTATION VALUE</Text>
                    <Text style={[styles.statTileValue, { color: '#D97706' }]}>
                      {data.quotationValue ? `₹ ${Number(data.quotationValue).toLocaleString('en-IN')}` : '₹ 0'}
                    </Text>
                  </View>

                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>TILE BUDGET</Text>
                    <Text style={[styles.statTileValue, { color: '#2563EB' }]}>
                      {data.tileBudget ? `₹ ${Number(data.tileBudget).toLocaleString('en-IN')}` : '₹ 0'}
                    </Text>
                  </View>

                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>HOUSE STAGE</Text>
                    <Text style={[styles.statTileValue, { color: '#0F172A' }]} numberOfLines={1}>
                      {data.houseStage || 'Flooring Stage'}
                    </Text>
                  </View>

                  <View style={styles.statTileItem}>
                    <Text style={styles.statTileLabel}>TOTAL INTERACTIONS</Text>
                    <Text style={[styles.statTileValue, { color: '#059669' }]}>
                      #{data.followUpCount || 0} Logged
                    </Text>
                  </View>
                </View>

                {/* 3. ⚡ Quick Follow-up & Stage Update Hub */}
                <View style={styles.followUpActionCard}>
                  <View style={styles.followUpHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16 }}>⚡</Text>
                      <Text style={styles.followUpTitle}>Log Follow-up & Stage</Text>
                    </View>
                    <View style={styles.followUpBadge}>
                      <Text style={styles.followUpBadgeText}>
                        #{data.followUpCount || 0} → Auto #{((Number(data.followUpCount) || 0) + 1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.followUpSubheading}>
                    Tap a status after discussion. Auto-increments count and logs today's date.
                  </Text>

                  {/* Status Selection Pills */}
                  <Text style={styles.fieldSectionMiniLabel}>UPDATE PIPELINE STAGE:</Text>
                  <View style={styles.statusPillsGrid}>
                    {[
                      { name: 'Quotation', color: '#2563EB' },
                      { name: 'Negotiation', color: '#D97706' },
                      { name: 'Order Confirmed', color: '#059669', icon: '🎉' },
                      { name: 'Follow-up', color: '#3B82F6' },
                      { name: 'Newly Contacted', color: '#6366F1' },
                      { name: 'Walk-in', color: '#0284C7' },
                      { name: 'Lost', color: '#475569' },
                      { name: 'Future Requirement', color: '#8B5CF6' },
                    ].map((st) => {
                      const isSelected = followUpStatus === st.name;
                      return (
                        <TouchableOpacity
                          key={st.name}
                          onPress={() => setFollowUpStatus(st.name)}
                          style={[
                            styles.statusPillBtn,
                            isSelected && { backgroundColor: st.color, borderColor: st.color },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.statusPillBtnText,
                              isSelected && { color: '#FFFFFF', fontWeight: '800' },
                            ]}
                          >
                            {st.icon ? `${st.icon} ` : ''}{st.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Discussion Notes / Reason */}
                  <Text style={styles.fieldSectionMiniLabel}>DISCUSSION NOTES / SUMMARY:</Text>
                  <TextInput
                    style={styles.followUpInput}
                    placeholder="e.g. Client visited showroom, approved vitrified tiles quote..."
                    placeholderTextColor={colors.textLight}
                    value={followUpReason}
                    onChangeText={setFollowUpReason}
                    multiline
                  />

                  {/* Quick Tag Snippets */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {[
                      'Visited Showroom',
                      'Shared Quote via WA',
                      'Requested Discount',
                      'Payment Confirmed',
                    ].map((snip, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setFollowUpReason((prev) => (prev ? `${prev} • ${snip}` : snip))}
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>+ {snip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Next Follow-up Date */}
                  <Text style={styles.fieldSectionMiniLabel}>NEXT SCHEDULED FOLLOW-UP:</Text>
                  <View style={styles.quickDateRow}>
                    {[
                      { label: '+2 Days', days: 2 },
                      { label: '+3 Days', days: 3 },
                      { label: '+1 Week', days: 7 },
                      { label: '+2 Weeks', days: 14 },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        style={styles.quickDateChip}
                        onPress={() => {
                          const target = new Date(Date.now() + item.days * 86400000);
                          setFollowUpNextDate(target.toISOString().split('T')[0]);
                        }}
                      >
                        <Text style={styles.quickDateChipText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.followUpInput, { marginBottom: 12 }]}
                    placeholder="YYYY-MM-DD (e.g. 2026-08-20)"
                    placeholderTextColor={colors.textLight}
                    value={followUpNextDate}
                    onChangeText={setFollowUpNextDate}
                  />

                  {/* Order Value (if Order Confirmed) */}
                  {followUpStatus === 'Order Confirmed' && (
                    <View style={{ marginBottom: 12, backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' }}>
                      <Text style={[styles.fieldSectionMiniLabel, { color: '#047857' }]}>🎉 FINAL BOOKING / ORDER VALUE (₹):</Text>
                      <TextInput
                        style={[styles.followUpInput, { borderColor: '#059669', marginBottom: 0, fontWeight: '800', color: '#065F46' }]}
                        placeholder="e.g. 150000"
                        placeholderTextColor={colors.textLight}
                        keyboardType="numeric"
                        value={followUpOrderValue}
                        onChangeText={setFollowUpOrderValue}
                      />
                    </View>
                  )}

                  {/* Submit Follow-up Button */}
                  <TouchableOpacity
                    style={styles.submitFollowUpBtn}
                    onPress={handleLogFollowUp}
                    disabled={submittingFollowUp}
                    activeOpacity={0.8}
                  >
                    {submittingFollowUp ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 14 }}>⚡</Text>
                        <Text style={styles.submitFollowUpBtnText}>
                          Log Follow-up (#{((Number(data.followUpCount) || 0) + 1)}) & Save Stage
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 4. Structured Clean Cards: Contact & Material Specs */}
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
                placeholder="http://10.169.195.152:5000/api"
                autoCapitalize="none"
              />
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                Current Wi-Fi IP: http://10.169.195.152:5000/api
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  headerBrandTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerBrandSubtitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBackBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBackBtnText: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  primaryAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  cardCustomerName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },
  cardCustomerId: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  cardPhoneTag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardPhoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardLocationText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
  },
  progressBarWrapper: {
    height: 3,
    backgroundColor: '#E2E8F0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sectionTabBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionTabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formScrollView: {
    flex: 1,
    padding: 14,
  },
  sectionBannerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionStepCounter: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionBannerSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  inputsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  formNavButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  prevSectionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  prevSectionBtnText: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '700',
  },
  nextSectionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextSectionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  submitFinalBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitFinalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
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
  quickCallBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  detailSectionContainer: {
    marginBottom: 12,
  },
  detailSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  detailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
  },
  detailRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1.2,
    textAlign: 'right',
  },
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
  // Quick Follow-up Action Card Styles
  followUpActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  followUpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
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
    marginBottom: 12,
  },
  fieldSectionMiniLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statusPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  statusPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusPillBtnText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  statusPillBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  followUpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  quickDateChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickDateChipText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  submitFollowUpBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  submitFollowUpBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  // WhatsApp Action Styles
  cardMiniWhatsAppBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardMiniWhatsAppText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  quickWhatsAppBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickWhatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  // Redesigned List Card & Detail Styles
  cardDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardTypeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardHighlightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 2,
  },
  cardLocationText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardFollowUpCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cardActionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardCallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardCallChipText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  cardWhatsAppChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardWhatsAppChipText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  cardNextFollowUpText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
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
});
