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

const STAFF_MEMBERS = ['all', 'Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar'];

const formatRelativeUrgency = (nextFollowUp) => {
  if (!nextFollowUp) return { label: 'No Date', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', dot: '#94A3B8', isOverdue: false, isToday: false };
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
    case 'Building Owner': return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: '🏢' };
    case 'Architect': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: '📐' };
    case 'Mason': return { bg: '#FAF5FF', text: '#7E22CE', border: '#DDD6FE', icon: '🧱' };
    default: return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', icon: '👤' };
  }
};

export function MobileFollowupSheet({
  followups,
  counts,
  loading,
  refreshing,
  onRefresh,
  activeTab,
  onTabChange,
  temperatureFilter,
  onTemperatureChange,
  ownerStaffFilter,
  onOwnerStaffChange,
  currentProfile,
  onLogActivity,
  onRecordLost,
  openWhatsApp,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Filter followups based on search text
  const displayedFollowups = useMemo(() => {
    if (!localSearch.trim()) return followups;
    const q = localSearch.toLowerCase().trim();
    return followups.filter((f) => {
      const name = (f.customerName || '').toLowerCase();
      const phone = (f.phone || '').toLowerCase();
      const id = (f.customerId || '').toLowerCase();
      const req = (typeof f.requirement === 'string' ? f.requirement : Array.isArray(f.requirement) ? f.requirement.join(' ') : '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q) || req.includes(q);
    });
  }, [followups, localSearch]);

  const detailUrgency = selectedDetailItem ? formatRelativeUrgency(selectedDetailItem.nextFollowUp) : null;
  const detailTypeColors = selectedDetailItem ? getCustomerTypeColors(selectedDetailItem.customerType) : null;
  const detailReqText = selectedDetailItem
    ? Array.isArray(selectedDetailItem.requirement)
      ? selectedDetailItem.requirement.join(', ')
      : (selectedDetailItem.requirement || 'Tiles & Sanitary Wares')
    : '';

  return (
    <View style={styles.container}>
      {/* 1. iOS-Grade Segmented Time-Horizon Dock */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'today' && styles.segmentBtnActive]}
          onPress={() => onTabChange('today')}
          activeOpacity={0.75}
        >
          <View style={[styles.segmentDot, { backgroundColor: '#2563EB' }]} />
          <Text style={[styles.segmentText, activeTab === 'today' && styles.segmentTextActive]}>
            Today
          </Text>
          <View style={[styles.segmentBadge, activeTab === 'today' && styles.segmentBadgeActiveBlue]}>
            <Text style={[styles.segmentBadgeText, activeTab === 'today' && styles.segmentBadgeTextActiveBlue]}>
              {counts?.today || 0}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'upcoming' && styles.segmentBtnActive]}
          onPress={() => onTabChange('upcoming')}
          activeOpacity={0.75}
        >
          <View style={[styles.segmentDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.segmentText, activeTab === 'upcoming' && styles.segmentTextActive]}>
            7 Days
          </Text>
          <View style={[styles.segmentBadge, activeTab === 'upcoming' && styles.segmentBadgeActiveGreen]}>
            <Text style={[styles.segmentBadgeText, activeTab === 'upcoming' && styles.segmentBadgeTextActiveGreen]}>
              {counts?.upcoming || 0}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'overdue' && styles.segmentBtnActive]}
          onPress={() => onTabChange('overdue')}
          activeOpacity={0.75}
        >
          <View style={[styles.segmentDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.segmentText, activeTab === 'overdue' && styles.segmentTextActive]}>
            Overdue
          </Text>
          <View style={[styles.segmentBadge, activeTab === 'overdue' && styles.segmentBadgeActiveRed]}>
            <Text style={[styles.segmentBadgeText, activeTab === 'overdue' && styles.segmentBadgeTextActiveRed]}>
              {counts?.overdue || 0}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
          onPress={() => onTabChange('all')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, activeTab === 'all' && styles.segmentTextActive]}>
            All
          </Text>
          <View style={[styles.segmentBadge, activeTab === 'all' && styles.segmentBadgeActiveDark]}>
            <Text style={[styles.segmentBadgeText, activeTab === 'all' && styles.segmentBadgeTextActiveDark]}>
              {counts?.total || 0}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Search & Priority Filter Toolbar */}
      <View style={styles.filterToolbar}>
        {/* Quick In-List Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search follow-up queue..."
            placeholderTextColor="#94A3B8"
            value={localSearch}
            onChangeText={setLocalSearch}
          />
          {localSearch ? (
            <TouchableOpacity onPress={() => setLocalSearch('')} style={styles.clearSearchBtn}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Priority & Staff Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
          {['all', 'Hot', 'Warm', 'Future'].map((t) => {
            const isSel = temperatureFilter === t;
            const label = t === 'Hot' ? 'Hot Deals' : t === 'Warm' ? 'Warm Leads' : t === 'Future' ? 'Future Req.' : 'All Priority';
            const icon = t === 'Hot' ? '🔥' : t === 'Warm' ? '☀️' : t === 'Future' ? '⏳' : '🎯';

            return (
              <TouchableOpacity
                key={t}
                style={[styles.filterPill, isSel && styles.filterPillActive]}
                onPress={() => onTemperatureChange(t)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 11 }}>{icon}</Text>
                <Text style={[styles.filterPillText, isSel && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Owner Staff Switcher */}
          {currentProfile?.role === 'owner' && (
            <>
              <View style={styles.filterDivider} />
              {STAFF_MEMBERS.map((staff) => {
                const isSel = ownerStaffFilter === staff;
                return (
                  <TouchableOpacity
                    key={staff}
                    style={[styles.filterPillStaff, isSel && styles.filterPillStaffActive]}
                    onPress={() => onOwnerStaffChange(staff)}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 11 }}>👤</Text>
                    <Text style={[styles.filterPillStaffText, isSel && styles.filterPillStaffTextActive]}>
                      {staff === 'all' ? 'All Reps' : staff.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>

      {/* 3. Follow-up Cards List (Clean, Uncluttered & Minimalist) */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching follow-up schedule...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedFollowups}
          keyExtractor={(item) => item._id || item.customerId || String(Math.random())}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 95, paddingTop: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>✨</Text>
              <Text style={styles.emptyTitle}>
                {localSearch ? 'No matching follow-ups' : 'Follow-up Queue is Clear!'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {localSearch
                  ? `No leads match "${localSearch}" in this bucket.`
                  : activeTab === 'today'
                  ? 'All calls for today are cleared. Great job!'
                  : activeTab === 'overdue'
                  ? 'Zero overdue leads. Pipeline is well nurtured.'
                  : 'No scheduled follow-up reminders in this bucket.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const urgency = formatRelativeUrgency(item.nextFollowUp);
            const isHot = item.leadTemperature === 'Hot';
            const isWarm = item.leadTemperature === 'Warm';
            const typeColors = getCustomerTypeColors(item.customerType);
            const initial = (item.customerName || 'C').charAt(0).toUpperCase();

            // Accent strip border color
            const accentBorderColor = urgency.isOverdue
              ? '#EF4444'
              : urgency.isToday
              ? '#2563EB'
              : isHot
              ? '#F59E0B'
              : '#10B981';

            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: accentBorderColor, borderLeftWidth: 4 }]}
                activeOpacity={0.75}
                onPress={() => setSelectedDetailItem(item)}
              >
                {/* Header Row: Avatar, Identity & Urgency Pill */}
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: typeColors.bg, borderColor: typeColors.border }]}>
                    <Text style={[styles.avatarText, { color: typeColors.text }]}>{initial}</Text>
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <Text style={styles.metaType}>
                        {typeColors.icon} {item.customerType || 'Customer'}
                      </Text>
                      {item.salesperson ? (
                        <>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.metaRep} numberOfLines={1}>
                            👤 {item.salesperson.split(' ')[0]}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>

                  {/* Relative Urgency Pill */}
                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg, borderColor: urgency.border }]}>
                    <View style={[styles.urgencyDot, { backgroundColor: urgency.dot }]} />
                    <Text style={[styles.urgencyLabel, { color: urgency.color }]}>
                      {urgency.label}
                    </Text>
                  </View>
                </View>

                {/* Footer Strip: Valuation, Temperature Pill & Tap Chevron */}
                <View style={styles.cardFooterStrip}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {item.quotationValue ? (
                      <Text style={styles.footerValuationText}>
                        ₹{Number(item.quotationValue || 0).toLocaleString('en-IN')}
                      </Text>
                    ) : null}

                    <View
                      style={[
                        styles.tempPill,
                        isHot ? styles.tempHot : isWarm ? styles.tempWarm : styles.tempFuture,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tempPillText,
                          { color: isHot ? '#DC2626' : isWarm ? '#B45309' : '#1E40AF' },
                        ]}
                      >
                        {isHot ? '🔥 HOT' : isWarm ? '☀️ WARM' : '⏳ FUTURE'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.tapToViewText}>Tap for actions</Text>
                    <Text style={styles.chevronIcon}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 4. Detailed Information & Action Hub Modal (Opened on clicking record) */}
      <Modal
        visible={Boolean(selectedDetailItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            {/* Modal Header */}
            <View style={styles.detailModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.detailModalTitle} numberOfLines={1}>
                    {selectedDetailItem?.customerName || 'Customer Follow-up'}
                  </Text>
                  {selectedDetailItem?.customerId && (
                    <View style={styles.idBadge}>
                      <Text style={styles.idBadgeText}>#{selectedDetailItem.customerId}</Text>
                    </View>
                  )}
                </View>
                {detailUrgency && (
                  <View style={[styles.detailUrgencyBanner, { backgroundColor: detailUrgency.bg, borderColor: detailUrgency.border }]}>
                    <View style={[styles.urgencyDot, { backgroundColor: detailUrgency.dot }]} />
                    <Text style={[styles.detailUrgencyText, { color: detailUrgency.color }]}>
                      Follow-up Status: {detailUrgency.label} ({selectedDetailItem?.nextFollowUp || 'Scheduled'})
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setSelectedDetailItem(null)}
                style={styles.detailModalCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {/* Contact & Assignment Card */}
              <View style={styles.detailSectionCard}>
                <Text style={styles.detailSectionHeading}>👤 Contact & Assignment</Text>
                
                {selectedDetailItem?.phone ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mobile Phone:</Text>
                    <Text style={styles.detailValueBold}>{selectedDetailItem.phone}</Text>
                  </View>
                ) : null}

                {selectedDetailItem?.location ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedDetailItem.location}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer Type:</Text>
                  <Text style={[styles.detailValue, { color: detailTypeColors?.text || '#0F172A', fontWeight: '700' }]}>
                    {detailTypeColors?.icon} {selectedDetailItem?.customerType || 'Customer'}
                  </Text>
                </View>

                {selectedDetailItem?.salesperson ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned Rep:</Text>
                    <Text style={styles.detailValueBold}>👤 {selectedDetailItem.salesperson}</Text>
                  </View>
                ) : null}
              </View>

              {/* Project & Valuation Card */}
              <View style={styles.detailSectionCard}>
                <Text style={styles.detailSectionHeading}>🏗️ Project & Requirement</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quotation Value:</Text>
                  <Text style={styles.detailPriceValue}>
                    ₹ {Number(selectedDetailItem?.quotationValue || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requirement:</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {detailReqText}
                  </Text>
                </View>

                {selectedDetailItem?.approxQuantity ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Approx Quantity:</Text>
                    <Text style={styles.detailValue}>{selectedDetailItem.approxQuantity} sq.ft</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lead Priority:</Text>
                  <Text style={[styles.detailValue, { fontWeight: '800' }]}>
                    {selectedDetailItem?.leadTemperature === 'Hot' ? '🔥 Hot Deal' : selectedDetailItem?.leadTemperature === 'Warm' ? '☀️ Warm Lead' : '⏳ Future Requirement'}
                  </Text>
                </View>

                {selectedDetailItem?.status ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pipeline Stage:</Text>
                    <Text style={styles.detailValue}>{selectedDetailItem.status}</Text>
                  </View>
                ) : null}
              </View>

              {/* Follow-up Notes & Discussion Context */}
              {selectedDetailItem?.notes ? (
                <View style={styles.detailNotesCard}>
                  <Text style={styles.detailSectionHeading}>💬 Last Discussion Notes</Text>
                  <Text style={styles.detailNotesText}>"{selectedDetailItem.notes}"</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Action Buttons Hub (EXCLUSIVELY PRESENT IN DETAIL VIEW) */}
            <View style={styles.detailActionHub}>
              {/* Direct Communication Quick Dialers */}
              {selectedDetailItem?.phone ? (
                <View style={styles.detailQuickDialRow}>
                  <TouchableOpacity
                    style={styles.detailCallBtn}
                    onPress={() => Linking.openURL(`tel:${selectedDetailItem.phone}`)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.detailCallBtnText}>📞 Direct Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailWaBtn}
                    onPress={() => openWhatsApp(selectedDetailItem.phone, selectedDetailItem.customerName, detailReqText)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.detailWaBtnText}>💬 WhatsApp Chat</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Main Action Hub: Log Call vs Record Lost */}
              <View style={styles.detailMainActionRow}>
                <TouchableOpacity
                  style={styles.detailLogCallBtn}
                  onPress={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    onLogActivity(item);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailLogCallBtnText}>📝 Log Follow-up Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailLostBtn}
                  onPress={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    onRecordLost(item);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailLostBtnText}>✕ Mark Lost</Text>
                </TouchableOpacity>
              </View>
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
  // iOS-Grade Segmented Time-Horizon Switcher
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
    padding: 3.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 4,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  segmentBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  segmentBadgeActiveBlue: {
    backgroundColor: '#EFF6FF',
  },
  segmentBadgeTextActiveBlue: {
    color: '#2563EB',
  },
  segmentBadgeActiveGreen: {
    backgroundColor: '#ECFDF5',
  },
  segmentBadgeTextActiveGreen: {
    color: '#047857',
  },
  segmentBadgeActiveRed: {
    backgroundColor: '#FEF2F2',
  },
  segmentBadgeTextActiveRed: {
    color: '#DC2626',
  },
  segmentBadgeActiveDark: {
    backgroundColor: '#F1F5F9',
  },
  segmentBadgeTextActiveDark: {
    color: '#0F172A',
  },
  segmentBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  // Search & Filter Toolbar
  filterToolbar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 7,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
    color: '#64748B',
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterPillStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillStaffActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  filterPillStaffText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillStaffTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginHorizontal: 3,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 17,
  },
  // Clean Minimalist Follow-up Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 14,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  idBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metaType: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  metaRep: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
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
  urgencyDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  urgencyLabel: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardFooterStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerValuationText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
  },
  tempPill: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  tempHot: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  tempWarm: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tempFuture: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tempPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
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
  },

  // Detailed Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailUrgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  detailUrgencyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailModalCloseBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  detailSectionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  detailSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3.5,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '800',
  },
  detailPriceValue: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#059669',
  },
  detailNotesCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  detailNotesText: {
    fontSize: 12.5,
    color: '#92400E',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 2,
  },
  detailActionHub: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  detailQuickDialRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailCallBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailCallBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  detailWaBtn: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailWaBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#047857',
  },
  detailMainActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLogCallBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailLogCallBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailLostBtn: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailLostBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
});
