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

    activeFields.forEach((field) => {
      const val = formData[field.name];
      const isMissing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (field.required && isMissing && field.type !== 'auto_number') {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Mandatory Fields', 'Please complete all required fields (*) marked in red before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.createCustomer(formData);
      if (res.success) {
        Alert.alert('Customer Saved', `Customer ${res.data?.customerId || 'record'} registered to MongoDB Atlas!`);
        setFormData({});
        setActiveScreen('list');
        await loadCustomers();
      } else {
        Alert.alert('Submission Failed', res.message || 'Error saving customer to database.');
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
          <View style={[styles.brandBadge, { backgroundColor: branding.primaryColor || '#2563EB' }]}>
            {branding.logoType === 'image' && branding.logoImage ? (
              <Image source={{ uri: branding.logoImage }} style={{ width: 26, height: 26, borderRadius: 6, resizeMode: 'contain' }} />
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
                  : (branding.appShortName?.charAt(0) || 'B').toUpperCase()}
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
                  if (f.defaultValue) initial[f.name] = f.defaultValue;
                });
                initial.entryDate = new Date().toISOString().split('T')[0];
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
                    onPress={() => {
                      setSelectedCustomer(item);
                      setActiveScreen('detail');
                    }}
                  >
                    {/* Top Row: Name, ID, Type */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardAvatar}>
                        <Text style={styles.cardAvatarText}>{initial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardCustomerName}>{data.customerName || 'Unnamed Customer'}</Text>
                        <Text style={styles.cardCustomerId}>{item.customerId || 'CUS-LEAD'}</Text>
                      </View>
                      <View style={[styles.typePill, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                        <Text style={[styles.typePillText, { color: badgeStyle.text }]}>
                          {data.customerType || 'Customer'}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Info Row */}
                    <View style={styles.cardInfoRow}>
                      <TouchableOpacity
                        style={styles.cardPhoneTag}
                        onPress={() => {
                          if (data.phone) Linking.openURL(`tel:${data.phone}`);
                        }}
                      >
                        <Text style={styles.cardPhoneText}>📞 {data.phone || 'No phone'}</Text>
                      </TouchableOpacity>

                      {data.location ? (
                        <Text style={styles.cardLocationText} numberOfLines={1}>
                          📍 {data.location}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Bottom Row: Status & Quotation Value */}
                    <View style={styles.cardFooterRow}>
                      {data.status ? (
                        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                            {data.status}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>Newly Registered</Text>
                      )}

                      {data.quotationValue || data.tileBudget ? (
                        <Text style={styles.cardPrice}>
                          ₹ {Number(data.quotationValue || data.tileBudget).toLocaleString('en-IN')}
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

      {/* Screen: Add Customer (23 Fields with 4 Tabs) */}
      {activeScreen === 'add' && (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Section Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressBarFill, { width: `${((currentSectionIndex + 1) / SECTIONS.length) * 100}%` }]} />
          </View>

          {/* Section Tab Bar */}
          <View style={styles.sectionTabBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
              {SECTIONS.map((sec) => {
                const isSelected = formSection === sec.id;
                return (
                  <TouchableOpacity
                    key={sec.id}
                    style={[styles.sectionTabChip, isSelected && styles.sectionTabChipActive]}
                    onPress={() => setFormSection(sec.id)}
                  >
                    <Text style={[styles.sectionTabChipText, isSelected && styles.sectionTabChipTextActive]}>
                      {sec.icon} {sec.shortTitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Form Scroll Container */}
          <ScrollView
            style={styles.formScrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Active Section Banner */}
            <View style={styles.sectionBannerBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sectionBannerTitle}>
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
                    onChange={handleFieldChange}
                    error={errors[field.name]}
                  />
                ));
              })()}
            </View>

            {/* Navigation & Submit Controls */}
            <View style={styles.formNavButtonsRow}>
              {currentSectionIndex > 0 && (
                <TouchableOpacity
                  style={styles.prevSectionBtn}
                  onPress={() => setFormSection(SECTIONS[currentSectionIndex - 1].id)}
                >
                  <Text style={styles.prevSectionBtnText}>← Previous</Text>
                </TouchableOpacity>
              )}

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

      {/* Screen: Customer Details */}
      {activeScreen === 'detail' && selectedCustomer && (
        <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
          {(() => {
            const data = selectedCustomer.data instanceof Map
              ? Object.fromEntries(selectedCustomer.data)
              : (selectedCustomer.data || {});
            const initial = (data.customerName || 'C').charAt(0).toUpperCase();
            const badgeStyle = getBadgeStyle(data.customerType);

            return (
              <View>
                {/* Profile Summary Card */}
                <View style={styles.detailHeroCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.detailAvatar}>
                      <Text style={styles.detailAvatarText}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailCustomerName}>{data.customerName || 'Customer Profile'}</Text>
                      <Text style={styles.detailCustomerId}>{selectedCustomer.customerId}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <View style={[styles.typePill, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                      <Text style={[styles.typePillText, { color: badgeStyle.text }]}>
                        {data.customerType || 'Building Owner'}
                      </Text>
                    </View>
                    {data.status ? (
                      <View style={[styles.typePill, { backgroundColor: colors.goldBg, borderColor: colors.goldBorder }]}>
                        <Text style={[styles.typePillText, { color: colors.gold }]}>
                          {data.status}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Direct Action Dialer */}
                  {data.phone ? (
                    <TouchableOpacity
                      style={styles.quickCallBtn}
                      onPress={() => Linking.openURL(`tel:${data.phone}`)}
                    >
                      <Text style={styles.quickCallBtnText}>📞 Call Customer ({data.phone})</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* 4 Categorized Sections */}
                {SECTIONS.map((sec) => {
                  const secFields = activeFields.filter((f) => sec.fieldNames.includes(f.name));
                  return (
                    <View key={sec.id} style={styles.detailSectionContainer}>
                      <Text style={styles.detailSectionHeading}>
                        {sec.icon} {sec.title}
                      </Text>
                      <View style={styles.detailSectionCard}>
                        {secFields.map((f) => (
                          <View key={f.name} style={styles.detailRow}>
                            <Text style={styles.detailRowLabel}>{f.label}</Text>
                            <Text style={styles.detailRowValue}>
                              {data[f.name] !== undefined && data[f.name] !== null && data[f.name] !== ''
                                ? Array.isArray(data[f.name])
                                  ? data[f.name].join(', ')
                                  : f.type === 'currency'
                                  ? `₹ ${Number(data[f.name]).toLocaleString('en-IN')}`
                                  : String(data[f.name])
                                : '—'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  detailCustomerName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.text,
  },
  detailCustomerId: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  quickCallBtn: {
    marginTop: 14,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
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
});
