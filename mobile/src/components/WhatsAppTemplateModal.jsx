import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';

export const WhatsAppTemplateModal = ({ visible, customer, branding, onClose }) => {
  if (!visible || !customer) return null;

  const data = customer.data instanceof Map
    ? Object.fromEntries(customer.data)
    : (customer.data || customer);

  const phone = data.phone || customer.phone || '';
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const name = data.customerName || customer.customerName || 'Valued Customer';
  const customerId = customer.customerId || data.customerId || '';
  const req = data.requirement || customer.requirement || '';
  const quoteVal = data.quotationValue || data.orderValue || customer.quotationValue || '';
  const brandName = branding?.appName || branding?.appShortName || 'Vasantham CRM';
  const tagline = branding?.tagline || 'Tiles & Sanitary Wares';

  const sendWhatsAppMessage = (messageText) => {
    onClose();
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`);
      })
      .catch(() => Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`));
  };

  const templates = [
    {
      id: 'quote',
      title: '📋 Full Quotation Summary',
      description: 'Complete quote details, requirements & pricing breakdown',
      color: '#2563EB',
      bg: '#EFF6FF',
      getMessage: () =>
        `🏛️ *${brandName}*\n✨ _${tagline}_\n\nDear *${name}*${customerId ? ` (Ref: #${customerId})` : ''},\n\nThank you for visiting *${brandName}*!\n${req ? `📌 *Requirement:* ${req}\n` : ''}${quoteVal ? `💰 *Quotation Total:* ₹${Number(quoteVal).toLocaleString('en-IN')}\n` : ''}\nWe invite you to visit our live showroom displays. Feel free to reply here for catalogue links or sample requests.\n\nWarm regards,\n*${brandName} Team*`,
    },
    {
      id: 'greeting',
      title: '👋 Showroom Follow-up & Greeting',
      description: 'Polite reminder and invitation to showroom',
      color: '#059669',
      bg: '#ECFDF5',
      getMessage: () =>
        `Hello *${name}*! 👋\n\nGreetings from *${brandName}* (${tagline}).\n\nWe wanted to check if you have any questions regarding your tile and sanitary requirements. Our showroom has new arrivals and premium mockups ready for you to explore!\n\nPlease let us know when you would like to visit.\n\nBest regards,\n*${brandName}*`,
    },
    {
      id: 'order',
      title: '🎉 Order Confirmation & Receipt',
      description: 'Congratulations note on booking the materials',
      color: '#7C3AED',
      bg: '#F5F3FF',
      getMessage: () =>
        `🎉 *Order Confirmed - ${brandName}*\n\nDear *${name}*,\n\nWe are delighted to confirm your order${quoteVal ? ` of *₹${Number(quoteVal).toLocaleString('en-IN')}*` : ''}!\n\nThank you for choosing ${brandName}. Our dispatch team is preparing your materials with utmost care.\n\nWarm regards,\n*${brandName} Management*`,
    },
    {
      id: 'location',
      title: '📍 Showroom Location & Visiting Hours',
      description: 'Share Google Maps directions and store contact info',
      color: '#D97706',
      bg: '#FFFBEB',
      getMessage: () =>
        `📍 *Visit ${brandName}*\n\nDear *${name}*,\n\nOur showroom is open from *9:00 AM to 9:00 PM* (Monday to Sunday).\n\nExperience live kitchen & bathroom mockup displays, imported tiles, and luxury sanitary wares.\n\n📞 Call us for assistance anytime.\n*${brandName}*`,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 20 }}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Send WhatsApp Message</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                To: {name} ({phone})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Template Options */}
          <ScrollView style={styles.list} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
            {templates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={[styles.templateCard, { backgroundColor: tpl.bg, borderColor: `${tpl.color}40` }]}
                activeOpacity={0.75}
                onPress={() => sendWhatsAppMessage(tpl.getMessage())}
              >
                <View style={styles.templateHeader}>
                  <Text style={[styles.templateTitle, { color: tpl.color }]}>{tpl.title}</Text>
                  <Text style={styles.sendArrow}>→</Text>
                </View>
                <Text style={styles.templateDesc}>{tpl.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  list: {
    marginBottom: 12,
  },
  templateCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sendArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
  },
  templateDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
});
