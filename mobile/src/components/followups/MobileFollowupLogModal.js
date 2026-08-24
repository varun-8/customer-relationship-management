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
  'Spoke with Customer / Positive Interest',
  'Customer Visiting Showroom Today / Soon',
  'Sent Revised Quotation / Discount Provided',
  'No Answer / Customer Busy / Callback Requested',
  'Negotiating Final Price / Competitor Comparison',
  'Site Measurement Scheduled',
  'Order Confirmed / Ready for Billing',
  'Deal Lost / Postponed',
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
          '📡 Connection Issue',
          res?.message || 'Could not save follow-up to the server. Please check your network connection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handleSubmit },
          ]
        );
      }
    } catch (e) {
      Alert.alert(
        '📡 Network Error',
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
          {/* Signature Dark Header */}
          <View style={styles.headerDark}>
            <View style={styles.headerIconBox}>
              <Text style={{ fontSize: 20 }}>📞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.headerTitleDark}>Log Follow-up Activity</Text>
                {followUp.customerId && (
                  <View style={styles.headerIdBadge}>
                    <Text style={styles.headerIdBadgeText}>#{followUp.customerId}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitleDark} numberOfLines={1}>
                {followUp.customerName} • 📞 {followUp.phone || 'No phone'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn} activeOpacity={0.7}>
              <Text style={styles.headerCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ padding: 18 }}>
            {/* Section 1: Outcome Picker */}
            <Text style={styles.sectionLabel}>1. DISCUSSION OUTCOME *</Text>
            <View style={styles.outcomeChipsContainer}>
              {OUTCOMES.map((o) => {
                const isSelected = outcome === o;
                return (
                  <TouchableOpacity
                    key={o}
                    style={[
                      styles.outcomeChip,
                      isSelected && styles.outcomeChipActive,
                      o === 'Deal Lost / Postponed' && isSelected && { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
                    ]}
                    onPress={() => setOutcome(o)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.outcomeChipText,
                        isSelected && styles.outcomeChipTextActive,
                        o === 'Deal Lost / Postponed' && isSelected && { color: '#991B1B' },
                      ]}
                    >
                      {isSelected ? '✓ ' : ''}{o}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Lead Priority Temperature */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>2. LEAD PRIORITY TEMPERATURE *</Text>
            <View style={styles.tempRow}>
              <TouchableOpacity
                style={[
                  styles.tempBtn,
                  leadTemperature === 'Hot' && { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
                ]}
                onPress={() => setLeadTemperature('Hot')}
              >
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <Text style={[styles.tempBtnText, leadTemperature === 'Hot' && { color: '#DC2626', fontWeight: '900' }]}>
                  Hot
                </Text>
                <Text style={styles.tempBtnSub}>Closing Soon</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tempBtn,
                  leadTemperature === 'Warm' && { backgroundColor: '#FFFBEB', borderColor: '#D97706' },
                ]}
                onPress={() => setLeadTemperature('Warm')}
              >
                <Text style={{ fontSize: 16 }}>☀️</Text>
                <Text style={[styles.tempBtnText, leadTemperature === 'Warm' && { color: '#D97706', fontWeight: '900' }]}>
                  Warm
                </Text>
                <Text style={styles.tempBtnSub}>Evaluating</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tempBtn,
                  leadTemperature === 'Future' && { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
                ]}
                onPress={() => setLeadTemperature('Future')}
              >
                <Text style={{ fontSize: 16 }}>⏳</Text>
                <Text style={[styles.tempBtnText, leadTemperature === 'Future' && { color: '#2563EB', fontWeight: '900' }]}>
                  Future
                </Text>
                <Text style={styles.tempBtnSub}>Site Stage</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Next Follow-up Date & Quick Helpers */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 6 }}>
              <Text style={styles.sectionLabel}>3. NEXT FOLLOW-UP DATE *</Text>
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

            <TextInput
              style={styles.textInput}
              value={nextFollowUp}
              onChangeText={setNextFollowUp}
              placeholder="YYYY-MM-DD (e.g. 2026-08-20)"
            />

            {/* Section 4: Quotation Value */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>4. DEAL / QUOTATION VALUE (₹)</Text>
            <View style={styles.quoteValueInputWrapper}>
              <View style={styles.currencyPrefixBadgeEmerald}>
                <Text style={styles.currencyPrefixTextEmerald}>₹</Text>
              </View>
              <TextInput
                style={[styles.textInput, { flex: 1, borderWidth: 0, fontWeight: '800', color: '#059669', fontSize: 15 }]}
                value={quotationValue}
                onChangeText={setQuotationValue}
                keyboardType="numeric"
                placeholder="e.g. 150000"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Section 5: Discussion Notes */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>5. DISCUSSION REMARKS & NOTES</Text>
            <TextInput
              style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
              value={discussionNotes}
              onChangeText={setDiscussionNotes}
              multiline
              placeholder="e.g. Customer liked 4x2 marble tiles, requested 5% adhesive discount..."
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {outcome === 'Deal Lost / Postponed' ? 'Record Lost Deal →' : '✓ Save Follow-up'}
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  headerDark: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitleDark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitleDark: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  headerIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerIdBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#93C5FD',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  scroll: {
    marginVertical: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  outcomeChipsContainer: {
    gap: 6,
  },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  outcomeChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  outcomeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  outcomeChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  tempRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  tempBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  tempBtnSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  quickDayBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDayText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  quoteValueInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  currencyPrefixBadgeEmerald: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefixTextEmerald: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
