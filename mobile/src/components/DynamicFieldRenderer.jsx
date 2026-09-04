import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';

// Helper: Indian currency words preview (e.g. 150000 -> "₹ 1.50 Lakhs")
const formatIndianCurrencyWords = (num) => {
  const n = Number(num);
  if (!n || isNaN(n) || n <= 0) return '';
  if (n >= 10000000) {
    return `₹ ${(n / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
  }
  if (n >= 100000) {
    return `₹ ${(n / 100000).toFixed(2).replace(/\.00$/, '')} Lakhs`;
  }
  if (n >= 1000) {
    return `₹ ${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `₹ ${n.toLocaleString('en-IN')}`;
};

// Helper: Formatted human-readable date preview (No emojis)
const formatReadableDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIndex, day);
      if (!isNaN(dateObj.getTime())) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[dateObj.getDay()]}, ${day} ${months[monthIndex]} ${year}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

// Clean Professional Helper: Minimalist character markers instead of emojis
const getFieldIcon = (fieldName = '', fieldType = '') => {
  return '';
};

// Interactive Mobile Calendar Picker Modal
function MobileCalendarModal({ visible, value, onSelect, onClose }) {
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
    }
  }, [visible, value]);

  if (!visible) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

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
    onClose();
  };

  const handleQuickPreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const formatted = d.toISOString().split('T')[0];
    setSelectedDate(formatted);
    onSelect(formatted);
    onClose();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(d);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={calStyles.backdrop}>
        <View style={calStyles.card}>
          {/* Header */}
          <View style={calStyles.header}>
            <View>
              <Text style={calStyles.headerTitle}>Select Date</Text>
              <Text style={calStyles.headerSub}>Touch any date to apply</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={calStyles.closeBtn} activeOpacity={0.75}>
              <Text style={calStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={calStyles.presetsRow}>
            <TouchableOpacity style={calStyles.presetChip} onPress={() => handleQuickPreset(0)} activeOpacity={0.75}>
              <Text style={calStyles.presetChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={calStyles.presetChip} onPress={() => handleQuickPreset(1)} activeOpacity={0.75}>
              <Text style={calStyles.presetChipText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={calStyles.presetChip} onPress={() => handleQuickPreset(3)} activeOpacity={0.75}>
              <Text style={calStyles.presetChipText}>+3 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={calStyles.presetChip} onPress={() => handleQuickPreset(7)} activeOpacity={0.75}>
              <Text style={calStyles.presetChipText}>+1 Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={calStyles.presetChip} onPress={() => handleQuickPreset(15)} activeOpacity={0.75}>
              <Text style={calStyles.presetChipText}>+15 Days</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={calStyles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={calStyles.navBtn} activeOpacity={0.7}>
              <Text style={calStyles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>
              {monthNames[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={calStyles.navBtn} activeOpacity={0.7}>
              <Text style={calStyles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={calStyles.dayNamesRow}>
            {dayNames.map((d, i) => (
              <Text key={i} style={calStyles.dayNameText}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={calStyles.grid}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <View key={`blank-${idx}`} style={calStyles.cell} />;
              }
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    calStyles.cell,
                    isSelected && calStyles.cellSelected,
                    isToday && !isSelected && calStyles.cellToday,
                  ]}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      calStyles.cellText,
                      isSelected && calStyles.cellTextSelected,
                      isToday && !isSelected && calStyles.cellTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Info */}
          {selectedDate ? (
            <View style={calStyles.footerSelectedRow}>
              <Text style={calStyles.footerSelectedLabel}>Selected Date:</Text>
              <Text style={calStyles.footerSelectedValue}>{formatReadableDate(selectedDate)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const calStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
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
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
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
    fontWeight: '700',
    color: '#334155',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dayNameText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    marginVertical: 2,
  },
  cellSelected: {
    backgroundColor: '#0F766E',
  },
  cellToday: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#0F766E',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  cellTextToday: {
    color: '#0F766E',
    fontWeight: '800',
  },
  footerSelectedRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerSelectedLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  footerSelectedValue: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '800',
  },
});

export const DynamicFieldRenderer = ({ field, value, onChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  if (!field || !field.active) {
    return null;
  }

  const {
    type,
    label,
    name,
    required,
    placeholder,
    description,
    options = [],
  } = field;

  // Safe universal change handler supporting both onChange(val) and onChange(name, val)
  const handleChange = (newVal) => {
    if (typeof onChange === 'function') {
      onChange(newVal, name);
    }
  };

  // Normalize options whether they are strings, objects, numbers or booleans
  const normalizedOptions = (options || []).map((option) => {
    if (typeof option === 'object' && option !== null) {
      const val = option.value !== undefined ? option.value : (option.label !== undefined ? option.label : String(option));
      const lab = option.label !== undefined ? String(option.label) : String(val);
      return { label: lab, value: val };
    }
    return { label: String(option), value: String(option) };
  });

  // Single-select matching
  const isOptionSelected = (option) => {
    if (value === undefined || value === null || value === '') return false;
    const optVal = option.value;
    const optLab = option.label;
    if (value === optVal) return true;
    if (String(value).trim() === String(optVal).trim()) return true;
    if (String(value).trim().toLowerCase() === String(optVal).trim().toLowerCase()) return true;
    if (optLab && String(value).trim().toLowerCase() === String(optLab).trim().toLowerCase()) return true;
    return false;
  };

  // Multi-select matching
  const multiSelectedValues = Array.isArray(value)
    ? value
    : (typeof value === 'string' && value ? value.split(',').map((s) => s.trim()) : []);

  const isMultiOptionSelected = (option) => {
    const optVal = option.value;
    const optLab = option.label;
    return multiSelectedValues.some((v) => {
      if (v === optVal) return true;
      if (String(v).trim().toLowerCase() === String(optVal).trim().toLowerCase()) return true;
      if (optLab && String(v).trim().toLowerCase() === String(optLab).trim().toLowerCase()) return true;
      return false;
    });
  };

  const handleToggleMultiItem = (option) => {
    const isSelected = isMultiOptionSelected(option);
    const optVal = option.value;
    let updated;
    if (isSelected) {
      updated = multiSelectedValues.filter(
        (v) =>
          v !== optVal &&
          String(v).trim().toLowerCase() !== String(optVal).trim().toLowerCase() &&
          (option.label ? String(v).trim().toLowerCase() !== String(option.label).trim().toLowerCase() : true)
      );
    } else {
      updated = [...multiSelectedValues, optVal];
    }
    handleChange(updated);
  };

  // Check if binary choice (e.g. Yes/No)
  const isBinaryChoice = normalizedOptions.length === 2 &&
    normalizedOptions.some((o) => String(o.label).toLowerCase() === 'yes') &&
    normalizedOptions.some((o) => String(o.label).toLowerCase() === 'no');

  // Strict check: Radio buttons should ONLY be used when required
  // 1. Explicitly type === 'radio' with <= 3 options (e.g. Sanitary Yes/No, Adhesive Yes/No)
  // 2. Binary Yes/No choice
  // Any options > 3 gracefully use the dropdown picker to prevent mobile UI clutter
  const shouldUseRadioButton = (type === 'radio' || isBinaryChoice) && normalizedOptions.length <= 3;

  const selectedOptionObj = normalizedOptions.find((o) => isOptionSelected(o));
  const fieldIcon = getFieldIcon(name, type);

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
              error && styles.inputContainerError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              placeholderTextColor="#94A3B8"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {value ? (
              <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );

      case 'textarea':
        return (
          <View>
            <View
              style={[
                styles.inputContainer,
                styles.textareaContainer,
                isFocused && styles.inputContainerFocused,
                error && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={[styles.textInput, styles.textareaInput]}
                placeholder={placeholder || `Enter ${label.toLowerCase()} details...`}
                placeholderTextColor="#94A3B8"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={handleChange}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
            {value && String(value).length > 0 ? (
              <View style={styles.charCountRow}>
                <Text style={styles.charCountText}>{String(value).length} characters</Text>
              </View>
            ) : null}
          </View>
        );

      case 'number':
        return (
          <View>
            <View
              style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused,
                error && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder={placeholder || '0'}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={(text) => {
                  const clean = String(text).replace(/[^0-9.]/g, '');
                  handleChange(clean === '' ? '' : Number(clean));
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {value ? (
                <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn} activeOpacity={0.7}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Presets for Area/Quantity */}
            {name.toLowerCase().includes('quantity') && (
              <View style={styles.quickAmountRow}>
                {[
                  { label: '500 sq.ft', val: 500 },
                  { label: '1,000 sq.ft', val: 1000 },
                  { label: '2,500 sq.ft', val: 2500 },
                  { label: '5,000 sq.ft', val: 5000 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.quickAmountPill,
                      Number(value) === item.val && styles.quickAmountPillActive,
                    ]}
                    onPress={() => handleChange(item.val)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.quickAmountPillText,
                        Number(value) === item.val && styles.quickAmountPillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      case 'currency': {
        const currencyWords = formatIndianCurrencyWords(value);
        return (
          <View>
            <View
              style={[
                styles.currencyInputBox,
                isFocused && styles.inputContainerFocused,
                error && styles.inputContainerError,
              ]}
            >
              <View style={styles.currencySymbolBadge}>
                <Text style={styles.currencySymbolText}>₹</Text>
              </View>
              <TextInput
                style={styles.currencyTextInput}
                placeholder={placeholder || '0.00'}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={(text) => {
                  const clean = String(text).replace(/[^0-9.]/g, '');
                  handleChange(clean === '' ? '' : Number(clean));
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {value ? (
                <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn} activeOpacity={0.7}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Live Indian Currency Words / Lakhs Helper */}
            {currencyWords ? (
              <View style={styles.currencyWordsBadge}>
                <Text style={styles.currencyWordsBadgeText}>{currencyWords}</Text>
              </View>
            ) : null}

            {/* Quick Amount Suggestion Pills */}
            <View style={styles.quickAmountRow}>
              {[
                { label: '+25k', val: 25000 },
                { label: '+50k', val: 50000 },
                { label: '+1L', val: 100000 },
                { label: '+2.5L', val: 250000 },
                { label: '+5L', val: 500000 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.quickAmountPill}
                  onPress={() => {
                    const currentVal = Number(value) || 0;
                    handleChange(currentVal + item.val);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAmountPillText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      case 'phone': {
        const rawDigits = String(value || '').replace(/[^0-9]/g, '');
        const isTenDigits = rawDigits.length === 10;

        return (
          <View>
            <View
              style={[
                styles.phoneInputBox,
                isFocused && styles.inputContainerFocused,
                error && styles.inputContainerError,
              ]}
            >
              <View style={styles.phonePrefixBadge}>
                <Text style={styles.phonePrefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneTextInput}
                placeholder={placeholder || '98765 43210'}
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={14}
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={(text) => {
                  const clean = String(text).replace(/[^0-9]/g, '');
                  // Format as XXXXX XXXXX if 10 digits
                  let formatted = clean;
                  if (clean.length > 5) {
                    formatted = `${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
                  }
                  handleChange(formatted);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {isTenDigits ? (
                <View style={styles.validCheckBadge}>
                  <Text style={styles.validCheckText}>✓ Valid</Text>
                </View>
              ) : value ? (
                <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn} activeOpacity={0.7}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      }

      case 'email':
        return (
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
              error && styles.inputContainerError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || 'customer@example.com'}
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {value ? (
              <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );

      case 'date':
      case 'time':
      case 'datetime': {
        const setQuickDate = (daysAhead) => {
          const target = new Date(Date.now() + daysAhead * 86400000);
          handleChange(target.toISOString().split('T')[0]);
        };

        const todayStr = new Date().toISOString().split('T')[0];
        const readableDate = formatReadableDate(value);

        return (
          <View>
            <TouchableOpacity
              style={[
                styles.dateInputBox,
                isFocused && styles.inputContainerFocused,
                error && styles.inputContainerError,
              ]}
              onPress={() => setCalendarVisible(true)}
              activeOpacity={0.75}
            >
              <View style={styles.dateTypeBadge}>
                <Text style={styles.dateTypeBadgeText}>DATE</Text>
              </View>

              <Text
                style={[
                  styles.dateTextInput,
                  !value && { color: '#94A3B8', fontWeight: '500' },
                ]}
                numberOfLines={1}
              >
                {value ? readableDate || value : placeholder || 'Tap to choose date...'}
              </Text>

              <View style={styles.calendarTriggerBtn}>
                <Text style={styles.calendarTriggerBtnText}>Open Calendar</Text>
              </View>
            </TouchableOpacity>

            {/* Quick Date Presets */}
            {type === 'date' && (
              <View style={styles.quickDatesRow}>
                <TouchableOpacity
                  style={[styles.quickDatePill, value === todayStr && styles.quickDatePillActive]}
                  onPress={() => setQuickDate(0)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickDatePillText, value === todayStr && styles.quickDatePillTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDatePill}
                  onPress={() => setQuickDate(1)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickDatePillText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDatePill}
                  onPress={() => setQuickDate(3)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickDatePillText}>+3 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDatePill}
                  onPress={() => setQuickDate(7)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickDatePillText}>+1 Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickDatePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                  onPress={() => setCalendarVisible(true)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickDatePillText, { color: '#1D4ED8' }]}>Pick Date</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Interactive Calendar Modal */}
            <MobileCalendarModal
              visible={calendarVisible}
              value={value}
              onSelect={(pickedDate) => handleChange(pickedDate)}
              onClose={() => setCalendarVisible(false)}
            />
          </View>
        );
      }

      case 'checkbox': {
        const isChecked = Boolean(value);
        return (
          <TouchableOpacity
            style={[
              styles.checkboxCard,
              isChecked && styles.checkboxCardChecked,
              error && styles.inputContainerError,
            ]}
            onPress={() => handleChange(!isChecked)}
            activeOpacity={0.75}
          >
            <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
              {isChecked && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <View style={styles.checkboxTextContent}>
              <Text style={[styles.checkboxLabel, isChecked && styles.checkboxLabelChecked]}>
                {placeholder || label}
              </Text>
              {description ? (
                <Text style={styles.checkboxSubtext}>{description}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      }

      // RADIO BUTTONS & SELECT DROPDOWN
      // Per instructions: "use radio button only when required"
      case 'radio':
      case 'select': {
        // When radio buttons ARE required:
        // Binary Yes/No choice OR small <= 3 choice group
        if (shouldUseRadioButton) {
          return (
            <View style={styles.radioGroupRow}>
              {normalizedOptions.map((option, index) => {
                const selected = isOptionSelected(option);
                const isYes = String(option.label).toLowerCase() === 'yes';
                const isNo = String(option.label).toLowerCase() === 'no';

                let cardStyle = styles.radioCard;
                let textStyle = styles.radioCardText;
                let dotStyle = styles.radioDotCircle;
                let innerDotStyle = styles.radioDotInner;

                if (selected) {
                  if (isYes) {
                    cardStyle = [styles.radioCard, styles.radioCardYesActive];
                    textStyle = [styles.radioCardText, styles.radioCardTextYesActive];
                    dotStyle = [styles.radioDotCircle, styles.radioDotCircleYes];
                    innerDotStyle = [styles.radioDotInner, styles.radioDotInnerYes];
                  } else if (isNo) {
                    cardStyle = [styles.radioCard, styles.radioCardNoActive];
                    textStyle = [styles.radioCardText, styles.radioCardTextNoActive];
                    dotStyle = [styles.radioDotCircle, styles.radioDotCircleNo];
                    innerDotStyle = [styles.radioDotInner, styles.radioDotInnerNo];
                  } else {
                    cardStyle = [styles.radioCard, styles.radioCardActive];
                    textStyle = [styles.radioCardText, styles.radioCardTextActive];
                    dotStyle = [styles.radioDotCircle, styles.radioDotCircleActive];
                  }
                }

                return (
                  <TouchableOpacity
                    key={`${name}-${option.value}-${index}`}
                    style={cardStyle}
                    onPress={() => handleChange(option.value)}
                    activeOpacity={0.75}
                  >
                    <View style={dotStyle}>
                      {selected && <View style={innerDotStyle} />}
                    </View>
                    <Text style={textStyle}>
                      {isYes ? '✓ Yes' : isNo ? '✕ No' : option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }

        // When radio button is NOT required (multi-options > 3, such as Lead Source, Customer Type, House Stage, Status)
        // Render as a high-end Dropdown Picker Card with search bottom-sheet
        const filteredModalOptions = normalizedOptions.filter((opt) =>
          opt.label.toLowerCase().includes(searchText.toLowerCase())
        );

        return (
          <View>
            <TouchableOpacity
              style={[
                styles.dropdownTriggerBox,
                selectedOptionObj && styles.dropdownTriggerBoxActive,
                error && styles.inputContainerError,
              ]}
              onPress={() => {
                setSearchText('');
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeftGroup}>
                <Text
                  style={[
                    styles.dropdownTriggerValueText,
                    !selectedOptionObj && styles.dropdownTriggerPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedOptionObj ? selectedOptionObj.label : placeholder || `Select ${label.toLowerCase()}...`}
                </Text>
              </View>
              <View style={styles.dropdownTriggerChevronBox}>
                <Text style={styles.dropdownChevronText}>▼</Text>
              </View>
            </TouchableOpacity>

            {/* Dropdown Bottom Sheet Modal */}
            <Modal
              visible={modalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalSheetCard}>
                  {/* Top Handle */}
                  <View style={styles.modalHandleWrapper}>
                    <View style={styles.modalHandle} />
                  </View>

                  {/* Header */}
                  <View style={styles.modalSheetHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.modalSheetTitle}>Select {label}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCloseBtnText}>✕ Close</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Box */}
                  {normalizedOptions.length > 4 && (
                    <View style={styles.modalSearchBox}>
                      <TextInput
                        style={styles.modalSearchInput}
                        placeholder={`Search ${label.toLowerCase()}...`}
                        placeholderTextColor="#94A3B8"
                        value={searchText}
                        onChangeText={setSearchText}
                      />
                      {searchText ? (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                          <Text style={{ fontSize: 12, color: '#94A3B8' }}>✕</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}

                  {/* Options List */}
                  <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={false}>
                    {filteredModalOptions.map((opt, idx) => {
                      const selected = isOptionSelected(opt);
                      return (
                        <TouchableOpacity
                          key={`${opt.value}-${idx}`}
                          style={[styles.modalOptionItem, selected && styles.modalOptionItemActive]}
                          onPress={() => {
                            handleChange(opt.value);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={[styles.modalOptionBullet, selected && styles.modalOptionBulletActive]} />
                            <Text style={[styles.modalOptionItemText, selected && styles.modalOptionItemTextActive]}>
                              {opt.label}
                            </Text>
                          </View>
                          {selected && (
                            <View style={styles.modalCheckmarkBadge}>
                              <Text style={styles.modalCheckmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    {filteredModalOptions.length === 0 && (
                      <View style={{ padding: 24, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#94A3B8' }}>No options match "{searchText}"</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        );
      }

      // MULTI-SELECT: Quick-toggle Chips + Modal Bottom Sheet
      case 'multiselect': {
        const filteredModalOptions = normalizedOptions.filter((opt) =>
          opt.label.toLowerCase().includes(searchText.toLowerCase())
        );

        // First 4 options rendered as 1-tap quick pills directly on the form
        const quickPills = normalizedOptions.slice(0, 4);

        return (
          <View>
            {/* Quick 1-Tap Toggle Chips directly on form */}
            <View style={styles.quickPillRow}>
              {quickPills.map((opt, idx) => {
                const isSelected = isMultiOptionSelected(opt);
                return (
                  <TouchableOpacity
                    key={`${opt.value}-${idx}`}
                    style={[
                      styles.quickMultiChip,
                      isSelected && styles.quickMultiChipSelected,
                    ]}
                    onPress={() => handleToggleMultiItem(opt)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.quickMultiChipText,
                        isSelected && styles.quickMultiChipTextSelected,
                      ]}
                    >
                      {isSelected ? '✓ ' : '+ '}{opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Trigger for Full Modal / More items */}
            <TouchableOpacity
              style={[
                styles.dropdownTriggerBox,
                multiSelectedValues.length > 0 && styles.dropdownTriggerBoxActive,
                error && styles.inputContainerError,
              ]}
              onPress={() => {
                setSearchText('');
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeftGroup}>
                <Text
                  style={[
                    styles.dropdownTriggerValueText,
                    multiSelectedValues.length === 0 && styles.dropdownTriggerPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {multiSelectedValues.length > 0
                    ? `${multiSelectedValues.length} items selected`
                    : placeholder || `Select ${label.toLowerCase()}...`}
                </Text>
              </View>
              <View style={styles.dropdownTriggerChevronBox}>
                <Text style={styles.dropdownChevronText}>▼</Text>
              </View>
            </TouchableOpacity>

            {/* Selected Dismissible Chips */}
            {multiSelectedValues.length > 0 && (
              <View style={styles.multiTagsRow}>
                {multiSelectedValues.map((v, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.multiTagPill}
                    onPress={() => {
                      const updated = multiSelectedValues.filter((item) => item !== v);
                      handleChange(updated);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.multiTagText}>{v}</Text>
                    <Text style={styles.multiTagDismiss}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Multi-Select Modal Sheet */}
            <Modal
              visible={modalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalSheetCard}>
                  {/* Handle */}
                  <View style={styles.modalHandleWrapper}>
                    <View style={styles.modalHandle} />
                  </View>

                  {/* Header */}
                  <View style={styles.modalSheetHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.modalSheetTitle}>Select {label}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalDoneBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalDoneBtnText}>Done ✓</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Bar */}
                  {normalizedOptions.length > 4 && (
                    <View style={styles.modalSearchBox}>
                      <TextInput
                        style={styles.modalSearchInput}
                        placeholder={`Search ${label.toLowerCase()}...`}
                        placeholderTextColor="#94A3B8"
                        value={searchText}
                        onChangeText={setSearchText}
                      />
                    </View>
                  )}

                  {/* Options List */}
                  <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={false}>
                    {filteredModalOptions.map((opt, idx) => {
                      const selected = isMultiOptionSelected(opt);
                      return (
                        <TouchableOpacity
                          key={`${opt.value}-${idx}`}
                          style={[styles.modalOptionItem, selected && styles.modalOptionItemActive]}
                          onPress={() => handleToggleMultiItem(opt)}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.multiCheckboxSquare, selected && styles.multiCheckboxSquareActive]}>
                            {selected && <Text style={styles.multiCheckboxCheck}>✓</Text>}
                          </View>
                          <Text style={[styles.modalOptionItemText, selected && styles.modalOptionItemTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        );
      }

      case 'auto_number':
        return (
          <View style={styles.autoNumberBox}>
            <View style={styles.autoNumberHeader}>
              <View style={styles.autoNumberIconPill}>
                <Text style={styles.autoNumberIconText}>#</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.autoNumberTitle}>SYSTEM GENERATED ID</Text>
                <Text style={styles.autoNumberSub}>Auto-assigned upon registration</Text>
              </View>
              <View style={styles.autoNumberBadge}>
                <Text style={styles.autoNumberBadgeText}>AUTO</Text>
              </View>
            </View>
            <View style={styles.autoNumberValueBox}>
              <Text style={styles.autoNumberValue}>
                {value || 'CUS-AUTO (Assigned on save)'}
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
              error && styles.inputContainerError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              placeholderTextColor="#94A3B8"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.fieldContainer}>
      {/* Field Header Row */}
      <View style={styles.labelHeaderRow}>
        <View style={styles.labelTitleGroup}>
          <Text style={styles.fieldLabel}>
            {label}
            {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
          </Text>
        </View>

        {/* Type / Status Badges */}
        {required ? (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeRequired}>* Required</Text>
          </View>
        ) : type === 'multiselect' ? (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeMulti}>Multi-Select</Text>
          </View>
        ) : shouldUseRadioButton ? (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeRadio}>Quick Select</Text>
          </View>
        ) : (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeOptional}>Optional</Text>
          </View>
        )}
      </View>

      {/* Field Description */}
      {description && type !== 'checkbox' ? (
        <Text style={styles.fieldDescriptionText}>{description}</Text>
      ) : null}

      {/* Input Body */}
      <View style={styles.inputBodyWrapper}>{renderInput()}</View>

      {/* Error Alert */}
      {error ? (
        <View style={styles.errorAlertBox}>
          <Text style={styles.errorAlertText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const DynamicFieldInput = DynamicFieldRenderer;

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  labelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  labelTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldIconPrefix: {
    fontSize: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontWeight: '900',
    fontSize: 14,
  },
  typeBadgeContainer: {
    marginLeft: 8,
  },
  typeBadgeRequired: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeOptional: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeMulti: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeRadio: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldDescriptionText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 6,
  },
  inputBodyWrapper: {
    marginTop: 1,
  },

  // Standard Text Input
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    borderWidth: 1.5,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  clearBtn: {
    padding: 5,
    marginLeft: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
  },

  // Textarea
  textareaContainer: {
    paddingVertical: 10,
    minHeight: 88,
    alignItems: 'flex-start',
  },
  textareaInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  charCountText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // ERROR ALERT
  errorAlertBox: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  errorAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Currency
  currencyInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  currencySymbolBadge: {
    backgroundColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currencySymbolText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  currencyTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  currencyWordsBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  currencyWordsBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickAmountPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickAmountPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  quickAmountPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  quickAmountPillTextActive: {
    color: '#2563EB',
    fontWeight: '900',
  },

  // Phone
  phoneInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phonePrefixBadge: {
    backgroundColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  phonePrefixText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  validCheckBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  validCheckText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },

  // Date
  dateInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateTypeBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.5,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarTriggerBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  calendarTriggerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readableDateBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  readableDateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  quickDatePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickDatePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  quickDatePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quickDatePillTextActive: {
    color: '#2563EB',
    fontWeight: '900',
  },

  // Checkbox Card
  checkboxCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxCardChecked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxTextContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkboxLabelChecked: {
    color: '#047857',
  },
  checkboxSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // RADIO BUTTONS (Used ONLY when required: Yes/No or <=3 choices)
  radioGroupRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radioCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  radioCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  radioCardYesActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  radioCardNoActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  radioCardText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  radioCardTextActive: {
    fontWeight: '900',
    color: '#1D4ED8',
  },
  radioCardTextYesActive: {
    fontWeight: '900',
    color: '#047857',
  },
  radioCardTextNoActive: {
    fontWeight: '900',
    color: '#B91C1C',
  },
  radioDotCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioDotCircleActive: {
    borderColor: '#2563EB',
  },
  radioDotCircleYes: {
    borderColor: '#10B981',
  },
  radioDotCircleNo: {
    borderColor: '#EF4444',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  radioDotInnerYes: {
    backgroundColor: '#10B981',
  },
  radioDotInnerNo: {
    backgroundColor: '#EF4444',
  },

  // DROPDOWN PICKER (For fields with >3 options)
  dropdownTriggerBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerBoxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  dropdownTriggerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownMiniIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownIconText: {
    fontSize: 14,
  },
  dropdownTriggerValueText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  dropdownTriggerPlaceholderText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  dropdownTriggerChevronBox: {
    paddingLeft: 6,
  },
  dropdownChevronText: {
    fontSize: 10.5,
    color: '#64748B',
  },

  // MULTI-SELECT CHIPS
  quickPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickMultiChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickMultiChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  quickMultiChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quickMultiChipTextSelected: {
    color: '#047857',
    fontWeight: '800',
  },
  multiTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  multiTagPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  multiTagDismiss: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3B82F6',
  },

  // MODAL BOTTOM SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  modalDoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalDoneBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginVertical: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalOptionsList: {
    maxHeight: 360,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalOptionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  modalOptionBulletActive: {
    backgroundColor: '#2563EB',
  },
  modalOptionItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  modalOptionItemTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  modalCheckmarkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  multiCheckboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  multiCheckboxSquareActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  multiCheckboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // AUTO NUMBER BOX
  autoNumberBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  autoNumberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  autoNumberIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoNumberIconText: {
    fontSize: 14,
  },
  autoNumberTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  autoNumberSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  autoNumberBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  autoNumberBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  autoNumberValueBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  autoNumberValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // ERROR ALERT
  errorAlertBox: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorAlertText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
});
