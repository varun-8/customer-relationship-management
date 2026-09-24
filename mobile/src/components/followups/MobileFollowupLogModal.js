import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { MobileCalendarModal } from '../common/MobileCalendarModal';

const OUTCOMES = [
  { label: 'Spoke with Customer / Positive Interest', shortLabel: 'Positive Interest', icon: 'checkmark-circle', color: '#2563EB' },
  { label: 'Customer Visiting Showroom Today / Soon', shortLabel: 'Visiting Showroom', icon: 'storefront-outline', color: '#059669' },
  { label: 'Sent Revised Quotation / Discount Provided', shortLabel: 'Sent Revised Quote', icon: 'document-text-outline', color: '#7C3AED' },
  { label: 'No Answer / Customer Busy / Callback Requested', shortLabel: 'No Answer / Busy', icon: 'time-outline', color: '#D97706' },
  { label: 'Negotiating Final Price / Competitor Comparison', shortLabel: 'Price Negotiation', icon: 'cash-outline', color: '#0284C7' },
  { label: 'Site Measurement Scheduled', shortLabel: 'Site Measurement', icon: 'compass-outline', color: '#4F46E5' },
  { label: 'Order Confirmed / Ready for Billing', shortLabel: 'Order Confirmed', icon: 'ribbon-outline', color: '#10B981' },
  { label: 'Deal Lost / Postponed', shortLabel: 'Deal Lost / Postponed', icon: 'close-circle-outline', color: '#DC2626' },
];

const PIPELINE_STATUSES = [
  'Newly Contacted',
  'Requirement Collected',
  'Quotation Provided',
  'Negotiation & Follow-up',
  'Won - Closed',
  'Lost Sale',
];

const STAGES = [
  'Foundation',
  'Brickwork',
  'Plastering',
  'Painting',
  'Building Completion',
  'Renovation',
];

const TEMPERATURES = [
  { label: 'Hot', title: 'Hot Deal', icon: 'flame', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { label: 'Warm', title: 'Warm Lead', icon: 'flash', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Future', title: 'Future', icon: 'calendar', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
];

const QUICK_SNIPPETS = [
  'Liked showroom tile samples',
  'Negotiating 5-10% discount',
  'Scheduled site measurement',
  'Shared quote PDF on WhatsApp',
  'Callback requested in evening',
  'Comparing with competitor rates',
];

// Parse historical discussion notes and conversation remarks
const parseNotesHistory = (followUp) => {
  if (!followUp) return [];
  const f = followUp || {};
  const d = (f.data instanceof Map) ? Object.fromEntries(f.data) : (f.data || f || {});
  const rawNotes = f.notes || d.notes || '';
  const rawDiscussion = f.discussionNotes || d.discussionNotes || '';
  const rawRemarks = f.conversationRemarks || d.conversationRemarks || '';
  const lastReason = f.lastReason || d.lastReason || '';

  const combined = [rawNotes, rawRemarks, rawDiscussion].filter(Boolean).join('\n');
  const lines = combined
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lastReason && lastReason.trim() && !lines.includes(lastReason.trim())) {
    lines.push(lastReason.trim());
  }

  const uniqueLines = [];
  const seen = new Set();
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      uniqueLines.push(line);
    }
  }

  const parsed = uniqueLines.map((line, idx) => {
    const dateMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const rest = dateMatch[2];
      const outcomeMatch = rest.match(/^(.*?):\s*(.*)$/);
      if (outcomeMatch) {
        return {
          id: `note-${idx}`,
          date: dateStr,
          outcome: outcomeMatch[1],
          text: outcomeMatch[2],
        };
      }
      return {
        id: `note-${idx}`,
        date: dateStr,
        outcome: null,
        text: rest,
      };
    }
    return {
      id: `note-${idx}`,
      date: null,
      outcome: null,
      text: line,
    };
  });

  return parsed.reverse();
};

export function MobileFollowupLogModal({
  visible,
  followUp,
  onClose,
  onSaved,
  onOpenLostSale,
}) {

  const safeFollowUp = followUp || {};
  const data = safeFollowUp?.data instanceof Map
    ? Object.fromEntries(safeFollowUp.data)
    : (safeFollowUp?.data || safeFollowUp || {});

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Active section: 'log' (Active by default) | 'info' (Customer Information)
  const [activeTab, setActiveTab] = useState('log');

  const [outcome, setOutcome] = useState('Spoke with Customer / Positive Interest');
  const [pipelineStatus, setPipelineStatus] = useState(safeFollowUp.status || data.status || 'Negotiation & Follow-up');
  const [leadTemperature, setLeadTemperature] = useState(safeFollowUp.leadTemperature || data.leadTemperature || 'Hot');
  const [customerName, setCustomerName] = useState(safeFollowUp.customerName || data.customerName || data.name || '');
  const [phone, setPhone] = useState(safeFollowUp.phone || data.phone || data.mobilePhone || data.mobileNumber || '');
  const [houseStage, setHouseStage] = useState(safeFollowUp.houseStage || data.houseStage || data.stage || 'Plastering');
  const [requirements, setRequirements] = useState(() => {
    const r = safeFollowUp.requirement || data.requirement;
    if (Array.isArray(r)) return r;
    if (typeof r === 'string' && r) {
      return r.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return ['Tiles'];
  });
  const [nextFollowUp, setNextFollowUp] = useState(
    safeFollowUp.nextFollowUp || data.nextFollowUp || tomorrow.toISOString().split('T')[0]
  );
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [quotationValue, setQuotationValue] = useState(() => {
    const q = safeFollowUp.quotationValue !== undefined ? safeFollowUp.quotationValue : data.quotationValue;
    return q !== undefined && q !== null ? String(q) : '';
  });
  const [orderValueAmount, setOrderValueAmount] = useState(() => {
    const ov = safeFollowUp.orderValue !== undefined ? safeFollowUp.orderValue : data.orderValue;
    const qv = safeFollowUp.quotationValue !== undefined ? safeFollowUp.quotationValue : data.quotationValue;
    const val = ov !== undefined && ov !== null ? ov : qv;
    return val !== undefined && val !== null ? String(val) : '';
  });


  // Notes history stream state
  const [notesHistory, setNotesHistory] = useState([]);
  const [savingQuickNote, setSavingQuickNote] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [outcomeModalVisible, setOutcomeModalVisible] = useState(false);
  const [pipelineModalVisible, setPipelineModalVisible] = useState(false);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Smooth slide animation
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && followUp) {
      setActiveTab('log'); // Always default to logging section when opened
      const f = followUp || {};
      const d = (f.data instanceof Map) ? Object.fromEntries(f.data) : (f.data || f || {});
      setPipelineStatus(f.status || d.status || 'Negotiation & Follow-up');
      setLeadTemperature(f.leadTemperature || d.leadTemperature || 'Hot');
      setCustomerName(f.customerName || d.customerName || d.name || '');
      setPhone(f.phone || d.phone || d.mobilePhone || d.mobileNumber || '');
      setHouseStage(f.houseStage || d.houseStage || d.stage || 'Plastering');
      const r = f.requirement || d.requirement;
      setRequirements(Array.isArray(r) ? r : (typeof r === 'string' && r ? r.split(',').map((x) => x.trim()).filter(Boolean) : ['Tiles']));
      setNextFollowUp(f.nextFollowUp || d.nextFollowUp || tomorrow.toISOString().split('T')[0]);
      const q = f.quotationValue !== undefined ? f.quotationValue : d.quotationValue;
      setQuotationValue(q !== undefined && q !== null ? String(q) : '');
      setDiscussionNotes('');
      setNotesHistory(parseNotesHistory(followUp));

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, followUp]);

  const handleSmoothClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  const selectedOutcomeObj = OUTCOMES.find((o) => o.label === outcome) || OUTCOMES[0];

  const handleToggleRequirement = (req) => {
    setRequirements((prev) => {
      if (prev.includes(req)) {
        return prev.filter((r) => r !== req);
      }
      return [...prev, req];
    });
  };

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

  const handleAddQuickNote = async () => {
    const noteText = discussionNotes.trim();
    if (!noteText || !followUp) return;
    setSavingQuickNote(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const newEntry = `[${todayStr}] Remark: ${noteText}`;
      const f = followUp || {};
      const d = (f.data instanceof Map) ? Object.fromEntries(f.data) : (f.data || f || {});
      const existingNotes = f.notes || d.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n${newEntry}` : newEntry;

      const recordId = f._id || f.customerId || d.customerId;
      const res = await apiClient.updateCustomer(recordId, {
        notes: updatedNotes,
        lastReason: newEntry,
        conversationRemarks: (f.conversationRemarks || d.conversationRemarks)
          ? `${f.conversationRemarks || d.conversationRemarks}\n${newEntry}`
          : newEntry,
      });

      if (res && res.success) {
        Alert.alert('Note Recorded', 'Discussion note added to customer history!');
        const updated = {
          ...f,
          notes: updatedNotes,
          lastReason: newEntry,
        };
        setNotesHistory(parseNotesHistory(updated));
        setDiscussionNotes('');
        if (onSaved) onSaved();
      } else {
        Alert.alert('Error', res?.message || 'Failed to record discussion note');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error saving discussion note');
    } finally {
      setSavingQuickNote(false);
    }
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return 'Select Date';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = months[parseInt(parts[1], 10) - 1];
        return `${parseInt(parts[2], 10)} ${m} ${parts[0]}`;
      }
      return dStr;
    } catch (e) {
      return dStr;
    }
  };

  const openWhatsApp = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(`Hello ${customerName || 'Customer'}, following up on your tile requirement.`);
    Linking.openURL(`https://wa.me/${formattedPhone}?text=${text}`);
  };

  const handleSubmit = async () => {
    const isLostTrigger =
      outcome === 'Deal Lost / Postponed' ||
      pipelineStatus === 'Lost' ||
      pipelineStatus === 'Lost Sale' ||
      pipelineStatus === 'Sale Lost' ||
      (pipelineStatus && String(pipelineStatus).toLowerCase().includes('lost'));

    let finalOrderVal = orderValueAmount ? Number(orderValueAmount) : (quotationValue ? Number(quotationValue) : undefined);

    if (isLostTrigger) {
      setSubmitting(true);
      try {
        const recordId = followUp._id || followUp.customerId || data.customerId;
        await apiClient.logFollowupActivity(recordId, {
          outcome,
          customerName: customerName.trim(),
          phone: phone.trim(),
          discussionNotes: discussionNotes.trim(),
          nextFollowUp,
          leadTemperature,
          houseStage,
          quotationValue: quotationValue ? Number(quotationValue) : undefined,
          orderValue: finalOrderVal,
          statusUpdate: 'Lost Sale',
        });
      } catch (logErr) {
        console.warn('Error logging followup prior to MobileLostSale modal:', logErr);
      } finally {
        setSubmitting(false);
      }

      if (onOpenLostSale) {
        onOpenLostSale(followUp);
        handleSmoothClose();
        return;
      }
    }

    const isOrderConfirmedTrigger = outcome === 'Order Confirmed / Ready for Billing' || pipelineStatus === 'Order Confirmed';

    if (isOrderConfirmedTrigger) {
      if (!finalOrderVal || finalOrderVal <= 0) {
        Alert.alert('Confirmed Order Value Required', 'Please enter the confirmed order deal amount (₹) at which the deal is closed.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const recordId = followUp._id || followUp.customerId || data.customerId;
      const res = await apiClient.logFollowupActivity(recordId, {
        outcome,
        customerName: customerName.trim(),
        phone: phone.trim(),
        discussionNotes: discussionNotes.trim(),
        nextFollowUp,
        leadTemperature,
        houseStage,
        requirement: requirements,
        quotationValue: quotationValue ? Number(quotationValue) : undefined,
        orderValue: finalOrderVal,
        statusUpdate: isOrderConfirmedTrigger ? 'Order Confirmed' : (isLostTrigger ? 'Lost Sale' : (pipelineStatus || undefined)),
      });



      if (res && res.success) {
        Alert.alert('Activity Logged', `Follow-up updated for ${customerName || 'Customer'}!`);
        if (onSaved) onSaved();
        handleSmoothClose();
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

  const customerId = followUp?.customerId || data.customerId || 'CUS-000000';
  const customerType = followUp?.customerType || data.customerType || 'Building Owner';
  const location = followUp?.location || data.location || '';
  const leadSource = followUp?.leadSource || data.leadSource || 'Showroom Walk-in';
  const salesperson = followUp?.salesperson || data.salesperson || 'Showroom Team';
  const approxQuantity = followUp?.approxQuantity || data.approxQuantity || '';
  const tileBudget = followUp?.tileBudget || data.tileBudget || '';
  const adhesiveRequirement = followUp?.adhesiveRequirement || data.adhesiveRequirement || 'No';
  const orderValue = followUp?.orderValue || data.orderValue || '';
  const crossSell = followUp?.crossSell || data.crossSell || '';
  const followUpCount = followUp?.followUpCount || data.followUpCount || 0;
  const lastFollowUp = followUp?.lastFollowUp || data.lastFollowUp || '';
  const lastReason = followUp?.lastReason || data.lastReason || '';
  const registeredDate = followUp?.entryDate || data.entryDate || followUp?.createdAt || '';

  if (!visible || !followUp) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleSmoothClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Executive Header Bar */}
          <View style={styles.headerLight}>
            <View style={styles.headerIconBoxLight}>
              <Ionicons name="create-outline" size={20} color="#0F766E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitleMain}>Log Follow-up Activity</Text>
              <Text style={styles.headerSubtitleText}>Record conversation remarks & schedule reminder</Text>
            </View>
            <TouchableOpacity
              onPress={handleSmoothClose}
              style={styles.headerCloseBtnLight}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Top Segmented Navigation Switcher: [Log Activity (Default)] vs [Customer Info] */}
          <View style={styles.segmentedTabWrapper}>
            <TouchableOpacity
              style={[
                styles.segmentedTabBtn,
                activeTab === 'log' && styles.segmentedTabBtnActive,
              ]}
              onPress={() => setActiveTab('log')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="clipboard-outline"
                size={14}
                color={activeTab === 'log' ? '#0F766E' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentedTabText, activeTab === 'log' && styles.segmentedTabTextActive]}>
                Log Activity
              </Text>
              {activeTab === 'log' && <View style={styles.segmentedActiveDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentedTabBtn,
                activeTab === 'info' && styles.segmentedTabBtnActive,
              ]}
              onPress={() => setActiveTab('info')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-circle-outline"
                size={15}
                color={activeTab === 'info' ? '#0F766E' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentedTabText, activeTab === 'info' && styles.segmentedTabTextActive]}>
                Customer Information
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
            {/* Customer Target Profile Header Summary Bar */}
            <View style={styles.customerCard}>
              <View style={styles.customerAvatarCircle}>
                <Text style={styles.customerAvatarText}>
                  {(customerName || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.customerNameRow}>
                  <Text style={styles.customerNameText} numberOfLines={1}>
                    {customerName || 'Customer Lead'}
                  </Text>
                  {customerId && (
                    <View style={styles.headerIdBadgeLight}>
                      <Text style={styles.headerIdBadgeTextLight}>#{customerId}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.customerMetaRow}>
                  {phone ? (
                    <View style={styles.phoneBadge}>
                      <Ionicons name="call-outline" size={12} color="#475569" />
                      <Text style={styles.phoneText}>{phone}</Text>
                    </View>
                  ) : null}

                  {customerType ? (
                    <View style={styles.customerTypePill}>
                      <Text style={styles.customerTypePillText}>{customerType}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Quick Communication Shortcuts */}
              {phone ? (
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.headerActionBtnCall}
                    onPress={() => Linking.openURL(`tel:${phone}`)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={13} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerActionBtnWa}
                    onPress={openWhatsApp}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* TAB 1: LOG ACTIVITY FORM (Active by default) */}
            {activeTab === 'log' ? (
              <View>
                {/* CARD 1: DISCUSSION OUTCOME & PRIORITY DROPDOWN */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#0F766E" />
                    <Text style={styles.sectionHeading}>Call Outcome & Lead Priority</Text>
                  </View>

                  {/* Outcome Dropdown List Box */}
                  <Text style={styles.fieldMicroLabel}>CALL OUTCOME *</Text>
                  <TouchableOpacity
                    style={styles.dropdownTriggerBox}
                    onPress={() => setOutcomeModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownTriggerLeftGroup}>
                      <View style={[styles.outcomeIconBadge, { backgroundColor: selectedOutcomeObj.color }]}>
                        <Ionicons name={selectedOutcomeObj.icon} size={15} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownTriggerValueText, { color: selectedOutcomeObj.color }]} numberOfLines={1}>
                          {selectedOutcomeObj.label}
                        </Text>
                        <Text style={styles.dropdownTriggerHint}>Tap to change outcome</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>

                  {/* Outcome Selection Modal */}
                  <Modal
                    visible={outcomeModalVisible}
                    transparent
                    animationType="fade"
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

                        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                          {OUTCOMES.map((o) => {
                            const isSelected = outcome === o.label;
                            return (
                              <TouchableOpacity
                                key={o.label}
                                style={[
                                  styles.outcomeListItem,
                                  isSelected && { borderColor: o.color, backgroundColor: '#F8FAFC' },
                                ]}
                                onPress={() => {
                                  setOutcome(o.label);
                                  setOutcomeModalVisible(false);
                                }}
                                activeOpacity={0.75}
                              >
                                <View style={[styles.outcomeListIconBadge, { backgroundColor: o.color }]}>
                                  <Ionicons name={o.icon} size={14} color="#FFFFFF" />
                                </View>
                                <Text style={[styles.outcomeListItemText, isSelected && { color: o.color, fontWeight: '900' }]}>
                                  {o.label}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-sharp" size={18} color={o.color} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>

                  {/* Lead Priority Selector */}
                  <View style={[styles.subHeadingRow, { marginTop: 14 }]}>
                    <Text style={styles.fieldMicroLabel}>LEAD PRIORITY TEMPERATURE</Text>
                  </View>
                  <View style={styles.tempRow}>
                    {TEMPERATURES.map((temp) => {
                      const isSelected = leadTemperature === temp.label;
                      return (
                        <TouchableOpacity
                          key={temp.label}
                          style={[
                            styles.tempBtn,
                            isSelected && { backgroundColor: temp.bg, borderColor: temp.border, borderWidth: 1.5 },
                          ]}
                          onPress={() => setLeadTemperature(temp.label)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name={temp.icon} size={14} color={isSelected ? temp.color : '#94A3B8'} />
                          <Text style={[styles.tempBtnText, isSelected && { color: temp.color, fontWeight: '800' }]}>
                            {temp.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Pipeline Stage Status Dropdown */}
                  <View style={[styles.subHeadingRow, { marginTop: 14 }]}>
                    <Text style={styles.fieldMicroLabel}>PIPELINE STAGE STATUS *</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownTriggerBox}
                    onPress={() => setPipelineModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownTriggerLeftGroup}>
                      <View style={[styles.outcomeIconBadge, { backgroundColor: '#2563EB' }]}>
                        <Ionicons name="git-network-outline" size={15} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownTriggerValueText, { color: '#1E293B', fontWeight: '800' }]} numberOfLines={1}>
                          {pipelineStatus}
                        </Text>
                        <Text style={styles.dropdownTriggerHint}>Tap to update deal pipeline status</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>

                  {/* Pipeline Status Selection Modal Sheet */}
                  <Modal
                    visible={pipelineModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPipelineModalVisible(false)}
                  >
                    <View style={styles.outcomeModalBackdrop}>
                      <View style={styles.outcomeModalSheet}>
                        <View style={styles.modalHandleWrapper}>
                          <View style={styles.modalHandle} />
                        </View>

                        <View style={styles.outcomeModalHeader}>
                          <Text style={styles.outcomeModalTitle}>Select Pipeline Status</Text>
                          <TouchableOpacity onPress={() => setPipelineModalVisible(false)} style={styles.modalCloseBtn}>
                            <Text style={styles.modalCloseBtnText}>Done</Text>
                          </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                          {PIPELINE_STATUSES.map((ps) => {
                            const isSelected = pipelineStatus === ps;
                            return (
                              <TouchableOpacity
                                key={ps}
                                style={[
                                  styles.outcomeListItem,
                                  isSelected && { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
                                ]}
                                onPress={() => {
                                  setPipelineStatus(ps);
                                  setPipelineModalVisible(false);
                                }}
                                activeOpacity={0.75}
                              >
                                <View style={[styles.outcomeListIconBadge, { backgroundColor: isSelected ? '#2563EB' : '#94A3B8' }]}>
                                  <Ionicons name="funnel-outline" size={14} color="#FFFFFF" />
                                </View>
                                <Text style={[styles.outcomeListItemText, isSelected && { color: '#2563EB', fontWeight: '900' }]}>
                                  {ps}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-sharp" size={18} color="#2563EB" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>
                </View>

                {/* CARD 2: SITE STAGE & MATERIAL REQUIREMENTS */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="business-outline" size={16} color="#0F766E" />
                    <Text style={styles.sectionHeading}>Site Stage & Requirements</Text>
                  </View>

                  {/* Construction Stage Dropdown List Box */}
                  <Text style={styles.fieldMicroLabel}>CONSTRUCTION / PROJECT STAGE *</Text>
                  <TouchableOpacity
                    style={styles.dropdownTriggerBox}
                    onPress={() => setStageModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownTriggerLeftGroup}>
                      <View style={[styles.outcomeIconBadge, { backgroundColor: '#0F766E' }]}>
                        <Ionicons name="home-outline" size={15} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownTriggerValueText, { color: '#0F172A' }]}>
                          {houseStage}
                        </Text>
                        <Text style={styles.dropdownTriggerHint}>Tap to change construction phase</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>

                  {/* House Stage Selection Modal Sheet */}
                  <Modal
                    visible={stageModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setStageModalVisible(false)}
                  >
                    <View style={styles.outcomeModalBackdrop}>
                      <View style={styles.outcomeModalSheet}>
                        <View style={styles.modalHandleWrapper}>
                          <View style={styles.modalHandle} />
                        </View>

                        <View style={styles.outcomeModalHeader}>
                          <Text style={styles.outcomeModalTitle}>Select Construction Stage</Text>
                          <TouchableOpacity onPress={() => setStageModalVisible(false)} style={styles.modalCloseBtn}>
                            <Text style={styles.modalCloseBtnText}>Done</Text>
                          </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                          {STAGES.map((stg) => {
                            const isSelected = houseStage === stg;
                            return (
                              <TouchableOpacity
                                key={stg}
                                style={[
                                  styles.outcomeListItem,
                                  isSelected && { borderColor: '#0F766E', backgroundColor: '#F0FDFA' },
                                ]}
                                onPress={() => {
                                  setHouseStage(stg);
                                  setStageModalVisible(false);
                                }}
                                activeOpacity={0.75}
                              >
                                <View style={[styles.outcomeListIconBadge, { backgroundColor: isSelected ? '#0F766E' : '#E2E8F0' }]}>
                                  <Ionicons name="hammer-outline" size={14} color={isSelected ? '#FFFFFF' : '#64748B'} />
                                </View>
                                <Text style={[styles.outcomeListItemText, isSelected && { color: '#0F766E', fontWeight: '900' }]}>
                                  {stg}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-sharp" size={18} color="#0F766E" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>

                  {/* Tile & Floor Material Requirements (Multi-select) */}
                  <View style={[styles.subHeadingRow, { marginTop: 14 }]}>
                    <Text style={styles.fieldMicroLabel}>MATERIAL REQUIREMENTS CATEGORIES</Text>
                  </View>
                  <View style={styles.reqTagsWrap}>
                    {['Tiles', 'Sanitary', 'Adhesive / Epoxy', 'CP Fittings', 'Bath Fittings', 'Kitchen Sinks'].map((req) => {
                      const isSelected = requirements.includes(req);
                      return (
                        <TouchableOpacity
                          key={req}
                          onPress={() => handleToggleRequirement(req)}
                          style={[styles.reqTagBtn, isSelected && styles.reqTagBtnActive]}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.reqTagBtnText, isSelected && styles.reqTagBtnTextActive]}>
                            {isSelected ? '✓ ' : '+ '}{req}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Deal / Quotation Value */}
                  <View style={[styles.subHeadingRow, { marginTop: 14 }]}>
                    <Text style={styles.fieldMicroLabel}>DEAL / QUOTATION VALUE (₹)</Text>
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

                  {/* Confirmed Order Value (Shown when Order Confirmed option is selected) */}
                  {(outcome === 'Order Confirmed / Ready for Billing' || pipelineStatus === 'Order Confirmed') && (
                    <View style={{ marginTop: 14, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC', borderRadius: 14, padding: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Ionicons name="ribbon" size={16} color="#059669" />
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#166534', letterSpacing: 0.5 }}>
                          CONFIRMED ORDER VALUE (₹) *
                        </Text>
                      </View>
                      <View style={styles.quoteValueInputWrapper}>
                        <View style={[styles.currencyPrefixBadgeEmerald, { backgroundColor: '#10B981' }]}>
                          <Text style={[styles.currencyPrefixTextEmerald, { color: '#FFFFFF' }]}>₹</Text>
                        </View>
                        <TextInput
                          style={[styles.quoteTextInput, { flex: 1, backgroundColor: '#FFFFFF', borderColor: '#86EFAC', fontWeight: '900', color: '#065F46' }]}
                          value={orderValueAmount}
                          onChangeText={setOrderValueAmount}
                          keyboardType="numeric"
                          placeholder="e.g. 150000"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                      <Text style={{ fontSize: 11.5, color: '#15803D', fontWeight: '700', marginTop: 6 }}>
                        ✓ Setting this value marks the deal as Order Confirmed and records total billing revenue.
                      </Text>
                    </View>
                  )}
                </View>


                {/* CARD 3: SCHEDULE REMINDER DATE */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="calendar-outline" size={16} color="#0F766E" />
                    <Text style={styles.sectionHeading}>Next Follow-up Reminder Schedule</Text>
                  </View>

                  <View style={styles.scheduleRowHeader}>
                    <Text style={styles.fieldMicroLabel}>SCHEDULED REMINDER DATE *</Text>
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

                  <TouchableOpacity
                    style={styles.modernDateTrigger}
                    onPress={() => setCalendarVisible(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dateTriggerLeft}>
                      <View style={styles.calendarIconCircle}>
                        <Ionicons name="calendar" size={16} color="#0F766E" />
                      </View>
                      <View>
                        <Text style={styles.dateTriggerLabel}>SCHEDULED FOR</Text>
                        <Text style={styles.dateTriggerVal}>{formatDisplayDate(nextFollowUp)}</Text>
                      </View>
                    </View>
                    <View style={styles.changeDatePill}>
                      <Text style={styles.changeDatePillText}>Change Date ›</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Reusable Calendar Modal */}
                  <MobileCalendarModal
                    visible={calendarVisible}
                    value={nextFollowUp}
                    onSelect={(date) => setNextFollowUp(date)}
                    onClose={() => setCalendarVisible(false)}
                    title="Schedule Follow-up Date"
                    accentColor="#0F766E"
                  />
                </View>

                {/* CARD 4: SEPARATE DEDICATED SECTION FOR DISCUSSION & CUSTOMER NOTES */}
                <View style={[styles.sectionCard, styles.notesDedicatedCard]}>
                  {/* Section Heading */}
                  <View style={styles.sectionHeadingRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={styles.notesSectionIconCircle}>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#0F766E" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sectionHeading}>4. Discussion & Customer Notes</Text>
                        <Text style={styles.notesSectionSubtext}>Record conversation summary & commitments</Text>
                      </View>
                    </View>
                  </View>

                  {/* B: Quick Discussion Snippets */}
                  <Text style={[styles.fieldMicroLabel, { marginTop: 4 }]}>QUICK REMARK SNIPPETS (TAP TO APPEND)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
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

                  {/* Multi-line Notes Text Input */}
                  <Text style={[styles.fieldMicroLabel, { marginTop: 8 }]}>NEW DISCUSSION REMARK / CUSTOMER NOTES</Text>
                  <TextInput
                    style={styles.notesTextInput}
                    value={discussionNotes}
                    onChangeText={setDiscussionNotes}
                    multiline
                    placeholder="Type detailed customer conversation notes, requirements, objections or price negotiations..."
                    placeholderTextColor="#94A3B8"
                  />

                  {/* Sub-bar with quick save note option */}
                  <View style={styles.addNoteActionRow}>
                    <Text style={styles.notesSubHint} numberOfLines={1}>
                      💡 Auto-saved to history on submit.
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addNoteBtn,
                        (!discussionNotes.trim() || savingQuickNote) && { opacity: 0.5 },
                      ]}
                      onPress={handleAddQuickNote}
                      disabled={!discussionNotes.trim() || savingQuickNote}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="add" size={14} color="#0F172A" />
                      <Text style={styles.addNoteBtnText}>
                        {savingQuickNote ? 'Saving...' : 'Add Note Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* TAB 2: CUSTOMER INFORMATION VIEW */
              <View>
                {/* 1. Contact & Profile Details Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="person-outline" size={16} color="#2563EB" />
                    <Text style={styles.sectionHeading}>1. Contact & Profile Information</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Customer ID</Text>
                    <Text style={[styles.infoValue, { fontFamily: 'monospace', fontWeight: '800', color: '#2563EB' }]}>
                      {customerId}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Client Name</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800' }]}>
                      {customerName || '—'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mobile Number</Text>
                    <Text style={[styles.infoValue, { fontFamily: 'monospace', fontWeight: '800' }]}>
                      {phone || '—'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Site / Location</Text>
                    <Text style={styles.infoValue}>
                      {location || '—'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Customer Type</Text>
                    <View style={styles.infoBadge}>
                      <Text style={styles.infoBadgeText}>{customerType}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Lead Source</Text>
                    <Text style={styles.infoValue}>
                      {leadSource}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Salesperson Assigned</Text>
                    <Text style={[styles.infoValue, { color: '#2563EB', fontWeight: '800' }]}>
                      {salesperson}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Registration Date</Text>
                    <Text style={styles.infoValue}>
                      {registeredDate ? formatDisplayDate(registeredDate) : 'Recent'}
                    </Text>
                  </View>
                </View>

                {/* 2. Project & Material Specifications Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="cube-outline" size={16} color="#059669" />
                    <Text style={styles.sectionHeading}>2. Project & Material Specifications</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>House Stage</Text>
                    <View style={[styles.infoBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Text style={[styles.infoBadgeText, { color: '#1D4ED8' }]}>{houseStage}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Requirements</Text>
                    <Text style={[styles.infoValue, { fontWeight: '700' }]}>
                      {requirements.join(', ') || 'Tiles'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Approx Coverage Area</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800' }]}>
                      {approxQuantity ? `${approxQuantity} sq.ft` : '—'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tile Target Budget</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800', color: '#0F172A' }]}>
                      {tileBudget ? `₹ ${Number(tileBudget).toLocaleString('en-IN')}` : '—'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Adhesive / Epoxy Req.</Text>
                    <Text style={[styles.infoValue, { fontWeight: '700' }]}>
                      {adhesiveRequirement}
                    </Text>
                  </View>
                </View>

                {/* 3. Quotation & Commercial Details Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="cash-outline" size={16} color="#EA580C" />
                    <Text style={styles.sectionHeading}>3. Quotation & Commercial Details</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Quotation Value</Text>
                    <Text style={[styles.infoValue, { fontSize: 15, fontWeight: '900', color: '#0F172A' }]}>
                      {quotationValue ? `₹ ${Number(quotationValue).toLocaleString('en-IN')}` : '—'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Pipeline Status</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800', color: '#2563EB' }]}>
                      {data.status || 'Follow-up'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Confirmed Order Value</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800', color: orderValue ? '#15803D' : '#94A3B8' }]}>
                      {orderValue ? `₹ ${Number(orderValue).toLocaleString('en-IN')}` : 'Pending Confirmation'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Cross-Sell Interest</Text>
                    <Text style={styles.infoValue}>
                      {crossSell || 'None specified'}
                    </Text>
                  </View>
                </View>

                {/* 4. Follow-up History & Activity Summary Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="time-outline" size={16} color="#2563EB" />
                    <Text style={styles.sectionHeading}>4. Follow-up Activity Records</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Follow-ups Logged</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800' }]}>
                      {followUpCount} interaction(s)
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Follow-up Date</Text>
                    <Text style={styles.infoValue}>
                      {lastFollowUp || 'Not yet logged'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Next Scheduled Follow-up</Text>
                    <Text style={[styles.infoValue, { fontWeight: '800', color: '#2563EB' }]}>
                      {formatDisplayDate(nextFollowUp)}
                    </Text>
                  </View>

                  {lastReason ? (
                    <View style={[styles.previousContextBox, { marginTop: 10 }]}>
                      <Text style={styles.previousContextLabel}>LAST DISCUSSION REMARKS:</Text>
                      <Text style={styles.previousContextText}>
                        "{lastReason}"
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Switch back button */}
                <TouchableOpacity
                  style={styles.switchBackToLogBtn}
                  onPress={() => setActiveTab('log')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back-outline" size={15} color="#0F766E" />
                  <Text style={styles.switchBackToLogText}>Return to Logging Form</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Footer (Only visible on Log Activity tab) */}
          {activeTab === 'log' ? (
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleSmoothClose} activeOpacity={0.75}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: outcome === 'Deal Lost / Postponed' ? '#FEF2F2' : '#EFF6FF',
                    borderWidth: 1.5,
                    borderColor: outcome === 'Deal Lost / Postponed' ? '#FECDD3' : '#BFDBFE',
                  },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <View style={styles.saveBtnGradient}>
                  {submitting ? (
                    <ActivityIndicator size="small" color={outcome === 'Deal Lost / Postponed' ? '#DC2626' : '#1D4ED8'} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <Ionicons
                        name={outcome === 'Deal Lost / Postponed' ? 'close-outline' : 'checkmark-outline'}
                        size={18}
                        color={outcome === 'Deal Lost / Postponed' ? '#DC2626' : '#1D4ED8'}
                      />
                      <Text
                        style={[
                          styles.saveBtnText,
                          { color: outcome === 'Deal Lost / Postponed' ? '#DC2626' : '#1D4ED8' },
                        ]}
                      >
                        {outcome === 'Deal Lost / Postponed' ? 'Record Lost Deal' : 'Save Follow-up Activity'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

            </View>
          ) : (
            <View style={styles.footerRow}>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={handleSmoothClose} activeOpacity={0.75}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { flex: 1.5, backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE' },
                ]}
                onPress={() => setActiveTab('log')}
                activeOpacity={0.85}
              >
                <View style={styles.saveBtnGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Ionicons name="clipboard-outline" size={16} color="#1D4ED8" />
                    <Text style={[styles.saveBtnText, { color: '#1D4ED8' }]}>Log Activity Now</Text>
                  </View>
                </View>
              </TouchableOpacity>

            </View>
          )}
        </Animated.View>
      </Animated.View>
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '94%',
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  headerIconBoxLight: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleMain: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitleText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  headerCloseBtnLight: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  segmentedTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentedTabBtnActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  segmentedTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentedTabTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  segmentedActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0F766E',
    marginLeft: 6,
  },
  scroll: {
    flexGrow: 1,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  customerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  customerNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerIdBadgeLight: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headerIdBadgeTextLight: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phoneText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  customerTypePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  customerTypePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  headerActionBtnCall: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnWa: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  notesDedicatedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0F766E',
    backgroundColor: '#FFFFFF',
  },
  notesSectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesSectionSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  fieldMicroLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  subHeadingRow: {
    marginBottom: 6,
  },
  dropdownTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  dropdownTriggerValueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dropdownTriggerHint: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  outcomeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  outcomeModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  modalHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  outcomeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  outcomeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 6,
    gap: 10,
  },
  outcomeListIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeListItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  tempRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tempBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  reqTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reqTagBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reqTagBtnActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  reqTagBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  reqTagBtnTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  quoteValueInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  currencyPrefixBadgeEmerald: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#99F6E4',
  },
  currencyPrefixTextEmerald: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F766E',
  },
  quoteTextInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  scheduleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  quickDayBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickDayText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  modernDateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
  },
  dateTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTriggerLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  dateTriggerVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  changeDatePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeDatePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  snippetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  snippetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  previousContextBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  previousContextLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  previousContextText: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  notesTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    minHeight: 100,
    lineHeight: 18,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  notesSubHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  notesCountBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  notesCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  noNotesBox: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noNotesText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  noteHistoryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  noteDateBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  noteDateBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
  },
  noteOutcomeBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    maxWidth: '60%',
  },
  noteOutcomeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  noteBodyText: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16,
    fontWeight: '500',
  },
  addNoteActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  addNoteBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Customer info tab styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  infoBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  switchBackToLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  switchBackToLogText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
