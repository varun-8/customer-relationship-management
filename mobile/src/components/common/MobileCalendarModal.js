import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MobileCalendarModal({
  visible,
  value,
  onSelect,
  onClose,
  title = 'Select Date',
  accentColor = '#0F766E',
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const parseDate = (dStr) => {
    if (dStr) {
      const parts = String(dStr).split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
      }
    }
    return new Date();
  };

  const initial = useMemo(() => parseDate(value), [value, visible]);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState(value || '');

  useEffect(() => {
    if (visible) {
      const dt = parseDate(value);
      setViewYear(dt.getFullYear());
      setViewMonth(dt.getMonth());
      setSelectedDate(value || '');

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [visible, value]);

  const handleSmoothClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(formatted);
    onSelect(formatted);
    handleSmoothClose();
  };

  const handleQuickPreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const formatted = d.toISOString().split('T')[0];
    setSelectedDate(formatted);
    onSelect(formatted);
    handleSmoothClose();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(d);
  }

  const formatReadableDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${MONTH_NAMES[mIdx]} ${parts[0]}`;
    }
    return dStr;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleSmoothClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSub}>Choose a date or select quick preset</Text>
            </View>
            <TouchableOpacity onPress={handleSmoothClose} style={styles.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset(0)} activeOpacity={0.75}>
              <Text style={styles.presetChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset(1)} activeOpacity={0.75}>
              <Text style={styles.presetChipText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset(3)} activeOpacity={0.75}>
              <Text style={styles.presetChipText}>+3 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset(7)} activeOpacity={0.75}>
              <Text style={styles.presetChipText}>+1 Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset(15)} activeOpacity={0.75}>
              <Text style={styles.presetChipText}>+15 Days</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map((d, i) => (
              <Text key={i} style={[styles.dayNameText, (i === 0 || i === 6) && styles.dayNameWeekend]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <View key={`blank-${idx}`} style={styles.cell} />;
              }
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.cell,
                    isSelected && [styles.cellSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                    isToday && !isSelected && styles.cellToday,
                  ]}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.cellText,
                      isSelected && styles.cellTextSelected,
                      isToday && !isSelected && [styles.cellTextToday, { color: accentColor }],
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Footer */}
          {selectedDate ? (
            <View style={styles.footerSelectedRow}>
              <Ionicons name="calendar-outline" size={15} color={accentColor} style={{ marginRight: 6 }} />
              <Text style={styles.footerSelectedLabel}>Selected: </Text>
              <Text style={[styles.footerSelectedValue, { color: accentColor }]}>
                {formatReadableDate(selectedDate)}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 32, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
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
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  presetChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dayNameText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  dayNameWeekend: {
    color: '#CBD5E1',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2.5,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  cellSelected: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cellTextToday: {
    fontWeight: '900',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  footerSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerSelectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  footerSelectedValue: {
    fontSize: 12.5,
    fontWeight: '900',
  },
});
