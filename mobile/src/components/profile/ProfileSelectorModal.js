import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';

export const PROFILES = [
  {
    id: 'owner',
    name: 'Showroom Owner',
    role: 'owner',
    icon: '👑',
    roleTitle: 'Showroom Owner',
    subtitle: 'All Showroom Leads & Full Team Command',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
];

export function ProfileSelectorModal({ visible, currentProfile, profiles = PROFILES, onSelectProfile, onClose }) {
  const displayProfiles = profiles && profiles.length > 0 ? profiles : PROFILES;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Select Active Profile</Text>
              <Text style={styles.subtitle}>
                Choose your staff account to view your assigned leads & follow-ups
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Profiles List */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {displayProfiles.map((p) => {
              const isSelected = currentProfile?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.profileCard,
                    { borderColor: isSelected ? p.color : '#E2E8F0' },
                    isSelected && { backgroundColor: p.bg },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelectProfile(p);
                    onClose();
                  }}
                >
                  <View style={[styles.avatarBox, { backgroundColor: p.bg, borderColor: p.border }]}>
                    <Text style={{ fontSize: 20 }}>{p.icon}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.profileName}>{p.name}</Text>
                      <View style={[styles.rolePill, { backgroundColor: p.bg, borderColor: p.border }]}>
                        <Text style={[styles.rolePillText, { color: p.color }]}>{p.roleTitle}</Text>
                      </View>
                    </View>
                    <Text style={styles.profileSubtitle} numberOfLines={1}>
                      {p.subtitle}
                    </Text>
                  </View>

                  {/* Radio / Check Circle */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && { borderColor: p.color, backgroundColor: p.color },
                    ]}
                  >
                    {isSelected && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              💡 <Text style={{ fontWeight: '800' }}>No credentials required.</Text> Switch freely between Owner command mode and Sales Executive follow-up views.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 270,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  scroll: {
    marginVertical: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  profileSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  noticeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  noticeText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
});
