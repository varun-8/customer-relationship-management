import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';

const APP_LOGO = require('../../../assets/logo.png');

export const MobileLoginScreen = ({
  onLoginSuccess,
  onDisconnectServer,
  serverHost,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Credential Login for Owner or Employee
  const handleLogin = async () => {
    const loginId = identifier.trim();
    const loginPass = password;

    if (!loginId) {
      setError('Please enter your username or email');
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
          color: isOwner ? '#D97706' : '#2563EB',
          bg: isOwner ? '#FEF3C7' : '#EFF6FF',
          border: isOwner ? '#FDE68A' : '#BFDBFE',
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
        setError(res?.message || 'Invalid credentials. Please check your username and password.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Paired Server Status Bar */}
          <View style={styles.serverBar}>
            <View style={styles.serverStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.serverHostText} numberOfLines={1}>
                Paired: {serverHost || 'Desktop Server'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={onDisconnectServer}
              activeOpacity={0.7}
            >
              <Text style={styles.disconnectBtnText}>Re-pair</Text>
            </TouchableOpacity>
          </View>

          {/* Minimalist Executive Login Card */}
          <View style={styles.loginCard}>
            {/* Logo Badge */}
            <View style={styles.logoBadge}>
              <Image source={APP_LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>

            {/* Brand Title & Subtitle */}
            <Text style={styles.brandTitle}>Vasantham CRM</Text>
            <Text style={styles.brandSubtitle}>
              Sign in to access your showroom workspace
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Username or Email Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>USERNAME OR EMAIL</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter username or email"
                    placeholderTextColor="#94A3B8"
                    value={identifier}
                    onChangeText={(val) => {
                      setIdentifier(val);
                      setError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.textInput, { paddingRight: 40 }]}
                    placeholder="Enter password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Signing in...' : 'Sign In  →'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Subtle Security Badge */}
            <View style={styles.securityFooter}>
              <Text style={{ fontSize: 13, marginRight: 6 }}>🛡️</Text>
              <Text style={styles.securityFooterText}>Vasantham Secure Login</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  serverBar: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  serverHostText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  disconnectBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disconnectBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 26,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  formContainer: {
    width: '100%',
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  securityFooterText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
