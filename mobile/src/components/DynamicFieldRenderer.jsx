import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

export const DynamicFieldRenderer = ({ field, value, onChange, error }) => {
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

  // Selection matching logic for single-select (select / radio)
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

  // Array of selected items for multi-select
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

  // Check if options are a binary Yes/No pair
  const isBinaryChoice = normalizedOptions.length === 2 &&
    normalizedOptions.some((o) => String(o.label).toLowerCase() === 'yes') &&
    normalizedOptions.some((o) => String(o.label).toLowerCase() === 'no');

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              placeholderTextColor={colors.textLight}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
            />
          </View>
        );

      case 'textarea':
        return (
          <View style={[styles.inputContainer, styles.textareaContainer, error && styles.inputContainerError]}>
            <TextInput
              style={[styles.textInput, styles.textareaInput]}
              placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
              placeholderTextColor={colors.textLight}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      case 'number':
        return (
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || '0'}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={(text) => handleChange(text === '' ? '' : Number(text))}
            />
          </View>
        );

      case 'currency':
        return (
          <View style={[styles.currencyInputBox, error && styles.inputContainerError]}>
            <View style={styles.currencySymbolBadge}>
              <Text style={styles.currencySymbolText}>₹</Text>
            </View>
            <TextInput
              style={styles.currencyTextInput}
              placeholder={placeholder || '0.00'}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={(text) => handleChange(text === '' ? '' : Number(text))}
            />
          </View>
        );

      case 'phone':
        return (
          <View style={[styles.phoneInputBox, error && styles.inputContainerError]}>
            <View style={styles.phonePrefixBadge}>
              <Text style={styles.phonePrefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneTextInput}
              placeholder={placeholder || '98765 43210'}
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
            />
          </View>
        );

      case 'email':
        return (
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || 'customer@example.com'}
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
            />
          </View>
        );

      case 'date':
      case 'time':
      case 'datetime': {
        const setQuickDate = (daysAhead) => {
          const target = new Date(Date.now() + daysAhead * 86400000);
          handleChange(target.toISOString().split('T')[0]);
        };

        return (
          <View>
            <View style={[styles.dateInputBox, error && styles.inputContainerError]}>
              <Text style={styles.dateIconText}>📅</Text>
              <TextInput
                style={styles.dateTextInput}
                placeholder={placeholder || (type === 'time' ? 'HH:mm' : 'YYYY-MM-DD')}
                placeholderTextColor={colors.textLight}
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={handleChange}
              />
            </View>
            {type === 'date' && (
              <View style={styles.quickDatesRow}>
                <TouchableOpacity
                  style={[styles.quickDatePill, value === new Date().toISOString().split('T')[0] && styles.quickDatePillActive]}
                  onPress={() => setQuickDate(0)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickDatePillText, value === new Date().toISOString().split('T')[0] && styles.quickDatePillTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDatePill}
                  onPress={() => setQuickDate(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDatePillText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDatePill}
                  onPress={() => setQuickDate(7)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDatePillText}>+1 Week</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }

      // Professional Checkbox Component with Touch Surface
      case 'checkbox': {
        const isChecked = Boolean(value);
        return (
          <TouchableOpacity
            style={[styles.checkboxCard, isChecked && styles.checkboxCardChecked, error && styles.inputContainerError]}
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

      // Professional Radio Buttons & Select Options
      case 'radio':
      case 'select': {
        // Render 2-column segmented control for Yes/No
        if (isBinaryChoice) {
          return (
            <View style={styles.binaryChoiceRow}>
              {normalizedOptions.map((option, index) => {
                const selected = isOptionSelected(option);
                const isYes = String(option.label).toLowerCase() === 'yes';

                return (
                  <TouchableOpacity
                    key={`${name}-${option.value}-${index}`}
                    style={[
                      styles.binaryChoiceBtn,
                      selected && (isYes ? styles.binaryChoiceBtnYes : styles.binaryChoiceBtnNo),
                    ]}
                    onPress={() => handleChange(option.value)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radioDotCircle, selected && styles.radioDotCircleActive]}>
                      {selected && <View style={styles.radioDotInner} />}
                    </View>
                    <Text style={[styles.binaryChoiceText, selected && styles.binaryChoiceTextActive]}>
                      {isYes ? '✓ Yes' : '✕ No'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }

        // Render clean interactive grid of modern Radio Option Cards
        return (
          <View style={styles.radioGrid}>
            {normalizedOptions.map((option, index) => {
              const selected = isOptionSelected(option);

              return (
                <TouchableOpacity
                  key={`${name}-${option.value}-${index}`}
                  activeOpacity={0.75}
                  style={[
                    styles.radioCard,
                    selected && styles.radioCardActive,
                  ]}
                  onPress={() => handleChange(option.value)}
                >
                  <View style={[styles.radioDotCircle, selected && styles.radioDotCircleActive]}>
                    {selected && <View style={styles.radioDotInner} />}
                  </View>
                  <Text style={[styles.radioCardText, selected && styles.radioCardTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      // Professional Multi-Select Options with Clean Checkboxes
      case 'multiselect':
        return (
          <View>
            {multiSelectedValues.length > 0 && (
              <View style={styles.multiSummaryBanner}>
                <Text style={styles.multiSummaryText}>
                  ✓ <Text style={{ fontWeight: '900' }}>{multiSelectedValues.length}</Text> {multiSelectedValues.length === 1 ? 'option selected' : 'options selected'}
                </Text>
              </View>
            )}
            <View style={styles.multiSelectGrid}>
              {normalizedOptions.map((option, index) => {
                const selected = isMultiOptionSelected(option);

                return (
                  <TouchableOpacity
                    key={`${name}-${option.value}-${index}`}
                    activeOpacity={0.75}
                    style={[
                      styles.multiSelectCard,
                      selected && styles.multiSelectCardActive,
                    ]}
                    onPress={() => handleToggleMultiItem(option)}
                  >
                    <View style={[styles.multiCheckboxBox, selected && styles.multiCheckboxBoxActive]}>
                      {selected && <Text style={styles.multiCheckboxIcon}>✓</Text>}
                    </View>
                    <Text style={[styles.multiSelectCardText, selected && styles.multiSelectCardTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'auto_number':
        return (
          <View style={styles.autoNumberBox}>
            <View style={styles.autoNumberHeader}>
              <Text style={styles.autoNumberIcon}>⚡</Text>
              <Text style={styles.autoNumberTitle}>SYSTEM GENERATED ID</Text>
            </View>
            <Text style={styles.autoNumberValue}>
              {value || 'CUS-AUTO (Assigned on save)'}
            </Text>
          </View>
        );

      default:
        return (
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              placeholderTextColor={colors.textLight}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.fieldContainer}>
      {/* Label Row */}
      <View style={styles.labelHeaderRow}>
        <View style={styles.labelTitleGroup}>
          <Text style={styles.fieldLabel}>
            {label}
            {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
          </Text>
        </View>

        {type === 'multiselect' ? (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeMulti}>Multi-Select</Text>
          </View>
        ) : type === 'radio' || type === 'select' ? (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeSingle}>Select One</Text>
          </View>
        ) : null}
      </View>

      {description && type !== 'checkbox' ? (
        <Text style={styles.fieldDescriptionText}>{description}</Text>
      ) : null}

      {/* Input Element Wrapper */}
      <View style={styles.inputBodyWrapper}>{renderInput()}</View>

      {/* Error Alert Message */}
      {error ? (
        <View style={styles.errorAlertBox}>
          <Text style={styles.errorAlertText}>⚠️ {error}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const DynamicFieldInput = DynamicFieldRenderer;

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 18,
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
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  requiredAsterisk: {
    color: '#E11D48',
    fontWeight: '900',
    fontSize: 14,
  },
  typeBadgeContainer: {
    marginLeft: 8,
  },
  typeBadgeMulti: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  typeBadgeSingle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  // Standard Text Input Box
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF1F2',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  textareaContainer: {
    minHeight: 92,
    paddingVertical: 12,
  },
  textareaInput: {
    minHeight: 70,
  },
  // Currency Input
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  currencySymbolBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F766E',
  },
  currencyTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
  },
  // Phone Input
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  phonePrefixBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
  },
  // Date Input
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    gap: 8,
  },
  dateIconText: {
    fontSize: 14,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  quickDatePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  quickDatePillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  quickDatePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quickDatePillTextActive: {
    color: '#059669',
  },
  // Checkbox Card Design
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  checkboxCardChecked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareChecked: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  checkboxTextContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkboxLabelChecked: {
    color: '#065F46',
  },
  checkboxSubtext: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  // Binary Choice (Yes / No)
  binaryChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  binaryChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  binaryChoiceBtnYes: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  binaryChoiceBtnNo: {
    backgroundColor: '#FFF1F2',
    borderColor: '#F43F5E',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  binaryChoiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  binaryChoiceTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  // Radio Buttons Grid
  radioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  radioCardActive: {
    backgroundColor: '#ECFEF8',
    borderColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  radioCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  radioCardTextActive: {
    color: '#0F766E',
    fontWeight: '900',
  },
  radioDotCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioDotCircleActive: {
    borderColor: '#0F766E',
    backgroundColor: '#FFFFFF',
  },
  radioDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0F766E',
  },
  // Multi-Select Grid
  multiSummaryBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  multiSummaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  multiSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  multiSelectCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  multiSelectCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  multiSelectCardTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  multiCheckboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  multiCheckboxBoxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  multiCheckboxIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
  },
  // Auto Number Box
  autoNumberBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  autoNumberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  autoNumberIcon: {
    fontSize: 13,
  },
  autoNumberTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  autoNumberValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F766E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Error Message Alert
  errorAlertBox: {
    marginTop: 5,
    paddingHorizontal: 2,
  },
  errorAlertText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E11D48',
  },
});
