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
  const [nextFollowUp, setNextFollowUp] = useState(
    followUp.nextFollowUp || tomorrow.toISOString().split('T')[0]
  );
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [quotationValue, setQuotationValue] = useState(
    followUp.quotationValue !== undefined ? String(followUp.quotationValue) : ''
  );
  const [submitting, setSubmitting] = useState(false);

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
        discussionNotes: discussionNotes.trim(),
        nextFollowUp,
        leadTemperature,
        quotationValue: quotationValue ? Number(quotationValue) : undefined,
        statusUpdate: outcome === 'Order Confirmed / Ready for Billing' ? 'Order Confirmed' : undefined,
      });

      if (res && res.success) {
        Alert.alert('✓ Activity Logged', `Follow-up updated for ${followUp.customerName}!`);
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
          {/* Top Sheet Drag Handle */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Clean Light Header */}
          <View style={styles.headerLight}>
            <View style={styles.headerIconBoxLight}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.headerTitleLight}>Log Follow-up Activity</Text>
                {followUp.customerId && (
                  <View style={styles.headerIdBadgeLight}>
                    <Text style={styles.headerIdBadgeTextLight}>#{followUp.customerId}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitleLight} numberOfLines={1}>
                {followUp.customerName} {followUp.phone ? `• 📱 ${followUp.phone}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseBtnLight} activeOpacity={0.7}>
              <Text style={styles.headerCloseBtnTextLight}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
            {/* 1. Discussion Outcome */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>1. Call Outcome *</Text>
              <View style={styles.outcomeGrid}>
                {OUTCOMES.map((o) => {
                  const isSelected = outcome === o.label;
                  const isLost = o.label === 'Deal Lost / Postponed';

                  return (
                    <TouchableOpacity
                      key={o.label}
                      style={[
                        styles.outcomeCard,
                        isSelected && {
                          backgroundColor: isLost ? '#FEF2F2' : o.bg,
                          borderColor: isLost ? '#DC2626' : o.color,
                          borderWidth: 1.5,
                        },
                      ]}
                      onPress={() => setOutcome(o.label)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.outcomeIconCircle, { backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9' }]}>
                        <Text style={{ fontSize: 13 }}>{o.icon}</Text>
                      </View>
                      <Text
                        style={[
                          styles.outcomeCardText,
                          isSelected && { color: isLost ? '#DC2626' : o.color, fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {o.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Lead Priority Temperature Integrated Inside Section 1 */}
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
              
              {/* Quick Snippet Chips placed directly above textarea */}
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
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconBoxLight: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  headerTitleLight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitleLight: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerIdBadgeLight: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  headerIdBadgeTextLight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
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
    marginVertical: 0,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subHeadingRow: {
    marginTop: 12,
    marginBottom: 6,
  },
  subHeadingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  outcomeCard: {
    width: '48.6%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 9.5,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 7,
  },
  outcomeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeCardText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    flex: 1,
  },
  tempRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tempBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: -0.2,
  },
  scheduleRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickDayBtn: {
    paddingHorizontal: 8.5,
    paddingVertical: 3.5,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
  },
  quickDayText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    paddingVertical: 0,
  },
  quoteValueInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  currencyPrefixBadgeEmerald: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1.2,
    borderRightColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefixTextEmerald: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  quoteTextInput: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    color: '#059669',
    fontWeight: '900',
  },
  snippetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
  },
  snippetChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  notesTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    height: 78,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: -0.2,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
