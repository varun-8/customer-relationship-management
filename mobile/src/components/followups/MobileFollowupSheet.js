import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const formatRelativeUrgency = (nextFollowUp) => {
  if (!nextFollowUp) {
    return { label: 'No Date', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', dot: '#94A3B8', isOverdue: false, isToday: false };
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextFollowUp);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d overdue`,
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECDD3',
        dot: '#EF4444',
        accent: '#EF4444',
        isOverdue: true,
        isToday: false,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Today',
        color: '#1D4ED8',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        dot: '#2563EB',
        accent: '#2563EB',
        isOverdue: false,
        isToday: true,
      };
    }
    if (diffDays === 1) {
      return {
        label: 'Tomorrow',
        color: '#047857',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        dot: '#10B981',
        accent: '#10B981',
        isOverdue: false,
        isToday: false,
      };
    }
    return {
      label: `In ${diffDays}d (${nextFollowUp.split('-').slice(1).join('/')})`,
      color: '#334155',
      bg: '#F8FAFC',
      border: '#E2E8F0',
      dot: '#64748B',
      accent: '#64748B',
      isOverdue: false,
      isToday: false,
    };
  } catch (e) {
    return { label: nextFollowUp, color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', dot: '#94A3B8', accent: '#CBD5E1', isOverdue: false, isToday: false };
  }
};

const getCustomerTypeColors = (type) => {
  switch (type) {
    case 'Building Owner': return { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' };
    case 'Architect': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    case 'Mason': return { bg: '#FAF5FF', text: '#7E22CE', border: '#DDD6FE' };
    default: return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
  }
};

const getRequirementChipStyle = (val) => {
  const v = (val || '').toLowerCase();
  if (v.includes('tile')) return { icon: '🧱', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' };
  if (v.includes('sanitary') || v.includes('bath') || v.includes('toilet') || v.includes('basin')) return { icon: '🚿', bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' };
  if (v.includes('cp') || v.includes('tap') || v.includes('faucet') || v.includes('shower')) return { icon: '🚰', bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' };
  if (v.includes('adhesive') || v.includes('grout')) return { icon: '🧪', bg: '#FAF5FF', border: '#DDD6FE', text: '#7E22CE' };
  return { icon: '✨', bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' };
};

export function MobileFollowupSheet({
  followups,
  customers = [],
  counts,
  loading,
  refreshing,
  onRefresh,
  activeTab,
  onTabChange,
  currentProfile,
  onLogActivity,
  onRecordLost,
  openWhatsApp,
  isOnline = true,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'specs' | 'timeline'

  // Check if active profile is an employee / sales person
  const isEmployee = Boolean(
    currentProfile && currentProfile.role !== 'owner' && currentProfile.name
  );
  const staffName = currentProfile?.name ? currentProfile.name.trim().toLowerCase() : '';

  // Filter leads to only the logged-in salesperson's records if employee
  const staffScopedFollowups = useMemo(() => {
    if (!followups || followups.length === 0) return [];
    if (!isEmployee || !staffName) return followups;
    return followups.filter((f) => {
      const s = (f.salesperson || '').trim().toLowerCase();
      return s === staffName || s.includes(staffName) || staffName.includes(s);
    });
  }, [followups, isEmployee, staffName]);

  // Compute dynamic counts strictly for the active user's scope
  const activeCounts = useMemo(() => {
    if (!isEmployee) {
      return counts || { today: 0, upcoming: 0, overdue: 0, total: 0 };
    }
    // Calculate employee-specific counts from staffScopedFollowups
    let today = 0;
    let upcoming = 0;
    let overdue = 0;
    staffScopedFollowups.forEach((f) => {
      if (f.bucket === 'today') today += 1;
      else if (f.bucket === 'overdue') overdue += 1;
      else upcoming += 1;
    });
    return {
      today,
      upcoming,
      overdue,
      total: staffScopedFollowups.length,
    };
  }, [isEmployee, staffScopedFollowups, counts]);

  // Filter followups based on search text
  const displayedFollowups = useMemo(() => {
    const baseList = staffScopedFollowups || [];
    if (!localSearch.trim()) return baseList;
    const q = localSearch.toLowerCase().trim();
    return baseList.filter((f) => {
      const name = String(f.customerName || '').toLowerCase();
      const phone = String(f.phone || '').toLowerCase();
      const id = String(f.customerId || '').toLowerCase();
      const req = (typeof f.requirement === 'string' ? f.requirement : Array.isArray(f.requirement) ? f.requirement.join(' ') : '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q) || req.includes(q);
    });
  }, [staffScopedFollowups, localSearch]);

  // Match selected detail item with full customer record from parent list
  const fullDetailItem = useMemo(() => {
    if (!selectedDetailItem) return null;
    const match = (customers || []).find(
      (c) => c.customerId === selectedDetailItem.customerId || c._id === selectedDetailItem._id
    );
    if (!match) return selectedDetailItem;
    const d = match.data instanceof Map ? Object.fromEntries(match.data) : (match.data || match);
    return {
      ...selectedDetailItem,
      ...d,
    };
  }, [selectedDetailItem, customers]);

  const detailUrgency = fullDetailItem ? formatRelativeUrgency(fullDetailItem.nextFollowUp) : null;
  const detailTypeColors = fullDetailItem ? getCustomerTypeColors(fullDetailItem.customerType) : null;
  const detailReqText = fullDetailItem
    ? Array.isArray(fullDetailItem.requirement)
      ? fullDetailItem.requirement.join(', ')
      : (fullDetailItem.requirement || 'Tiles & Sanitary Wares')
    : '';

  const reqItems = useMemo(() => {
    if (!fullDetailItem?.requirement) return [];
    if (Array.isArray(fullDetailItem.requirement)) return fullDetailItem.requirement;
    return String(fullDetailItem.requirement)
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
  }, [fullDetailItem?.requirement]);

  const tempPill = useMemo(() => {
    const t = String(fullDetailItem?.leadTemperature || 'Hot').toLowerCase();
    if (t === 'hot') return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: '🔥' };
    if (t === 'warm') return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', icon: '⚡' };
    return { bg: '#F0FDFA', border: '#CCFBF1', text: '#0F766E', icon: '✦' };
  }, [fullDetailItem?.leadTemperature]);

  // Parse discussion history to construct a vertical activity timeline
  const activityTimeline = useMemo(() => {
    if (!fullDetailItem?.notes || !fullDetailItem.notes.trim()) return [];
    const lines = fullDetailItem.notes.split('\n');
    const list = [];
    lines.forEach((line) => {
      if (!line.trim()) return;
      // Match format: [YYYY-MM-DD] Outcome: DiscussionNotes
      const match = line.match(/^\[([\d-]+)\]\s*(.*?):\s*(.*)$/);
      if (match) {
        list.push({
          date: match[1],
          outcome: match[2],
          notes: match[3],
        });
      } else {
        list.push({
          date: '',
          outcome: 'Activity Logged',
          notes: line,
        });
      }
    });
    return list.reverse(); // Newest first
  }, [fullDetailItem?.notes]);

  const formatTimelineDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (months[monthIndex]) {
          return `${day} ${months[monthIndex]} ${parts[0]}`;
        }
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {/* Offline Status & Cloud Reconnect Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineBannerText}>
              Offline Mode • Showing {displayedFollowups.length} local leads
            </Text>
          </View>
          <TouchableOpacity
            style={styles.offlineRetryBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.offlineRetryBtnText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Screen Header & Executive Quick Stats Summary ── */}
      <View style={styles.sheetHeaderWrapper}>
        <View style={styles.sheetTopTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconBadge}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F766E' }} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sheetTopTitle}>
                    {isEmployee ? 'Follow-ups' : 'Showroom Follow-ups'}
                  </Text>
                  <View style={styles.sheetTopCountBadge}>
                    <Text style={styles.sheetTopCountBadgeText}>{activeCounts?.total || 0}</Text>
                  </View>
                </View>
                <Text style={styles.sheetTopSubtitle}>
                  {isEmployee
                    ? `Active callback queue & scheduled reminders`
                    : 'Showroom active customer follow-ups & callbacks'}
                </Text>
              </View>
            </View>

            {isEmployee && (
              <View style={styles.employeeIdentityChip}>
                <Text style={styles.employeeIdentityChipText}>{currentProfile?.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 3 Executive Modern Stat Tiles matching Leads page */}
        <View style={styles.headerStatRow}>
          {/* 1. Due Today */}
          <View style={styles.headerStatCard}>
            <View style={styles.headerStatTopRow}>
              <View style={[styles.headerStatIconBadge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                <Text style={[styles.headerStatIconGlyph, { color: '#2563EB' }]}>📅</Text>
              </View>
              <Text style={styles.headerStatLabel}>DUE TODAY</Text>
            </View>
            <Text style={[styles.headerStatVal, { color: '#1D4ED8' }]} numberOfLines={1}>
              {activeCounts?.today || 0}
            </Text>
            <View style={[styles.headerStatSubBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.headerStatSubText, { color: '#2563EB' }]}>
                {(activeCounts?.today || 0) > 0 ? 'Pending calls' : 'All clear'}
              </Text>
            </View>
          </View>

          {/* 2. Overdue */}
          <View style={styles.headerStatCard}>
            <View style={styles.headerStatTopRow}>
              <View
                style={[
                  styles.headerStatIconBadge,
                  (activeCounts?.overdue || 0) > 0
                    ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
                    : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                ]}
              >
                <Text
                  style={[
                    styles.headerStatIconGlyph,
                    { color: (activeCounts?.overdue || 0) > 0 ? '#DC2626' : '#64748B' },
                  ]}
                >
                  {(activeCounts?.overdue || 0) > 0 ? '⏱' : '•'}
                </Text>
              </View>
              <Text style={styles.headerStatLabel}>OVERDUE</Text>
            </View>
            <Text
              style={[
                styles.headerStatVal,
                (activeCounts?.overdue || 0) > 0 ? { color: '#DC2626' } : { color: '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {activeCounts?.overdue || 0}
            </Text>
            <View
              style={[
                styles.headerStatSubBadge,
                (activeCounts?.overdue || 0) > 0
                  ? { backgroundColor: '#FEF2F2' }
                  : { backgroundColor: '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.headerStatSubText,
                  (activeCounts?.overdue || 0) > 0 ? { color: '#DC2626' } : { color: '#64748B' },
                ]}
              >
                {(activeCounts?.overdue || 0) > 0 ? 'Action needed' : 'Zero backlog'}
              </Text>
            </View>
          </View>

          {/* 3. Next 7 Days */}
          <View style={styles.headerStatCard}>
            <View style={styles.headerStatTopRow}>
              <View style={[styles.headerStatIconBadge, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                <Text style={[styles.headerStatIconGlyph, { color: '#16A34A' }]}>🗓️</Text>
              </View>
              <Text style={styles.headerStatLabel}>NEXT 7 DAYS</Text>
            </View>
            <Text style={[styles.headerStatVal, { color: '#15803D' }]} numberOfLines={1}>
              {activeCounts?.upcoming || 0}
            </Text>
            <View style={[styles.headerStatSubBadge, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.headerStatSubText, { color: '#16A34A' }]}>
                {(activeCounts?.upcoming || 0) > 0 ? 'Scheduled' : 'None upcoming'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 1. In-List Search Toolbar */}
      <View style={styles.filterToolbar}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search follow-ups by customer name, phone or ID..."
            placeholderTextColor="#94A3B8"
            value={localSearch}
            onChangeText={setLocalSearch}
          />
          {localSearch ? (
            <TouchableOpacity onPress={() => setLocalSearch('')} style={styles.clearSearchBtn}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 2. Horizontal scrolling Filter Tab pills */}
      <View style={styles.filterTabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabBarContent}
        >
          {[
            { id: 'today', label: 'Today', count: activeCounts?.today || 0 },
            { id: 'upcoming', label: '7 Days', count: activeCounts?.upcoming || 0 },
            { id: 'overdue', label: 'Overdue', count: activeCounts?.overdue || 0 },
            { id: 'all', label: 'All', count: activeCounts?.total || 0 },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.filterTabBadge, isSelected && styles.filterTabBadgeActive]}>
                  <Text style={[styles.filterTabBadgeText, isSelected && styles.filterTabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Follow-up Cards List */}
      {loading && (!displayedFollowups || displayedFollowups.length === 0) ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching your follow-ups schedule...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedFollowups || []}
          keyExtractor={(item, index) => item._id || item.customerId || `fu_${item.phone}_${index}`}
          extraData={{ activeTab, refreshing, isEmployee, staffName }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 95, paddingTop: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing || (loading && displayedFollowups.length > 0)} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {localSearch
                  ? 'No matching leads found'
                  : isEmployee
                  ? `No leads scheduled in this section`
                  : 'Follow-up Queue is Clear!'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {localSearch
                  ? `No leads match "${localSearch}" in your pipeline.`
                  : activeTab === 'today'
                  ? 'All scheduled calls for today are cleared. Great job!'
                  : activeTab === 'overdue'
                  ? 'Zero overdue leads in your pipeline.'
                  : 'No scheduled reminders in this section.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const urgency = formatRelativeUrgency(item.nextFollowUp);
            const initial = (item.customerName || 'C').charAt(0).toUpperCase();
            const typeColors = getCustomerTypeColors(item.customerType);

            // Accent strip border color
            const accentBorderColor = urgency.isOverdue
              ? '#EF4444'
              : urgency.isToday
              ? '#2563EB'
              : '#10B981';

            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: accentBorderColor, borderLeftWidth: 4 }]}
                activeOpacity={0.75}
                onPress={() => {
                  setDetailTab('overview');
                  setSelectedDetailItem(item);
                }}
              >
                {/* Header Row: Avatar, Customer Name & Relative Urgency Pill */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10, marginRight: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {item.customerName || 'Unnamed Lead'}
                      </Text>
                      {item.customerId && (
                        <View style={styles.idBadge}>
                          <Text style={styles.idBadgeText}>#{item.customerId}</Text>
                        </View>
                      )}
                    </View>

                    {item.phone || item.location ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        {item.phone ? (
                          <Text style={styles.metaPhone} numberOfLines={1}>
                            {item.phone}
                          </Text>
                        ) : null}
                        {item.phone && item.location ? <Text style={styles.metaDot}>•</Text> : null}
                        {item.location ? (
                          <Text style={styles.metaLocation} numberOfLines={1}>
                            {item.location}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>

                  {/* Relative Urgency Pill */}
                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg, borderColor: urgency.border }]}>
                    <Text style={[styles.urgencyLabel, { color: urgency.color }]}>
                      {urgency.label}
                    </Text>
                  </View>
                </View>

                {/* Middle Info Strip: Customer Type Badge & Requirement Tag */}
                <View style={styles.cardMiddleRow}>
                  {item.customerType ? (
                    <View style={[styles.cardTypePill, { backgroundColor: typeColors.bg, borderColor: typeColors.border }]}>
                      <Text style={[styles.cardTypePillText, { color: typeColors.text }]}>
                        {item.customerType}
                      </Text>
                    </View>
                  ) : null}

                  {item.requirement ? (
                    <View style={styles.cardReqTag}>
                      <Text style={styles.cardReqTagText} numberOfLines={1}>
                        {Array.isArray(item.requirement) ? item.requirement.join(', ') : item.requirement}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer Strip: Valuation & Tap Chevron */}
                <View style={styles.cardFooterStrip}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {item.quotationValue ? (
                      <View style={styles.valuationBadge}>
                        <Text style={styles.footerValuationText}>
                          ₹{Number(item.quotationValue || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.footerValuationMuted}>Quote Pending</Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.tapToViewText}>Review details</Text>
                    <Text style={styles.chevronIcon}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 4. Professional Lead Detail Sheet */}
      <Modal
        visible={Boolean(selectedDetailItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            {/* Drag Handle */}
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

              {/* ── Hero Header ── */}
              <View style={styles.dHeroSection}>
                <View style={styles.dHeroTop}>
                  <View style={styles.dHeroAvatarBox}>
                    <Text style={styles.dHeroAvatarLetter}>
                      {(fullDetailItem?.customerName || 'C').charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.dHeroName} numberOfLines={1}>
                        {fullDetailItem?.customerName || 'Customer'}
                      </Text>
                      {fullDetailItem?.customerId && (
                        <View style={styles.dHeroIdPill}>
                          <Text style={styles.dHeroIdPillText}>#{fullDetailItem.customerId}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      {fullDetailItem?.customerType && (
                        <View style={[styles.dHeroTypePill, { backgroundColor: detailTypeColors?.bg, borderColor: detailTypeColors?.border }]}>
                          <Text style={[styles.dHeroTypePillText, { color: detailTypeColors?.text }]}>
                            {fullDetailItem.customerType}
                          </Text>
                        </View>
                      )}
                      {fullDetailItem?.location && (
                        <View style={styles.dHeroLocationBadge}>
                          <Text style={styles.dHeroLocation} numberOfLines={1}>📍 {fullDetailItem.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedDetailItem(null)}
                    style={styles.dCloseBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.dCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Follow-up Status Ribbon */}
                {detailUrgency && (
                  <View style={[styles.dStatusRibbon, { backgroundColor: detailUrgency.bg, borderColor: detailUrgency.border }]}>
                    <View style={[styles.dStatusDot, { backgroundColor: detailUrgency.dot || detailUrgency.accent }]} />
                    <Text style={[styles.dStatusText, { color: detailUrgency.color }]}>
                      {detailUrgency.label}
                    </Text>
                    {fullDetailItem?.nextFollowUp && (
                      <Text style={[styles.dStatusDateText, { color: detailUrgency.color }]}>
                        — {fullDetailItem.nextFollowUp}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* ── Modern Lightweight Segmented Tabs ── */}
              <View style={styles.dSegmentTrack}>
                <TouchableOpacity
                  style={[styles.dSegmentBtn, detailTab === 'overview' && styles.dSegmentBtnActive]}
                  onPress={() => setDetailTab('overview')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dSegmentBtnText, detailTab === 'overview' && styles.dSegmentBtnTextActive]}>
                    Overview
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dSegmentBtn, detailTab === 'specs' && styles.dSegmentBtnActive]}
                  onPress={() => setDetailTab('specs')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dSegmentBtnText, detailTab === 'specs' && styles.dSegmentBtnTextActive]}>
                    Specs & Site
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dSegmentBtn, detailTab === 'timeline' && styles.dSegmentBtnActive]}
                  onPress={() => setDetailTab('timeline')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dSegmentBtnText, detailTab === 'timeline' && styles.dSegmentBtnTextActive]}>
                    Timeline{activityTimeline.length > 0 ? ` (${activityTimeline.length})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── TAB 1: OVERVIEW ── */}
              {detailTab === 'overview' && (
                <View>
                  {/* 1-Tap Action Call & WhatsApp Buttons (Clean, matching Leads page) */}
                  {fullDetailItem?.phone ? (
                    <View style={styles.detailHeroActionsRow}>
                      <TouchableOpacity
                        style={styles.detailActionBtnCall}
                        onPress={() => Linking.openURL(`tel:${fullDetailItem.phone}`)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.detailActionBtnCallIcon}>📞</Text>
                        <Text style={styles.detailActionBtnCallText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailActionBtnWhatsApp}
                        onPress={() => openWhatsApp(fullDetailItem)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.detailActionBtnWhatsAppIcon}>💬</Text>
                        <Text style={styles.detailActionBtnWhatsAppText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Modern Deal Valuation & Pipeline Banner */}
                  <View style={styles.dValuationBanner}>
                    <View style={styles.dValuationTopRow}>
                      <View>
                        <Text style={styles.dValuationLabel}>Quotation Value</Text>
                        <Text style={styles.dValuationAmount}>
                          ₹ {Number(fullDetailItem?.quotationValue || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.dValuationBadgesCol}>
                        <View style={[styles.dPriorityPill, { backgroundColor: tempPill.bg, borderColor: tempPill.border }]}>
                          <Text style={{ fontSize: 11 }}>{tempPill.icon}</Text>
                          <Text style={[styles.dPriorityPillText, { color: tempPill.text }]}>
                            {fullDetailItem?.leadTemperature || 'Hot'}
                          </Text>
                        </View>
                        {fullDetailItem?.status ? (
                          <View style={styles.dStagePill}>
                            <Text style={styles.dStagePillText}>{fullDetailItem.status}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {fullDetailItem?.tileBudget ? (
                      <View style={styles.dBudgetChip}>
                        <Text style={{ fontSize: 12, color: '#0F766E' }}>📊</Text>
                        <Text style={styles.dBudgetChipText}>
                          Tile Budget: ₹ {Number(fullDetailItem.tileBudget).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Next Reminder & Target Objective Card */}
                  {detailUrgency && (
                    <View style={[styles.dReminderCard, { backgroundColor: detailUrgency.bg, borderColor: detailUrgency.border }]}>
                      <View style={styles.dReminderHead}>
                        <View style={styles.dReminderLeft}>
                          <View style={[styles.dStatusDot, { backgroundColor: detailUrgency.dot || detailUrgency.accent }]} />
                          <Text style={[styles.dReminderTitle, { color: detailUrgency.color }]}>
                            {detailUrgency.label}
                          </Text>
                        </View>
                        {fullDetailItem?.nextFollowUp && (
                          <Text style={[styles.dReminderDate, { color: detailUrgency.color }]}>
                            {fullDetailItem.nextFollowUp}
                          </Text>
                        )}
                      </View>

                      {fullDetailItem?.lastReason && fullDetailItem.lastReason.trim() !== '' ? (
                        <View style={styles.dObjectiveBox}>
                          <Text style={[styles.dObjectiveLabel, { color: detailUrgency.color }]}>
                            🎯 Target Objective
                          </Text>
                          <Text style={[styles.dObjectiveText, { color: detailUrgency.color }]}>
                            {fullDetailItem.lastReason.split(': ').slice(1).join(': ') || fullDetailItem.lastReason}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {/* Quick Specs Snapshot Card */}
                  <View style={styles.dSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.dSectionIconBox}>
                          <Text style={styles.dSectionIcon}>🧱</Text>
                        </View>
                        <Text style={styles.dSectionTitle}>Requirement Snapshot</Text>
                      </View>
                      <TouchableOpacity onPress={() => setDetailTab('specs')} activeOpacity={0.7} style={styles.dSectionLinkBtn}>
                        <Text style={styles.dSectionLinkText}>All Specs ›</Text>
                      </TouchableOpacity>
                    </View>

                    {reqItems.length > 0 ? (
                      <View style={styles.dTagRow}>
                        {reqItems.map((req, idx) => {
                          const chipStyle = getRequirementChipStyle(req);
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.dTagChip,
                                { backgroundColor: chipStyle.bg, borderColor: chipStyle.border },
                              ]}
                            >
                              <Text style={{ fontSize: 12 }}>{chipStyle.icon}</Text>
                              <Text style={[styles.dTagChipText, { color: chipStyle.text }]}>{req}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.dNotesEmpty}>No specific tile requirement tagged yet.</Text>
                    )}

                    {fullDetailItem?.approxQuantity ? (
                      <View style={styles.dMetricHighlightChip}>
                        <Text style={{ fontSize: 13 }}>📐</Text>
                        <Text style={styles.dMetricHighlightText}>
                          {fullDetailItem.approxQuantity} sq.ft flooring coverage
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Recent Activity Snapshot Card */}
                  <View style={styles.dSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.dSectionIconBox}>
                          <Text style={styles.dSectionIcon}>💬</Text>
                        </View>
                        <Text style={styles.dSectionTitle}>Recent Interaction</Text>
                      </View>
                      {activityTimeline.length > 0 && (
                        <TouchableOpacity onPress={() => setDetailTab('timeline')} activeOpacity={0.7} style={styles.dSectionLinkBtn}>
                          <Text style={styles.dSectionLinkText}>Timeline ({activityTimeline.length}) ›</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {activityTimeline.length > 0 ? (
                      <View style={styles.dRecentActivityBox}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={styles.dRecentOutcomeBadge}>
                            <Text style={styles.dRecentOutcomeText}>{activityTimeline[0].outcome}</Text>
                          </View>
                          {activityTimeline[0].date ? (
                            <Text style={styles.timelineDate}>{formatTimelineDate(activityTimeline[0].date)}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.timelineNotes}>"{activityTimeline[0].notes.trim()}"</Text>
                      </View>
                    ) : (
                      <Text style={styles.dNotesEmpty}>
                        No activity logged yet. Tap "Log Activity" below after speaking with the customer.
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* ── TAB 2: SPECS & SITE ── */}
              {detailTab === 'specs' && (
                <View>
                  {/* Material & Tile Specifications Card */}
                  <View style={styles.dSection}>
                    <View style={styles.dSectionHead}>
                      <View style={styles.dSectionIconBox}>
                        <Text style={styles.dSectionIcon}>📐</Text>
                      </View>
                      <Text style={styles.dSectionTitle}>Tile & Flooring Requirements</Text>
                    </View>

                    {reqItems.length > 0 ? (
                      <View style={styles.dTagRow}>
                        {reqItems.map((req, idx) => {
                          const chipStyle = getRequirementChipStyle(req);
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.dTagChip,
                                { backgroundColor: chipStyle.bg, borderColor: chipStyle.border },
                              ]}
                            >
                              <Text style={{ fontSize: 12 }}>{chipStyle.icon}</Text>
                              <Text style={[styles.dTagChipText, { color: chipStyle.text }]}>{req}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.dNotesEmpty}>General tile requirement.</Text>
                    )}

                    {fullDetailItem?.approxQuantity ? (
                      <View style={styles.dMetricHighlightChip}>
                        <Text style={{ fontSize: 13 }}>📐</Text>
                        <Text style={styles.dMetricHighlightText}>
                          {fullDetailItem.approxQuantity} sq.ft Approx Flooring Quantity
                        </Text>
                      </View>
                    ) : null}

                    {fullDetailItem?.sanitaryRequirement ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Sanitary Ware Spec</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.sanitaryRequirement}</Text>
                      </View>
                    ) : null}

                    {fullDetailItem?.adhesiveRequirement ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Adhesives & Grouts</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.adhesiveRequirement}</Text>
                      </View>
                    ) : null}

                    {fullDetailItem?.crossSell ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Cross-Sell Interest</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.crossSell}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Site Progress & Identity Card */}
                  <View style={styles.dSection}>
                    <View style={styles.dSectionHead}>
                      <View style={styles.dSectionIconBox}>
                        <Text style={styles.dSectionIcon}>🏗️</Text>
                      </View>
                      <Text style={styles.dSectionTitle}>Site Progress & Construction</Text>
                    </View>

                    {fullDetailItem?.houseStage ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Construction Phase</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.houseStage}</Text>
                      </View>
                    ) : null}

                    {fullDetailItem?.location ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Site Location</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.location}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Customer & Staff Details */}
                  <View style={styles.dSection}>
                    <View style={styles.dSectionHead}>
                      <View style={styles.dSectionIconBox}>
                        <Text style={styles.dSectionIcon}>👤</Text>
                      </View>
                      <Text style={styles.dSectionTitle}>Sales & Contact Details</Text>
                    </View>

                    {fullDetailItem?.salesperson ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Assigned Staff</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.salesperson}</Text>
                      </View>
                    ) : null}

                    {fullDetailItem?.leadSource ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Inquiry Source</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.leadSource}</Text>
                      </View>
                    ) : null}

                    {fullDetailItem?.phone ? (
                      <View style={styles.dSectionMetaRow}>
                        <Text style={styles.dSectionMetaLabel}>Contact Phone</Text>
                        <Text style={styles.dSectionMetaVal}>{fullDetailItem.phone}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}

              {/* ── TAB 3: TIMELINE ── */}
              {detailTab === 'timeline' && (
                <View style={styles.dSection}>
                  <View style={styles.dSectionHead}>
                    <View style={styles.dSectionIconBox}>
                      <Text style={styles.dSectionIcon}>⏱️</Text>
                    </View>
                    <Text style={styles.dSectionTitle}>Customer Activity Timeline</Text>
                  </View>

                  {activityTimeline.length > 0 ? (
                    <View style={styles.timelineContainer}>
                      <View style={styles.timelineVerticalLine} />

                      {activityTimeline.map((act, index) => {
                        const outcomeLower = act.outcome.toLowerCase();
                        const isPositive = outcomeLower.includes('won') || outcomeLower.includes('confirmed') || outcomeLower.includes('order');
                        const isNegative = outcomeLower.includes('lost') || outcomeLower.includes('postponed');
                        const dotColor = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#0F766E';
                        const dotBg = isPositive ? '#ECFDF5' : isNegative ? '#FEF2F2' : '#F0FDFA';

                        return (
                          <View key={index} style={styles.timelineItem}>
                            <View style={[styles.timelineBullet, { backgroundColor: dotBg, borderColor: dotColor }]}>
                              <View style={[styles.timelineBulletInner, { backgroundColor: dotColor }]} />
                            </View>

                            <View style={styles.timelineContent}>
                              <View style={styles.timelineHeaderRow}>
                                <Text style={[styles.timelineTitle, { color: dotColor }]}>
                                  {act.outcome}
                                </Text>
                                {act.date ? (
                                  <Text style={styles.timelineDate}>
                                    {formatTimelineDate(act.date)}
                                  </Text>
                                ) : null}
                              </View>
                              <Text style={styles.timelineNotes}>"{act.notes.trim()}"</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                      <Text style={styles.dNotesEmpty}>
                        No history notes logged yet. Log callbacks or visits to begin your customer activity timeline.
                      </Text>
                    </View>
                  )}
                </View>
              )}

            </ScrollView>

            {/* ── Sticky Action Footer ── */}
            <View style={styles.dActionFooter}>
              <TouchableOpacity
                style={styles.dLogActivityBtn}
                onPress={() => {
                  const item = selectedDetailItem;
                  setSelectedDetailItem(null);
                  onLogActivity(item);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.dLogActivityGradient}>
                  <Text style={styles.dLogActivityIcon}>📋</Text>
                  <Text style={styles.dLogActivityText}>Log Activity</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dMarkLostBtn}
                onPress={() => {
                  const item = selectedDetailItem;
                  setSelectedDetailItem(null);
                  onRecordLost(item);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.dMarkLostGradient}>
                  <Text style={styles.dMarkLostIcon}>✕</Text>
                  <Text style={styles.dMarkLostText}>Lost</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sheetTopTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sheetTopTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  sheetTopCountBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 7,
  },
  sheetTopCountBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  sheetTopSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  employeeIdentityChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  employeeIdentityChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  filterTabBar: {
    marginBottom: 8,
  },
  filterTabBarContent: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 14,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterTabActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterTabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterTabBadgeTextActive: {
    color: '#FFFFFF',
  },
  filterToolbar: {
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  employeeIdentityBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  employeeIdentityText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  offlineBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  offlineRetryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offlineRetryBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 13,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2563EB',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  idBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  metaPhone: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  metaLocation: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  urgencyLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  sheetHeaderWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 6,
  },
  headerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  headerStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 90,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  headerStatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerStatIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatIconGlyph: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  headerStatVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginVertical: 2,
  },
  headerStatSubBadge: {
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  headerStatSubText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  cardTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardTypePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardReqTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 1,
  },
  cardReqTagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  valuationBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardFooterStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerValuationText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#059669',
  },
  footerValuationMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tapToViewText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  chevronIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '93%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  /* ── Hero Header ── */
  dHeroSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dHeroAvatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dHeroAvatarLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dHeroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  dHeroIdPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dHeroIdPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dHeroTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dHeroTypePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dHeroLocation: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  dCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dCloseBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '800',
  },
  dStatusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  dStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dStatusDateText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* ── 1-Tap Action Call & WhatsApp Buttons (Matching Leads Page) ── */
  detailHeroActionsRow: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 10,
    gap: 10,
  },
  detailActionBtnCall: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  detailActionBtnCallIcon: {
    fontSize: 14,
  },
  detailActionBtnCallText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  detailActionBtnWhatsApp: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  detailActionBtnWhatsAppIcon: {
    fontSize: 14,
  },
  detailActionBtnWhatsAppText: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 13,
  },

  dHeroLocationBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 160,
  },

  /* ── Modern Lightweight Segmented Tabs ── */
  dSegmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 14,
    marginTop: 10,
    gap: 4,
  },
  dSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dSegmentBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  dSegmentBtnTextActive: {
    fontWeight: '800',
    color: '#0F172A',
  },

  /* ── Deal Valuation & Pipeline Banner ── */
  dValuationBanner: {
    backgroundColor: '#F0FDFA',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#99F6E4',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dValuationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dValuationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dValuationAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  dValuationBadgesCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dPriorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dPriorityPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  dStagePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dStagePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  dBudgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CCFBF1',
  },
  dBudgetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },

  /* ── Reminder & Objective Card ── */
  dReminderCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  dReminderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dReminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dReminderTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  dReminderDate: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dObjectiveBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  dObjectiveLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dObjectiveText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },

  /* ── Tag Chips & Metric Highlights ── */
  dTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  dTagChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
  },
  dTagChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  dSectionLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dSectionLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  dMetricHighlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  dMetricHighlightText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  dRecentActivityBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    padding: 10,
    marginTop: 4,
  },
  dRecentOutcomeBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dRecentOutcomeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },

  /* ── Info Grid Tiles (legacy fallback) ── */
  dInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 14,
    marginTop: 10,
    gap: 8,
  },
  dInfoTile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '46%',
    flexGrow: 1,
  },
  dInfoTileHighlight: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '46%',
    flexGrow: 1,
  },
  dInfoTileLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dInfoTileValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dInfoTileValueGreen: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F766E',
  },

  /* ── Info Sections ── */
  dSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dSectionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dSectionIcon: {
    fontSize: 13,
  },
  dSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  dSectionBody: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 19,
  },
  dSectionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginVertical: 2,
  },
  dSectionMetaLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dSectionMetaVal: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },

  /* ── Notes Card ── */
  dNotesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dNotesBubble: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 2,
  },
  dNotesQuote: {
    fontSize: 13,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 19,
    fontWeight: '500',
  },
  dNotesEmpty: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 2,
  },
  dNotesTimestamp: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 8,
  },

  /* ── Action Footer ── */
  dActionFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dLogActivityBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dLogActivityGradient: {
    height: 48,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  dLogActivityIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dLogActivityText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dMarkLostBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  dMarkLostGradient: {
    height: 48,
    backgroundColor: '#FFF1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  dMarkLostIcon: {
    fontSize: 13,
    color: '#E11D48',
    fontWeight: '900',
  },
  dMarkLostText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: -0.1,
  },

  /* ── Activity Timeline Styles ── */
  timelineContainer: {
    marginTop: 8,
    position: 'relative',
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 9,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  timelineBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginRight: 10,
  },
  timelineBulletInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  timelineDate: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  timelineNotes: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  timelineObjectiveBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  timelineObjectiveLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  timelineObjectiveVal: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
    lineHeight: 17,
  },
});

