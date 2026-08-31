import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';

export const DynamicFieldRenderer = ({ field, value, onChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

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

  // Binary choice check (Yes/No pair)
  const isBinaryChoice = normalizedOptions.length === 2 &&
    normalizedOptions.some((o) => String(o.label).toLowerCase() === 'yes') &&
    normalizedOptions.some((o) => String(o.label).toLowerCase() === 'no');

  // Active selected option object
  const selectedOptionObj = normalizedOptions.find((o) => isOptionSelected(o));

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

      // Dropdown List Box for Single Select & Radio Buttons
      case 'radio':
      case 'select': {
        // Binary Yes/No Choice Pill Segment
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

        // Modern Mobile Dropdown List Box
        const filteredModalOptions = normalizedOptions.filter((opt) =>
          opt.label.toLowerCase().includes(searchText.toLowerCase())
        );

        return (
          <View>
            {/* Dropdown Trigger Box */}
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
                <Text style={styles.dropdownIconText}>
                  {name.includes('Type') ? '🏢' : name.includes('Source') ? '📢' : name.includes('status') || name.includes('Stage') ? '📋' : name.includes('person') ? '👤' : '📑'}
                </Text>
                <Text
                  style={[
                    styles.dropdownTriggerValueText,
                    !selectedOptionObj && styles.dropdownTriggerPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedOptionObj ? selectedOptionObj.label : placeholder || `Select ${label}...`}
                </Text>
              </View>
              <View style={styles.dropdownTriggerChevronBox}>
                <Text style={styles.dropdownChevronText}>▼</Text>
              </View>
            </TouchableOpacity>

            {/* Dropdown Option List Modal Sheet */}
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
                    <Text style={styles.modalSheetTitle}>Select {label}</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCloseBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Input for List Box */}
                  {normalizedOptions.length > 5 && (
                    <View style={styles.modalSearchBox}>
                      <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
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
                          <Text style={[styles.modalOptionItemText, selected && styles.modalOptionItemTextActive]}>
                            {opt.label}
                          </Text>
                          {selected && (
                            <View style={styles.modalCheckmarkBadge}>
                              <Text style={styles.modalCheckmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    {filteredModalOptions.length === 0 && (
                      <View style={{ padding: 20, alignItems: 'center' }}>
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

      // Multi-Select Dropdown Box
      case 'multiselect': {
        const filteredModalOptions = normalizedOptions.filter((opt) =>
          opt.label.toLowerCase().includes(searchText.toLowerCase())
        );

        return (
          <View>
            {/* Multi-Select Trigger Box */}
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
                <Text style={styles.dropdownIconText}>🎨</Text>
                <Text
                  style={[
                    styles.dropdownTriggerValueText,
                    multiSelectedValues.length === 0 && styles.dropdownTriggerPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {multiSelectedValues.length > 0
                    ? `${multiSelectedValues.length} categories selected`
                    : placeholder || `Select ${label.toLowerCase()}...`}
                </Text>
              </View>
              <View style={styles.dropdownTriggerChevronBox}>
                <Text style={styles.dropdownChevronText}>▼</Text>
              </View>
            </TouchableOpacity>

            {/* Selected Tags Display */}
            {multiSelectedValues.length > 0 && (
              <View style={styles.multiTagsRow}>
                {multiSelectedValues.map((v, i) => (
                  <View key={i} style={styles.multiTagPill}>
                    <Text style={styles.multiTagText}>{v}</Text>
                  </View>
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
                  {/* Top Handle */}
                  <View style={styles.modalHandleWrapper}>
                    <View style={styles.modalHandle} />
                  </View>

                  {/* Header */}
                  <View style={styles.modalSheetHeader}>
                    <Text style={styles.modalSheetTitle}>Select {label}</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCloseBtnText}>Done ✓</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Input for Multi-Select */}
                  {normalizedOptions.length > 5 && (
                    <View style={styles.modalSearchBox}>
                      <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
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
            <Text style={styles.typeBadgeSingle}>Dropdown</Text>
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
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  textareaContainer: {
    paddingVertical: 10,
    minHeight: 90,
  },
  textareaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
  clearBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  // Currency Input
  currencyInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  currencySymbolBadge: {
    backgroundColor: '#F1F5F9',
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
  quickAmountRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  quickAmountPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickAmountPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  // Phone Input
  phoneInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phonePrefixBadge: {
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  phonePrefixText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Date Input
  dateInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconText: {
    fontSize: 15,
    marginRight: 8,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  quickDatePill: {
    backgroundColor: '#F8FAFC',
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
    borderColor: '#CBD5E1',
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
  // Binary Yes/No Choice
  binaryChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  binaryChoiceBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  binaryChoiceBtnYes: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  binaryChoiceBtnNo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  binaryChoiceText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  binaryChoiceTextActive: {
    fontWeight: '900',
    color: '#0F172A',
  },
  radioDotCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotCircleActive: {
    borderColor: '#2563EB',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  // Dropdown List Box Component Styles
  dropdownTriggerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerBoxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  dropdownTriggerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownIconText: {
    fontSize: 16,
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
    paddingLeft: 8,
  },
  dropdownChevronText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Multi-Select Tags
  multiTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  multiTagPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  multiTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },

  // Dropdown Modal Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '75%',
  },
  modalHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
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
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginVertical: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalOptionsList: {
    maxHeight: 350,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalOptionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  modalOptionItemTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
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

  // Auto Number Box
  autoNumberBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  errorAlertBox: {
    marginTop: 6,
    paddingHorizontal: 8,
  },
  errorAlertText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
});
