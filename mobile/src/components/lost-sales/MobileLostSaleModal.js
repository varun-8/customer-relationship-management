import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';

const PRODUCT_OPTIONS = [
  'Tile',
  'Sanitary',
  'CP Fittings',
  'Adhesive / Epoxy',
  'Vanity',
  'Kitchen Sinks',
];

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

// Robust helper functions to extract customer fields across flat & nested MongoDB data structures
const extractCustomerObj = (c) => {
  if (!c) return {};
  const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
  return { ...c, ...d };
};

const extractCustomerName = (c) => {
  const d = extractCustomerObj(c);
  const name = d.customerName || d.name || d.fullName || d.clientName || c?.customerName || c?.name;
  return name && name !== 'null' && name !== 'undefined' ? String(name) : 'Customer Lead';
};

const extractPhone = (c) => {
  const d = extractCustomerObj(c);
  const ph = d.phone || d.phoneNumber || d.mobile || c?.phone || c?.customerPhone;
  return ph && ph !== 'null' && ph !== 'undefined' ? String(ph) : '';
};

const extractQuoteValue = (c) => {
  const d = extractCustomerObj(c);
  const val = d.quotationValue || d.quoteValue || d.orderValue || d.tileBudget || c?.quotationValue || c?.quoteValue || 0;
  return Number(val) || 0;
};

const extractSalesperson = (c) => {
  const d = extractCustomerObj(c);
  const val = d.salesperson || d.assignedTo || (typeof c?.createdBy === 'object' ? c.createdBy?.name : c?.createdBy) || '';
  return typeof val === 'object' ? val?.name || '' : String(val);
};

const extractProductsFromCustomer = (c) => {
  if (!c) return ['Tile'];
  const d = extractCustomerObj(c);
  const raw = d.requirement || d.requirements || d.products || d.product || d.materialRequirements || c?.requirement || c?.requirements;
  
  let productList = [];
  if (Array.isArray(raw)) {
    productList = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    productList = raw.split(',').map((x) => x.trim()).filter(Boolean);
  }

  const normalized = [];
  productList.forEach((p) => {
    const lower = String(p).toLowerCase();
    if (lower.includes('tile')) normalized.push('Tile');
    else if (lower.includes('sanitary') || lower.includes('bath')) normalized.push('Sanitary');
    else if (lower.includes('cp') || lower.includes('fitting') || lower.includes('tap')) normalized.push('CP Fittings');
    else if (lower.includes('adhesive') || lower.includes('epoxy') || lower.includes('grout')) normalized.push('Adhesive / Epoxy');
    else if (lower.includes('vanity') || lower.includes('sink')) normalized.push('Vanity');
    else normalized.push(p);
  });

  return normalized.length > 0 ? Array.from(new Set(normalized)) : ['Tile'];
};

export function MobileLostSaleModal({
  visible,
  customer,
  onClose,
  onSaved,
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [quoteValue, setQuoteValue] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(['Tile']);
  const [salesperson, setSalesperson] = useState('');
  const [lostReason, setLostReason] = useState('Price Too High / Cheaper Competitor Quote');
  const [competitor, setCompetitor] = useState('Supreme Tiles');
  const [customCompetitor, setCustomCompetitor] = useState('');
  const [priceDifference, setPriceDifference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && customer) {
      const name = extractCustomerName(customer);
      const ph = extractPhone(customer);
      const qv = extractQuoteValue(customer);
      const sp = extractSalesperson(customer);
      const prods = extractProductsFromCustomer(customer);

      setCustomerName(name);
      setPhone(ph);
      setQuoteValue(qv > 0 ? String(qv) : '');
      setSelectedProducts(prods);
      setSalesperson(sp);
      setLostReason('Price Too High / Cheaper Competitor Quote');
      setCompetitor('Supreme Tiles');
      setCustomCompetitor('');
      setPriceDifference('');
      setNotes('');
    }
  }, [visible, customer]);

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
      Alert.alert('Validation Error', 'Customer name is required.');
      return;
    }
    if (!quoteValue || Number(quoteValue) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quotation value for the lost deal.');
      return;
    }

    const finalCompetitor = competitor === 'Other / Custom Showroom' && customCompetitor.trim()
      ? customCompetitor.trim()
      : competitor;

    setSubmitting(true);
    try {
      const payload = {
        customerId: customer?.customerId || undefined,
        customerRef: customer?._id || customer?.id || undefined,
        customerName: customerName.trim(),
        phone: phone.trim() || undefined,
        quoteValue: Number(quoteValue) || 0,
        products: selectedProducts,
        salesperson: salesperson.trim() || 'Showroom Staff',
        lostReason,
        competitor: finalCompetitor || 'Unknown Dealer',
        priceDifference: Number(priceDifference) || 0,
        priceDiffPercentage: diffPercent,
        date: todayStr,
        notes: notes.trim(),
      };

      const res = await apiClient.createLostSale(payload);
      
      // Directly update customer status to Lost in MongoDB
      const custIdToUpdate = customer?._id || customer?.customerId || customer?.id;
      if (custIdToUpdate) {
        try {
          await apiClient.updateCustomer(custIdToUpdate, {
            status: 'Lost',
            lostReason,
            lostCompetitor: finalCompetitor || 'Unknown Dealer',
            lastReason: `Lost Deal to ${finalCompetitor || 'competitor'}: ${lostReason}`,
          });
        } catch (updateErr) {
          console.warn('Customer status update to Lost warning:', updateErr.message);
        }
      }

      if (res && res.success) {
        Alert.alert('✓ Lost Sale Logged', `Lost deal analysis for ${customerName} recorded. The lead status has been set to Lost.`);
        if (onSaved) onSaved();
        onClose();
      } else {
        Alert.alert(
          'Connection Issue',
          res?.message || 'Could not save lost sale report. Please check your network connection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handleSubmit },
          ]
        );
      }
    } catch (e) {
      Alert.alert(
        'Network Error',
        `Connection failed: ${e.message}. Your entries have been preserved.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleSubmit },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !customer) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Light-Themed Executive Header Bar */}
          <View style={styles.headerLight}>
            <View style={styles.headerIconBoxLight}>
              <Ionicons name="pricetag-outline" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.headerTitleLight}>Record Lost Sale & Intel</Text>
                {customer?.customerId && (
                  <View style={styles.headerIdBadgeLight}>
                    <Text style={styles.headerIdBadgeTextLight}>#{customer.customerId}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitleLight}>
                Competitor pricing gap, product leakage & root cause analysis
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseBtnLight} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ padding: 18 }}>
            {/* Auto-Fetched Lead Profile Summary Box */}
            <View style={styles.leadSummaryCard}>
              <View style={styles.leadSummaryAccentBar} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.leadNameText} numberOfLines={1}>
                  {customerName}
                </Text>
                <View style={styles.leadMetaRow}>
                  {phone ? (
                    <View style={styles.phoneChip}>
                      <Ionicons name="call-outline" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                      <Text style={styles.phoneChipText}>{phone}</Text>
                    </View>
                  ) : null}
                  {salesperson ? (
                    <View style={styles.staffChip}>
                      <Ionicons name="person-outline" size={11} color="#475569" style={{ marginRight: 3 }} />
                      <Text style={styles.staffChipText}>{salesperson}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.quoteValueBox}>
                <Text style={styles.quoteValueLabel}>DEAL QUOTATION</Text>
                <Text style={styles.quoteValueVal}>
                  ₹ {Number(quoteValue || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Section 1: Products Quoted (Fetched from Lead Form) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <Ionicons name="layers-outline" size={16} color="#DC2626" />
                <Text style={styles.sectionHeading}>1. Products Quoted (Auto-Fetched) *</Text>
              </View>
              <Text style={styles.sectionHint}>
                Extracted from customer lead requirements. Tap to modify category selection.
              </Text>

              <View style={styles.chipsRow}>
                {PRODUCT_OPTIONS.map((prod) => {
                  const isSel = selectedProducts.includes(prod);
                  return (
                    <TouchableOpacity
                      key={prod}
                      style={[styles.chipProduct, isSel && styles.chipProductActive]}
                      onPress={() => toggleProduct(prod)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipProductText, isSel && styles.chipProductTextActive]}>
                        {isSel ? '✓ ' : '+ '}{prod}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Winning Competitor */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <Ionicons name="business-outline" size={16} color="#DC2626" />
                <Text style={styles.sectionHeading}>2. Winning Competitor Showroom *</Text>
              </View>

              <View style={styles.chipsRow}>
                {COMMON_COMPETITORS.map((comp) => {
                  const isSel = competitor === comp;
                  return (
                    <TouchableOpacity
                      key={comp}
                      style={[styles.chipCompetitor, isSel && styles.chipCompetitorActive]}
                      onPress={() => setCompetitor(comp)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipCompetitorText, isSel && styles.chipCompetitorTextActive]}>
                        {comp}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {competitor === 'Other / Custom Showroom' && (
                <TextInput
                  style={[styles.textInput, { marginTop: 10 }]}
                  value={customCompetitor}
                  onChangeText={setCustomCompetitor}
                  placeholder="Enter custom showroom or brand name..."
                  placeholderTextColor="#94A3B8"
                />
              )}
            </View>

            {/* Section 3: Price Difference & Discount Gap */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <Ionicons name="trending-down-outline" size={16} color="#DC2626" />
                <Text style={styles.sectionHeading}>3. Competitor Price Gap (₹)</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={styles.priceDiffInputWrapper}>
                  <View style={styles.currencyPrefixBadge}>
                    <Text style={styles.currencyPrefixText}>₹</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { flex: 1, borderWidth: 0, fontWeight: '800', color: '#DC2626' }]}
                    value={priceDifference}
                    onChangeText={setPriceDifference}
                    keyboardType="numeric"
                    placeholder="e.g. 15000"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.gapCard}>
                  <Text style={styles.gapCardPercent}>
                    {diffPercent > 0 ? `-${diffPercent}%` : '0%'}
                  </Text>
                  <Text style={styles.gapCardSub}>cheaper</Text>
                </View>
              </View>
            </View>

            {/* Section 4: Primary Lost Reason */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.sectionHeading}>4. Primary Root Cause *</Text>
              </View>

              <View style={{ gap: 7 }}>
                {COMMON_REASONS.map((r) => {
                  const isSel = lostReason === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonChip, isSel && styles.reasonChipActive]}
                      onPress={() => setLostReason(r)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.radioDotCircle, isSel && styles.radioDotCircleActive]}>
                        {isSel && <View style={styles.radioDotInner} />}
                      </View>
                      <Text style={[styles.reasonText, isSel && styles.reasonTextActive]} numberOfLines={2}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 5: Notes & Strategic Intelligence */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color="#DC2626" />
                <Text style={styles.sectionHeading}>5. Discussion Remarks & Competitor Intel</Text>
              </View>

              <TextInput
                style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="e.g. Customer bought from Supreme Tiles due to 10% lower pricing + free transport..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                  <Text style={styles.saveBtnText}>Save Lost Sale</Text>
                </View>
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
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
    maxHeight: '92%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconBoxLight: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleLight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitleLight: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  headerIdBadgeLight: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  headerIdBadgeTextLight: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerCloseBtnLight: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    marginVertical: 0,
  },
  leadSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  leadSummaryAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#F87171',
  },
  leadNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginLeft: 6,
  },
  leadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    marginLeft: 6,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  phoneChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quoteValueBox: {
    alignItems: 'flex-end',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  quoteValueLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.4,
  },
  quoteValueVal: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  sectionHint: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipProduct: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipProductActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  chipProductText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  chipProductTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  chipCompetitor: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipCompetitorActive: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  chipCompetitorText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  chipCompetitorTextActive: {
    color: '#E11D48',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  priceDiffInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 12,
    overflow: 'hidden',
  },
  currencyPrefixBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRightWidth: 1,
    borderRightColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefixText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
  },
  gapCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapCardPercent: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  gapCardSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    textTransform: 'uppercase',
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  reasonChipActive: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  radioDotCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioDotCircleActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reasonTextActive: {
    color: '#991B1B',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: -0.2,
  },
});
