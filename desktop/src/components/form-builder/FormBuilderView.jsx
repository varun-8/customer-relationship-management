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
  Clock,
  Calendar,
  Check,
  Hash,
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
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--primary-700)' }}>
        <div className="spin" style={{ width: '22px', height: '22px', border: '2px solid var(--primary-700)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 10px' }} />
        <span style={{ fontWeight: '600' }}>Loading Form Builder canvas...</span>
      </div>
    );
  }

  const fields = draftForm?.fields || [];
  const activeFieldsCount = fields.filter((f) => f.active).length;
  const requiredFieldsCount = fields.filter((f) => f.required).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: toastMessage.type === 'success' ? 'var(--emerald-50)' : 'var(--rose-50)',
            border: `1px solid ${toastMessage.type === 'success' ? '#A7F3D0' : '#FECDD3'}`,
            color: toastMessage.type === 'success' ? 'var(--emerald-700)' : 'var(--rose-600)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'var(--primary-50)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', color: 'var(--text-primary)', margin: 0 }}>
                {draftForm?.name || 'Customer CRM Form'}
              </h2>
              <span className="badge badge-amber">Draft v{draftForm?.version || 1}</span>
              {hasChanges && (
                <span className="badge badge-purple">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {fields.length} total fields • {activeFieldsCount} active • {requiredFieldsCount} required
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View Draft Info */}
          <button
            onClick={() => setShowDraftInfoModal(true)}
            className="btn btn-secondary"
            title="View Draft summary, metadata and field breakdown"
            style={{ padding: '7px 12px', fontSize: '12.5px' }}
          >
            <Info size={14} color="var(--primary-700)" />
            <span>View Draft</span>
          </button>

          {/* Discard / Delete Draft */}
          <button
            onClick={() => setShowDeleteConfirmModal(true)}
            className="btn btn-danger"
            title="Discard draft and reset to active published version"
            style={{ padding: '7px 12px', fontSize: '12.5px' }}
          >
            <Trash2 size={14} />
            <span>Delete Draft</span>
          </button>

          <button
            onClick={fetchDraftForm}
            className="btn btn-secondary"
            title="Reset changes from database"
            style={{ padding: '7px 10px' }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={handleSaveDraft}
            className="btn btn-secondary"
            disabled={saving}
            style={{ padding: '7px 14px', fontSize: '12.5px' }}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '12.5px', borderColor: 'var(--primary-600)', color: 'var(--primary-700)' }}
          >
            <Eye size={14} />
            <span>Preview Form</span>
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            className="btn btn-primary"
            style={{ padding: '7px 16px', fontSize: '12.5px' }}
          >
            <UploadCloud size={14} />
            <span>Publish Changes</span>
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
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Customer Form Canvas
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Drag and drop or use arrows to reorder fields. Order is identical in mobile & desktop forms.
              </p>
            </div>
            <span className="badge badge-emerald">{fields.length} Fields</span>
          </div>

          {/* Fields List */}
          {fields.length === 0 ? (
            <div
              style={{
                padding: '50px 20px',
                textAlign: 'center',
                border: '2px dashed var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)',
              }}
            >
              <Plus size={28} color="var(--primary-700)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Your form has no fields yet
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '320px', margin: '4px auto 0' }}>
                Click any field type from the left palette to start designing your customer form.
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
        <div className="modal-backdrop" onClick={() => setShowDraftInfoModal(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} color="var(--primary-700)" />
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
                  Draft Form Details & Field Summary
                </h3>
              </div>
              <button onClick={() => setShowDraftInfoModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Target Version</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-700)', marginTop: '2px' }}>v{draftForm?.version || 1}</div>
                </div>

                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Fields</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{fields.length}</div>
                </div>

                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Active in Mobile</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--emerald-700)', marginTop: '2px' }}>{activeFieldsCount}</div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Configured Fields In Draft
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-default)', borderRadius: '8px' }}>
                  {fields.map((f, i) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '10px 14px',
                        borderBottom: i < fields.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', width: '20px' }}>#{i + 1}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{f.label}</span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({f.name})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-slate" style={{ fontSize: '10px' }}>{f.type}</span>
                        {f.required && <span className="badge badge-amber" style={{ fontSize: '9px' }}>Required</span>}
                        {!f.active && <span className="badge badge-slate" style={{ fontSize: '9px' }}>Inactive</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Draft Status: <span className="badge badge-amber">Unpublished Draft</span> • Changes will take effect in the mobile showroom app once published.
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowDraftInfoModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Discard Draft Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--rose-600)" />
                <h3 style={{ fontSize: '16px', color: 'var(--rose-600)', margin: 0 }}>
                  Discard / Delete Draft Form?
                </h3>
              </div>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Are you sure you want to discard this draft? All unpublished field additions, reordering, and edits will be deleted, and your form will reset back to the active published schema.
              </p>

              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--rose-50)',
                  border: '1px solid #FECDD3',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--rose-600)',
                  fontWeight: '600',
                }}
              >
                Existing customer records and published form versions will NOT be affected.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDraftSubmit}
                className="btn btn-danger"
                disabled={saving}
              >
                <Trash2 size={14} />
                {saving ? 'Discarding...' : 'Yes, Discard Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="modal-backdrop" onClick={() => setShowPublishModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={16} color="var(--primary-700)" />
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>
                  Publish Customer Form (v{(draftForm?.version || 1)})
                </h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Publishing will save this configuration as the active live form schema. All showroom employees and the React Native mobile app will immediately render this configuration.
              </p>

              <div className="form-group">
                <label className="form-label">Changelog / Version Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Added Project Budget and Preferred Finish fields"
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                />
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--amber-50)',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--amber-700)',
                }}
              >
                Existing customer records will retain all their data even if fields are disabled or modified.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishSubmit}
                className="btn btn-primary"
                disabled={saving}
              >
                <UploadCloud size={14} />
                {saving ? 'Publishing...' : 'Publish to Showroom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
