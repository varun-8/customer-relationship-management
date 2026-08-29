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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';

const QUICK_SHIFT_SNIPPETS = [
  'All walk-in quotations followed up',
  'Advance payment received for site delivery',
  'Engineer requested tile sample site visit',
  'Pending stock confirmation from warehouse',
];

const DEFAULT_SHIFT_TARGET_SALES = 50000; // ₹ 50,000 shift benchmark

export function MobileShiftKpiModal({
  visible,
  onClose,
  currentProfile,
  profiles = [],
  branding,
}) {
  const [viewMode, setViewMode] = useState('individual');
  const [targetStaff, setTargetStaff] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [teamPerformance, setTeamPerformance] = useState([]);

  // Date Navigation State
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayObj = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Individual KPI Metrics State (100% Read-Only Auto-Calculated)
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

  const employeeProfiles = profiles.filter((p) => p.role === 'employee');
  const defaultStaffName = currentProfile?.role === 'employee'
    ? currentProfile?.name
    : (employeeProfiles[0]?.name || 'Showroom Staff');

  const activeStaffName = targetStaff || defaultStaffName;

  const loadKpiData = async (staffToLoad = activeStaffName, dateToLoad = selectedDate) => {
    setLoading(true);
    setSubmittedSuccess(false);
    try {
      const res = await apiClient.getKPIAutoFill({
        date: dateToLoad,
        staffName: staffToLoad,
      });

      if (res && res.success && res.data) {
        const auto = res.data.autoValues || {};
        const saved = res.data.savedKpi || res.data.kpiRecord;
        setVisits(String(auto.walkins?.visits || 0));
        setQuotes(String(auto.walkins?.quotes || 0));
        setOrders(String(auto.walkins?.orders || 0));
        setFollowups(String(auto.followUpsCount || 0));
        setTotalBills(String(auto.ordersCount || auto.walkins?.orders || 0));
        setSalesValue(String(auto.salesValue || 0));
        setOldCustomers(Boolean(auto.oldCustomers));
        setEngineerCalls(Boolean(auto.engineerCalls));
        setCrossSell(Boolean(auto.crossSell));
        if (saved && saved.notes) {
          setShiftNotes(saved.notes);
        }
      }
    } catch (e) {
      console.warn('Error loading shift KPI:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamPerformance = async (dateToLoad = selectedDate) => {
    setLoadingTeam(true);
    try {
      const results = await Promise.all(
        employeeProfiles.map(async (emp) => {
          try {
            const res = await apiClient.getKPIAutoFill({
              date: dateToLoad,
              staffName: emp.name,
            });
            const auto = res?.data?.autoValues || {};
            const saved = res?.data?.savedKpi || res?.data?.kpiRecord;
            const v = Number(auto.walkins?.visits) || 0;
            const o = Number(auto.walkins?.orders) || 0;
            const q = Number(auto.walkins?.quotes) || 0;
            const f = Number(auto.followUpsCount) || 0;
            const b = Number(auto.ordersCount) || o || 0;
            const s = Number(auto.salesValue) || 0;
            const cr = v > 0 ? Math.round((o / v) * 100) : 0;
            const qr = v > 0 ? Math.round((q / v) * 100) : 0;
            const targetPct = Math.min(100, Math.round((s / DEFAULT_SHIFT_TARGET_SALES) * 100));

            return {
              staffName: emp.name,
              role: emp.role || 'employee',
              visits: v,
              quotes: q,
              orders: o,
              followups: f,
              totalBills: b,
              salesValue: s,
              oldCustomers: Boolean(auto.oldCustomers),
              engineerCalls: Boolean(auto.engineerCalls),
              crossSell: Boolean(auto.crossSell),
              conversionRate: cr,
              quoteRate: qr,
              targetPct,
              notes: auto.notes || saved?.notes || '',
              isSubmitted: Boolean(saved),
            };
          } catch (e) {
            return {
              staffName: emp.name,
              role: 'employee',
              visits: 0,
              quotes: 0,
              orders: 0,
              followups: 0,
              totalBills: 0,
              salesValue: 0,
              oldCustomers: false,
              engineerCalls: false,
              crossSell: false,
              conversionRate: 0,
              quoteRate: 0,
              targetPct: 0,
              notes: '',
              isSubmitted: false,
            };
          }
        })
      );

      // Sort team members by closed sales value descending
      results.sort((a, b) => b.salesValue - a.salesValue || b.orders - a.orders);
      setTeamPerformance(results);
    } catch (err) {
      console.warn('Error loading team KPI performance:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (currentProfile?.role === 'owner') {
        setViewMode('team');
        loadTeamPerformance(selectedDate);
      } else {
        setViewMode('individual');
        const initialStaff = currentProfile?.name || '';
        setTargetStaff(initialStaff);
        loadKpiData(initialStaff, selectedDate);
      }
    }
  }, [visible, currentProfile, selectedDate]);

  const handleDateChange = (newDateStr) => {
    setSelectedDate(newDateStr);
    if (viewMode === 'team') {
      loadTeamPerformance(newDateStr);
    } else {
      loadKpiData(activeStaffName, newDateStr);
    }
  };

  const handleSubmitShiftReport = async () => {
    setSubmitting(true);
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

    try {
      const res = await apiClient.submitDailyKPI(payload);
      if (res && res.success) {
        setSubmittedSuccess(true);
        Alert.alert(
          'Shift Report Finalized',
          `Shift performance report for ${activeStaffName} (${selectedDate}) has been saved.`,
          [{ text: 'Done', onPress: () => setTimeout(() => onClose(), 500) }]
        );
      } else {
        await saveLocalKpiReport(payload);
        setSubmittedSuccess(true);
        Alert.alert(
          'Saved Offline',
          `Shift report saved offline for ${activeStaffName}. Will sync when reconnected.`,
          [{ text: 'OK', onPress: () => setTimeout(() => onClose(), 500) }]
        );
      }
    } catch (err) {
      await saveLocalKpiReport(payload);
      setSubmittedSuccess(true);
      Alert.alert(
        'Saved Offline',
        `Network offline. Shift report saved locally and queued for auto-sync.`,
        [{ text: 'OK', onPress: () => setTimeout(() => onClose(), 500) }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const saveLocalKpiReport = async (payload) => {
    try {
      const existing = await AsyncStorage.getItem('@offline_kpi_reports');
      const list = existing ? JSON.parse(existing) : [];
      list.push({ ...payload, timestamp: Date.now() });
      await AsyncStorage.setItem('@offline_kpi_reports', JSON.stringify(list));
    } catch (e) {
      console.warn('AsyncStorage error saving local KPI:', e);
    }
  };

  if (!visible) return null;

  // Calculate Conversions & Quote Rates
  const visitNum = Number(visits) || 0;
  const quoteNum = Number(quotes) || 0;
  const orderNum = Number(orders) || 0;
  const salesValNum = Number(salesValue) || 0;
  const conversionRate = visitNum > 0 ? Math.round((orderNum / visitNum) * 100) : 0;
  const quoteRate = visitNum > 0 ? Math.round((quoteNum / visitNum) * 100) : 0;

  // Target Goal Achievement
  const shiftGoalProgress = Math.min(100, Math.round((salesValNum / DEFAULT_SHIFT_TARGET_SALES) * 100));

  // Performance Rating Engine (Clean text without emojis)
  let ratingBadge = { label: 'Shift Active', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' };
  if (salesValNum >= 75000 || conversionRate >= 40) {
    ratingBadge = { label: 'Exceptional Pace', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
  } else if (salesValNum >= 40000 || conversionRate >= 25) {
    ratingBadge = { label: 'High Pace', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
  } else if (salesValNum > 0 || visitNum > 0) {
    ratingBadge = { label: 'On Track', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
  }

  // Calculate Team Totals for Owner View
  const teamTotalRevenue = teamPerformance.reduce((acc, emp) => acc + emp.salesValue, 0);
  const teamTotalVisits = teamPerformance.reduce((acc, emp) => acc + emp.visits, 0);
  const teamTotalOrders = teamPerformance.reduce((acc, emp) => acc + emp.orders, 0);
  const teamTotalFollowups = teamPerformance.reduce((acc, emp) => acc + emp.followups, 0);
  const teamTotalBills = teamPerformance.reduce((acc, emp) => acc + emp.totalBills, 0);
  const teamAvgConversion = teamTotalVisits > 0 ? Math.round((teamTotalOrders / teamTotalVisits) * 100) : 0;
  const teamTargetRevenue = Math.max(DEFAULT_SHIFT_TARGET_SALES, employeeProfiles.length * DEFAULT_SHIFT_TARGET_SALES);
  const teamGoalProgress = Math.min(100, Math.round((teamTotalRevenue / teamTargetRevenue) * 100));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          
          {/* Top Drag Handle Indicator */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* =========================================================
              1. MINIMALIST CLEAN HEADER (NO EMOJIS)
             ========================================================= */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTextRow}>
                <View style={styles.headerBarIcon}>
                  <View style={styles.bar1} />
                  <View style={styles.bar2} />
                  <View style={styles.bar3} />
                </View>
                <Text style={styles.headerTitle}>Daily Shift KPI</Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>LIVE SYNC</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {currentProfile?.role === 'owner' && viewMode === 'team'
                  ? 'Showroom Executive Performance & Revenue Matrix'
                  : `Executive Daily Report • ${activeStaffName}`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* =========================================================
              2. DATE NAVIGATION & PERFORMANCE GRADE BAR
             ========================================================= */}
          <View style={styles.dateSelectorBar}>
            <View style={styles.dateSegmentGroup}>
              <TouchableOpacity
                style={[styles.dateChip, selectedDate === todayStr && styles.dateChipActive]}
                onPress={() => handleDateChange(todayStr)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipText, selectedDate === todayStr && styles.dateChipTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateChip, selectedDate === yesterdayStr && styles.dateChipActive]}
                onPress={() => handleDateChange(yesterdayStr)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipText, selectedDate === yesterdayStr && styles.dateChipTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.ratingPill, { backgroundColor: ratingBadge.bg, borderColor: ratingBadge.border }]}>
              <Text style={[styles.ratingPillText, { color: ratingBadge.color }]}>
                {ratingBadge.label}
              </Text>
            </View>
          </View>

          {/* =========================================================
              3. OWNER VIEW MODE & STAFF SELECTOR BAR
             ========================================================= */}
          {currentProfile?.role === 'owner' && (
            <View style={styles.staffFilterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[
                    styles.staffTabPill,
                    viewMode === 'team' && styles.staffTabPillActive,
                  ]}
                  onPress={() => {
                    setViewMode('team');
                    loadTeamPerformance(selectedDate);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.staffTabPillText, viewMode === 'team' && styles.staffTabPillTextActive]}>
                    Leaderboard
                  </Text>
                </TouchableOpacity>

                {employeeProfiles.map((p) => {
                  const isSel = viewMode === 'individual' && (activeStaffName || '').toLowerCase() === p.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={p.id || p.name}
                      style={[
                        styles.staffTabPill,
                        isSel && styles.staffTabPillActive,
                      ]}
                      onPress={() => {
                        setViewMode('individual');
                        setTargetStaff(p.name);
                        loadKpiData(p.name, selectedDate);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.miniStaffAvatar, isSel && { backgroundColor: '#FFFFFF' }]}>
                        <Text style={[styles.miniStaffAvatarText, isSel && { color: '#0F172A' }]}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.staffTabPillText, isSel && styles.staffTabPillTextActive]}>
                        {p.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* =========================================================
              4. SCROLLABLE WORKSPACE
             ========================================================= */}
          <ScrollView style={styles.bodyScrollView} showsVerticalScrollIndicator={false}>

            {/* VIEW MODE A: OWNER TEAM OVERVIEW & LEADERBOARD */}
            {currentProfile?.role === 'owner' && viewMode === 'team' ? (
              loadingTeam ? (
                <View style={styles.loadingStateBox}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.loadingStateText}>
                    Syncing showroom entries & performance matrix...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Aggregated Team Revenue Hero Card */}
                  <View style={styles.heroDarkCard}>
                    <View style={styles.heroCardHeaderRow}>
                      <View style={styles.heroTagBadge}>
                        <Text style={styles.heroTagBadgeText}>SHOWROOM TOTAL REVENUE</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => loadTeamPerformance(selectedDate)}
                        style={styles.heroSyncBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.heroSyncBtnText}>Sync CRM</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.heroDarkRevenueValue}>
                      ₹ {teamTotalRevenue.toLocaleString('en-IN')}
                    </Text>

                    {/* Team Goal Progress Bar */}
                    <View style={styles.darkProgressTrack}>
                      <View style={[styles.darkProgressFill, { width: `${teamGoalProgress}%` }]} />
                    </View>
                    <View style={styles.darkProgressLabelRow}>
                      <Text style={styles.darkProgressSubtext}>Benchmark: ₹{teamTargetRevenue.toLocaleString('en-IN')}</Text>
                      <Text style={styles.darkProgressPercent}>{teamGoalProgress}% Target Achieved</Text>
                    </View>

                    {/* Metadata Capsules */}
                    <View style={styles.heroStatGrid}>
                      <View style={styles.heroStatTile}>
                        <Text style={styles.heroStatTileLabel}>INVOICES</Text>
                        <Text style={styles.heroStatTileVal}>{teamTotalBills}</Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatTile}>
                        <Text style={styles.heroStatTileLabel}>FOOTFALL</Text>
                        <Text style={styles.heroStatTileVal}>{teamTotalVisits}</Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatTile}>
                        <Text style={styles.heroStatTileLabel}>WIN RATE</Text>
                        <Text style={[styles.heroStatTileVal, { color: teamAvgConversion > 0 ? '#34D399' : '#FFFFFF' }]}>
                          {teamAvgConversion}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Section Title */}
                  <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionTitle}>SALES EXECUTIVE PERFORMANCE</Text>
                    <Text style={styles.sectionBadge}>{teamPerformance.length} Executives</Text>
                  </View>

                  {/* Employee Performance List */}
                  {teamPerformance.length === 0 ? (
                    <View style={styles.emptyStateBox}>
                      <Text style={styles.emptyStateText}>No sales executive records found for this shift date.</Text>
                    </View>
                  ) : (
                    teamPerformance.map((emp, idx) => {
                      const rankBadge = `#${idx + 1}`;
                      const rankBg = idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : idx === 2 ? '#FFEDD5' : '#F8FAFC';
                      const rankColor = idx === 0 ? '#B45309' : idx === 1 ? '#475569' : idx === 2 ? '#9A3412' : '#64748B';

                      return (
                        <TouchableOpacity
                          key={emp.staffName}
                          style={styles.empLeaderCard}
                          activeOpacity={0.8}
                          onPress={() => {
                            setViewMode('individual');
                            setTargetStaff(emp.staffName);
                            loadKpiData(emp.staffName, selectedDate);
                          }}
                        >
                          {/* Card Top Row: Rank + Avatar + Name + Closed Sales */}
                          <View style={styles.empLeaderTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <View style={[styles.rankMedalPill, { backgroundColor: rankBg }]}>
                                <Text style={[styles.rankMedalPillText, { color: rankColor }]}>{rankBadge}</Text>
                              </View>

                              <View style={styles.empAvatarCircle}>
                                <Text style={styles.empAvatarCircleText}>{emp.staffName.charAt(0).toUpperCase()}</Text>
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={styles.empLeaderName} numberOfLines={1}>
                                  {emp.staffName}
                                </Text>
                                <Text style={styles.empLeaderSub}>
                                  {emp.totalBills} Invoices • {emp.conversionRate}% Win Rate
                                </Text>
                              </View>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.empLeaderRevenue}>
                                ₹ {emp.salesValue.toLocaleString('en-IN')}
                              </Text>
                              <View style={[styles.statusMiniBadge, emp.isSubmitted ? styles.statusMiniBadgeLogged : styles.statusMiniBadgePending]}>
                                <Text style={[styles.statusMiniBadgeText, emp.isSubmitted ? styles.statusMiniBadgeTextLogged : styles.statusMiniBadgeTextPending]}>
                                  {emp.isSubmitted ? 'Saved' : 'Active'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Mini Progress Track */}
                          <View style={styles.miniProgressTrack}>
                            <View style={[styles.miniProgressFill, { width: `${emp.targetPct}%` }]} />
                          </View>

                          {/* 4-Stat Metric Breakdown Row (No emojis) */}
                          <View style={styles.empMetricGrid}>
                            <View style={styles.empMetricCol}>
                              <Text style={styles.empMetricKey}>WALK-INS</Text>
                              <Text style={styles.empMetricNum}>{emp.visits}</Text>
                            </View>
                            <View style={styles.empMetricCol}>
                              <Text style={styles.empMetricKey}>QUOTES</Text>
                              <Text style={styles.empMetricNum}>{emp.quotes}</Text>
                            </View>
                            <View style={styles.empMetricCol}>
                              <Text style={styles.empMetricKey}>ORDERS</Text>
                              <Text style={[styles.empMetricNum, { color: '#059669' }]}>{emp.orders}</Text>
                            </View>
                            <View style={styles.empMetricCol}>
                              <Text style={styles.empMetricKey}>CALLS</Text>
                              <Text style={[styles.empMetricNum, { color: '#2563EB' }]}>{emp.followups}</Text>
                            </View>
                          </View>

                          {/* Milestone Badges Row (No emojis) */}
                          {(emp.oldCustomers || emp.engineerCalls || emp.crossSell) && (
                            <View style={styles.empMilestonesRow}>
                              {emp.oldCustomers && (
                                <View style={styles.empMilestoneTag}>
                                  <Text style={styles.empMilestoneTagText}>Repeat Customer</Text>
                                </View>
                              )}
                              {emp.engineerCalls && (
                                <View style={styles.empMilestoneTag}>
                                  <Text style={styles.empMilestoneTagText}>Architect Visit</Text>
                                </View>
                              )}
                              {emp.crossSell && (
                                <View style={styles.empMilestoneTag}>
                                  <Text style={styles.empMilestoneTagText}>Cross-Sell</Text>
                                </View>
                              )}
                            </View>
                          )}

                          {/* Handover Remarks Preview */}
                          {emp.notes ? (
                            <View style={styles.empNotesPreviewBox}>
                              <Text style={styles.empNotesPreviewLabel}>REMARKS:</Text>
                              <Text style={styles.empNotesPreviewText} numberOfLines={2}>
                                "{emp.notes}"
                              </Text>
                            </View>
                          ) : null}

                          {/* Card Footer Action */}
                          <View style={styles.empLeaderCardFooter}>
                            <Text style={styles.inspectDetailsText}>Inspect Shift Details ›</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </>
              )
            ) : (
              /* VIEW MODE B: INDIVIDUAL AUTO-CALCULATED SHIFT REPORT */
              loading ? (
                <View style={styles.loadingStateBox}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.loadingStateText}>
                    Calculating shift performance from CRM records...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Back to Leaderboard Button for Owner */}
                  {currentProfile?.role === 'owner' && (
                    <TouchableOpacity
                      style={styles.backToTeamBtn}
                      onPress={() => {
                        setViewMode('team');
                        loadTeamPerformance(selectedDate);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backToTeamBtnText}>← Back to Leaderboard</Text>
                    </TouchableOpacity>
                  )}

                  {/* Individual Revenue Hero Card */}
                  <View style={styles.heroDarkCard}>
                    <View style={styles.heroCardHeaderRow}>
                      <View style={styles.heroTagBadge}>
                        <Text style={styles.heroTagBadgeText}>CLOSED REVENUE</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => loadKpiData(activeStaffName, selectedDate)}
                        style={styles.heroSyncBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.heroSyncBtnText}>Sync CRM</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.heroDarkRevenueValue}>
                      ₹ {salesValNum.toLocaleString('en-IN')}
                    </Text>

                    {/* Goal Achievement Progress Bar */}
                    <View style={styles.darkProgressTrack}>
                      <View style={[styles.darkProgressFill, { width: `${shiftGoalProgress}%` }]} />
                    </View>
                    <View style={styles.darkProgressLabelRow}>
                      <Text style={styles.darkProgressSubtext}>Target: ₹{DEFAULT_SHIFT_TARGET_SALES.toLocaleString('en-IN')}</Text>
                      <Text style={styles.darkProgressPercent}>{shiftGoalProgress}% Target Achieved</Text>
                    </View>

                    {/* Metadata Capsules */}
                    <View style={styles.heroStatGrid}>
                      <View style={styles.heroStatTile}>
                        <Text style={styles.heroStatTileLabel}>INVOICES</Text>
                        <Text style={styles.heroStatTileVal}>{totalBills || 0}</Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatTile}>
                        <Text style={styles.heroStatTileLabel}>WIN RATE</Text>
                        <Text style={[styles.heroStatTileVal, { color: conversionRate > 0 ? '#34D399' : '#FFFFFF' }]}>
                          {conversionRate}%
                        </Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatTile}>
                        <Text style={styles.heroStatTileLabel}>EXECUTIVE</Text>
                        <Text style={styles.heroStatTileVal} numberOfLines={1}>{activeStaffName.split(' ')[0]}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Section: Showroom Conversion Funnel */}
                  <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionTitle}>SHOWROOM PIPELINE & FUNNEL</Text>
                    <Text style={styles.sectionBadge}>Auto-Calculated</Text>
                  </View>

                  {/* 4-Metric Balanced Funnel Grid (No Emojis) */}
                  <View style={styles.funnelGrid}>
                    {/* Card 1: Walk-ins */}
                    <View style={styles.funnelTileCard}>
                      <View style={styles.funnelHeaderPill}>
                        <Text style={styles.funnelHeaderPillText}>FOOTFALL</Text>
                      </View>
                      <Text style={styles.funnelTileNumber}>{visits || 0}</Text>
                      <Text style={styles.funnelTileTitle}>Walk-in Visitors</Text>
                      <Text style={styles.funnelTileSub}>Total Showroom Traffic</Text>
                    </View>

                    {/* Card 2: Quotations */}
                    <View style={styles.funnelTileCard}>
                      <View style={[styles.funnelHeaderPill, { backgroundColor: '#F5F3FF' }]}>
                        <Text style={[styles.funnelHeaderPillText, { color: '#7C3AED' }]}>PROPOSALS</Text>
                      </View>
                      <Text style={styles.funnelTileNumber}>{quotes || 0}</Text>
                      <Text style={styles.funnelTileTitle}>Quotations</Text>
                      <Text style={styles.funnelTileSub}>{quoteRate}% of footfall</Text>
                    </View>

                    {/* Card 3: Orders Closed */}
                    <View style={[styles.funnelTileCard, { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }]}>
                      <View style={[styles.funnelHeaderPill, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.funnelHeaderPillText, { color: '#047857' }]}>CONVERSIONS</Text>
                      </View>
                      <Text style={[styles.funnelTileNumber, { color: '#047857' }]}>{orders || 0}</Text>
                      <Text style={[styles.funnelTileTitle, { color: '#047857' }]}>Orders Won</Text>
                      <Text style={[styles.funnelTileSub, { color: '#059669', fontWeight: '700' }]}>{conversionRate}% win rate</Text>
                    </View>

                    {/* Card 4: Follow-ups */}
                    <View style={styles.funnelTileCard}>
                      <View style={[styles.funnelHeaderPill, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[styles.funnelHeaderPillText, { color: '#B45309' }]}>TOUCHPOINTS</Text>
                      </View>
                      <Text style={styles.funnelTileNumber}>{followups || 0}</Text>
                      <Text style={styles.funnelTileTitle}>Follow-ups</Text>
                      <Text style={styles.funnelTileSub}>Calls & messages</Text>
                    </View>
                  </View>

                  {/* Section: Strategic Milestones (No Emojis) */}
                  <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionTitle}>AUTO-DETECTED STRATEGIC MILESTONES</Text>
                  </View>

                  {/* Repeat Customer Status */}
                  <View style={[styles.milestoneCard, oldCustomers && styles.milestoneCardActive]}>
                    <View style={[styles.milestoneDot, oldCustomers && styles.milestoneDotActive]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneCardTitle}>Repeat / Existing Clients</Text>
                      <Text style={styles.milestoneCardSub}>Auto-detected from returning customer records</Text>
                    </View>
                    <View style={[styles.milestonePill, oldCustomers ? styles.milestonePillActive : styles.milestonePillInactive]}>
                      <Text style={[styles.milestonePillText, oldCustomers ? styles.milestonePillTextActive : styles.milestonePillTextInactive]}>
                        {oldCustomers ? 'Detected' : 'None'}
                      </Text>
                    </View>
                  </View>

                  {/* Engineer / Architect Status */}
                  <View style={[styles.milestoneCard, engineerCalls && styles.milestoneCardActive]}>
                    <View style={[styles.milestoneDot, engineerCalls && styles.milestoneDotActive]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneCardTitle}>Architect / Engineer Visits</Text>
                      <Text style={styles.milestoneCardSub}>Auto-detected from influencer trade records</Text>
                    </View>
                    <View style={[styles.milestonePill, engineerCalls ? styles.milestonePillActive : styles.milestonePillInactive]}>
                      <Text style={[styles.milestonePillText, engineerCalls ? styles.milestonePillTextActive : styles.milestonePillTextInactive]}>
                        {engineerCalls ? 'Detected' : 'None'}
                      </Text>
                    </View>
                  </View>

                  {/* Cross-Sell Status */}
                  <View style={[styles.milestoneCard, crossSell && styles.milestoneCardActive]}>
                    <View style={[styles.milestoneDot, crossSell && styles.milestoneDotActive]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneCardTitle}>Cross-Sell Product Combo</Text>
                      <Text style={styles.milestoneCardSub}>Adhesive, grout or sanitary additions recorded</Text>
                    </View>
                    <View style={[styles.milestonePill, crossSell ? styles.milestonePillActive : styles.milestonePillInactive]}>
                      <Text style={[styles.milestonePillText, crossSell ? styles.milestonePillTextActive : styles.milestonePillTextInactive]}>
                        {crossSell ? 'Detected' : 'None'}
                      </Text>
                    </View>
                  </View>

                  {/* Section: Shift Handover Remarks */}
                  <View style={styles.handoverSectionBox}>
                    <Text style={styles.sectionTitle}>HANDOVER & SHIFT REMARKS</Text>
                    
                    {/* Quick Smart Snippets */}
                    <View style={styles.promptChipsContainer}>
                      {QUICK_SHIFT_SNIPPETS.map((snip, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.smartPromptChip}
                          onPress={() => setShiftNotes((prev) => (prev ? `${prev}; ${snip}` : snip))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.smartPromptChipText}>+ {snip}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.handoverTextInput}
                      placeholder="Enter closing remarks, customer objections, site visits or stock requests..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                      value={shiftNotes}
                      onChangeText={setShiftNotes}
                    />
                  </View>
                </>
              )
            )}
          </ScrollView>

          {/* =========================================================
              5. MINIMALIST MODAL FOOTER
             ========================================================= */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerCancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.footerCancelBtnText}>Close</Text>
            </TouchableOpacity>

            {viewMode === 'individual' && (
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
                    {submittedSuccess ? 'Shift Finalized' : 'Finalize & Save Shift'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 24,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
  headerBarIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2.5,
    paddingBottom: 4,
  },
  bar1: {
    width: 2.5,
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 1,
  },
  bar2: {
    width: 2.5,
    height: 10,
    backgroundColor: '#2563EB',
    borderRadius: 1,
  },
  bar3: {
    width: 2.5,
    height: 14,
    backgroundColor: '#2563EB',
    borderRadius: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
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
    fontSize: 13,
    color: '#475569',
    fontWeight: '800',
  },
  dateSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateSegmentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2.5,
    gap: 2,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  dateChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  dateChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  dateChipTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratingPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  staffFilterBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  staffTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffTabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  miniStaffAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStaffAvatarText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  staffTabPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  staffTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bodyScrollView: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: '#F8FAFC',
  },
  loadingStateBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingStateText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  backToTeamBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backToTeamBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  heroDarkCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 14,
  },
  heroCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  heroTagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  heroSyncBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heroSyncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  heroDarkRevenueValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginTop: 6,
    marginBottom: 6,
  },
  darkProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  darkProgressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  darkProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  darkProgressSubtext: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  darkProgressPercent: {
    fontSize: 10.5,
    color: '#34D399',
    fontWeight: '800',
  },
  heroStatGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  heroStatTile: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatTileLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  heroStatTileVal: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.6,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  funnelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  funnelTileCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  funnelHeaderPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  funnelHeaderPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  funnelTileNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  funnelTileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginTop: 2,
  },
  funnelTileSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  milestoneCardActive: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginLeft: 2,
  },
  milestoneDotActive: {
    backgroundColor: '#0284C7',
  },
  milestoneCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  milestoneCardSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  milestonePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  milestonePillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  milestonePillInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  milestonePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  milestonePillTextActive: {
    color: '#FFFFFF',
  },
  milestonePillTextInactive: {
    color: '#64748B',
  },
  handoverSectionBox: {
    marginTop: 10,
    marginBottom: 24,
  },
  promptChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  smartPromptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
  },
  smartPromptChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  handoverTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 12.5,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  empLeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
  },
  empLeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankMedalPill: {
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rankMedalPillText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  empAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarCircleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
  empLeaderName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  empLeaderSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  empLeaderRevenue: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'right',
  },
  statusMiniBadge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusMiniBadgeLogged: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusMiniBadgePending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statusMiniBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  statusMiniBadgeTextLogged: {
    color: '#047857',
  },
  statusMiniBadgeTextPending: {
    color: '#64748B',
  },
  miniProgressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 8,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  empMetricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  empMetricCol: {
    alignItems: 'center',
    flex: 1,
  },
  empMetricKey: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  empMetricNum: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  empMilestonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  empMilestoneTag: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  empMilestoneTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  empNotesPreviewBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  empNotesPreviewLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  empNotesPreviewText: {
    fontSize: 10.5,
    color: '#92400E',
    marginTop: 2,
    fontStyle: 'italic',
  },
  empLeaderCardFooter: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  inspectDetailsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  footerCancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  footerCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  footerSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  footerSubmitBtnSuccess: {
    backgroundColor: '#059669',
  },
  footerSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
