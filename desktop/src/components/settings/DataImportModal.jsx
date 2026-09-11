import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Database,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  FileText,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useCustomer } from '../../context/CustomerContext';
import { useBranding } from '../../context/BrandingContext';

export const DataImportModal = ({ mode = 'csv', onClose }) => {
  const { fetchCustomers, activeForm } = useCustomer();
  const { updateBranding } = useBranding();

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [allParsedRows, setAllParsedRows] = useState([]);
  const [jsonBackupData, setJsonBackupData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState(null);
  const [error, setError] = useState('');

  // Handle CSV Parsing
  const handleCSVFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      setError('Please upload a valid .csv spreadsheet file.');
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setError('');
    setResultMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setError('CSV file is empty or does not contain header rows.');
          return;
        }

        // Parse header and rows (handling quotes)
        const parseLine = (line) => {
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const values = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            let str = match[1];
            if (str === undefined || str === '') {
              if (match.index === regex.lastIndex) break;
            } else {
              str = str.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
              values.push(str);
            }
          }
          return values;
        };

        const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const rawVals = lines[i].split(',').map((v) => v.replace(/^"|"$/g, '').trim());
          if (rawVals.length === 0 || rawVals.every((v) => !v)) continue;

          const rowData = {};
          headers.forEach((h, idx) => {
            const val = rawVals[idx] || '';
            if (h.includes('name') || h.includes('customer')) {
              rowData.customerName = val;
            } else if (h.includes('phone') || h.includes('mobile') || h.includes('contact')) {
              rowData.phone = val;
            } else if (h.includes('type')) {
              rowData.customerType = val || 'Direct Client';
            } else if (h.includes('location') || h.includes('city') || h.includes('address')) {
              rowData.location = val;
            } else if (h.includes('quote') || h.includes('budget') || h.includes('value') || h.includes('amount')) {
              rowData.quotationValue = Number(val.replace(/[^0-9.]/g, '')) || 0;
            } else if (h.includes('sales') || h.includes('staff') || h.includes('executive')) {
              rowData.salesperson = val;
            } else if (h.includes('notes') || h.includes('discussion')) {
              rowData.notes = val;
            } else if (h.includes('category') || h.includes('product')) {
              rowData.productCategory = val;
            }
          });

          // Fallback if name was not explicitly parsed
          if (!rowData.customerName && rawVals[0]) {
            rowData.customerName = rawVals[0];
          }
          if (!rowData.phone && rawVals[1]) {
            rowData.phone = rawVals[1];
          }

          if (rowData.customerName || rowData.phone) {
            rows.push(rowData);
          }
        }

        if (rows.length === 0) {
          setError('No valid customer rows could be extracted from this CSV file.');
          return;
        }

        setAllParsedRows(rows);
        setPreviewRows(rows.slice(0, 5));
      } catch (err) {
        setError('Error parsing CSV file: ' + err.message);
      }
    };
    reader.readAsText(selected);
  };

  // Handle JSON Backup Parsing
  const handleJSONFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.json')) {
      setError('Please upload a valid .json system backup file.');
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setError('');
    setResultMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const dataSection = (parsed?.data && typeof parsed.data === 'object') ? parsed.data : parsed;
        const customersList = dataSection?.customers || parsed?.customers || [];
        const brandingData = dataSection?.branding || parsed?.branding || null;
        const formsList = dataSection?.customerForms || (parsed?.formSchema ? [parsed.formSchema] : []);

        if (!parsed || (customersList.length === 0 && !brandingData && formsList.length === 0)) {
          setError('Invalid CRM JSON backup format or no recognizable CRM data inside.');
          return;
        }

        setJsonBackupData(parsed);
        if (Array.isArray(customersList) && customersList.length > 0) {
          setAllParsedRows(customersList);
          setPreviewRows(customersList.slice(0, 5));
        } else {
          setAllParsedRows([]);
          setPreviewRows([]);
        }
      } catch (err) {
        setError('Error parsing JSON backup file: ' + err.message);
      }
    };
    reader.readAsText(selected);
  };

  // Execute Import
  const handleRunImport = async () => {
    if (allParsedRows.length === 0 && !jsonBackupData) {
      setError('No data found to import.');
      return;
    }

    setImporting(true);
    setError('');
    setProgress(0);

    try {
      if (mode === 'json' && jsonBackupData) {
        setProgress(25);
        const restoreRes = await api.restoreBackup(jsonBackupData);
        setProgress(75);
        if (restoreRes && restoreRes.success) {
          if (fetchCustomers) await fetchCustomers();
          setProgress(100);
          setResultMessage({
            success: true,
            text: restoreRes.message || `Successfully restored database from backup!`,
          });
          return;
        } else {
          throw new Error(restoreRes?.message || 'Restore failed');
        }
      }

      // CSV Bulk Import Customers
      if (allParsedRows && allParsedRows.length > 0) {
        setProgress(40);
        const bulkRes = await api.bulkImportCustomers(allParsedRows);
        if (bulkRes && bulkRes.success) {
          const successCount = bulkRes.importedCount || allParsedRows.length;
          if (fetchCustomers) await fetchCustomers();
          setProgress(100);
          setResultMessage({
            success: true,
            text: `Successfully imported ${successCount} customer records into CRM database! Instant mobile & desktop sync active.`,
          });
        } else {
          throw new Error(bulkRes?.message || 'Bulk import failed');
        }
      }
    } catch (err) {
      setError('Import process encountered an issue: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '740px',
          width: '90%',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: mode === 'csv' ? '#ECFDF5' : '#EFF6FF',
                color: mode === 'csv' ? '#059669' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mode === 'csv' ? <FileSpreadsheet size={22} /> : <Database size={22} />}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>
                {mode === 'csv' ? 'Import Customer Records (CSV)' : 'Restore Full CRM Backup (JSON)'}
              </h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                {mode === 'csv'
                  ? 'Upload a spreadsheet to bulk-create leads in your CRM database.'
                  : 'Restore complete showroom database, configuration, and customer records.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          {resultMessage && (
            <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontSize: '13.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#10B981" />
              <span>{resultMessage.text}</span>
            </div>
          )}

          {/* Upload Area */}
          {!resultMessage && (
            <div
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={22} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                  {fileName ? fileName : `Select ${mode.toUpperCase()} File`}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {mode === 'csv' ? 'Compatible with Excel, Google Sheets, or CRM exports' : 'System JSON snapshot format'}
                </div>
              </div>

              <label
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                <span>{fileName ? 'Choose Different File' : 'Browse File...'}</span>
                <input
                  type="file"
                  accept={mode === 'csv' ? '.csv' : '.json'}
                  onChange={mode === 'csv' ? handleCSVFile : handleJSONFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* Preview Table */}
          {allParsedRows.length > 0 && !resultMessage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>
                  Data Preview ({allParsedRows.length} total records detected)
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>Showing first {previewRows.length} rows</span>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontWeight: '800' }}>
                      <th style={{ padding: '8px 12px' }}>Customer Name</th>
                      <th style={{ padding: '8px 12px' }}>Phone</th>
                      <th style={{ padding: '8px 12px' }}>Type</th>
                      <th style={{ padding: '8px 12px' }}>Location</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Quote (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => {
                      const d = r.data instanceof Map ? Object.fromEntries(r.data) : (r.data || r);
                      return (
                        <tr key={i} style={{ borderBottom: i < previewRows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0F172A' }}>
                            {d.customerName || d.name || '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{d.phone || d.mobile || '—'}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{d.customerType || 'Direct Client'}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{d.location || '—'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                            ₹{Number(d.quotationValue || d.orderValue || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {importing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>
                <span>Importing records into CRM database...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563EB, #10B981)',
                    transition: 'width 0.15s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ borderRadius: '8px', fontSize: '12.5px' }}
          >
            {resultMessage ? 'Close' : 'Cancel'}
          </button>

          {!resultMessage && (
            <button
              type="button"
              disabled={importing || allParsedRows.length === 0}
              onClick={handleRunImport}
              className="btn btn-primary"
              style={{
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <CheckCircle size={15} />
              <span>{importing ? `Importing (${progress}%)...` : `Import ${allParsedRows.length} Records Now`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
