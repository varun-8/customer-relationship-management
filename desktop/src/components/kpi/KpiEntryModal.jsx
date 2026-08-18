import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  User,
  Users,
  FileText,
  CheckCircle,
  PhoneCall,
  Receipt,
  IndianRupee,
  ShoppingBag,
  HardHat,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';

const STAFF_MEMBERS = [
  'Karthik Raja',
  'Senthil Kumar',
  'Priya Dharshini',
  'Manoj Kumar',
  'Showroom Team',
];

const CROSS_SELL_SUGGESTIONS = [
  'Tile Adhesive',
  'Epoxy Grout',
  'Tile Spacers',
  'Waterproofing',
  'Bath Fittings',
  'Kitchen Sinks',
  'Vanity Units',
  'Sanitary Wares',
];

export const KpiEntryModal = ({ initialData, onClose, onSaved }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initialData?.dateString || todayStr);
  const [staffName, setStaffName] = useState(initialData?.staffName || 'Karthik Raja');

  // Walk-ins Funnel
  const [visits, setVisits] = useState(initialData?.walkins?.visits ?? 0);
  const [quotes, setQuotes] = useState(initialData?.walkins?.quotes ?? 0);
  const [walkinOrders, setWalkinOrders] = useState(initialData?.walkins?.orders ?? 0);

  // Follow-ups & Orders
  const [followUpsCount, setFollowUpsCount] = useState(initialData?.followUpsCount ?? 0);
  const [ordersCount, setOrdersCount] = useState(initialData?.ordersCount ?? 0);
  const [salesValue, setSalesValue] = useState(initialData?.salesValue ?? 0);

  // Old Customers (Yes / No)
  const [oldCustomers, setOldCustomers] = useState(initialData?.oldCustomers ?? false);
  const [oldCustomersCount, setOldCustomersCount] = useState(initialData?.oldCustomersCount ?? 0);
  const [oldCustomerNotes, setOldCustomerNotes] = useState(initialData?.oldCustomerNotes || '');

  // Engineer Calls (Yes / No)
  const [engineerCalls, setEngineerCalls] = useState(initialData?.engineerCalls ?? false);
  const [engineerCallsCount, setEngineerCallsCount] = useState(initialData?.engineerCallsCount ?? 0);
  const [engineerNotes, setEngineerNotes] = useState(initialData?.engineerNotes || '');

  // Cross-sell (Yes / No)
  const [crossSell, setCrossSell] = useState(initialData?.crossSell ?? false);
  const [crossSellItems, setCrossSellItems] = useState(initialData?.crossSellItems || []);
  const [crossSellNotes, setCrossSellNotes] = useState(initialData?.crossSellNotes || '');

  // General Notes
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [loading, setLoading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Live Conversion Rate
  const conversionRate = visits > 0 ? ((walkinOrders / visits) * 100).toFixed(1) : 0;
  const quoteRate = visits > 0 ? ((quotes / visits) * 100).toFixed(1) : 0;

  const handleAutoFill = async () => {
    setAutoFilling(true);
    setAutoFillMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.getKPIAutoFill({ date, staffName });
      if (res.success && res.data) {
        const auto = res.data.autoValues;
        setVisits(auto.walkins.visits);
        setQuotes(auto.walkins.quotes);
        setWalkinOrders(auto.walkins.orders);
        setFollowUpsCount(auto.followUpsCount);
        setOrdersCount(auto.ordersCount);
        setSalesValue(auto.salesValue);

        if (auto.oldCustomers) {
          setOldCustomers(true);
          setOldCustomersCount(auto.oldCustomersCount);
        }
        if (auto.engineerCalls) {
          setEngineerCalls(true);
          setEngineerCallsCount(auto.engineerCallsCount);
        }
        if (auto.crossSell) {
          setCrossSell(true);
          setCrossSellItems(auto.crossSellItems);
        }

        setAutoFillMsg(`✨ Pulled metrics from ${res.data.matchedCustomersCount} CRM record(s) on ${date}`);
      }
    } catch (e) {
      setErrorMsg(e.message || 'Could not auto-calculate metrics');
    } finally {
      setAutoFilling(false);
    }
  };

  const toggleCrossSellItem = (item) => {
    if (crossSellItems.includes(item)) {
      setCrossSellItems(crossSellItems.filter((i) => i !== item));
    } else {
      setCrossSellItems([...crossSellItems, item]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      date,
      staffName,
      walkins: {
        visits: Number(visits) || 0,
        quotes: Number(quotes) || 0,
        orders: Number(walkinOrders) || 0,
      },
      followUpsCount: Number(followUpsCount) || 0,
      ordersCount: Number(ordersCount) || 0,
      salesValue: Number(salesValue) || 0,
      oldCustomers: Boolean(oldCustomers),
      oldCustomersCount: oldCustomers ? (Number(oldCustomersCount) || 1) : 0,
      oldCustomerNotes,
      engineerCalls: Boolean(engineerCalls),
      engineerCallsCount: engineerCalls ? (Number(engineerCallsCount) || 1) : 0,
      engineerNotes,
      crossSell: Boolean(crossSell),
      crossSellItems: crossSell ? crossSellItems : [],
      crossSellNotes,
      notes,
    };

    try {
      const res = await api.createOrUpdateKPI(payload);
      if (res.success) {
        onSaved?.(res.data);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save KPI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content kpi-entry-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> {initialData ? 'Edit Daily KPI Log' : 'Log Daily KPI Record'}
            </h2>
            <p className="modal-subtitle">
              Showroom Footfalls, Quotation Funnel, Follow-ups, and Daily Sales Value
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Auto Fill Quick Action Banner */}
        <div className="kpi-autofill-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="kpi-autofill-icon">
              <Sparkles size={18} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                Auto-Calculate from CRM Activity
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                Pre-fill footfalls, confirmed orders, and quotation sums from live CRM customer logs
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleAutoFill}
            disabled={autoFilling}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF' }}
          >
            <Sparkles size={14} color="#2563EB" />
            <span>{autoFilling ? 'Calculating...' : '✨ Auto-Fill'}</span>
          </button>
        </div>

        {autoFillMsg && (
          <div className="kpi-alert-success" style={{ margin: '0 24px 16px' }}>
            <CheckCircle size={15} />
            <span>{autoFillMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="kpi-alert-danger" style={{ margin: '0 24px 16px' }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body kpi-modal-body" style={{ maxHeight: 'calc(80vh - 160px)', overflowY: 'auto' }}>
            {/* 1. Date & 2. Staff */}
            <div className="kpi-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#0F766E" />
                  <span>1. Date <span style={{ color: 'var(--color-danger)' }}>*</span></span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#0F766E" />
                  <span>2. Staff Member <span style={{ color: 'var(--color-danger)' }}>*</span></span>
                </label>
                <select
                  className="form-select"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                >
                  {STAFF_MEMBERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Walk-ins Funnel (Visits -> Quotes -> Orders) */}
            <div className="kpi-section-box">
              <div className="kpi-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#2563EB" />
                  <span>3. Walk-ins Funnel (Showroom Footfall)</span>
                </div>
                <div className="kpi-badge-conversion">
                  <span>Conversion: </span>
                  <strong>{conversionRate}%</strong>
                </div>
              </div>

              <div className="kpi-grid-3">
                <div className="form-group">
                  <label className="form-label">
                    Visits (Total Footfall)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={visits}
                    onChange={(e) => setVisits(e.target.value)}
                  />
                  <span className="kpi-field-hint">Customers walked in</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Quotes Given
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={quotes}
                    onChange={(e) => setQuotes(e.target.value)}
                  />
                  <span className="kpi-field-hint">{quoteRate}% quote rate</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Orders Closed (Sales)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={walkinOrders}
                    onChange={(e) => setWalkinOrders(e.target.value)}
                  />
                  <span className="kpi-field-hint">{conversionRate}% conversion</span>
                </div>
              </div>
            </div>

            {/* 4. Follow-ups, 5. Orders (Bills), 6. Sales Value */}
            <div className="kpi-grid-3" style={{ marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall size={14} color="#059669" />
                  <span>4. Follow-ups Completed</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={followUpsCount}
                  onChange={(e) => setFollowUpsCount(e.target.value)}
                />
                <span className="kpi-field-hint">Calls / Chats logged today</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} color="#D97706" />
                  <span>5. Orders (No. of Bills)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={ordersCount}
                  onChange={(e) => setOrdersCount(e.target.value)}
                />
                <span className="kpi-field-hint">Invoices closed today</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={14} color="#059669" />
                  <span>6. Sales Value (₹ Total Bill)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="₹ 0.00"
                  value={salesValue}
                  onChange={(e) => setSalesValue(e.target.value)}
                  style={{ fontWeight: '800', color: '#0F766E' }}
                />
                <span className="kpi-field-hint">Total revenue in INR</span>
              </div>
            </div>

            {/* 7. Old Customers (Yes / No) */}
            <div className="kpi-toggle-card">
              <div className="kpi-toggle-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={16} color="#7C3AED" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                      7. Old / Repeat Customers
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Were existing or repeat customers served today?
                    </div>
                  </div>
                </div>

                <div className="kpi-segmented-control">
                  <button
                    type="button"
                    className={`kpi-seg-btn ${oldCustomers ? 'kpi-seg-btn-active' : ''}`}
                    onClick={() => setOldCustomers(true)}
                  >
                    ✓ Yes
                  </button>
                  <button
                    type="button"
                    className={`kpi-seg-btn ${!oldCustomers ? 'kpi-seg-btn-inactive' : ''}`}
                    onClick={() => setOldCustomers(false)}
                  >
                    ✕ No
                  </button>
                </div>
              </div>

              {oldCustomers && (
                <div className="kpi-toggle-details">
                  <div className="kpi-grid-2">
                    <div className="form-group">
                      <label className="form-label">No. of Repeat Clients</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="1"
                        value={oldCustomersCount}
                        onChange={(e) => setOldCustomersCount(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Client Notes / Feedback</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Regular contractor repeat order"
                        value={oldCustomerNotes}
                        onChange={(e) => setOldCustomerNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 8. Engineer Calls (Yes / No) */}
            <div className="kpi-toggle-card">
              <div className="kpi-toggle-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardHat size={16} color="#EA580C" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                      8. Engineer / Architect Calls
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Site visits, calls, or meetings with site engineers and architects
                    </div>
                  </div>
                </div>

                <div className="kpi-segmented-control">
                  <button
                    type="button"
                    className={`kpi-seg-btn ${engineerCalls ? 'kpi-seg-btn-active' : ''}`}
                    onClick={() => setEngineerCalls(true)}
                  >
                    ✓ Yes
                  </button>
                  <button
                    type="button"
                    className={`kpi-seg-btn ${!engineerCalls ? 'kpi-seg-btn-inactive' : ''}`}
                    onClick={() => setEngineerCalls(false)}
                  >
                    ✕ No
                  </button>
                </div>
              </div>

              {engineerCalls && (
                <div className="kpi-toggle-details">
                  <div className="kpi-grid-2">
                    <div className="form-group">
                      <label className="form-label">No. of Interactions</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="1"
                        value={engineerCallsCount}
                        onChange={(e) => setEngineerCallsCount(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Project / Engineer Notes</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Er. Vignesh project site consultation"
                        value={engineerNotes}
                        onChange={(e) => setEngineerNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 9. Cross-sell (Yes / No) */}
            <div className="kpi-toggle-card">
              <div className="kpi-toggle-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#059669" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                      9. Cross-Sell Achieved
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Adhesive, epoxy grout, spacers, bath fittings, kitchen sinks
                    </div>
                  </div>
                </div>

                <div className="kpi-segmented-control">
                  <button
                    type="button"
                    className={`kpi-seg-btn ${crossSell ? 'kpi-seg-btn-active' : ''}`}
                    onClick={() => setCrossSell(true)}
                  >
                    ✓ Yes
                  </button>
                  <button
                    type="button"
                    className={`kpi-seg-btn ${!crossSell ? 'kpi-seg-btn-inactive' : ''}`}
                    onClick={() => setCrossSell(false)}
                  >
                    ✕ No
                  </button>
                </div>
              </div>

              {crossSell && (
                <div className="kpi-toggle-details">
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Select Cross-Sold Products:
                  </label>
                  <div className="kpi-chips-wrap">
                    {CROSS_SELL_SUGGESTIONS.map((item) => {
                      const isSelected = crossSellItems.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          className={`kpi-chip-pill ${isSelected ? 'kpi-chip-pill-active' : ''}`}
                          onClick={() => toggleCrossSellItem(item)}
                        >
                          {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Cross-sell Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 10 bags Roff tile adhesive + 5kg epoxy grout"
                      value={crossSellNotes}
                      onChange={(e) => setCrossSellNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* General Notes */}
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">
                Daily Remarks & Showroom Observations
              </label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Key highlights, lost sales reasons, stock shortage notes, or customer feedback..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '160px' }}>
              {loading ? 'Saving...' : '✓ Save Daily KPI Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
