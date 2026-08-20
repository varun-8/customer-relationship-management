import React, { useState } from 'react';
import {
  Save,
  UploadCloud,
  Eye,
  Plus,
  Layers,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  Info,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useFormBuilder } from '../../context/FormBuilderContext';
import { FieldPalette } from './FieldPalette';
import { FieldCard } from './FieldCard';
import { FieldConfigModal } from './FieldConfigModal';
import { FormPreviewModal } from '../form-preview/FormPreviewModal';
import { useCustomer } from '../../context/CustomerContext';

export const FormBuilderView = () => {
  const {
    draftForm,
    loading,
    saving,
    hasChanges,
    saveDraft,
    deleteDraft,
    publishForm,
    fetchDraftForm,
    reorderAllFields,
  } = useFormBuilder();

  const { fetchActiveForm } = useCustomer();

  const [editingField, setEditingField] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDraftInfoModal, setShowDraftInfoModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !draftForm) return;

    const fields = [...draftForm.fields];
    const [moved] = fields.splice(draggedIndex, 1);
    fields.splice(targetIndex, 0, moved);

    const reorderedIds = fields.map((f) => f.id);
    reorderAllFields(reorderedIds);
    setDraggedIndex(null);
  };

  const handleSaveDraft = async () => {
    const res = await saveDraft();
    if (res && res.success) {
      showToast('Draft form saved successfully!');
    } else if (res) {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteDraftSubmit = async () => {
    const res = await deleteDraft();
    if (res && res.success) {
      setShowDeleteConfirmModal(false);
      showToast(res.message || 'Draft discarded and reset to published version!');
    } else if (res) {
      showToast(res.message, 'error');
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    const res = await publishForm(changelog || 'Updated customer form definition');
    if (res && res.success) {
      setShowPublishModal(false);
      setChangelog('');
      await fetchActiveForm();
      showToast(res.message || 'Form version published successfully!');
    } else if (res) {
      showToast(res.message, 'error');
    }
  };

  if (loading && !draftForm) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#2563EB' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: '700', fontSize: '14px', color: '#334155' }}>Loading Form Builder canvas...</span>
      </div>
    );
  }

  const fields = draftForm?.fields || [];
  const activeFieldsCount = fields.filter((f) => f.active).length;
  const requiredFieldsCount = fields.filter((f) => f.required).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '14px',
            backgroundColor: toastMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1.5px solid ${toastMessage.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
            color: toastMessage.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '13.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner Header & Action Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '24px',
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Layers size={24} color="#FFFFFF" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                {draftForm?.name || 'Customer CRM Form Schema'}
              </h2>
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 10px',
                  borderRadius: '20px',
                }}
              >
                Draft v{draftForm?.version || 1}
              </span>

              {hasChanges && (
                <span
                  style={{
                    backgroundColor: 'rgba(167, 139, 250, 0.2)',
                    color: '#C4B5FD',
                    border: '1px solid rgba(167, 139, 250, 0.4)',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 10px',
                    borderRadius: '20px',
                  }}
                >
                  Unsaved Changes
                </span>
              )}
            </div>

            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              {fields.length} total fields • {activeFieldsCount} active • {requiredFieldsCount} required
            </p>
          </div>
        </div>

        {/* Action Toolbar Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Draft Details */}
          <button
            type="button"
            onClick={() => setShowDraftInfoModal(true)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              borderRadius: '12px',
              padding: '9px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="View Draft summary and schema breakdown"
          >
            <Info size={15} color="#38BDF8" />
            <span>Draft Summary</span>
          </button>

          {/* Reset Changes */}
          <button
            type="button"
            onClick={fetchDraftForm}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              borderRadius: '12px',
              padding: '9px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Reset to database version"
          >
            <RotateCcw size={15} />
          </button>

          {/* Delete Draft */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirmModal(true)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              borderRadius: '12px',
              padding: '9px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Discard draft"
          >
            <Trash2 size={15} />
            <span>Discard</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '9px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          {/* Preview Form */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            style={{
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              color: '#1D4ED8',
              borderRadius: '12px',
              padding: '9px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Eye size={15} color="#2563EB" />
            <span>Live Preview</span>
          </button>

          {/* Publish Changes Button */}
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            }}
          >
            <UploadCloud size={16} />
            <span>Publish to Mobile App</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: 15 Field Types Palette */}
        <div>
          <FieldPalette />
        </div>

        {/* Right: Form Canvas with Reorderable Fields */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Customer Form Canvas ({fields.length} Fields)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>
                Drag and drop or use arrow buttons to reorder fields. Field structure syncs live to Mobile & Desktop CRM.
              </p>
            </div>

            <span
              style={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                fontSize: '12px',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '20px',
              }}
            >
              {activeFieldsCount} Active in Mobile
            </span>
          </div>

          {/* Fields List */}
          {fields.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                border: '2px dashed #CBD5E1',
                borderRadius: '20px',
                backgroundColor: '#F8FAFC',
                color: '#64748B',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  backgroundColor: '#DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <Plus size={28} color="#2563EB" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                Your form canvas is currently empty
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '340px', margin: '6px auto 0' }}>
                Click any field type from the left palette to start designing your custom showroom form.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fields.map((field, idx) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  index={idx}
                  total={fields.length}
                  onEdit={(f) => setEditingField(f)}
                  isDragging={draggedIndex === idx}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Field Config Modal */}
      {editingField && (
        <FieldConfigModal
          field={editingField}
          onClose={() => setEditingField(null)}
        />
      )}

      {/* Live Form Preview Modal */}
      {showPreview && (
        <FormPreviewModal
          onClose={() => setShowPreview(false)}
          onPublishClick={() => setShowPublishModal(true)}
        />
      )}

      {/* View Draft Information Modal */}
      {showDraftInfoModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDraftInfoModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            margin: 0,
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '640px',
              width: '100%',
              maxHeight: '88vh',
              margin: 'auto',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={20} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Draft Form Details & Field Summary
                </h3>
              </div>
              <button onClick={() => setShowDraftInfoModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Target Version</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB', marginTop: '2px' }}>v{draftForm?.version || 1}</div>
                </div>

                <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Total Fields</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>{fields.length}</div>
                </div>

                <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Active in Mobile</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>{activeFieldsCount}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Configured Fields In Draft
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                  {fields.map((f, i) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: i < fields.length - 1 ? '1px solid #F1F5F9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '800', width: '24px' }}>#{i + 1}</span>
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>{f.label}</span>
                        <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#64748B' }}>({f.name})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: '700', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '8px' }}>
                          {f.type}
                        </span>
                        {f.required && <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#FFF1F2', color: '#E11D48', padding: '2px 6px', borderRadius: '6px' }}>Required</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Draft Status: <span style={{ fontWeight: '800', color: '#D97706' }}>Unpublished Draft</span> • Changes will take effect in the mobile showroom app once published.
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setShowDraftInfoModal(false)}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Discard Draft Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDeleteConfirmModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            margin: 0,
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '480px',
              width: '100%',
              maxHeight: '88vh',
              margin: 'auto',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#DC2626', margin: 0 }}>
                  Discard / Delete Draft Form?
                </h3>
              </div>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: '#334155', marginBottom: '16px', lineHeight: 1.5 }}>
                Are you sure you want to discard this draft? All unpublished field additions, reordering, and edits will be deleted, and your form will reset back to the active published schema.
              </p>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  color: '#991B1B',
                  fontWeight: '600',
                }}
              >
                Existing customer records and published form versions will NOT be affected.
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                style={{
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  color: '#475569',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDraftSubmit}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                disabled={saving}
              >
                <Trash2 size={15} />
                {saving ? 'Discarding...' : 'Yes, Discard Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowPublishModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            margin: 0,
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '88vh',
              margin: 'auto',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UploadCloud size={20} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Publish Customer Form (v{(draftForm?.version || 1)})
                </h3>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              <p style={{ fontSize: '13.5px', color: '#334155', marginBottom: '16px', lineHeight: 1.5 }}>
                Publishing will save this configuration as the active live form schema. All showroom employees and the React Native mobile app will immediately render this configuration.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                  Changelog / Version Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Added Project Budget and Preferred Finish fields"
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#92400E',
                  fontWeight: '600',
                }}
              >
                Existing customer records will retain all their data even if fields are disabled or modified.
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                style={{
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  color: '#475569',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishSubmit}
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
                disabled={saving}
              >
                <UploadCloud size={16} />
                {saving ? 'Publishing...' : 'Publish to Showroom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
