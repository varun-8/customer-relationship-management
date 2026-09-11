import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { colors } from '../../theme/colors';

const APP_LOGO = require('../../../assets/logo.png');

function MobileLoginScreenComponent({
  onLoginSuccess,
  onDisconnectServer,
  onOpenQrScanner,
  serverHost,
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const passwordInputRef = useRef(null);

  // Handle Credential Login for Owner or Employee
  const handleLogin = async () => {
    Keyboard.dismiss();
    const loginId = identifier.trim();
    const loginPass = password;

    if (!loginId) {
      setError('Please enter your staff username or email');
      return;
    }
    if (!loginPass) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiClient.login(loginId, loginPass);
      if (res && res.success && res.data) {
        const user = res.data;
        const isOwner = user.role === 'owner' || user.role === 'admin';

        // Dynamically build user profile according to authenticated role
        const profile = {
          id: isOwner ? 'owner' : `staff_${user._id}`,
          name: user.name,
          email: user.email,
          role: isOwner ? 'owner' : 'employee',
          phone: user.phone || '',
          icon: isOwner ? '👑' : '💼',
          roleTitle: isOwner ? 'Showroom Owner' : 'Sales Executive',
          subtitle: isOwner ? 'Full Showroom Command & Oversight' : 'Showroom Sales & Assigned Leads',
          color: isOwner ? '#D97706' : '#0F766E',
          bg: isOwner ? '#FEF3C7' : '#ECFEF8',
          border: isOwner ? '#FDE68A' : '#CCFBF1',
        };

        await apiClient.sendDeviceHeartbeat(profile, 'Mobile App Login');

        if (onLoginSuccess) {
          onLoginSuccess({
            role: profile.role,
            profile,
            user,
            token: user.token,
          });
        }
      } else {
        setError(res?.message || 'Invalid credentials. Please verify your employee username/password from the Desktop CRM.');
      }
    } catch (err) {
      setError(err.message || 'Unable to reach Desktop CRM. Please verify your server connection.');
    } finally {
      setLoading(false);
    }
  };

  const cleanHostDisplay = (serverHost || 'Desktop CRM')
    .replace(/^https?:\/\//, '')
    .replace(/\/api.*$/, '');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
            {/* Top Paired Server Status Pill */}
            <View style={styles.serverPill}>
              <View style={styles.serverPillLeft}>
                <View style={styles.statusLiveDot} />
                <Text style={styles.serverHostValue} numberOfLines={1}>
                  {cleanHostDisplay}
                </Text>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>PAIRED</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {onOpenQrScanner && (
                  <TouchableOpacity
                    style={styles.rePairBtn}
                    onPress={onOpenQrScanner}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.rePairBtnText}>📷 Scan QR</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.rePairBtn}
                  onPress={onDisconnectServer}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.rePairBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Minimalist Executive Login Card */}
            <View style={styles.cardContainer}>
              {/* Header Brand Section */}
              <View style={styles.brandSection}>
                <View style={styles.logoElevatedWrapper}>
                  <Image source={APP_LOGO} style={styles.logoImg} resizeMode="contain" />
                </View>

                <Text style={styles.brandTitle}>Vasantham CRM</Text>
                <Text style={styles.brandSubtitle}>
                  Showroom Workspace • Sign in with your Desktop credentials
                </Text>
              </View>

              {/* Error Notification Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Input Form Fields */}
              <View style={styles.form}>
                {/* Username or Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>USERNAME OR EMAIL</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'username' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Text style={styles.inputPrefixIcon}>👤</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter username or email"
                      placeholderTextColor="#94A3B8"
                      value={identifier}
                      onChangeText={(val) => {
                        setIdentifier(val);
                        setError('');
                      }}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    {identifier.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setIdentifier('')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.clearBtn}
                      >
                        <Text style={styles.clearBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'password' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Text style={styles.inputPrefixIcon}>🔒</Text>
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.textInput}
                      placeholder="Enter password"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        setError('');
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      returnKeyType="go"
                      onSubmitEditing={handleLogin}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggleBtn}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={{ fontSize: 15 }}>{showPassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sign In Primary Action Button */}
                <TouchableOpacity
                  style={[styles.signInBtn, loading && styles.signInBtnLoading]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  ) : null}
                  <Text style={styles.signInBtnText}>
                    {loading ? 'Authenticating with Desktop...' : 'Sign In to Workspace  →'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Desktop Verification Note */}
              <View style={styles.desktopNoticeCard}>
                <Text style={styles.noticeDesc}>
                  Employee accounts are managed in Desktop CRM under <Text style={{ fontWeight: '800', color: '#0F172A' }}>Employees</Text>. Both Sales Executives and Showroom Admins can log in using their credentials.
                </Text>
              </View>

              {/* Security Assurance Footer */}
              <View style={styles.securityBadgeRow}>
                <Text style={styles.securityBadgeText}>🔒 Encrypted Direct Showroom Network</Text>
              </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const MobileLoginScreen = React.memo(MobileLoginScreenComponent);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    alignItems: 'center',
  },
  serverPill: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  serverPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 8,
  },
  statusLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  serverHostValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  connectedBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  connectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  rePairBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rePairBtnText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '800',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  brandSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 22,
  },
  logoElevatedWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    padding: 7,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 10,
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputFieldBoxFocused: {
    borderColor: '#0F766E',
    backgroundColor: '#FFFFFF',
  },
  inputPrefixIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 0,
    paddingRight: 6,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  clearBtnText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '800',
  },
  passwordToggleBtn: {
    padding: 4,
    marginLeft: 4,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 12,
    height: 48,
    marginTop: 6,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signInBtnLoading: {
    opacity: 0.8,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  desktopNoticeCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 20,
  },
  noticeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    textAlign: 'center',
  },
  securityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
