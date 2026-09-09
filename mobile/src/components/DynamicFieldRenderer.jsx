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
    borderRadius: 18,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#64748B',
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
    fontWeight: '600',
    color: '#475569',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '500',
    color: '#1E293B',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cellTextToday: {
    color: '#0F766E',
    fontWeight: '700',
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
    fontWeight: '500',
  },
  footerSelectedValue: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '700',
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
              <View style={styles.currencyPrefixBox}>
                <Text style={styles.currencyPrefixText}>₹</Text>
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

            {/* Live Indian Currency Words Helper */}
            {currencyWords ? (
              <View style={styles.currencyWordsBadge}>
                <Text style={styles.currencyWordsBadgeText}>{currencyWords}</Text>
              </View>
            ) : null}
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
              <View style={styles.phonePrefixBox}>
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
                  <Text style={styles.validCheckText}>Valid</Text>
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
              <Text
                style={[
                  styles.dateTextInput,
                  !value && { color: '#94A3B8', fontWeight: '400' },
                ]}
                numberOfLines={1}
              >
                {value ? readableDate || value : placeholder || 'Tap to select date...'}
              </Text>

              <View style={styles.calendarTriggerBtn}>
                <Text style={styles.calendarTriggerBtnText}>Pick Date</Text>
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
              {isChecked && <View style={styles.checkboxSquareFilled} />}
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
                      {isYes ? 'Yes' : isNo ? 'No' : option.label}
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
              <Text
                style={[
                  styles.dropdownTriggerValueText,
                  !selectedOptionObj && styles.dropdownTriggerPlaceholderText,
                ]}
                numberOfLines={1}
              >
                {selectedOptionObj ? selectedOptionObj.label : placeholder || `Select ${label.toLowerCase()}...`}
              </Text>
              <Text style={styles.dropdownChevronText}>▾</Text>
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
                          <View style={styles.modalOptionItemContent}>
                            <View style={[styles.modalOptionBullet, selected && styles.modalOptionBulletActive]} />
                            <Text style={[styles.modalOptionItemText, selected && styles.modalOptionItemTextActive]}>
                              {opt.label}
                            </Text>
                          </View>
                          {selected && (
                            <View style={styles.modalActiveIndicatorDot} />
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
                      {isSelected ? '• ' : '+ '}{opt.label}
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
              <Text style={styles.dropdownChevronText}>▾</Text>
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
                      <Text style={styles.modalDoneBtnText}>Done</Text>
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
                            {selected && <View style={styles.multiCheckboxCheckFilled} />}
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
          <View style={styles.autoNumberBoxClean}>
            <View style={styles.autoNumberIconPillClean}>
              <Text style={styles.autoNumberIconTextClean}>#</Text>
            </View>
            <Text style={styles.autoNumberValueClean}>
              {value || 'Auto-generated'}
            </Text>
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

        {/* Minimalist Meta Indicator: Never show Optional for dropdowns, radios, auto-number, or multiselect */}
        {!required && type !== 'select' && type !== 'radio' && type !== 'multiselect' && type !== 'auto_number' ? (
          <Text style={styles.fieldMetaText}>Optional</Text>
        ) : null}
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
    marginBottom: 6,
  },
  labelTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: -0.1,
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13.5,
  },
  fieldMetaText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  fieldDescriptionText: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  inputBodyWrapper: {
    marginTop: 1,
  },

  // Standard Text Input
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0F766E',
    borderWidth: 1.5,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  clearBtnText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },

  // Textarea
  textareaContainer: {
    paddingVertical: 10,
    minHeight: 84,
    alignItems: 'flex-start',
  },
  textareaInput: {
    minHeight: 68,
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
    fontWeight: '500',
  },

  // ERROR ALERT
  errorAlertBox: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Currency
  currencyInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefixBox: {
    paddingLeft: 12,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: 10,
    justifyContent: 'center',
  },
  currencyPrefixText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#64748B',
  },
  currencyTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  currencyWordsBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  currencyWordsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quickAmountPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickAmountPillActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  quickAmountPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickAmountPillTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },

  // Phone
  phoneInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePrefixBox: {
    paddingLeft: 12,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: 10,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  validCheckBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  validCheckText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },

  // Date
  dateInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextInput: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
  calendarTriggerBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calendarTriggerBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  quickDatePill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickDatePillActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  quickDatePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickDatePillTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },

  // Checkbox Card
  checkboxCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxCardChecked: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  checkboxTextContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  checkboxLabelChecked: {
    color: '#0F766E',
  },
  checkboxSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Radio Buttons
  radioGroupRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radioCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  radioCardActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  radioCardYesActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  radioCardNoActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  radioCardText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  radioCardTextActive: {
    fontWeight: '700',
    color: '#0F766E',
  },
  radioCardTextYesActive: {
    fontWeight: '700',
    color: '#15803D',
  },
  radioCardTextNoActive: {
    fontWeight: '700',
    color: '#DC2626',
  },
  radioDotCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioDotCircleActive: {
    borderColor: '#0F766E',
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
    backgroundColor: '#0F766E',
  },
  radioDotInnerYes: {
    backgroundColor: '#10B981',
  },
  radioDotInnerNo: {
    backgroundColor: '#EF4444',
  },

  // Dropdown Picker
  dropdownTriggerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerBoxActive: {
    borderColor: '#0F766E',
  },
  dropdownTriggerValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
  dropdownTriggerPlaceholderText: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  dropdownChevronText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Multi-select Chips
  quickPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  quickMultiChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickMultiChipSelected: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  quickMultiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickMultiChipTextSelected: {
    color: '#0F766E',
    fontWeight: '700',
  },
  multiTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  multiTagPill: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  multiTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F766E',
  },
  multiTagDismiss: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },

  // Modal Bottom Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '80%',
  },
  modalHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalDoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#0F766E',
  },
  modalDoneBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginVertical: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  modalOptionsList: {
    maxHeight: 320,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalOptionItemActive: {
    backgroundColor: '#F0FDFA',
  },
  modalOptionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalOptionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  modalOptionBulletActive: {
    backgroundColor: '#0F766E',
  },
  modalOptionItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'left',
    flex: 1,
  },
  modalOptionItemTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  modalActiveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },
  modalCheckmarkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxSquareFilled: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  multiCheckboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  multiCheckboxSquareActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  multiCheckboxCheckFilled: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  multiCheckboxCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Clean Auto-Number Box
  autoNumberBoxClean: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoNumberIconPillClean: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoNumberIconTextClean: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  autoNumberValueClean: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.2,
  },

  // Legacy Auto-Number Box
  autoNumberBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  autoNumberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  autoNumberIconPill: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoNumberIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  autoNumberTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.3,
  },
  autoNumberSub: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  autoNumberBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  autoNumberBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  autoNumberValueBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  autoNumberValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
