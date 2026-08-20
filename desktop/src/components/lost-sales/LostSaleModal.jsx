import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const DEFAULT_COMPETITORS = [
  'Supreme Tiles',
  'Kajaria World',
  'Local Ceramics Mart',
  'Direct Wholesaler',
  'Simpolo Showroom',
  'Somany Display Center',
  'Local Hardware Store',
];

export const LostSaleModal = ({ initialData, customer, onClose, onSaved }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Persistent Competitors List from localStorage
  const [competitorList, setCompetitorList] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_saved_competitors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved competitors:', e);
    }
    return DEFAULT_COMPETITORS;
  });

  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [showAddCompetitorInput, setShowAddCompetitorInput] = useState(false);

  const saveCompetitorList = (list) => {
    setCompetitorList(list);
    try {
      localStorage.setItem('crm_saved_competitors', JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving competitors:', e);
    }
  };

  const handleAddCompetitor = (e) => {
    e.preventDefault();
    const trimmed = newCompetitorName.trim();
    if (!trimmed) return;
    if (!competitorList.includes(trimmed)) {
      const updated = [...competitorList, trimmed];
      saveCompetitorList(updated);
    }
    setCompetitor(trimmed);
    setNewCompetitorName('');
    setShowAddCompetitorInput(false);
  };

  const handleRemoveCompetitor = (compToRemove, e) => {
    e.stopPropagation();
    if (competitorList.length <= 1) {
      alert('Must keep at least one competitor option in list.');
      return;
    }
    const updated = competitorList.filter((c) => c !== compToRemove);
    saveCompetitorList(updated);
    if (competitor === compToRemove) {
      setCompetitor(updated[0] || 'Unknown Dealer');
    }
  };

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
    initialData?.salesperson || customer?.salesperson || ''
  );
  const [staffList, setStaffList] = useState([]);

  // Fetch live staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.getUsers();
        if (res && res.success && Array.isArray(res.data)) {
          const emps = res.data.filter((u) => u.role !== 'owner' && u.active !== false);
          const names = emps.map((u) => u.name);
          setStaffList(names);
          if (!salesperson && names.length > 0) {
            setSalesperson(names[0]);
          }
        }
      } catch (e) {
        console.warn('Error loading staff in LostSaleModal:', e);
      }
    };
    fetchStaff();
  }, []);

  const [lostReason, setLostReason] = useState(initialData?.lostReason || 'Price Too High / Cheaper Competitor Quote');
  const [customReason, setCustomReason] = useState('');
  const [competitor, setCompetitor] = useState(initialData?.competitor || competitorList[0] || 'Supreme Tiles');
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
        competitor: competitor || 'Unknown Dealer',
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

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1100,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        margin: 0,
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '740px',
          width: '100%',
          maxHeight: '92vh',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          backgroundColor: '#FFFFFF',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '20px 24px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(220, 38, 38, 0.35)',
              }}
            >
              <FileX size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  {initialData ? 'Edit Lost Sale Intelligence' : 'Record Lost Sale & Competitor Intelligence'}
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
                      fontWeight: '800',
                      color: '#F87171',
                    }}
                  >
                    <Hash size={11} />
                    <span>{customerId}</span>
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Analyze winning competitor dealers, discount gaps, and reasons for lost quotes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px',
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', backgroundColor: '#F8FAFC' }}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: CUSTOMER LEAD INFO */}
            <div className="lost-section-box" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px' }}>
              <div className="lost-section-title" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#2563EB" />
                <span>1. CUSTOMER IDENTITY & QUOTATION VALUE</span>
              </div>

              {!initialData && !customer && (
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748B' }}>
                    LINK EXISTING CRM CUSTOMER (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by customer name, phone, or #ID..."
                    value={searchCrm}
                    onChange={(e) => setSearchCrm(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '12.5px' }}
                  />

                  {showCrmDropdown && crmCustomers.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '4px', overflow: 'hidden' }}>
                      {crmCustomers.map((cust) => {
                        const d = cust.data instanceof Map ? Object.fromEntries(cust.data) : (cust.data || {});
                        return (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'monospace', fontSize: '12px' }}>
                                #{cust.customerId}
                              </span>
                              <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                                {d.customerName || 'Unnamed'}
                              </span>
                            </div>
                            <span style={{ color: '#64748B', fontSize: '12px' }}>
                              📞 {d.phone || 'No phone'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="kpi-grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '700' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div className="kpi-grid-2" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Quotation Value (₹) *</label>
                  <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', fontWeight: '900', color: '#DC2626', fontSize: '15px' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 150000"
                      value={quoteValue}
                      onChange={(e) => setQuoteValue(e.target.value)}
                      required
                      min="0"
                      style={{ paddingLeft: '28px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '900', color: '#DC2626', fontSize: '15px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Lost Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '700' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRODUCTS & SALESPERSON */}
            <div className="lost-section-box" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px' }}>
              <div className="lost-section-title" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#2563EB" />
                <span>2. PRODUCT CATEGORIES & SALES STAFF</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', display: 'block' }}>Product Lines Quoted (Multi-Select) *</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRODUCT_OPTIONS.map((prod) => {
                    const isSel = selectedProducts.includes(prod);
                    return (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => toggleProduct(prod)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: isSel ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                          backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF',
                          color: isSel ? '#2563EB' : '#475569',
                          fontWeight: isSel ? '800' : '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isSel && <Check size={14} />}
                        <span>{prod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', display: 'block' }}>Sales Executive Handling Deal *</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {staffList.map((staff) => {
                    const isSel = salesperson === staff;
                    return (
                      <button
                        key={staff}
                        type="button"
                        onClick={() => setSalesperson(staff)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: isSel ? '1.5px solid #059669' : '1px solid #E2E8F0',
                          backgroundColor: isSel ? '#ECFDF5' : '#FFFFFF',
                          color: isSel ? '#059669' : '#475569',
                          fontWeight: isSel ? '800' : '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        👤 {staff}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: COMPETITOR SHOWROOM CRUD & PRICING GAP */}
            <div className="lost-section-box" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px' }}>
              <div className="lost-section-title" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} color="#EA580C" />
                <span>3. COMPETITOR SHOWROOM & PRICING GAP</span>
              </div>

              {/* Dynamic Competitor Selection & CRUD Chips */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Competitor Showroom / Winning Dealer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCompetitorInput(!showAddCompetitorInput)}
                    style={{ fontSize: '11.5px', fontWeight: '800', color: '#2563EB', background: '#EFF6FF', border: '1px solid #DBEAFE', padding: '3px 10px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    + Save New Competitor
                  </button>
                </div>

                {/* Inline Add Competitor Input */}
                {showAddCompetitorInput && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Enter new competitor dealer name (e.g. Royal Marble & Tiles)..."
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                      style={{ flex: 1, padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '12.5px' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCompetitor}
                      style={{ backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCompetitorInput(false)}
                      style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Saved Competitors Chips with Delete (x) Button */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {competitorList.map((comp) => {
                    const isSel = competitor === comp;
                    return (
                      <div
                        key={comp}
                        onClick={() => setCompetitor(comp)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: isSel ? '1.5px solid #EA580C' : '1px solid #E2E8F0',
                          backgroundColor: isSel ? '#FFF7ED' : '#FFFFFF',
                          color: isSel ? '#C2410C' : '#475569',
                          fontWeight: isSel ? '800' : '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>🏢 {comp}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCompetitor(comp, e)}
                          title="Remove saved competitor"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: isSel ? '#C2410C' : '#94A3B8',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            padding: '0 2px',
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Difference & Calculation Card */}
              <div className="kpi-grid-2" style={{ marginTop: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                    Price Difference / Competitor Discount (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', fontWeight: '900', color: '#DC2626', fontSize: '14px' }}>₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={priceDifference}
                      onChange={(e) => setPriceDifference(e.target.value)}
                      min="0"
                      style={{ width: '100%', paddingLeft: '28px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: '800', color: '#DC2626' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    How much lower was the competitor's quote?
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Pricing Gap Analysis</label>
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingDown size={22} color="#DC2626" />
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '15px', color: '#991B1B' }}>
                        {diffPercent > 0 ? `${diffPercent}% lower quote` : '0% price gap'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#7F1D1D', fontWeight: '600' }}>
                        {numDiff > 0 ? `₹${numDiff.toLocaleString('en-IN')} competitor price discount` : 'Enter price difference above'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: ROOT CAUSE & NOTES */}
            <div className="lost-section-box" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '18px' }}>
              <div className="lost-section-title" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} color="#991B1B" />
                <span>4. ROOT CAUSE & COMPETITOR INTEL REMARKS</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '6px', display: 'block' }}>Primary Lost Reason *</label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    paddingRight: '36px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23475569' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
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
                    style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1' }}
                    required
                  />
                )}
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '6px', display: 'block' }}>Discussion Remarks & Intel Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Customer liked our design but Supreme Tiles offered 10% lower bill + free site delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '12.5px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ borderRadius: '10px', padding: '8px 18px', fontWeight: '700' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '800',
                padding: '9px 22px',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              {saving ? 'Recording...' : initialData ? 'Update Lost Sale' : '✓ Save Lost Sale Analysis'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
