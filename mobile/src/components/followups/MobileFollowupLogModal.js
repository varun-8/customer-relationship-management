import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../api/client';

const OUTCOMES = [
  { label: 'Spoke with Customer / Positive Interest', shortLabel: 'Positive Interest', icon: '✓', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  { label: 'Customer Visiting Showroom Today / Soon', shortLabel: 'Visiting Showroom', icon: '→', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  { label: 'Sent Revised Quotation / Discount Provided', shortLabel: 'Sent Revised Quote', icon: '•', color: '#7E22CE', bg: '#FAF5FF', border: '#DDD6FE' },
  { label: 'No Answer / Customer Busy / Callback Requested', shortLabel: 'No Answer / Busy', icon: '!', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Negotiating Final Price / Competitor Comparison', shortLabel: 'Price Negotiation', icon: '₹', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
  { label: 'Site Measurement Scheduled', shortLabel: 'Site Measurement', icon: '✦', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' },
  { label: 'Order Confirmed / Ready for Billing', shortLabel: 'Order Confirmed', icon: '★', color: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
  { label: 'Deal Lost / Postponed', shortLabel: 'Deal Lost / Postponed', icon: '✕', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
];

const QUICK_SNIPPETS = [
  'Liked showroom tile samples',
  'Negotiating 5-10% discount',
  'Scheduled site measurement',
  'Shared quote PDF on WhatsApp',
  'Callback requested in evening',
];

export function MobileFollowupLogModal({
  visible,
  followUp,
  onClose,
  onSaved,
  onOpenLostSale,
}) {
  if (!followUp) return null;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [outcome, setOutcome] = useState('Spoke with Customer / Positive Interest');
  const [leadTemperature, setLeadTemperature] = useState(followUp.leadTemperature || 'Hot');
  const [customerName, setCustomerName] = useState(followUp.customerName || '');
  const [phone, setPhone] = useState(followUp.phone || '');
  const [nextFollowUp, setNextFollowUp] = useState(
    followUp.nextFollowUp || tomorrow.toISOString().split('T')[0]
  );
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [quotationValue, setQuotationValue] = useState(
    followUp.quotationValue !== undefined ? String(followUp.quotationValue) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [outcomeModalVisible, setOutcomeModalVisible] = useState(false);

  const selectedOutcomeObj = OUTCOMES.find((o) => o.label === outcome) || OUTCOMES[0];

  const handleQuickDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextFollowUp(d.toISOString().split('T')[0]);
  };

  const handleAppendSnippet = (snippet) => {
    setDiscussionNotes((prev) => {
      const cleanSnippet = snippet.trim();
      if (!prev.trim()) return cleanSnippet;
      return `${prev.trim()}\n• ${cleanSnippet}`;
    });
  };

  const handleSubmit = async () => {
    if (outcome === 'Deal Lost / Postponed') {
      if (onOpenLostSale) {
        onOpenLostSale(followUp);
        onClose();
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await apiClient.logFollowupActivity(followUp._id, {
        outcome,
        customerName: customerName.trim(),
        phone: phone.trim(),
        discussionNotes: discussionNotes.trim(),
        nextFollowUp,
        leadTemperature,
        quotationValue: quotationValue ? Number(quotationValue) : undefined,
        statusUpdate: outcome === 'Order Confirmed / Ready for Billing' ? 'Order Confirmed' : undefined,
      });

      if (res && res.success) {
        Alert.alert('Activity Logged', `Follow-up updated for ${customerName || 'Customer'}!`);
        if (onSaved) onSaved();
        onClose();
      } else {
        Alert.alert(
          'Connection Issue',
          res?.message || 'Could not save follow-up to the server. Please check your network connection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handleSubmit },
          ]
        );
      }
    } catch (e) {
      Alert.alert(
        'Network Error',
        `Connection failed: ${e.message}. Your entries have been preserved.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleSubmit },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Drag Handle */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Modern App Header Bar */}
          <View style={styles.headerLight}>
            <View style={styles.headerIconBoxLight}>
              <Text style={styles.headerIconGlyph}>✎</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitleMain}>Log Follow-up Activity</Text>
              <Text style={styles.headerSubtitleText}>Record conversation remarks & schedule reminder</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerCloseBtnLight}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.headerCloseBtnTextLight}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
            {/* Modern Customer Target Profile Card */}
            <View style={styles.customerCard}>
              <View style={styles.customerAvatarCircle}>
                <Text style={styles.customerAvatarText}>
                  {(customerName || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.customerNameRow}>
                  <TextInput
                    style={styles.customerNameInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Customer Name"
                    placeholderTextColor="#94A3B8"
                  />
                  {followUp.customerId && (
                    <View style={styles.headerIdBadgeLight}>
                      <Text style={styles.headerIdBadgeTextLight}>#{followUp.customerId}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.customerMetaRow}>
                  <View style={styles.phoneInputWrap}>
                    <Text style={styles.phoneIconSmall}>📞</Text>
                    <TextInput
                      style={styles.customerPhoneInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Mobile Phone"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>

                  {followUp.customerType ? (
                    <View style={styles.customerTypePill}>
                      <Text style={styles.customerTypePillText}>{followUp.customerType}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* 1. Discussion Outcome Dropdown List Box */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionHeadingIconCircle}>
                  <Text style={styles.sectionHeadingIcon}>✓</Text>
                </View>
                <Text style={styles.sectionHeading}>1. Call Outcome & Priority</Text>
              </View>
              
              {/* Outcome Dropdown Trigger Box */}
              <TouchableOpacity
                style={[
                  styles.dropdownTriggerBox,
                  { backgroundColor: selectedOutcomeObj.bg, borderColor: selectedOutcomeObj.border },
                ]}
                onPress={() => setOutcomeModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownTriggerLeftGroup}>
                  <View style={[styles.outcomeIconBadge, { backgroundColor: selectedOutcomeObj.color }]}>
                    <Text style={styles.outcomeIconBadgeText}>{selectedOutcomeObj.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownTriggerHint}>Selected Outcome</Text>
                    <Text style={[styles.dropdownTriggerValueText, { color: selectedOutcomeObj.color }]} numberOfLines={1}>
                      {selectedOutcomeObj.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.dropdownTriggerChevronBox}>
                  <Text style={{ fontSize: 13, color: selectedOutcomeObj.color, fontWeight: '800' }}>▼</Text>
                </View>
              </TouchableOpacity>

              {/* Outcome Selection Modal Sheet */}
              <Modal
                visible={outcomeModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setOutcomeModalVisible(false)}
              >
                <View style={styles.outcomeModalBackdrop}>
                  <View style={styles.outcomeModalSheet}>
                    <View style={styles.modalHandleWrapper}>
                      <View style={styles.modalHandle} />
                    </View>

                    <View style={styles.outcomeModalHeader}>
                      <Text style={styles.outcomeModalTitle}>Select Call Outcome</Text>
                      <TouchableOpacity onPress={() => setOutcomeModalVisible(false)} style={styles.modalCloseBtn}>
                        <Text style={styles.modalCloseBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                      {OUTCOMES.map((o) => {
                        const isSelected = outcome === o.label;
                        return (
                          <TouchableOpacity
                            key={o.label}
                            style={[
                              styles.outcomeListItem,
                              isSelected && { backgroundColor: o.bg, borderColor: o.border },
                            ]}
                            onPress={() => {
                              setOutcome(o.label);
                              setOutcomeModalVisible(false);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={{ fontSize: 14, fontWeight: '800', marginRight: 10, color: o.color }}>{o.icon}</Text>
                            <Text style={[styles.outcomeListItemText, isSelected && { color: o.color, fontWeight: '800' }]}>
                              {o.label}
                            </Text>
                            {isSelected && (
                              <View style={[styles.outcomeCheckmarkBadge, { backgroundColor: o.color }]}>
                                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {/* Lead Priority Temperature Selector */}
              <View style={styles.subHeadingRow}>
                <Text style={styles.subHeadingLabel}>Lead Priority Temperature</Text>
              </View>
              <View style={styles.tempRow}>
                <TouchableOpacity
                  style={[
                    styles.tempBtn,
                    leadTemperature === 'Hot' && styles.tempBtnHotActive,
                  ]}
                  onPress={() => setLeadTemperature('Hot')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 12 }}>🔥</Text>
                  <Text style={[styles.tempBtnText, leadTemperature === 'Hot' && styles.tempBtnHotText]}>
                    Hot Deal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tempBtn,
                    leadTemperature === 'Warm' && styles.tempBtnWarmActive,
                  ]}
                  onPress={() => setLeadTemperature('Warm')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 12 }}>⚡</Text>
                  <Text style={[styles.tempBtnText, leadTemperature === 'Warm' && styles.tempBtnWarmText]}>
                    Warm Lead
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tempBtn,
                    leadTemperature === 'Future' && styles.tempBtnFutureActive,
                  ]}
                  onPress={() => setLeadTemperature('Future')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 12 }}>✦</Text>
                  <Text style={[styles.tempBtnText, leadTemperature === 'Future' && styles.tempBtnFutureText]}>
                    Future
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Next Follow-up Schedule & Valuation */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionHeadingIconCircle}>
                  <Text style={styles.sectionHeadingIcon}>📅</Text>
                </View>
                <Text style={styles.sectionHeading}>2. Next Schedule & Value</Text>
              </View>
              
              {/* Next Follow-up Date */}
              <View style={styles.scheduleRowHeader}>
                <Text style={styles.subHeadingLabel}>Next Reminder Date *</Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <TouchableOpacity style={styles.quickDayBtn} onPress={() => handleQuickDays(1)}>
                    <Text style={styles.quickDayText}>+1d</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDayBtn} onPress={() => handleQuickDays(3)}>
                    <Text style={styles.quickDayText}>+3d</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDayBtn} onPress={() => handleQuickDays(7)}>
                    <Text style={styles.quickDayText}>+1w</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDayBtn} onPress={() => handleQuickDays(15)}>
                    <Text style={styles.quickDayText}>+15d</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateInputWrapper}>
                <Text style={{ fontSize: 13, marginRight: 8 }}>📅</Text>
                <TextInput
                  style={styles.dateTextInput}
                  value={nextFollowUp}
                  onChangeText={setNextFollowUp}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Deal / Quotation Value */}
              <View style={[styles.scheduleRowHeader, { marginTop: 14 }]}>
                <Text style={styles.subHeadingLabel}>Deal / Quotation Value (₹)</Text>
              </View>
              <View style={styles.quoteValueInputWrapper}>
                <View style={styles.currencyPrefixBadgeEmerald}>
                  <Text style={styles.currencyPrefixTextEmerald}>₹</Text>
                </View>
                <TextInput
                  style={[styles.quoteTextInput, { flex: 1 }]}
                  value={quotationValue}
                  onChangeText={setQuotationValue}
                  keyboardType="numeric"
                  placeholder="e.g. 150000"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 3. Discussion Remarks & 1-Tap Snippets */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionHeadingIconCircle}>
                  <Text style={styles.sectionHeadingIcon}>💬</Text>
                </View>
                <Text style={styles.sectionHeading}>3. Discussion Remarks & Notes</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
                {QUICK_SNIPPETS.map((snip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.snippetChip}
                    onPress={() => handleAppendSnippet(snip)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.snippetChipText}>+ {snip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.notesTextInput}
                value={discussionNotes}
                onChangeText={setDiscussionNotes}
                multiline
                placeholder="Type customer discussion notes, tile requirements, objections or next steps..."
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.notesSubHint}>
                Notes will be appended to the customer's permanent follow-up timeline.
              </Text>
            </View>

            <View style={{ height: 10 }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  outcome === 'Deal Lost / Postponed'
                    ? ['#DC2626', '#B91C1C']
                    : ['#0F766E', '#0D9488']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={styles.saveBtnIcon}>
                      {outcome === 'Deal Lost / Postponed' ? '✕' : '✓'}
                    </Text>
                    <Text style={styles.saveBtnText}>
                      {outcome === 'Deal Lost / Postponed' ? 'Record Lost Deal' : 'Save Follow-up Activity'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  headerLight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  headerIconBoxLight: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.2,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconGlyph: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F766E',
  },
  headerTitleMain: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  headerIdBadgeLight: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerIdBadgeTextLight: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerCloseBtnLight: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseBtnTextLight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  scroll: {
    flexGrow: 0,
  },

  /* ── Customer Identity Profile Card ── */
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  customerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.2,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerNameInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 130,
  },
  phoneIconSmall: {
    fontSize: 12,
  },
  customerPhoneInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    paddingVertical: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  customerTypePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },

  /* ── Form Section Cards ── */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeadingIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeadingIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  /* ── Outcome Selector ── */
  dropdownTriggerBox: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dropdownTriggerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  outcomeIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeIconBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dropdownTriggerHint: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dropdownTriggerValueText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  dropdownTriggerChevronBox: {
    paddingLeft: 8,
  },
  outcomeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  outcomeModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  outcomeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  outcomeModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  outcomeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  outcomeListItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  outcomeCheckmarkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeadingRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  subHeadingLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tempRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tempBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  tempBtnHotActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  tempBtnHotText: {
    color: '#DC2626',
    fontWeight: '900',
  },
  tempBtnWarmActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  tempBtnWarmText: {
    color: '#D97706',
    fontWeight: '900',
  },
  tempBtnFutureActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
    borderWidth: 1.5,
  },
  tempBtnFutureText: {
    color: '#0F766E',
    fontWeight: '900',
  },

  /* ── Schedule & Valuation ── */
  scheduleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quickDayBtn: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  quickDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  quoteValueInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
    height: 44,
  },
  currencyPrefixBadgeEmerald: {
    backgroundColor: '#F0FDFA',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    paddingHorizontal: 13,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefixTextEmerald: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F766E',
  },
  quoteTextInput: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* ── Discussion Notes ── */
  snippetChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  snippetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  notesTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    minHeight: 96,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  notesSubHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 6,
  },

  /* ── Footer Row ── */
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveBtnIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  saveBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
