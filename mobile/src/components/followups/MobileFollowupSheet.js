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
    case 'Building Owner': return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
    case 'Architect': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    case 'Mason': return { bg: '#FAF5FF', text: '#7E22CE', border: '#DDD6FE' };
    default: return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
  }
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

        {/* 3 Executive Stat Tiles */}
        <View style={styles.headerStatRow}>
          <View style={[styles.headerStatCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.headerStatVal, { color: '#1E40AF' }]}>{activeCounts?.today || 0}</Text>
            <Text style={styles.headerStatLabel}>Due Today</Text>
          </View>

          <View style={[styles.headerStatCard, (activeCounts?.overdue || 0) > 0 ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <Text style={[styles.headerStatVal, (activeCounts?.overdue || 0) > 0 ? { color: '#DC2626' } : { color: '#475569' }]}>{activeCounts?.overdue || 0}</Text>
            <Text style={styles.headerStatLabel}>Overdue</Text>
          </View>

          <View style={[styles.headerStatCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Text style={[styles.headerStatVal, { color: '#166534' }]}>{activeCounts?.upcoming || 0}</Text>
            <Text style={styles.headerStatLabel}>Next 7 Days</Text>
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
                onPress={() => setSelectedDetailItem(item)}
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
                        <Text style={styles.dHeroLocation}>{fullDetailItem.location}</Text>
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

              {/* ── Quick Contact Bar (Call + WhatsApp at top) ── */}
              {fullDetailItem?.phone ? (
                <View style={styles.dContactBar}>
                  <TouchableOpacity
                    style={styles.dContactCallBtn}
                    onPress={() => Linking.openURL(`tel:${fullDetailItem.phone}`)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dContactCallLabel}>Call Now</Text>
                      <Text style={styles.dContactCallNumber}>{fullDetailItem.phone}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dContactWaBtn}
                    onPress={() => openWhatsApp(fullDetailItem)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dContactWaLabel}>WhatsApp</Text>
                      <Text style={styles.dContactWaSub}>Send Quote</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* ── Pipeline & Valuation Summary ── */}
              <View style={styles.dInfoGrid}>
                <View style={styles.dInfoTile}>
                  <Text style={styles.dInfoTileLabel}>Quotation Value</Text>
                  <Text style={styles.dInfoTileValueGreen}>
                    ₹ {Number(fullDetailItem?.quotationValue || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {fullDetailItem?.tileBudget ? (
                  <View style={styles.dInfoTile}>
                    <Text style={styles.dInfoTileLabel}>Tile Budget</Text>
                    <Text style={[styles.dInfoTileValue, { color: '#2563EB' }]}>
                      ₹ {Number(fullDetailItem.tileBudget).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.dInfoTile}>
                  <Text style={styles.dInfoTileLabel}>Lead Priority</Text>
                  <Text style={styles.dInfoTileValue}>
                    {fullDetailItem?.leadTemperature || 'Hot'}
                  </Text>
                </View>

                {fullDetailItem?.status ? (
                  <View style={styles.dInfoTile}>
                    <Text style={styles.dInfoTileLabel}>Pipeline Stage</Text>
                    <Text style={styles.dInfoTileValue}>{fullDetailItem.status}</Text>
                  </View>
                ) : null}
              </View>

              {/* ── Material & Project Specifications ── */}
              <View style={styles.dSection}>
                <View style={styles.dSectionHead}>
                  <Text style={styles.dSectionTitle}>Material & Project Specifications</Text>
                </View>
                
                <View style={styles.dSectionMetaRow}>
                  <Text style={styles.dSectionMetaLabel}>Tile Requirement:</Text>
                  <Text style={styles.dSectionMetaVal}>{detailReqText || '—'}</Text>
                </View>

                {fullDetailItem?.approxQuantity ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Approx Flooring Qty:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.approxQuantity} sq.ft</Text>
                  </View>
                ) : null}

                {fullDetailItem?.sanitaryRequirement ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Sanitary Ware Spec:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.sanitaryRequirement}</Text>
                  </View>
                ) : null}

                {fullDetailItem?.adhesiveRequirement ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Adhesives & Grouts:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.adhesiveRequirement}</Text>
                  </View>
                ) : null}

                {fullDetailItem?.crossSell ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Cross-Sell Interest:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.crossSell}</Text>
                  </View>
                ) : null}
              </View>

              {/* ── Site Progress & Assignment Details ── */}
              <View style={styles.dSection}>
                <View style={styles.dSectionHead}>
                  <Text style={styles.dSectionTitle}>Site Progress & Identity</Text>
                </View>

                {fullDetailItem?.houseStage ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Construction Phase:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.houseStage}</Text>
                  </View>
                ) : null}

                {fullDetailItem?.leadSource ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Inquiry Source:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.leadSource}</Text>
                  </View>
                ) : null}

                {fullDetailItem?.salesperson ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Assigned Staff:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.salesperson}</Text>
                  </View>
                ) : null}

                {fullDetailItem?.phone ? (
                  <View style={styles.dSectionMetaRow}>
                    <Text style={styles.dSectionMetaLabel}>Contact Phone:</Text>
                    <Text style={styles.dSectionMetaVal}>{fullDetailItem.phone}</Text>
                  </View>
                ) : null}
              </View>

              {/* ── Activity Timeline (Vertical History List) ── */}
              <View style={styles.dSection}>
                <View style={styles.dSectionHead}>
                  <Text style={styles.dSectionTitle}>Activity Timeline</Text>
                </View>

                {activityTimeline.length > 0 ? (
                  <View style={styles.timelineContainer}>
                    {/* Vertical line through timeline */}
                    <View style={styles.timelineVerticalLine} />

                    {activityTimeline.map((act, index) => {
                      // Color code bullet dots based on activity outcome
                      const outcomeLower = act.outcome.toLowerCase();
                      const isPositive = outcomeLower.includes('won') || outcomeLower.includes('confirmed') || outcomeLower.includes('order');
                      const isNegative = outcomeLower.includes('lost') || outcomeLower.includes('postponed');
                      const dotColor = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#3B82F6';
                      const dotBg = isPositive ? '#ECFDF5' : isNegative ? '#FEF2F2' : '#EFF6FF';

                      return (
                        <View key={index} style={styles.timelineItem}>
                          {/* Left bullet marker */}
                          <View style={[styles.timelineBullet, { backgroundColor: dotBg, borderColor: dotColor }]}>
                            <View style={[styles.timelineBulletInner, { backgroundColor: dotColor }]} />
                          </View>

                          {/* Right Content details card */}
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
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={styles.dNotesEmpty}>
                      No history notes logged yet. Log callbacks or visits to begin your customer activity timeline.
                    </Text>
                  </View>
                )}

                {fullDetailItem?.lastReason && fullDetailItem.lastReason.trim() !== '' && (
                  <View style={styles.timelineObjectiveBox}>
                    <Text style={styles.timelineObjectiveLabel}>Latest Target Objective:</Text>
                    <Text style={styles.timelineObjectiveVal}>
                      {fullDetailItem.lastReason.split(': ').slice(1).join(': ') || fullDetailItem.lastReason}
                    </Text>
                  </View>
                )}
              </View>

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
                <Text style={styles.dLogActivityText}>Log Activity</Text>
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
                <Text style={styles.dMarkLostText}>✕ Lost</Text>
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
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatEmoji: {
    fontSize: 11,
    marginBottom: 1,
  },
  headerStatVal: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerStatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
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
  },
  dHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  dHeroAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dHeroAvatarLetter: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2563EB',
  },
  dHeroName: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  dHeroIdPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dHeroIdPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  dHeroTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  dHeroTypePillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  dHeroLocation: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dCloseBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '900',
  },
  dStatusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  dStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  dStatusDateText: {
    fontSize: 10.5,
    fontWeight: '600',
  },

  /* ── Quick Contact Bar ── */
  dContactBar: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 10,
    gap: 10,
  },
  dContactCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  dContactCallIcon: {
    fontSize: 18,
  },
  dContactCallLabel: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: -0.2,
  },
  dContactCallNumber: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 1,
  },
  dContactWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  dContactWaIcon: {
    fontSize: 18,
  },
  dContactWaLabel: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: -0.2,
  },
  dContactWaSub: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },

  /* ── Info Grid Tiles ── */
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
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: '46%',
    flexGrow: 1,
  },
  dInfoTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  dInfoTileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dInfoTileValueGreen: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },

  /* ── Info Sections ── */
  dSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  dSectionIcon: {
    fontSize: 13,
  },
  dSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  dSectionBody: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 19,
  },
  dSectionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4.5,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  dSectionMetaLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  dSectionMetaVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },

  /* ── Notes Card ── */
  dNotesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 13,
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
    fontSize: 12.5,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 18,
    fontWeight: '500',
  },
  dNotesEmpty: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 2,
  },
  dNotesTimestamp: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 8,
  },

  /* ── Action Footer ── */
  dActionFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dLogActivityBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2563EB',
    borderRadius: 13,
    paddingVertical: 13,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dLogActivityIcon: {
    fontSize: 15,
  },
  dLogActivityText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dMarkLostBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    borderRadius: 13,
    paddingVertical: 13,
  },
  dMarkLostText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: -0.2,
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

