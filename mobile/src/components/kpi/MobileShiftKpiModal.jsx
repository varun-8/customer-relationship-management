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

const DEFAULT_SHIFT_TARGET_SALES = 50000; // ₹ 50,000 shift sales benchmark

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
          '✓ Shift Report Finalized',
          `Automated shift performance report for ${activeStaffName} (${selectedDate}) has been saved.`,
          [{ text: 'Done', onPress: () => setTimeout(() => onClose(), 500) }]
        );
      } else {
        await saveLocalKpiReport(payload);
        setSubmittedSuccess(true);
        Alert.alert(
          '✓ Saved Offline',
          `Shift report saved offline for ${activeStaffName}. Will sync when reconnected.`,
          [{ text: 'OK', onPress: () => setTimeout(() => onClose(), 500) }]
        );
      }
    } catch (err) {
      await saveLocalKpiReport(payload);
      setSubmittedSuccess(true);
      Alert.alert(
        '✓ Saved Offline',
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

  // Performance Rating Engine
  let ratingBadge = { label: '⏱️ Shift Active', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
  if (salesValNum >= 75000 || conversionRate >= 40) {
    ratingBadge = { label: '⭐ Exceptional Performance', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
  } else if (salesValNum >= 40000 || conversionRate >= 25) {
    ratingBadge = { label: '🔥 High Pace Shift', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
  } else if (salesValNum > 0 || visitNum > 0) {
    ratingBadge = { label: '📈 On Track', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
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
          {/* =========================================================
              1. MINIMALIST CLEAN HEADER
             ========================================================= */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTextRow}>
                <Text style={styles.headerTitle}>Daily Shift KPI</Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>Live Auto-Calculated</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                {currentProfile?.role === 'owner' ? 'Showroom Executive Team Shift Overview' : 'Daily Shift Report & Performance'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* =========================================================
              2. DATE NAVIGATION & SHIFT SELECTOR BAR
             ========================================================= */}
          <View style={styles.dateSelectorBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={[styles.dateChip, selectedDate === todayStr && styles.dateChipActive]}
                onPress={() => handleDateChange(todayStr)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipText, selectedDate === todayStr && styles.dateChipTextActive]}>
                  📅 Today ({todayStr.split('-').slice(1).join('/')})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateChip, selectedDate === yesterdayStr && styles.dateChipActive]}
                onPress={() => handleDateChange(yesterdayStr)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipText, selectedDate === yesterdayStr && styles.dateChipTextActive]}>
                  ⏮️ Yesterday ({yesterdayStr.split('-').slice(1).join('/')})
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
              <Text style={styles.filterSectionLabel}>SHIFT VIEW MODE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
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
                    📊 Team Leaderboard
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
                      <Text style={[styles.staffTabPillText, isSel && styles.staffTabPillTextActive]}>
                        👤 {p.name}
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
            {/* 100% Auto-Calculated CRM Banner */}
            <View style={styles.autoCalculatedBanner}>
              <Text style={{ fontSize: 13 }}>🤖</Text>
              <Text style={styles.autoCalculatedText}>
                Shift metrics are 100% auto-calculated from live CRM customer records & follow-up logs.
              </Text>
            </View>

            {/* VIEW MODE A: OWNER TEAM OVERVIEW & LEADERBOARD */}
            {currentProfile?.role === 'owner' && viewMode === 'team' ? (
              loadingTeam ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0F172A" />
                  <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13, fontWeight: '600' }}>
                    Syncing live CRM customer entries & performance...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Aggregated Team Revenue Card */}
                  <View style={styles.revenueCard}>
                    <View style={styles.revenueTopRow}>
                      <Text style={styles.revenueLabel}>SHOWROOM SHIFT REVENUE ({selectedDate})</Text>
                      <TouchableOpacity onPress={() => loadTeamPerformance(selectedDate)} style={styles.syncLink} activeOpacity={0.7}>
                        <Text style={styles.syncLinkText}>🔄 Sync Live CRM</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.revenueValue}>
                      ₹ {teamTotalRevenue.toLocaleString('en-IN')}
                    </Text>

                    {/* Team Goal Progress Bar */}
                    <View style={styles.goalProgressTrack}>
                      <View style={[styles.goalProgressFill, { width: `${teamGoalProgress}%` }]} />
                    </View>
                    <View style={styles.goalLabelRow}>
                      <Text style={styles.goalSubtext}>Team Target: ₹{teamTargetRevenue.toLocaleString('en-IN')}</Text>
                      <Text style={styles.goalPercentText}>{teamGoalProgress}% Goal Achieved</Text>
                    </View>

                    {/* Metadata Capsules */}
                    <View style={styles.revenueMetaRow}>
                      <View style={styles.metaCapsule}>
                        <Text style={styles.metaCapsuleLabel}>Team Invoices:</Text>
                        <Text style={styles.metaCapsuleValue}>{teamTotalBills}</Text>
                      </View>

                      <View style={styles.metaCapsule}>
                        <Text style={styles.metaCapsuleLabel}>Total Walk-ins:</Text>
                        <Text style={styles.metaCapsuleValue}>{teamTotalVisits}</Text>
                      </View>

                      <View style={styles.metaCapsule}>
                        <Text style={styles.metaCapsuleLabel}>Team Conversion:</Text>
                        <Text style={[styles.metaCapsuleValue, { color: teamAvgConversion > 0 ? '#059669' : '#0F172A' }]}>
                          {teamAvgConversion}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Section Title */}
                  <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionTitle}>🏆 SALES EXECUTIVE PERFORMANCE LEADERBOARD</Text>
                  </View>

                  {/* Employee Performance Matrix List */}
                  {teamPerformance.length === 0 ? (
                    <View style={{ padding: 30, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>No sales employees found.</Text>
                    </View>
                  ) : (
                    teamPerformance.map((emp, idx) => {
                      const rankBadge = idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
                      const rankColor = idx === 0 ? '#D97706' : idx === 1 ? '#475569' : idx === 2 ? '#B45309' : '#64748B';
                      const rankBg = idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : idx === 2 ? '#FFEDD5' : '#F8FAFC';

                      return (
                        <TouchableOpacity
                          key={emp.staffName}
                          style={styles.empPerfCard}
                          activeOpacity={0.8}
                          onPress={() => {
                            setViewMode('individual');
                            setTargetStaff(emp.staffName);
                            loadKpiData(emp.staffName, selectedDate);
                          }}
                        >
                          {/* Card Header: Rank + Avatar + Name + Closed Sales */}
                          <View style={styles.empPerfHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <View style={[styles.rankBadge, { backgroundColor: rankBg }]}>
                                <Text style={[styles.rankBadgeText, { color: rankColor }]}>{rankBadge}</Text>
                              </View>

                              <View style={styles.empAvatar}>
                                <Text style={styles.empAvatarText}>{emp.staffName.charAt(0).toUpperCase()}</Text>
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={styles.empName} numberOfLines={1}>
                                  {emp.staffName}
                                </Text>
                                <Text style={styles.empSubtext}>
                                  {emp.totalBills} Invoices • {emp.conversionRate}% Win Rate
                                </Text>
                              </View>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.empSalesValue}>
                                ₹ {emp.salesValue.toLocaleString('en-IN')}
                              </Text>
                              <View style={[styles.empStatusBadge, emp.isSubmitted ? styles.empStatusBadgeLogged : styles.empStatusBadgePending]}>
                                <Text style={[styles.empStatusBadgeText, emp.isSubmitted ? styles.empStatusBadgeTextLogged : styles.empStatusBadgeTextPending]}>
                                  {emp.isSubmitted ? '✓ Report Logged' : '⏳ In Progress'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Mini Progress Track */}
                          <View style={[styles.goalProgressTrack, { marginTop: 10, height: 4 }]}>
                            <View style={[styles.goalProgressFill, { width: `${emp.targetPct}%` }]} />
                          </View>

                          {/* 4 Read-Only Stat Badges Row */}
                          <View style={styles.empStatGrid}>
                            <View style={styles.empStatItem}>
                              <Text style={styles.empStatLabel}>WALK-INS</Text>
                              <Text style={styles.empStatVal}>🚶 {emp.visits}</Text>
                            </View>

                            <View style={styles.empStatItem}>
                              <Text style={styles.empStatLabel}>QUOTES</Text>
                              <Text style={styles.empStatVal}>📄 {emp.quotes}</Text>
                            </View>

                            <View style={styles.empStatItem}>
                              <Text style={styles.empStatLabel}>ORDERS</Text>
                              <Text style={[styles.empStatVal, { color: '#059669' }]}>🛒 {emp.orders}</Text>
                            </View>

                            <View style={styles.empStatItem}>
                              <Text style={styles.empStatLabel}>FOLLOW-UPS</Text>
                              <Text style={[styles.empStatVal, { color: '#2563EB' }]}>📞 {emp.followups}</Text>
                            </View>
                          </View>

                          {/* Milestone Pills Row */}
                          {(emp.oldCustomers || emp.engineerCalls || emp.crossSell) && (
                            <View style={styles.milestoneBadgesRow}>
                              {emp.oldCustomers && (
                                <View style={styles.milestoneBadge}>
                                  <Text style={styles.milestoneBadgeText}>🔄 Repeat Clients</Text>
                                </View>
                              )}
                              {emp.engineerCalls && (
                                <View style={styles.milestoneBadge}>
                                  <Text style={styles.milestoneBadgeText}>📐 Architect Call</Text>
                                </View>
                              )}
                              {emp.crossSell && (
                                <View style={styles.milestoneBadge}>
                                  <Text style={styles.milestoneBadgeText}>🏷️ Cross-Sell Combo</Text>
                                </View>
                              )}
                            </View>
                          )}

                          {/* Handover Remarks Preview */}
                          {emp.notes ? (
                            <View style={styles.notesPreviewBox}>
                              <Text style={styles.notesPreviewLabel}>SHIFT REMARKS:</Text>
                              <Text style={styles.notesPreviewText} numberOfLines={2}>
                                "{emp.notes}"
                              </Text>
                            </View>
                          ) : null}

                          {/* Drill-down action bar */}
                          <View style={styles.empCardFooter}>
                            <Text style={styles.inspectLinkText}>Inspect Full Shift Report ›</Text>
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
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0F172A" />
                  <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13, fontWeight: '600' }}>
                    Auto-calculating shift performance from CRM...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Back to Leaderboard Banner for Owner */}
                  {currentProfile?.role === 'owner' && (
                    <TouchableOpacity
                      style={styles.backToTeamBtn}
                      onPress={() => {
                        setViewMode('team');
                        loadTeamPerformance(selectedDate);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backToTeamBtnText}>← Back to Team Leaderboard</Text>
                    </TouchableOpacity>
                  )}

                  {/* Revenue Display Card */}
                  <View style={styles.revenueCard}>
                    <View style={styles.revenueTopRow}>
                      <Text style={styles.revenueLabel}>CLOSED REVENUE ({selectedDate})</Text>
                      <TouchableOpacity onPress={() => loadKpiData(activeStaffName, selectedDate)} style={styles.syncLink} activeOpacity={0.7}>
                        <Text style={styles.syncLinkText}>🔄 Sync Live CRM</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.revenueValue}>
                      ₹ {salesValNum.toLocaleString('en-IN')}
                    </Text>

                    {/* Goal Achievement Progress Bar */}
                    <View style={styles.goalProgressTrack}>
                      <View style={[styles.goalProgressFill, { width: `${shiftGoalProgress}%` }]} />
                    </View>
                    <View style={styles.goalLabelRow}>
                      <Text style={styles.goalSubtext}>Daily Goal: ₹{DEFAULT_SHIFT_TARGET_SALES.toLocaleString('en-IN')}</Text>
                      <Text style={styles.goalPercentText}>{shiftGoalProgress}% Achieved</Text>
                    </View>

                    {/* Metadata Capsules */}
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

                  {/* Section: Showroom Conversion Funnel (100% Read-Only Auto-Calculated) */}
                  <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionTitle}>SHOWROOM FUNNEL METRICS</Text>
                  </View>

                  {/* 3-Column Read-Only Funnel Cards */}
                  <View style={styles.funnelGrid}>
                    {/* Card 1: Walk-ins */}
                    <View style={styles.funnelCard}>
                      <Text style={styles.funnelCardLabel}>Walk-ins</Text>
                      <Text style={styles.funnelCardNumber}>{visits || 0}</Text>
                      <Text style={styles.funnelCardHint}>Total Footfall</Text>
                    </View>

                    {/* Card 2: Quotations */}
                    <View style={styles.funnelCard}>
                      <Text style={styles.funnelCardLabel}>Quotations</Text>
                      <Text style={styles.funnelCardNumber}>{quotes || 0}</Text>
                      <Text style={styles.funnelCardHint}>{quoteRate}% of visits</Text>
                    </View>

                    {/* Card 3: Orders Closed */}
                    <View style={[styles.funnelCard, { borderColor: '#CBD5E1' }]}>
                      <Text style={[styles.funnelCardLabel, { color: '#0F172A' }]}>Orders Closed</Text>
                      <Text style={[styles.funnelCardNumber, { color: '#0F172A' }]}>{orders || 0}</Text>
                      <Text style={[styles.funnelCardHint, { color: '#059669', fontWeight: '700' }]}>{conversionRate}% won</Text>
                    </View>
                  </View>

                  {/* Follow-ups Activity Card */}
                  <View style={styles.listCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listCardTitle}>Client Follow-ups</Text>
                      <Text style={styles.listCardSubtitle}>Calls, chats & quotation check-ins recorded today</Text>
                    </View>
                    <View style={styles.badgeSolidDark}>
                      <Text style={styles.badgeSolidDarkText}>{followups || 0} calls</Text>
                    </View>
                  </View>

                  {/* Section: Strategic Milestones (Auto-Detected) */}
                  <View style={[styles.sectionHeadingRow, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>AUTO-DETECTED STRATEGIC MILESTONES</Text>
                  </View>

                  {/* Repeat Customer Status */}
                  <View style={styles.readOnlyMilestoneRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneToggleTitle}>Repeat / Existing Clients Served</Text>
                      <Text style={styles.milestoneToggleSubtitle}>Detected from customer entries marked Existing Customer</Text>
                    </View>
                    <View style={[styles.togglePill, oldCustomers ? styles.togglePillActive : styles.togglePillInactive]}>
                      <Text style={[styles.togglePillText, oldCustomers ? styles.togglePillTextActive : styles.togglePillTextInactive]}>
                        {oldCustomers ? '✓ Yes' : '✕ No'}
                      </Text>
                    </View>
                  </View>

                  {/* Engineer / Architect Status */}
                  <View style={styles.readOnlyMilestoneRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneToggleTitle}>Engineer / Architect Interactions</Text>
                      <Text style={styles.milestoneToggleSubtitle}>Detected from influencer customer entries</Text>
                    </View>
                    <View style={[styles.togglePill, engineerCalls ? styles.togglePillActive : styles.togglePillInactive]}>
                      <Text style={[styles.togglePillText, engineerCalls ? styles.togglePillTextActive : styles.togglePillTextInactive]}>
                        {engineerCalls ? '✓ Yes' : '✕ No'}
                      </Text>
                    </View>
                  </View>

                  {/* Cross-Sell Status */}
                  <View style={styles.readOnlyMilestoneRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneToggleTitle}>Cross-sell Combo Achieved</Text>
                      <Text style={styles.milestoneSub}>Detected from adhesives, grouts or sanitary additions</Text>
                    </View>
                    <View style={[styles.togglePill, crossSell ? styles.togglePillActive : styles.togglePillInactive]}>
                      <Text style={[styles.togglePillText, crossSell ? styles.togglePillTextActive : styles.togglePillTextInactive]}>
                        {crossSell ? '✓ Yes' : '✕ No'}
                      </Text>
                    </View>
                  </View>

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
                    {submittedSuccess ? '✓ Report Finalized' : `Finalize & Save ${activeStaffName}'s Shift`}
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
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ratingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
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
    paddingTop: 14,
    backgroundColor: '#F8FAFC',
  },
  autoCalculatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  autoCalculatedText: {
    fontSize: 11.5,
    color: '#1D4ED8',
    fontWeight: '700',
    flex: 1,
  },
  backToTeamBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backToTeamBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
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
    marginVertical: 4,
  },
  goalProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  goalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalSubtext: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  goalPercentText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '800',
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
  empPerfCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
  },
  empPerfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  empAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  empName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  empSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  empSalesValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'right',
  },
  empStatusBadge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  empStatusBadgeLogged: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  empStatusBadgePending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  empStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  empStatusBadgeTextLogged: {
    color: '#047857',
  },
  empStatusBadgeTextPending: {
    color: '#64748B',
  },
  empStatGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  empStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  empStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  empStatVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  milestoneBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  milestoneBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  milestoneBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  notesPreviewBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  notesPreviewLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  notesPreviewText: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    fontStyle: 'italic',
  },
  empCardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  inspectLinkText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563EB',
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
  readOnlyMilestoneRow: {
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
