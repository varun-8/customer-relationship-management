import React, { useState, useEffect } from 'react';
import {
  X,
  FileX,
  IndianRupee,
  Users,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Tag,
  Check,
  TrendingDown,
  Info,
  Hash,
  User,
} from 'lucide-react';
import { api } from '../../services/api';

const PRODUCT_OPTIONS = ['Tile', 'Sanitary', 'CP', 'Adhesive', 'Vanity', 'Kitchen Sink', 'Fittings'];

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
  'Somany Display Center',
  'Local Hardware Store',
];

const STAFF_MEMBERS = ['Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar', 'Showroom Staff'];

export const LostSaleModal = ({ initialData, customer, onClose, onSaved }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState(initialData?.customerName || customer?.customerName || '');
  const [phone, setPhone] = useState(initialData?.phone || customer?.phone || '');
  const [customerId, setCustomerId] = useState(initialData?.customerId || customer?.customerId || '');
  const [quoteValue, setQuoteValue] = useState(
    initialData?.quoteValue !== undefined
      ? String(initialData.quoteValue)
      : customer?.quotationValue
      ? String(customer.quotationValue)
      : ''
  );
  const [selectedProducts, setSelectedProducts] = useState(
    initialData?.products || (customer?.requirement ? (Array.isArray(customer.requirement) ? customer.requirement : [customer.requirement]) : ['Tile'])
  );
  const [salesperson, setSalesperson] = useState(
    initialData?.salesperson || customer?.salesperson || 'Karthik Raja'
  );
  const [lostReason, setLostReason] = useState(initialData?.lostReason || 'Price Too High / Cheaper Competitor Quote');
  const [customReason, setCustomReason] = useState('');
  const [competitor, setCompetitor] = useState(initialData?.competitor || 'Supreme Tiles');
  const [customCompetitor, setCustomCompetitor] = useState('');
  const [priceDifference, setPriceDifference] = useState(
    initialData?.priceDifference !== undefined ? String(initialData.priceDifference) : ''
  );
  const [date, setDate] = useState(initialData?.dateString || todayStr);
  const [notes, setNotes] = useState(initialData?.notes || '');

  // CRM Search state
  const [crmCustomers, setCrmCustomers] = useState([]);
  const [searchCrm, setSearchCrm] = useState('');
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Search existing CRM customers
  useEffect(() => {
    if (!searchCrm.trim() || searchCrm.length < 2) {
      setCrmCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingCrm(true);
      try {
        const res = await api.getCustomers({ search: searchCrm.trim(), limit: 5 });
        const list = res.customers || res.data || [];
        setCrmCustomers(list);
        setShowCrmDropdown(true);
      } catch (err) {
        console.warn('CRM search error:', err);
      } finally {
        setLoadingCrm(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCrm]);

  const handleSelectCustomer = (cust) => {
    const d = cust.data instanceof Map ? Object.fromEntries(cust.data) : (cust.data || {});
    setCustomerId(cust.customerId || '');
    setCustomerName(d.customerName || 'Unnamed');
    setPhone(d.phone || '');
    if (d.quotationValue || d.orderValue || d.tileBudget) {
      setQuoteValue(String(d.quotationValue || d.orderValue || d.tileBudget));
    }
    if (d.salesperson) {
      setSalesperson(d.salesperson);
    }
    if (d.requirement) {
      const reqStr = Array.isArray(d.requirement) ? d.requirement.join(' ') : String(d.requirement);
      const matched = PRODUCT_OPTIONS.find((p) => reqStr.toLowerCase().includes(p.toLowerCase()));
      if (matched && !selectedProducts.includes(matched)) {
        setSelectedProducts([...selectedProducts, matched]);
      }
    }
    setSearchCrm('');
    setShowCrmDropdown(false);
  };

  const toggleProduct = (prod) => {
    if (selectedProducts.includes(prod)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter((p) => p !== prod));
      }
    } else {
      setSelectedProducts([...selectedProducts, prod]);
    }
  };

  // Calculated percentage difference
  const numQuote = Number(quoteValue) || 0;
  const numDiff = Number(priceDifference) || 0;
  const diffPercent = numQuote > 0 && numDiff > 0 ? Number(((numDiff / numQuote) * 100).toFixed(1)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!quoteValue || Number(quoteValue) <= 0) {
      setError('Please enter a valid quotation value');
      return;
    }
    if (!salesperson.trim()) {
      setError('Salesperson is required');
      return;
    }

    const finalReason = lostReason === 'Other / Custom Reason' && customReason.trim() ? customReason.trim() : lostReason;
    const finalCompetitor = competitor === 'Other' && customCompetitor.trim() ? customCompetitor.trim() : competitor;

    setSaving(true);
    try {
      const payload = {
        customerId: customerId || undefined,
        customerName: customerName.trim(),
        phone: phone.trim() || undefined,
        quoteValue: Number(quoteValue) || 0,
        products: selectedProducts,
        salesperson: salesperson.trim(),
        lostReason: finalReason,
        competitor: finalCompetitor || 'Unknown Dealer',
        priceDifference: Number(priceDifference) || 0,
        priceDiffPercentage: diffPercent,
        date,
        notes: notes.trim(),
      };

      if (initialData?._id) {
        await api.updateLostSale(initialData._id, payload);
      } else {
        await api.createLostSale(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving lost sale:', err);
      setError(err.message || 'Failed to record lost sale');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '720px',
          width: '95%',
          maxHeight: '92vh',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rich Crimson Gradient Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '18px 24px',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              <FileX size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  {initialData ? 'Edit Lost Sale Analysis' : 'Record Lost Sale & Competitor Intelligence'}
                </h3>
                {customerId && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#F87171',
                    }}
                  >
                    <Hash size={11} />
                    <span>{customerId}</span>
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Track competitor pricing gaps, product leakage, and root causes for lost quotations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body with Distinct Sections */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div className="kpi-alert-danger">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Quick CRM Lookup Bar */}
            {!initialData && !customer && (
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>
                  ✨ QUICK POPULATE FROM CRM LEAD (OPTIONAL):
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by customer name, phone, or ID (e.g. #CUS-1002)..."
                    value={searchCrm}
                    onChange={(e) => setSearchCrm(e.target.value)}
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
                  />
                  {loadingCrm && (
                    <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '11px', color: '#64748B' }}>
                      Searching...
                    </span>
                  )}
                </div>

                {showCrmDropdown && crmCustomers.length > 0 && (
                  <div className="lost-crm-search-dropdown">
                    {crmCustomers.map((cust) => {
                      const d = cust.data instanceof Map ? Object.fromEntries(cust.data) : (cust.data || {});
                      return (
                        <div
                          key={cust._id || cust.customerId}
                          className="lost-crm-search-item"
                          onClick={() => handleSelectCustomer(cust)}
                        >
                          <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'monospace' }}>
                            #{cust.customerId}
                          </span>
                          <span style={{ fontWeight: '700', color: '#0F172A' }}>
                            {d.customerName || 'Unnamed'}
                          </span>
                          <span style={{ color: '#64748B', fontSize: '11.5px' }}>
                            📞 {d.phone || 'No phone'}
                          </span>
                          {d.quotationValue && (
                            <span style={{ fontWeight: '800', color: '#059669', marginLeft: 'auto' }}>
                              ₹{Number(d.quotationValue).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 1: CUSTOMER & QUOTATION VALUE */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#DC2626" />
                  <span>1. CUSTOMER & QUOTATION VALUE</span>
                </div>
                {customerId && <span className="lost-id-tag">#{customerId}</span>}
              </div>

              <div className="kpi-grid-2">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="kpi-grid-2" style={{ marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Quotation Value (₹) *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-currency-tag">₹</span>
                    <input
                      type="number"
                      className="form-input form-input-with-currency"
                      placeholder="e.g. 150000"
                      value={quoteValue}
                      onChange={(e) => setQuoteValue(e.target.value)}
                      required
                      min="0"
                      style={{ fontWeight: '900', color: '#DC2626', fontSize: '15px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lost Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ fontWeight: '700' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRODUCTS & SALESPERSON */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#2563EB" />
                  <span>2. PRODUCT CATEGORIES & SALES STAFF</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Lines Quoted (Multi-Select) *</label>
                <div className="lost-product-chips-grid">
                  {PRODUCT_OPTIONS.map((prod) => {
                    const isSel = selectedProducts.includes(prod);
                    return (
                      <button
                        key={prod}
                        type="button"
                        className={`lost-prod-chip ${isSel ? 'lost-prod-chip-active' : ''}`}
                        onClick={() => toggleProduct(prod)}
                      >
                        {isSel && <Check size={14} style={{ marginRight: '4px' }} />}
                        <span>{prod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Salesperson Handling Deal *</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {STAFF_MEMBERS.map((staff) => {
                    const isSel = salesperson === staff;
                    return (
                      <button
                        key={staff}
                        type="button"
                        className={`kpi-chip-pill ${isSel ? 'kpi-chip-pill-active' : ''}`}
                        onClick={() => setSalesperson(staff)}
                      >
                        {staff}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: COMPETITOR & PRICING GAP */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} color="#EA580C" />
                  <span>3. COMPETITOR SHOWROOM & PRICING GAP</span>
                </div>
              </div>

              {/* Competitor Showroom */}
              <div className="form-group">
                <label className="form-label">Competitor Showroom / Winning Dealer *</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {COMMON_COMPETITORS.map((comp) => {
                    const isSel = competitor === comp;
                    return (
                      <button
                        key={comp}
                        type="button"
                        className={`lost-comp-chip ${isSel ? 'lost-comp-chip-active' : ''}`}
                        onClick={() => {
                          setCompetitor(comp);
                          setCustomCompetitor('');
                        }}
                      >
                        {comp}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className={`lost-comp-chip ${competitor === 'Other' ? 'lost-comp-chip-active' : ''}`}
                    onClick={() => setCompetitor('Other')}
                  >
                    + Custom Competitor
                  </button>
                </div>

                {competitor === 'Other' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter competitor showroom or brand name..."
                    value={customCompetitor}
                    onChange={(e) => setCustomCompetitor(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Price Difference */}
              <div className="kpi-grid-2" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price Difference / Competitor Discount (₹)</label>
                  <div className="input-icon-wrapper">
                    <span className="input-currency-tag">₹</span>
                    <input
                      type="number"
                      className="form-input form-input-with-currency"
                      placeholder="e.g. 15000"
                      value={priceDifference}
                      onChange={(e) => setPriceDifference(e.target.value)}
                      min="0"
                    />
                  </div>
                  <span className="kpi-field-hint">
                    How much lower was the competitor quote?
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Calculated Pricing Gap</label>
                  <div className="lost-gap-display-box">
                    <TrendingDown size={20} color="#DC2626" />
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '15px', color: '#991B1B' }}>
                        {diffPercent > 0 ? `${diffPercent}% cheaper` : '0%'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {numDiff > 0 ? `₹${numDiff.toLocaleString('en-IN')} lower price` : 'No price gap entered'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: ROOT CAUSE & NOTES */}
            <div className="lost-section-box">
              <div className="lost-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} color="#991B1B" />
                  <span>4. ROOT CAUSE & INTELLIGENCE NOTES</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Lost Reason *</label>
                <select
                  className="form-select"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  style={{ fontWeight: '700', fontSize: '13px' }}
                >
                  {COMMON_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {lostReason === 'Other / Custom Reason' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Specify the exact reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    style={{ marginTop: '8px' }}
                    required
                  />
                )}
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Discussion Remarks & Competitor Intel</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="e.g. Customer liked our design but Supreme Tiles offered 10% lower bill + free site delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ fontSize: '12.5px' }}
                />
              </div>
            </div>
          </div>

          {/* Sticky Modal Action Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                fontWeight: '800',
                padding: '8px 20px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              {saving ? 'Recording...' : initialData ? 'Update Lost Sale' : '✓ Save Lost Sale Analysis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
