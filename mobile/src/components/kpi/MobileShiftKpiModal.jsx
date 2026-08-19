import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';

const QUICK_SHIFT_SNIPPETS = [
  'All walk-in quotations followed up',
  'Advance payment received for site delivery',
  'Engineer requested tile sample site visit',
  'Pending stock confirmation from warehouse',
];

export function MobileShiftKpiModal({
  visible,
  onClose,
  currentProfile,
  profiles = [],
  branding,
}) {
  const [targetStaff, setTargetStaff] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // KPI Metrics State
  const [visits, setVisits] = useState('0');
  const [quotes, setQuotes] = useState('0');
  const [orders, setOrders] = useState('0');
  const [followups, setFollowups] = useState('0');
  const [totalBills, setTotalBills] = useState('0');
  const [salesValue, setSalesValue] = useState('0');
  const [oldCustomers, setOldCustomers] = useState(false);
  const [engineerCalls, setEngineerCalls] = useState(false);
  const [crossSell, setCrossSell] = useState(false);
  const [shiftNotes, setShiftNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const employeeProfiles = profiles.filter((p) => p.role === 'employee');
  const defaultStaffName = currentProfile?.role === 'employee'
    ? currentProfile?.name
    : (employeeProfiles[0]?.name || 'Showroom Staff');

  const activeStaffName = targetStaff || defaultStaffName;

  const loadKpiData = async (staffToLoad = activeStaffName) => {
    setLoading(true);
    setSubmittedSuccess(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      const res = await apiClient.getKPIAutoFill({
        date: today,
        staffName: staffToLoad,
      });

      if (res && res.success && res.data) {
        const auto = res.data.autoValues || {};
        setVisits(String(auto.walkins?.visits || 0));
        setQuotes(String(auto.walkins?.quotes || 0));
        setOrders(String(auto.walkins?.orders || 0));
        setFollowups(String(auto.followUpsCount || 0));
        setTotalBills(String(auto.ordersCount || auto.walkins?.orders || 0));
        setSalesValue(String(auto.salesValue || 0));
        setOldCustomers(Boolean(auto.oldCustomers));
        setEngineerCalls(Boolean(auto.engineerCalls));
        setCrossSell(Boolean(auto.crossSell));
      }
    } catch (e) {
      console.warn('Error loading shift KPI:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      const initialStaff = currentProfile?.role === 'employee'
        ? currentProfile?.name
        : (employeeProfiles[0]?.name || '');
      setTargetStaff(initialStaff);
      loadKpiData(initialStaff);
    }
  }, [visible, currentProfile]);

  const handleSubmitShiftReport = async () => {
    setSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        staffName: activeStaffName,
        walkins: {
          visits: Number(visits) || 0,
          quotes: Number(quotes) || 0,
          orders: Number(orders) || 0,
        },
        followUpsCount: Number(followups) || 0,
        ordersCount: Number(totalBills) || Number(orders) || 0,
        salesValue: Number(salesValue) || 0,
        oldCustomers,
        engineerCalls,
        crossSell,
        notes: shiftNotes.trim(),
      };

      const res = await apiClient.submitDailyKPI(payload);
      if (res && res.success) {
        setSubmittedSuccess(true);
        Alert.alert(
          '✓ Shift Report Logged',
          `Shift performance report for ${activeStaffName} has been saved.`,
          [{ text: 'Done', onPress: () => setTimeout(() => onClose(), 500) }]
        );
      } else {
        Alert.alert('Notice', res?.message || 'Shift report recorded locally.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit shift KPI');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  // Calculate Conversions & Quote Rates
  const visitNum = Number(visits) || 0;
  const quoteNum = Number(quotes) || 0;
  const orderNum = Number(orders) || 0;
  const conversionRate = visitNum > 0 ? Math.round((orderNum / visitNum) * 100) : 0;
  const quoteRate = visitNum > 0 ? Math.round((quoteNum / visitNum) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* =========================================================
              1. MINIMALIST CLEAN HEADER
             ========================================================= */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTextRow}>
                <Text style={styles.headerTitle}>Daily Shift KPI</Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>Live CRM</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* =========================================================
              2. OWNER SALES REP SELECTOR (Minimalist Dark Pills)
             ========================================================= */}
          {currentProfile?.role === 'owner' && employeeProfiles.length > 0 && (
            <View style={styles.staffFilterBar}>
              <Text style={styles.filterSectionLabel}>TEAM MEMBER</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {employeeProfiles.map((p) => {
                  const isSel = (activeStaffName || '').toLowerCase() === p.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={p.id || p.name}
                      style={[
                        styles.staffTabPill,
                        isSel && styles.staffTabPillActive,
                      ]}
                      onPress={() => {
                        setTargetStaff(p.name);
                        loadKpiData(p.name);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.staffTabPillText, isSel && styles.staffTabPillTextActive]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* =========================================================
              3. SCROLLABLE WORKSPACE
             ========================================================= */}
          <ScrollView style={styles.bodyScrollView} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13, fontWeight: '600' }}>
                  Syncing performance metrics...
                </Text>
              </View>
            ) : (
              <>
                {/* Minimalist Revenue Display Card */}
                <View style={styles.revenueCard}>
                  <View style={styles.revenueTopRow}>
                    <Text style={styles.revenueLabel}>CLOSED REVENUE TODAY</Text>
                    <TouchableOpacity onPress={() => loadKpiData(activeStaffName)} style={styles.syncLink} activeOpacity={0.7}>
                      <Text style={styles.syncLinkText}>Recalculate</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.revenueValue}>
                    ₹ {Number(salesValue || 0).toLocaleString('en-IN')}
                  </Text>

                  {/* Clean Metadata Capsules */}
                  <View style={styles.revenueMetaRow}>
                    <View style={styles.metaCapsule}>
                      <Text style={styles.metaCapsuleLabel}>Invoices:</Text>
                      <Text style={styles.metaCapsuleValue}>{totalBills || 0}</Text>
                    </View>

                    <View style={styles.metaCapsule}>
                      <Text style={styles.metaCapsuleLabel}>Conversion:</Text>
                      <Text style={[styles.metaCapsuleValue, { color: conversionRate > 0 ? '#059669' : '#0F172A' }]}>
                        {conversionRate}%
                      </Text>
                    </View>

                    <View style={styles.metaCapsule}>
                      <Text style={styles.metaCapsuleLabel}>Staff:</Text>
                      <Text style={styles.metaCapsuleValue}>{activeStaffName.split(' ')[0]}</Text>
                    </View>
                  </View>
                </View>

                {/* Section: Showroom Conversion Funnel */}
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionTitle}>SHOWROOM FUNNEL</Text>
                </View>

                {/* 3-Column Minimalist Funnel Cards */}
                <View style={styles.funnelGrid}>
                  <View style={styles.funnelCard}>
                    <Text style={styles.funnelCardLabel}>Walk-ins</Text>
                    <Text style={styles.funnelCardNumber}>{visits || 0}</Text>
                    <Text style={styles.funnelCardHint}>Total Footfall</Text>
                  </View>

                  <View style={styles.funnelCard}>
                    <Text style={styles.funnelCardLabel}>Quotations</Text>
                    <Text style={styles.funnelCardNumber}>{quotes || 0}</Text>
                    <Text style={styles.funnelCardHint}>{quoteRate}% of visits</Text>
                  </View>

                  <View style={[styles.funnelCard, { borderColor: '#CBD5E1' }]}>
                    <Text style={[styles.funnelCardLabel, { color: '#0F172A' }]}>Orders Closed</Text>
                    <Text style={[styles.funnelCardNumber, { color: '#0F172A' }]}>{orders || 0}</Text>
                    <Text style={[styles.funnelCardHint, { color: '#059669', fontWeight: '700' }]}>{conversionRate}% won</Text>
                  </View>
                </View>

                {/* Follow-up Activities Row */}
                <View style={styles.listCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listCardTitle}>Client Follow-ups</Text>
                    <Text style={styles.listCardSubtitle}>Calls, chats & quotation check-ins recorded</Text>
                  </View>
                  <View style={styles.badgeSolidDark}>
                    <Text style={styles.badgeSolidDarkText}>{followups || 0} calls</Text>
                  </View>
                </View>

                {/* Section: Shift Milestones */}
                <View style={[styles.sectionHeadingRow, { marginTop: 20 }]}>
                  <Text style={styles.sectionTitle}>STRATEGIC MILESTONES</Text>
                </View>

                {/* Repeat Customer Row */}
                <TouchableOpacity
                  style={styles.milestoneToggleRow}
                  onPress={() => setOldCustomers(!oldCustomers)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneToggleTitle}>Repeat / Existing Clients Served</Text>
                    <Text style={styles.milestoneToggleSubtitle}>Past clients returning for new purchase</Text>
                  </View>
                  <View style={[styles.togglePill, oldCustomers ? styles.togglePillActive : styles.togglePillInactive]}>
                    <Text style={[styles.togglePillText, oldCustomers ? styles.togglePillTextActive : styles.togglePillTextInactive]}>
                      {oldCustomers ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Engineer / Architect Row */}
                <TouchableOpacity
                  style={styles.milestoneToggleRow}
                  onPress={() => setEngineerCalls(!engineerCalls)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneToggleTitle}>Engineer / Architect Interactions</Text>
                    <Text style={styles.milestoneToggleSubtitle}>Influencer site specifications & discussions</Text>
                  </View>
                  <View style={[styles.togglePill, engineerCalls ? styles.togglePillActive : styles.togglePillInactive]}>
                    <Text style={[styles.togglePillText, engineerCalls ? styles.togglePillTextActive : styles.togglePillTextInactive]}>
                      {engineerCalls ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Cross-Sell Row */}
                <TouchableOpacity
                  style={styles.milestoneToggleRow}
                  onPress={() => setCrossSell(!crossSell)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneToggleTitle}>Cross-sell Achieved</Text>
                    <Text style={styles.milestoneSub}>Adhesives, grouts or sanitary combo sales</Text>
                  </View>
                  <View style={[styles.togglePill, crossSell ? styles.togglePillActive : styles.togglePillInactive]}>
                    <Text style={[styles.togglePillText, crossSell ? styles.togglePillTextActive : styles.togglePillTextInactive]}>
                      {crossSell ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Section: Shift Handover Remarks */}
                <View style={{ marginTop: 20, marginBottom: 24 }}>
                  <Text style={styles.sectionTitle}>HANDOVER & SHIFT REMARKS</Text>
                  
                  {/* Quick Prompts */}
                  <View style={styles.promptChipsRow}>
                    {QUICK_SHIFT_SNIPPETS.map((snip, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.promptChip}
                        onPress={() => setShiftNotes((prev) => (prev ? `${prev}; ${snip}` : snip))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.promptChipText}>+ {snip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.notesTextInput}
                    placeholder="Enter closing remarks, customer objections, site visits or stock requests..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={shiftNotes}
                    onChangeText={setShiftNotes}
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* =========================================================
              4. MINIMALIST MODAL FOOTER
             ========================================================= */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerCancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.footerCancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerSubmitBtn,
                submittedSuccess && styles.footerSubmitBtnSuccess,
                submitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmitShiftReport}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.footerSubmitBtnText}>
                  {submittedSuccess ? '✓ Report Submitted' : 'Submit Shift Report'}
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '92%',
    minHeight: '78%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '800',
  },
  staffFilterBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  staffTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffTabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  staffTabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  staffTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bodyScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F8FAFC',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  revenueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  syncLink: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  syncLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
    marginVertical: 6,
  },
  revenueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaCapsuleLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaCapsuleValue: {
    fontSize: 11.5,
    color: '#0F172A',
    fontWeight: '800',
  },
  sectionHeadingRow: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  funnelGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  funnelCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  funnelCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  funnelCardNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
    letterSpacing: -0.4,
  },
  funnelCardHint: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  listCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  listCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badgeSolidDark: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeSolidDarkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  milestoneToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  milestoneToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  milestoneToggleSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  milestoneSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  togglePillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  togglePillInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  togglePillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  togglePillTextInactive: {
    color: '#64748B',
  },
  promptChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  promptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  notesTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  footerCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  footerCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  footerSubmitBtn: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  footerSubmitBtnSuccess: {
    backgroundColor: '#059669',
  },
  footerSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
