import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  FileText,
  History,
  CheckCircle2,
  ExternalLink,
  Printer,
  RefreshCw,
  X,
  ChevronRight,
  TrendingUp,
  Target,
  Building2,
  Lightbulb,
  ShieldAlert,
  IndianRupee,
  Layers,
  Check,
  Lock,
  Settings
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * AI Showroom Business Report Modal
 * - Robust CSS inline styles (no Tailwind dependency).
 * - Minimalistic contents with high-contrast text visibility.
 * - In-app AI report is ONLY visible and accessible if an API key (OpenAI or Gemini) is configured in Settings.
 * - If no API key is provided, the In-App AI generator shows a locked notice with clear instructions, while ChatGPT.com 1-Click Export remains available.
 */
export const AiLostSalesReportModal = ({ onClose, initialReportType, initialMonth, initialYear }) => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'viewer' | 'history'
  const [status, setStatus] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);

  const todayStr = new Date().toISOString().substring(0, 7);
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || todayStr);
  const [selectedYear, setSelectedYear] = useState(initialYear || currentYearStr);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingChatGpt, setExportingChatGpt] = useState(false);
  const [chatGptNotice, setChatGptNotice] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState(initialReportType || 'monthly');
  const [currentReport, setCurrentReport] = useState(null);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);

  // Fetch report quota status & AI key status
  const fetchStatusAndConfig = async (overrideParams) => {
    try {
      setLoadingStatus(true);
      setError(null);
      const m = overrideParams?.month || selectedMonth;
      const y = overrideParams?.year || selectedYear;

      const [statusRes, configRes] = await Promise.all([
        api.getAiReportStatus({ month: m, year: y }).catch((e) => ({ success: false, message: e.message })),
        api.getAiConfig().catch((e) => ({ success: false, message: e.message })),
      ]);

      if (statusRes && statusRes.success) {
        setStatus(statusRes.data);
      }
      if (configRes && configRes.success) {
        setAiConfig(configRes);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error checking AI report settings');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch saved reports
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
    fetchStatusAndConfig({ month: selectedMonth, year: selectedYear });
    fetchHistory();
  }, [selectedMonth, selectedYear]);

  // Determine if API Key is configured in settings
  const hasApiKey = Boolean(
    status?.hasApiKey ||
    aiConfig?.hasApiKey ||
    aiConfig?.hasOpenAiKey
  );

  const activeProviderName = aiConfig?.hasOpenAiKey
    ? `OpenAI (${aiConfig.openaiModel || 'GPT-4o'})`
    : aiConfig?.hasApiKey
    ? `Gemini (${aiConfig.model || 'Gemini 1.5'})`
    : status?.activeProvider === 'openai'
    ? 'OpenAI ChatGPT'
    : status?.activeProvider === 'gemini'
    ? 'Google Gemini'
    : null;

  // Handle in-app generation
  const handleGenerate = async (reportType) => {
    if (!hasApiKey) {
      setError('An API Key is required in Settings to generate in-app AI reports.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const periodToUse = reportType === 'monthly' ? selectedMonth : selectedYear;
      const res = await api.generateAiReport({
        reportType,
        period: periodToUse,
      });

      if (res && res.success && res.data) {
        setCurrentReport(res.data);
        setActiveTab('viewer');
        fetchStatusAndConfig();
        fetchHistory();
      } else {
        setError(res?.message || 'Failed to generate AI report');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to generate AI report';
      setError(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  // Resilient clipboard copy helper
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn('navigator.clipboard.writeText failed, using fallback textarea...', e);
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.warn('Fallback copy failed:', err);
      return false;
    }
  };

  // Export full period dataset prompt and launch ChatGPT.com
  const handleOpenInChatGPT = async (reportType) => {
    try {
      setExportingChatGpt(true);
      setChatGptNotice(null);
      setError(null);
      const periodToUse = reportType === 'monthly' ? selectedMonth : selectedYear;
      const res = await api.getChatGptPrompt({ reportType, period: periodToUse });
      const promptText = res?.data?.prompt || res?.prompt;

      if (res && res.success && promptText) {
        await copyToClipboard(promptText);
        window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
        setChatGptNotice({
          period: periodToUse,
          type: reportType,
          message: `Prompt with showroom data copied to clipboard! Paste (Ctrl+V) in the opened ChatGPT tab.`
        });
      } else {
        setError(res?.message || 'Failed to prepare ChatGPT prompt. Please ensure records exist for the selected period.');
      }
    } catch (err) {
      console.error('Failed to export to ChatGPT:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not export to ChatGPT');
    } finally {
      setExportingChatGpt(false);
    }
  };

  // View archived report
  const handleViewArchivedReport = async (report) => {
    if (report && report.content && (report.content.rootCauses || report.content.areasToImprove)) {
      setCurrentReport(report);
      setActiveTab('viewer');
      return;
    }
    try {
      if (report && report._id) {
        const res = await api.getAiReportById(report._id);
        if (res && res.success && res.data) {
          setCurrentReport(res.data);
          setActiveTab('viewer');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch full report by ID:', e);
    }
    setCurrentReport(report);
    setActiveTab('viewer');
  };

  const handlePrint = () => {
    window.print();
  };

  const currentPeriodStr = selectedReportType === 'monthly' ? selectedMonth : selectedYear;
  const existingSavedReport = selectedReportType === 'monthly'
    ? status?.monthly?.existingReport
    : status?.yearly?.existingReport;

  return createPortal(
    <div
      className="modal-backdrop modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '24px',
        margin: 0,
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '1020px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(226, 232, 240, 0.9)',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#0F172A',
          margin: 'auto',
          alignSelf: 'center',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  AI Showroom Business Report
                </h2>
                {hasApiKey ? (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#6EE7B7',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Check size={12} />
                    In-App AI Ready ({activeProviderName || 'API Key Active'})
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      color: '#FDE68A',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Lock size={12} />
                    API Key Missing in Settings
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '3px 0 0' }}>
                Executive intelligence across sales revenue, footfall, conversion, and actionable floor fixes.
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
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: activeTab === 'generate' ? '1px solid #E2E8F0' : '1px solid transparent',
                backgroundColor: activeTab === 'generate' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'generate' ? '#6D28D9' : '#64748B',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'generate' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <Sparkles size={15} color={activeTab === 'generate' ? '#6D28D9' : '#64748B'} />
              <span>Generate Report</span>
            </button>

            {currentReport && (
              <button
                type="button"
                onClick={() => setActiveTab('viewer')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: activeTab === 'viewer' ? '1px solid #E2E8F0' : '1px solid transparent',
                  backgroundColor: activeTab === 'viewer' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'viewer' ? '#6D28D9' : '#64748B',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: activeTab === 'viewer' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <FileText size={15} color={activeTab === 'viewer' ? '#6D28D9' : '#64748B'} />
                <span>Active Report ({currentReport.period})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: activeTab === 'history' ? '1px solid #E2E8F0' : '1px solid transparent',
                backgroundColor: activeTab === 'history' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'history' ? '#6D28D9' : '#64748B',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'history' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <History size={15} color={activeTab === 'history' ? '#6D28D9' : '#64748B'} />
              <span>Saved Reports ({reportsHistory.length})</span>
            </button>
          </div>

          {activeTab === 'viewer' && currentReport && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleOpenInChatGPT(currentReport.reportType || 'monthly')}
                disabled={exportingChatGpt}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1.2px solid #A7F3D0',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: exportingChatGpt ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ExternalLink size={13} />
                <span>Analyze on ChatGPT.com</span>
              </button>

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
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={13} />
                <span>Print PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' }}>
          {/* Error Notice */}
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FECDD3',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#991B1B' }}>Notice</h4>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#B91C1C', fontWeight: '600', lineHeight: 1.45 }}>
                    {error}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* TAB 1: GENERATE REPORT */}
          {activeTab === 'generate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {chatGptNotice && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#065F46', display: 'block', fontWeight: '800' }}>
                        Prompt Copied to Clipboard
                      </strong>
                      <span style={{ fontSize: '12px', color: '#047857', fontWeight: '600' }}>
                        {chatGptNotice.message}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatGptNotice(null)}
                    style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Minimalist Period Control Bar */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.2px solid #E2E8F0',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      Report Scope & Period
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                      Select whether you want a single Month analysis or Annual Showroom Audit.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Segmented Type Switch */}
                  <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '10px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReportType('monthly')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        backgroundColor: selectedReportType === 'monthly' ? '#FFFFFF' : 'transparent',
                        color: selectedReportType === 'monthly' ? '#6D28D9' : '#64748B',
                        boxShadow: selectedReportType === 'monthly' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReportType('yearly')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        backgroundColor: selectedReportType === 'yearly' ? '#FFFFFF' : 'transparent',
                        color: selectedReportType === 'yearly' ? '#6D28D9' : '#64748B',
                        boxShadow: selectedReportType === 'yearly' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      Annual
                    </button>
                  </div>

                  {/* Period Input Picker */}
                  {selectedReportType === 'monthly' ? (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1.2px solid #CBD5E1',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    />
                  ) : (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1.2px solid #CBD5E1',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((yr) => (
                        <option key={yr} value={String(yr)}>
                          Year {yr}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* In-App AI Report Section (CONDITIONALLY VISIBLE BASED ON API KEY IN SETTINGS) */}
              {hasApiKey ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #C4B5FD',
                    padding: '22px',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '4px',
                      background: 'linear-gradient(90deg, #7C3AED, #6366F1, #10B981)',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginTop: '4px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F5F3FF',
                            color: '#6D28D9',
                            border: '1px solid #DDD6FE',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Sparkles size={12} />
                          Direct In-App AI Report
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                          Powered by {activeProviderName}
                        </span>
                      </div>
                      <h4 style={{ margin: '8px 0 0', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                        Generate {selectedReportType === 'monthly' ? selectedMonth : `Year ${selectedYear}`} In-App AI Report
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#475569', fontWeight: '600', maxWidth: '620px', lineHeight: 1.5 }}>
                        Feeds all showroom inquiries, closed bills, walk-in footfalls, lost sales records, and targets strictly for {currentPeriodStr} into the AI engine.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {existingSavedReport && (
                        <button
                          type="button"
                          onClick={() => handleViewArchivedReport(existingSavedReport)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1.2px solid #CBD5E1',
                            fontSize: '12px',
                            fontWeight: '800',
                            color: '#334155',
                            backgroundColor: '#F8FAFC',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <FileText size={14} color="#6D28D9" />
                          <span>View Saved</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={generating || exportingChatGpt}
                        onClick={() => handleGenerate(selectedReportType)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: '800',
                          cursor: (generating || exportingChatGpt) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.28)',
                          opacity: (generating || exportingChatGpt) ? 0.65 : 1,
                        }}
                      >
                        {generating ? (
                          <>
                            <RefreshCw size={14} className="spin-anim" />
                            <span>Generating Report...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Generate In-App Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sleek Locked Card when API Key is NOT in Settings */
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.2px solid #E2E8F0',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Lock size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                          In-App AI Report Locked
                        </h4>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '5px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          API Key Required
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', fontWeight: '600', maxWidth: '580px', lineHeight: 1.5 }}>
                        The In-App AI Report feature is only visible when an OpenAI (ChatGPT) or Google Gemini API Key is entered in <strong>Settings → AI Configuration</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1.2px solid #C4B5FD',
                      backgroundColor: '#F5F3FF',
                      color: '#6D28D9',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Settings size={14} />
                    <span>Open Settings</span>
                  </button>
                </div>
              )}

              {/* 1-Click ChatGPT.com Report Card (Always available) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.2px solid #E2E8F0',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ExternalLink size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                        1-Click ChatGPT.com Report
                      </h4>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '5px', backgroundColor: '#DCFCE7', color: '#166534' }}>
                        No API Key Needed
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', fontWeight: '600', maxWidth: '580px', lineHeight: 1.5 }}>
                      Compiles 100% of showroom lost sales, footfall, and quotations for {currentPeriodStr} into formatted markdown tables, copies to your clipboard, and launches ChatGPT.com.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generating || exportingChatGpt}
                  onClick={() => handleOpenInChatGPT(selectedReportType)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1.2px solid #86EFAC',
                    backgroundColor: '#F0FDF4',
                    color: '#15803D',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: (generating || exportingChatGpt) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>{exportingChatGpt ? 'Preparing Prompt...' : 'Analyze on ChatGPT.com'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE REPORT VIEWER */}
          {activeTab === 'viewer' && currentReport && (
            <div
              id="printable-ai-report"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
              }}
            >
              {/* Header Banner */}
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        backgroundColor: '#EDE9FE',
                        color: '#6D28D9',
                      }}
                    >
                      {currentReport.reportType || 'MONTHLY'} REPORT
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                      Period: {currentReport.period}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                      Generated: {new Date(currentReport.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>
                    {currentReport.title || 'Executive Showroom Performance & Lost Sales Report'}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1.2px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Printer size={13} />
                  <span>Print PDF</span>
                </button>
              </div>

              {/* 4 Core Scorecards (Supreme Contrast & Legibility) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {/* 1. Sales Revenue */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#ECFDF5', border: '1.2px solid #A7F3D0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#065F46', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IndianRupee size={13} />
                    <span>Sales Revenue</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#064E3B', marginTop: '6px' }}>
                    ₹{(currentReport.metrics?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#047857', marginTop: '2px' }}>
                    {currentReport.metrics?.totalOrders || 0} Closed Orders
                  </div>
                </div>

                {/* 2. Walk-in Footfall */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#EEF2FF', border: '1.2px solid #C7D2FE' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#312E81', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={13} />
                    <span>Walk-ins</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#1E1B4B', marginTop: '6px' }}>
                    {currentReport.metrics?.totalWalkins || 0} Visits
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#3730A3', marginTop: '2px' }}>
                    {currentReport.metrics?.totalQuotes || 0} Quotes Issued
                  </div>
                </div>

                {/* 3. Conversion Rate */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1.2px solid #FDE68A' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Target size={13} />
                    <span>Conversion</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#78350F', marginTop: '6px' }}>
                    {currentReport.metrics?.conversionRate || '0%'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#B45309', marginTop: '2px' }}>
                    {currentReport.metrics?.repeatCustomersCount || 0} Repeat Clients
                  </div>
                </div>

                {/* 4. Lost Sales Risk */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1.2px solid #FECDD3' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldAlert size={13} />
                    <span>Lost Revenue</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#881337', marginTop: '6px' }}>
                    ₹{(currentReport.metrics?.totalLostValue || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#B91C1C', marginTop: '2px' }}>
                    {currentReport.metrics?.totalLostDeals || 0} Deals Dropped
                  </div>
                </div>
              </div>

              {/* Executive Overview & Wins */}
              <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1.2px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#6D28D9" />
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A' }}>
                    Executive Showroom Overview
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#1E293B', lineHeight: 1.6 }}>
                  {currentReport.content?.showroomOverview || currentReport.summary}
                </p>

                {Array.isArray(currentReport.content?.strengths) && currentReport.content.strengths.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#065F46', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} />
                      <span>Key Showroom Wins</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                      {currentReport.content.strengths.map((str, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #A7F3D0',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#064E3B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Areas to Improve (Colorful Cards with Crisp Bold Text) */}
              {Array.isArray(currentReport.content?.areasToImprove) && currentReport.content.areasToImprove.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lightbulb size={16} color="#6D28D9" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      Areas to Improve & Floor Remedies
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {currentReport.content.areasToImprove.map((item, aIdx) => {
                      const accentColor = item.color || (aIdx % 4 === 0 ? '#6366F1' : aIdx % 4 === 1 ? '#10B981' : aIdx % 4 === 2 ? '#F59E0B' : '#EF4444');
                      return (
                        <div
                          key={aIdx}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            border: '1.2px solid #E2E8F0',
                            borderLeft: `4px solid ${accentColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  textTransform: 'uppercase',
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  backgroundColor: `${accentColor}18`,
                                  color: accentColor,
                                }}
                              >
                                {item.category || 'Floor Action'}
                              </span>
                              {item.impact && (
                                <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '5px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                                  {item.impact}
                                </span>
                              )}
                            </div>

                            <h4 style={{ margin: '4px 0 0', fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                              {item.title}
                            </h4>

                            {item.problem && (
                              <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: '600', color: '#334155', lineHeight: 1.45 }}>
                                <strong style={{ color: '#0F172A' }}>What's happening: </strong>
                                {item.problem}
                              </p>
                            )}
                          </div>

                          {item.solution && (
                            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: '700', color: '#0F172A', lineHeight: 1.45 }}>
                              <span style={{ color: accentColor }}>Floor Fix: </span>
                              {item.solution}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Competitor Analysis & Floor Scripts */}
              {Array.isArray(currentReport.content?.competitorAnalysis) && currentReport.content.competitorAnalysis.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Building2 size={16} color="#EA580C" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      Competitor Tactics & Showroom Counter-Scripts
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {currentReport.content.competitorAnalysis.map((comp, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: '#FFFBEB',
                          border: '1.2px solid #FDE68A',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13.5px', color: '#78350F' }}>
                              {comp.competitor}
                            </strong>
                            <span style={{ fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '5px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                              {comp.observedStrength}
                            </span>
                          </div>

                          <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: '600', color: '#78350F', lineHeight: 1.45 }}>
                            <strong>Strategy: </strong>
                            {comp.counterStrategy}
                          </p>
                        </div>

                        {comp.floorScript && (
                          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #FDE68A', fontSize: '12px', color: '#451A03', lineHeight: 1.45 }}>
                            <span style={{ fontWeight: '800', color: '#B45309' }}>🗣️ Staff Script: </span>
                            <span style={{ fontStyle: 'italic', fontWeight: '600' }}>"{comp.floorScript}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Action Roadmap */}
              {Array.isArray(currentReport.content?.actionRoadmap) && currentReport.content.actionRoadmap.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Target size={16} color="#6D28D9" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      Priority Action Roadmap
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    {currentReport.content.actionRoadmap.map((act, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <span
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            backgroundColor: '#6D28D9',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: '900',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', lineHeight: 1.4 }}>
                          {act}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED REPORTS ARCHIVE */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                  Archived Reports ({reportsHistory.length})
                </h3>
              </div>

              {loadingHistory ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={22} className="spin-anim" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>Loading report archive...</div>
                </div>
              ) : reportsHistory.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <FileText size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>No Reports Archived Yet</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: '600', color: '#64748B' }}>
                    Generate an AI report to store historical executive intelligence.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {reportsHistory.map((rep) => (
                    <div
                      key={rep._id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1.2px solid #E2E8F0',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              backgroundColor: '#F3E8FF',
                              color: '#7C3AED',
                            }}
                          >
                            {rep.reportType}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                            {new Date(rep.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                          {rep.title || `Report for ${rep.period}`}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: '600', color: '#64748B', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {rep.summary}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#DC2626' }}>
                          ₹{(rep.metrics?.totalLostValue || 0).toLocaleString('en-IN')} lost
                        </span>
                        <button
                          type="button"
                          onClick={() => handleViewArchivedReport(rep)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '7px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F8FAFC',
                            color: '#6D28D9',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Open</span>
                          <ChevronRight size={13} />
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
    </div>,
    document.body
  );
};
