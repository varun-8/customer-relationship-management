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
import { apiClient } from '../../api/client';

const OUTCOMES = [
  { label: 'Spoke with Customer / Positive Interest', shortLabel: 'Positive Interest', icon: '🤝', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  { label: 'Customer Visiting Showroom Today / Soon', shortLabel: 'Visiting Showroom', icon: '🏢', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  { label: 'Sent Revised Quotation / Discount Provided', shortLabel: 'Sent Revised Quote', icon: '📄', color: '#7E22CE', bg: '#FAF5FF', border: '#DDD6FE' },
  { label: 'No Answer / Customer Busy / Callback Requested', shortLabel: 'No Answer / Busy', icon: '📵', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Negotiating Final Price / Competitor Comparison', shortLabel: 'Price Negotiation', icon: '💰', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
  { label: 'Site Measurement Scheduled', shortLabel: 'Site Measurement', icon: '📐', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' },
  { label: 'Order Confirmed / Ready for Billing', shortLabel: 'Order Confirmed', icon: '🛒', color: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
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
        Alert.alert('✓ Activity Logged', `Follow-up updated for ${customerName || 'Customer'}!`);
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

          {/* Header Bar with Editable Customer Info */}
          <View style={styles.headerLight}>
            <View style={styles.headerIconBoxLight}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[styles.headerTitleLight, { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#FFFFFF' }]}
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

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#64748B' }}>📱</Text>
                <TextInput
                  style={{ fontSize: 12, color: '#334155', fontWeight: '700', flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FFFFFF' }}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Mobile Phone"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseBtnLight} activeOpacity={0.7}>
              <Text style={styles.headerCloseBtnTextLight}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
            {/* 1. Discussion Outcome Dropdown List Box */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>1. Call Outcome *</Text>
              
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
                  <Text style={{ fontSize: 18 }}>{selectedOutcomeObj.icon}</Text>
                  <Text style={[styles.dropdownTriggerValueText, { color: selectedOutcomeObj.color }]} numberOfLines={1}>
                    {selectedOutcomeObj.label}
                  </Text>
                </View>
                <View style={styles.dropdownTriggerChevronBox}>
                  <Text style={{ fontSize: 11, color: selectedOutcomeObj.color }}>▼</Text>
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
                        <Text style={styles.modalCloseBtnText}>✕ Close</Text>
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
                            <Text style={{ fontSize: 18, marginRight: 12 }}>{o.icon}</Text>
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
                <Text style={styles.subHeadingLabel}>Lead Priority</Text>
              </View>
              <View style={styles.tempRow}>
                <TouchableOpacity
                  style={[
                    styles.tempBtn,
                    leadTemperature === 'Hot' && { backgroundColor: '#FEF2F2', borderColor: '#DC2626', borderWidth: 1.5 },
                  ]}
                  onPress={() => setLeadTemperature('Hot')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 15 }}>🔥</Text>
                  <Text style={[styles.tempBtnText, leadTemperature === 'Hot' && { color: '#DC2626', fontWeight: '900' }]}>
                    Hot Deal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tempBtn,
                    leadTemperature === 'Warm' && { backgroundColor: '#FFFBEB', borderColor: '#D97706', borderWidth: 1.5 },
                  ]}
                  onPress={() => setLeadTemperature('Warm')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 15 }}>☀️</Text>
                  <Text style={[styles.tempBtnText, leadTemperature === 'Warm' && { color: '#D97706', fontWeight: '900' }]}>
                    Warm Lead
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tempBtn,
                    leadTemperature === 'Future' && { backgroundColor: '#EFF6FF', borderColor: '#2563EB', borderWidth: 1.5 },
                  ]}
                  onPress={() => setLeadTemperature('Future')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 15 }}>⏳</Text>
                  <Text style={[styles.tempBtnText, leadTemperature === 'Future' && { color: '#2563EB', fontWeight: '900' }]}>
                    Future
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Next Follow-up Schedule & Valuation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>2. Schedule & Valuation</Text>
              
              {/* Next Follow-up Date */}
              <View style={styles.scheduleRowHeader}>
                <Text style={styles.subHeadingLabel}>Next Reminder Date *</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
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
                <Text style={{ fontSize: 14, marginRight: 8 }}>📅</Text>
                <TextInput
                  style={styles.dateTextInput}
                  value={nextFollowUp}
                  onChangeText={setNextFollowUp}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Deal / Quotation Value */}
              <View style={[styles.scheduleRowHeader, { marginTop: 12 }]}>
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
              <Text style={styles.sectionHeading}>3. Discussion Notes & Remarks</Text>
              
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
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {outcome === 'Deal Lost / Postponed' ? '✕ Record Lost Deal' : '✓ Save Follow-up Activity'}
                </Text>
              )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  headerIconBoxLight: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleLight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerIdBadgeLight: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  headerIdBadgeTextLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerSubtitleLight: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerCloseBtnLight: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerCloseBtnTextLight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  scroll: {
    flexGrow: 0,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dropdownTriggerBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  dropdownTriggerValueText: {
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
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
    paddingVertical: 10,
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
    backgroundColor: '#F1F5F9',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
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
    fontSize: 13.5,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tempRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tempBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  scheduleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quickDayBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
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
    fontSize: 13.5,
    fontWeight: '700',
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
    height: 42,
  },
  currencyPrefixBadgeEmerald: {
    backgroundColor: '#ECFDF5',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefixTextEmerald: {
    fontSize: 15,
    fontWeight: '900',
    color: '#047857',
  },
  quoteTextInput: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  snippetChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  snippetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  notesTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    minHeight: 80,
    textAlignVertical: 'top',
  },
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
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
