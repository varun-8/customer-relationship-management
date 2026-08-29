import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

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
              placeholderTextColor="#94A3B8"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
            />
            {value ? (
              <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );

      case 'textarea':
        return (
          <View style={[styles.inputContainer, styles.textareaContainer, error && styles.inputContainerError]}>
            <TextInput
              style={[styles.textInput, styles.textareaInput]}
              placeholder={placeholder || `Enter detailed ${label.toLowerCase()}...`}
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={(text) => {
                const clean = String(text).replace(/[^0-9.]/g, '');
                handleChange(clean === '' ? '' : Number(clean));
              }}
            />
            {value ? (
              <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );

      case 'currency':
        return (
          <View>
            <View style={[styles.currencyInputBox, error && styles.inputContainerError]}>
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
              />
              {value ? (
                <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Amount Suggestion Pills for Easy 1-Tap Entry */}
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

      case 'phone':
        return (
          <View style={[styles.phoneInputBox, error && styles.inputContainerError]}>
            <View style={styles.phonePrefixBadge}>
              <Text style={styles.phonePrefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneTextInput}
              placeholder={placeholder || '98765 43210'}
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={14}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={(text) => {
                const clean = String(text).replace(/[^0-9\s-]/g, '');
                handleChange(clean);
              }}
            />
            {value ? (
              <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );

      case 'email':
        return (
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || 'customer@example.com'}
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={handleChange}
            />
            {value ? (
              <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn}>
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

        return (
          <View>
            <View style={[styles.dateInputBox, error && styles.inputContainerError]}>
              <Text style={styles.dateIconText}>📅</Text>
              <TextInput
                style={styles.dateTextInput}
                placeholder={placeholder || (type === 'time' ? 'HH:mm' : 'YYYY-MM-DD')}
                placeholderTextColor="#94A3B8"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChangeText={handleChange}
              />
              {value ? (
                <TouchableOpacity onPress={() => handleChange('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {type === 'date' && (
              <View style={styles.quickDatesRow}>
                <TouchableOpacity
                  style={[styles.quickDatePill, value === todayStr && styles.quickDatePillActive]}
                  onPress={() => setQuickDate(0)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickDatePillText, value === todayStr && styles.quickDatePillTextActive]}>
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
                  onPress={() => setQuickDate(3)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDatePillText}>+3 Days</Text>
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

      // Checkbox Card Component
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

      // Radio Buttons & Select Options
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

      // Multi-Select Options with Clean Checkboxes
      case 'multiselect':
        return (
          <View>
            {multiSelectedValues.length > 0 && (
              <View style={styles.multiSummaryBanner}>
                <Text style={styles.multiSummaryText}>
                  ✓ <Text style={{ fontWeight: '900' }}>{multiSelectedValues.length}</Text> {multiSelectedValues.length === 1 ? 'item selected' : 'items selected'}
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
              placeholderTextColor="#94A3B8"
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
        ) : required ? (
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeRequired}>Required</Text>
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '900',
    fontSize: 13.5,
  },
  typeBadgeContainer: {
    marginLeft: 8,
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
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeSingle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeRequired: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
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
  // Standard Text Input Box
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '800',
  },
  textareaContainer: {
    minHeight: 88,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  textareaInput: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  // Currency Input
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  currencySymbolBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRightWidth: 1.2,
    borderRightColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  currencyTextInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  quickAmountPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  quickAmountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  // Phone Input
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  phonePrefixBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRightWidth: 1.2,
    borderRightColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
  },
  // Date Input
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    gap: 8,
  },
  dateIconText: {
    fontSize: 14,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13.5,
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
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  quickDatePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  quickDatePillTextActive: {
    color: '#2563EB',
  },
  // Checkbox Card Design
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 11,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkboxLabelChecked: {
    color: '#065F46',
    fontWeight: '800',
  },
  checkboxSubtext: {
    fontSize: 11,
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
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingVertical: 11,
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
    fontSize: 13.5,
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
    gap: 7,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9.5,
    minHeight: 42,
  },
  radioCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 1,
  },
  radioCardText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  radioCardTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  radioDotCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioDotCircleActive: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  // Multi-Select Grid
  multiSummaryBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    marginBottom: 7,
    alignSelf: 'flex-start',
  },
  multiSummaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  multiSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  multiSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9.5,
    minHeight: 42,
  },
  multiSelectCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 1,
  },
  multiSelectCardText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  multiSelectCardTextActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  multiCheckboxBox: {
    width: 17,
    height: 17,
    borderRadius: 4.5,
    borderWidth: 1.8,
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
    fontSize: 10.5,
    fontWeight: '900',
    lineHeight: 12,
  },
  // Auto Number Box
  autoNumberBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 13,
    padding: 13,
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
    fontWeight: '800',
    color: '#DC2626',
  },
});
