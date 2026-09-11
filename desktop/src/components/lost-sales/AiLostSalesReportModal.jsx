import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  History,
  TrendingUp,
  ShieldAlert,
  Target,
  FileText,
  Lightbulb,
  Award,
  ChevronRight,
  RefreshCw,
  Clock,
  Building2,
  IndianRupee,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';

export const AiLostSalesReportModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'viewer' | 'history'
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [currentReport, setCurrentReport] = useState(null);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);

  // Fetch report quota status (monthly/yearly lock status)
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      setError(null);
      const res = await api.getAiReportStatus();
      if (res && res.success) {
        setStatus(res.data);
      } else {
        setError(res?.message || 'Unable to check AI report quota.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error checking AI report quota');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch historical saved reports
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getAiReportsHistory();
      if (res && res.success && Array.isArray(res.data)) {
        setReportsHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load reports history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  // Handle generation
  const handleGenerate = async (reportType) => {
    try {
      setGenerating(true);
      setError(null);
      const res = await api.generateAiReport(reportType);
      if (res && res.success && res.data) {
        setCurrentReport(res.data);
        setActiveTab('viewer');
        // Refresh locks & history
        fetchStatus();
        fetchHistory();
      } else {
        setError(res?.message || 'Failed to generate AI report');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to generate AI strategic report';
      setError(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  // View archived report
  const handleViewArchivedReport = (report) => {
    setCurrentReport(report);
    setActiveTab('viewer');
  };

  // Print / Save as PDF handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                  AI Lost Sales Strategic Intelligence
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(124, 58, 237, 0.25)',
                    color: '#C4B5FD',
                    border: '1px solid rgba(167, 139, 250, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}
                >
                  Executive Edition
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '3px 0 0' }}>
                Deep competitive insights, root cause patterns, and strategic quotation enhancements (strictly confidential).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#CBD5E1'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'generate' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'generate' ? '#7C3AED' : '#64748B',
                fontWeight: activeTab === 'generate' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'generate' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Sparkles size={15} />
              <span>Generate Report</span>
            </button>

            {currentReport && (
              <button
                type="button"
                onClick={() => setActiveTab('viewer')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeTab === 'viewer' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'viewer' ? '#7C3AED' : '#64748B',
                  fontWeight: activeTab === 'viewer' ? '800' : '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: activeTab === 'viewer' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <FileText size={15} />
                <span>Active Report ({currentReport.period})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'history' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'history' ? '#7C3AED' : '#64748B',
                fontWeight: activeTab === 'history' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'history' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <History size={15} />
              <span>Archived Reports ({reportsHistory.length})</span>
            </button>
          </div>

          {activeTab === 'viewer' && currentReport && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1.2px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  color: '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#92400E' }}>
                  {error.toLowerCase().includes('api key') ? 'Gemini API Key Required for AI Intelligence' : 'AI Generation Notice'}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#B45309', lineHeight: 1.5 }}>
                  {error}
                </p>
                {error.toLowerCase().includes('api key') && (
                  <div style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#78350F', marginBottom: '6px' }}>
                      🔑 How to configure your Gemini API Key in 30 seconds:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
                      <li>
                        Get a free API key from{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563EB', fontWeight: '700', textDecoration: 'underline' }}
                        >
                          Google AI Studio (aistudio.google.com)
                        </a>
                      </li>
                      <li>In the CRM, open <strong>Settings</strong> from the left navigation sidebar.</li>
                      <li>Switch to the <strong>Developer Mode</strong> tab and enter your key under <strong>AI Configuration</strong>.</li>
                      <li>Click <strong>Save AI Configuration</strong> and return here to generate your report.</li>
                    </ol>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#B45309',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* TAB 1: GENERATE REPORT */}
          {activeTab === 'generate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quota & Generation Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
                {/* Monthly Report Card */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1.5px solid #E2E8F0',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #7C3AED, #6366F1)',
                    }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            Monthly Strategic Report
                          </h3>
                          <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>
                            Period: {status?.monthly?.currentPeriod || 'Current Month'}
                          </span>
                        </div>
                      </div>

                      {status?.monthly?.generated ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Lock size={12} />
                          Locked (1 / mo)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Available
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                      Synthesizes all lost deals, pricing variances, and competitor displacements for the current month. Identifies prompt service fixes and proposal inclusions.
                    </p>

                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px 14px', border: '1px solid #F1F5F9', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                        <span>Generation Quota:</span>
                        <strong style={{ color: '#0F172A' }}>Once per calendar month</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                        <span>Next unlocked on:</span>
                        <strong style={{ color: '#0F172A' }}>{status?.monthly?.nextAvailable || 'Next Month'}</strong>
                      </div>
                    </div>
                  </div>

                  {status?.monthly?.generated ? (
                    <button
                      type="button"
                      onClick={() => handleViewArchivedReport(status.monthly.existingReport)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <FileText size={15} color="#7C3AED" />
                      <span>View Generated {status.monthly.currentPeriod} Report</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => handleGenerate('monthly')}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                        opacity: generating ? 0.7 : 1,
                      }}
                    >
                      {generating ? (
                        <>
                          <RefreshCw size={15} className="spin" />
                          <span>Analyzing Lost Deals with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Generate {status?.monthly?.currentPeriod || 'Monthly'} Report</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Yearly Strategic Report Card */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1.5px solid #E2E8F0',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #2563EB, #38BDF8)',
                    }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Award size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            Yearly Comprehensive Audit
                          </h3>
                          <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>
                            Period: Year {status?.yearly?.currentPeriod || new Date().getFullYear()}
                          </span>
                        </div>
                      </div>

                      {status?.yearly?.generated ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Lock size={12} />
                          Locked (1 / yr)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Available
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                      Macro-level competitive review across 12 months. Dissects annual revenue leakages, market shifts, competitor pricing wars, and showroom service overhauls.
                    </p>

                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px 14px', border: '1px solid #F1F5F9', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                        <span>Generation Quota:</span>
                        <strong style={{ color: '#0F172A' }}>Once per calendar year</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                        <span>Next unlocked on:</span>
                        <strong style={{ color: '#0F172A' }}>{status?.yearly?.nextAvailable || 'Next Year'}</strong>
                      </div>
                    </div>
                  </div>

                  {status?.yearly?.generated ? (
                    <button
                      type="button"
                      onClick={() => handleViewArchivedReport(status.yearly.existingReport)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <FileText size={15} color="#2563EB" />
                      <span>View Generated Year {status.yearly.currentPeriod} Audit</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => handleGenerate('yearly')}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                        opacity: generating ? 0.7 : 1,
                      }}
                    >
                      {generating ? (
                        <>
                          <RefreshCw size={15} className="spin" />
                          <span>Synthesizing Annual Audit with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Generate Year {status?.yearly?.currentPeriod || new Date().getFullYear()} Audit</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Intelligence Standards & Privacy Box */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Strict Privacy & Strategic Aggregation Standard
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0', lineHeight: 1.4 }}>
                    To ensure client privacy and provide executive clarity, raw customer names and phone numbers are completely omitted from the generated reports. The AI synthesizes underlying commercial patterns, competitor strengths, and actionable sales tactics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE REPORT VIEWER */}
          {activeTab === 'viewer' && currentReport && (
            <div
              id="printable-ai-report"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #E2E8F0',
                padding: '28px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              {/* Report Title & Metadata Banner */}
              <div style={{ borderBottom: '2px solid #F1F5F9', paddingBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: currentReport.reportType === 'monthly' ? '#F3E8FF' : '#EFF6FF', color: currentReport.reportType === 'monthly' ? '#7C3AED' : '#2563EB', padding: '3px 9px', borderRadius: '8px' }}>
                      {currentReport.reportType.toUpperCase()} REPORT
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                      Period: <strong>{currentReport.period}</strong>
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Generated: {new Date(currentReport.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    {currentReport.title || 'Executive Lost Sales Strategic Analysis'}
                  </h1>
                </div>

                {/* Scorecards */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', padding: '8px 14px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: '#991B1B' }}>Lost Revenue</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#DC2626', marginTop: '2px' }}>
                      ₹{(currentReport.metrics?.totalLostValue || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 14px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: '#64748B' }}>Deals Analyzed</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>
                      {currentReport.metrics?.totalLostDeals || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Card */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Executive Briefing
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  {currentReport.summary}
                </p>
              </div>

              {/* Section 1: Root Causes of Customer Losses */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Target size={18} color="#DC2626" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    1. Root Causes Behind Customer Losses
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {(currentReport.content?.rootCauses || []).map((rc, idx) => (
                    <div key={idx} style={{ backgroundColor: '#FFFFFF', border: '1.2px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>{rc.reason}</strong>
                        {rc.percentage && (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 7px', borderRadius: '6px' }}>
                            {rc.percentage}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                        {rc.analysis}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Competitor Intelligence & Counter-Strategies */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={18} color="#EA580C" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    2. Competitor Advantage & Recommended Counter-Strategies
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(currentReport.content?.competitorAnalysis || []).map((comp, idx) => (
                    <div key={idx} style={{ backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '12px', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA580C' }} />
                          <strong style={{ fontSize: '14px', color: '#9A3412' }}>{comp.competitor}</strong>
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#C2410C', fontWeight: '700' }}>
                          {comp.observedStrength}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#7C2D12', lineHeight: 1.5 }}>
                        <strong>Counter-Strategy:</strong> {comp.counterStrategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Service Improvements to Outperform Competitors */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <TrendingUp size={18} color="#2563EB" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    3. Service Enhancements to Outperform Competitors
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {(currentReport.content?.serviceImprovements || []).map((si, idx) => (
                    <div key={idx} style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13.5px', color: '#1E40AF' }}>{si.area}</strong>
                        {si.impact && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: '#2563EB', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '6px' }}>
                            {si.impact} IMPACT
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#1E3A8A', lineHeight: 1.45, margin: 0 }}>
                        {si.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: What Must Be Included in Future Proposals / Quotations */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    4. Essential Inclusions for Future Quotations & Proposals
                  </h3>
                </div>
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(currentReport.content?.proposalInclusions || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: '13px', color: '#14532D', lineHeight: 1.5, fontWeight: '600' }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 5: Priority Action Roadmap */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Lightbulb size={18} color="#7C3AED" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    5. Strategic Action Roadmap
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {(currentReport.content?.actionRoadmap || []).map((action, idx) => (
                    <div key={idx} style={{ backgroundColor: '#F8FAFC', border: '1.2px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.45, fontWeight: '600' }}>
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ARCHIVE & HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Archived Strategic Intelligence Reports
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                  {reportsHistory.length} saved reports available for re-inspection
                </span>
              </div>

              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading report archive...</div>
                </div>
              ) : reportsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <FileText size={36} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    No Reports Generated Yet
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 16px' }}>
                    Generate your first Monthly or Yearly report to begin archiving executive intelligence.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('generate')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Generate Monthly Report
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                  {reportsHistory.map((rep) => (
                    <div
                      key={rep._id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1.2px solid #E2E8F0',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              backgroundColor: rep.reportType === 'monthly' ? '#F3E8FF' : '#EFF6FF',
                              color: rep.reportType === 'monthly' ? '#7C3AED' : '#2563EB',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {rep.reportType}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                            {new Date(rep.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px' }}>
                          {rep.title || `Report for ${rep.period}`}
                        </h4>
                        <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.45, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {rep.summary}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#DC2626' }}>
                          ₹{(rep.metrics?.totalLostValue || 0).toLocaleString('en-IN')} lost
                        </span>
                        <button
                          type="button"
                          onClick={() => handleViewArchivedReport(rep)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1.2px solid #E2E8F0',
                            backgroundColor: '#F8FAFC',
                            color: '#0F172A',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Open Report</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
