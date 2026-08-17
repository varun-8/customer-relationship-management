import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
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

  const normalizedOptions = options.map((option) => (
    typeof option === 'object' && option !== null
      ? option
      : { label: String(option), value: String(option) }
  ));

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <TextInput
            style={styles.input}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={colors.textLight}
            value={value ?? ''}
            onChangeText={(text) => onChange(name, text)}
          />
        );

      case 'textarea':
        return (
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={colors.textLight}
            value={value ?? ''}
            onChangeText={(text) => onChange(name, text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.input}
            placeholder={placeholder || '0'}
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChangeText={(text) => onChange(name, text === '' ? '' : Number(text))}
          />
        );

      case 'currency':
        return (
          <View style={styles.currencyShell}>
            <Text style={styles.currencyPrefix}>Rs</Text>
            <TextInput
              style={[styles.input, styles.currencyInput]}
              placeholder={placeholder || '0.00'}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={(text) => onChange(name, text === '' ? '' : Number(text))}
            />
          </View>
        );

      case 'phone':
        return (
          <TextInput
            style={styles.input}
            placeholder={placeholder || '9876543210'}
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
            value={value ?? ''}
            onChangeText={(text) => onChange(name, text)}
          />
        );

      case 'email':
        return (
          <TextInput
            style={styles.input}
            placeholder={placeholder || 'customer@example.com'}
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            value={value ?? ''}
            onChangeText={(text) => onChange(name, text)}
          />
        );

      case 'date':
      case 'time':
      case 'datetime':
        return (
          <TextInput
            style={styles.input}
            placeholder={placeholder || (type === 'time' ? 'HH:mm' : 'YYYY-MM-DD')}
            placeholderTextColor={colors.textLight}
            value={value ?? ''}
            onChangeText={(text) => onChange(name, text)}
          />
        );

      case 'checkbox':
        return (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{placeholder || 'Toggle option'}</Text>
            <Switch
              value={Boolean(value)}
              onValueChange={(nextValue) => onChange(name, nextValue)}
              trackColor={{ false: '#D8E1EA', true: colors.primaryLight }}
              thumbColor="#FFFFFF"
            />
          </View>
        );

      case 'radio':
      case 'select':
        return (
          <View style={styles.chipsContainer}>
            {normalizedOptions.map((option, index) => {
              const isSelected = value === option.value;

              return (
                <TouchableOpacity
                  key={`${name}-${option.value}-${index}`}
                  activeOpacity={0.8}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => onChange(name, option.value)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value : [];

        const toggleItem = (optionValue) => {
          if (selectedValues.includes(optionValue)) {
            onChange(name, selectedValues.filter((entry) => entry !== optionValue));
            return;
          }

          onChange(name, [...selectedValues, optionValue]);
        };

        return (
          <View style={styles.chipsContainer}>
            {normalizedOptions.map((option, index) => {
              const isSelected = selectedValues.includes(option.value);

              return (
                <TouchableOpacity
                  key={`${name}-${option.value}-${index}`}
                  activeOpacity={0.8}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggleItem(option.value)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {isSelected ? 'Selected: ' : ''}{option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      case 'auto_number':
        return (
          <View style={styles.autoNumberBox}>
            <Text style={styles.autoNumberText}>
              {value || 'Generated automatically when the record is saved'}
            </Text>
          </View>
        );

      default:
        return (
          <TextInput
            style={styles.input}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={colors.textLight}
            value={value ?? ''}
            onChangeText={(text) => onChange(name, text)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </Text>
        {type === 'multiselect' ? <Text style={styles.typeBadge}>Multi-select</Text> : null}
      </View>

      {description ? <Text style={styles.helpText}>{description}</Text> : null}

      <View style={styles.inputWrapper}>{renderInput()}</View>

      {error ? <Text style={styles.errorText}>Required: {error}</Text> : null}
    </View>
  );
};

export const DynamicFieldInput = DynamicFieldRenderer;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  requiredStar: {
    color: colors.rose,
    fontWeight: '800',
  },
  typeBadge: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  helpText: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: 6,
    lineHeight: 16,
  },
  inputWrapper: {
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  textarea: {
    minHeight: 92,
  },
  currencyShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  currencyPrefix: {
    paddingLeft: 14,
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryStrong,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  autoNumberBox: {
    padding: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  autoNumberText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    fontSize: 11.5,
    color: colors.rose,
    fontWeight: '700',
    marginTop: 6,
  },
});
