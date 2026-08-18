import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../api/client';

const PRODUCT_OPTIONS = ['Tile', 'Sanitary', 'CP', 'Adhesive', 'Vanity'];

const COMMON_REASONS = [
  'Price Too High / Cheaper Competitor Quote',
  'Brand / Design / Size Not in Stock',
  'Competitor Offered Free Delivery / Higher Discount',
  'Delay in Showroom Response / Follow-up',
  'Customer Postponed Construction / Renovation',
  'Quality / Spec Mismatch',
  'Bought from Known Relative / Personal Dealer',
  'Other / Custom Reason',
];

const COMMON_COMPETITORS = [
  'Supreme Tiles',
  'Kajaria World',
  'Local Ceramics Mart',
  'Direct Wholesaler',
  'Simpolo Showroom',
  'Other / Custom Showroom',
];

export function MobileLostSaleModal({
  visible,
  customer,
  onClose,
  onSaved,
}) {
  if (!customer) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState(customer.customerName || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [quoteValue, setQuoteValue] = useState(
    customer.quotationValue ? String(customer.quotationValue) : ''
  );
  const [selectedProducts, setSelectedProducts] = useState(
    customer.requirement
      ? Array.isArray(customer.requirement)
        ? customer.requirement
        : [customer.requirement]
      : ['Tile']
  );
  const [salesperson, setSalesperson] = useState(customer.salesperson || 'Karthik Raja');
  const [lostReason, setLostReason] = useState('Price Too High / Cheaper Competitor Quote');
  const [competitor, setCompetitor] = useState('Supreme Tiles');
  const [customCompetitor, setCustomCompetitor] = useState('');
  const [priceDifference, setPriceDifference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleProduct = (prod) => {
    if (selectedProducts.includes(prod)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter((p) => p !== prod));
      }
    } else {
      setSelectedProducts([...selectedProducts, prod]);
    }
  };

  const numQuote = Number(quoteValue) || 0;
  const numDiff = Number(priceDifference) || 0;
  const diffPercent = numQuote > 0 && numDiff > 0 ? Number(((numDiff / numQuote) * 100).toFixed(1)) : 0;

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      Alert.alert('Validation', 'Customer name is required.');
      return;
    }
    if (!quoteValue || Number(quoteValue) <= 0) {
      Alert.alert('Validation', 'Please enter a valid quotation value.');
      return;
    }

    const finalCompetitor = competitor === 'Other / Custom Showroom' && customCompetitor.trim()
      ? customCompetitor.trim()
      : competitor;

    setSubmitting(true);
    try {
      const payload = {
        customerId: customer.customerId || undefined,
        customerName: customerName.trim(),
        phone: phone.trim() || undefined,
        quoteValue: Number(quoteValue) || 0,
        products: selectedProducts,
        salesperson: salesperson.trim(),
        lostReason,
        competitor: finalCompetitor || 'Unknown Dealer',
        priceDifference: Number(priceDifference) || 0,
        priceDiffPercentage: diffPercent,
        date: todayStr,
        notes: notes.trim(),
      };

      const res = await apiClient.createLostSale(payload);
      if (res.success) {
        Alert.alert('✓ Lost Sale Logged', 'Competitor pricing analysis and deal loss recorded!');
        if (onSaved) onSaved();
        onClose();
      } else {
        Alert.alert('Error', res.message || 'Failed to record lost sale');
      }
    } catch (e) {
      Alert.alert('Connection Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.title}>Record Lost Sale & Intel</Text>
                {customer.customerId && (
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>#{customer.customerId}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>
                Track competitor discounts, product leakage & lost reasons
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Section 1: Customer Lead Summary */}
            <View style={styles.leadSummaryBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.leadName}>{customerName}</Text>
                <Text style={styles.leadPhone}>📞 {phone || 'No phone'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.leadQuoteLabel}>QUOTATION</Text>
                <Text style={styles.leadQuoteVal}>
                  ₹{Number(quoteValue || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Section 2: Products Quoted */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>1. PRODUCTS QUOTED (MULTI-SELECT) *</Text>
            <View style={styles.chipsRow}>
              {PRODUCT_OPTIONS.map((prod) => {
                const isSel = selectedProducts.includes(prod);
                return (
                  <TouchableOpacity
                    key={prod}
                    style={[styles.chip, isSel && styles.chipActive]}
                    onPress={() => toggleProduct(prod)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                      {isSel ? '✓ ' : ''}{prod}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 3: Winning Competitor */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>2. WINNING COMPETITOR SHOWROOM *</Text>
            <View style={styles.chipsRow}>
              {COMMON_COMPETITORS.map((comp) => {
                const isSel = competitor === comp;
                return (
                  <TouchableOpacity
                    key={comp}
                    style={[styles.chip, isSel && styles.chipActiveCrimson]}
                    onPress={() => setCompetitor(comp)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTextActiveCrimson]}>
                      {comp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {competitor === 'Other / Custom Showroom' && (
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                value={customCompetitor}
                onChangeText={setCustomCompetitor}
                placeholder="Enter showroom or brand name..."
              />
            )}

            {/* Section 4: Price Difference & Calculated Gap */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>3. PRICE DIFFERENCE (₹)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.textInput, { flex: 1, fontWeight: '800', color: '#DC2626' }]}
                value={priceDifference}
                onChangeText={setPriceDifference}
                keyboardType="numeric"
                placeholder="e.g. 15000"
              />
              <View style={styles.gapCard}>
                <Text style={styles.gapCardPercent}>
                  {diffPercent > 0 ? `-${diffPercent}%` : '0%'}
                </Text>
                <Text style={styles.gapCardSub}>cheaper</Text>
              </View>
            </View>

            {/* Section 5: Primary Lost Reason */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>4. PRIMARY LOST REASON *</Text>
            <View style={{ gap: 6 }}>
              {COMMON_REASONS.map((r) => {
                const isSel = lostReason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonChip, isSel && styles.reasonChipActive]}
                    onPress={() => setLostReason(r)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.reasonText, isSel && styles.reasonTextActive]}>
                      {isSel ? '● ' : '○ '}{r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 6: Notes */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>5. NOTES & COMPETITOR INTELLIGENCE</Text>
            <TextInput
              style={[styles.textInput, { height: 50, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="e.g. Customer bought from Supreme Tiles due to 10% lower price..."
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>✓ Save Lost Sale</Text>
              )}
            </TouchableOpacity>
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
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  idBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  idBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  scroll: {
    marginVertical: 4,
  },
  leadSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    padding: 12,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  leadPhone: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
  leadQuoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
  },
  leadQuoteVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#991B1B',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  chipActiveCrimson: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  chipTextActiveCrimson: {
    color: '#991B1B',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  gapCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapCardPercent: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
  },
  gapCardSub: {
    fontSize: 9.5,
    color: '#991B1B',
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reasonChipActive: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  reasonTextActive: {
    color: '#991B1B',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
