import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const FormBuilderContext = createContext(null);

export const DEFAULT_FIELD_TEMPLATES = {
  text: {
    label: 'Text Field',
    name: 'customText',
    type: 'text',
    required: false,
    active: true,
    placeholder: 'Enter text...',
    description: '',
    defaultValue: '',
    options: [],
    validation: { minLength: 0, maxLength: 255 },
  },
  textarea: {
    label: 'Paragraph / Long Text',
    name: 'customParagraph',
    type: 'textarea',
    required: false,
    active: true,
    placeholder: 'Enter detailed notes...',
    description: '',
    defaultValue: '',
    options: [],
    validation: { maxLength: 2000 },
  },
  number: {
    label: 'Number',
    name: 'customNumber',
    type: 'number',
    required: false,
    active: true,
    placeholder: '0',
    description: '',
    defaultValue: null,
    options: [],
    validation: { min: 0, max: 10000000 },
  },
  phone: {
    label: 'Phone Number',
    name: 'customPhone',
    type: 'phone',
    required: false,
    active: true,
    placeholder: '9876543210',
    description: '10-digit mobile number',
    defaultValue: '',
    options: [],
    validation: { phoneFormat: '10-digit' },
  },
  email: {
    label: 'Email Address',
    name: 'customEmail',
    type: 'email',
    required: false,
    active: true,
    placeholder: 'example@domain.com',
    description: 'Customer contact email',
    defaultValue: '',
    options: [],
    validation: {},
  },
  date: {
    label: 'Date',
    name: 'customDate',
    type: 'date',
    required: false,
    active: true,
    placeholder: 'Select date',
    description: '',
    defaultValue: null,
    options: [],
    validation: {},
  },
  time: {
    label: 'Time',
    name: 'customTime',
    type: 'time',
    required: false,
    active: true,
    placeholder: 'Select time',
    description: '',
    defaultValue: null,
    options: [],
    validation: {},
  },
  datetime: {
    label: 'Date & Time',
    name: 'customDateTime',
    type: 'datetime',
    required: false,
    active: true,
    placeholder: 'Select date & time',
    description: '',
    defaultValue: null,
    options: [],
    validation: {},
  },
  checkbox: {
    label: 'Checkbox / Boolean',
    name: 'customCheckbox',
    type: 'checkbox',
    required: false,
    active: true,
    placeholder: '',
    description: '',
    defaultValue: false,
    options: [],
    validation: {},
  },
  radio: {
    label: 'Radio Options',
    name: 'customRadio',
    type: 'radio',
    required: false,
    active: true,
    placeholder: '',
    description: 'Select one option',
    defaultValue: 'Option 1',
    options: [
      { label: 'Option 1', value: 'Option 1', isDefault: true },
      { label: 'Option 2', value: 'Option 2', isDefault: false },
    ],
    validation: {},
  },
  select: {
    label: 'Dropdown Select',
    name: 'customSelect',
    type: 'select',
    required: false,
    active: true,
    placeholder: 'Select an option...',
    description: 'Single selection dropdown',
    defaultValue: '',
    options: [
      { label: 'First Choice', value: 'First Choice', isDefault: true },
      { label: 'Second Choice', value: 'Second Choice', isDefault: false },
      { label: 'Third Choice', value: 'Third Choice', isDefault: false },
    ],
    validation: {},
  },
  multiselect: {
    label: 'Multi-Select',
    name: 'customMultiSelect',
    type: 'multiselect',
    required: false,
    active: true,
    placeholder: 'Select multiple items...',
    description: 'Select one or more items',
    defaultValue: [],
    options: [
      { label: 'Tiles', value: 'Tiles', isDefault: true },
      { label: 'Sanitary Ware', value: 'Sanitary Ware', isDefault: false },
      { label: 'Faucets', value: 'Faucets', isDefault: false },
    ],
    validation: {},
  },
  currency: {
    label: 'Currency Amount',
    name: 'customCurrency',
    type: 'currency',
    required: false,
    active: true,
    placeholder: '50000',
    description: 'Monetary figure with currency symbol',
    defaultValue: null,
    options: [],
    validation: { currencySymbol: '₹', min: 0 },
  },
  url: {
    label: 'Website / URL',
    name: 'customUrl',
    type: 'url',
    required: false,
    active: true,
    placeholder: 'https://example.com',
    description: 'Valid website URL link',
    defaultValue: '',
    options: [],
    validation: {},
  },
  auto_number: {
    label: 'Auto-Generated Number',
    name: 'customAutoNumber',
    type: 'auto_number',
    required: false,
    active: true,
    placeholder: 'Auto-generated on creation',
    description: 'System incremented sequential number',
    defaultValue: '',
    options: [],
    validation: {
      autoNumberConfig: {
        prefix: 'DOC-',
        start: 1,
        digits: 6,
        step: 1,
      },
    },
  },
};

export const FormBuilderProvider = ({ children }) => {
  const [draftForm, setDraftForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState(null);

  const fetchDraftForm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDraftForm();
      if (res.success && res.data) {
        setDraftForm(res.data);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Error fetching draft form:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await api.getFormVersions();
      if (res.success && res.data) {
        setVersions(res.data);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    }
  }, []);

  useEffect(() => {
    fetchDraftForm();
    fetchVersions();
  }, [fetchDraftForm, fetchVersions]);

  const addField = (type, customOverrides = {}) => {
    const template = DEFAULT_FIELD_TEMPLATES[type] || DEFAULT_FIELD_TEMPLATES.text;
    const uniqueSuffix = Date.now().toString().slice(-4);
    const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    const newField = {
      ...template,
      id: fieldId,
      name: `${template.name}_${uniqueSuffix}`,
      label: `${template.label} ${uniqueSuffix}`,
      order: draftForm ? draftForm.fields.length : 0,
      active: true,
      ...customOverrides,
    };

    setDraftForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: [...prev.fields, newField],
      };
    });
    setHasChanges(true);
    setSelectedFieldId(fieldId);
  };

  const updateField = (id, updatedAttributes) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((field) =>
          field.id === id ? { ...field, ...updatedAttributes } : field
        ),
      };
    });
    setHasChanges(true);
  };

  const deleteField = (id) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      const filtered = prev.fields.filter((field) => field.id !== id);
      return {
        ...prev,
        fields: filtered.map((f, idx) => ({ ...f, order: idx })),
      };
    });
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
    setHasChanges(true);
  };

  const duplicateField = (id) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      const source = prev.fields.find((f) => f.id === id);
      if (!source) return prev;

      const uniqueSuffix = Date.now().toString().slice(-4);
      const clonedField = {
        ...JSON.parse(JSON.stringify(source)),
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: `${source.name}_copy`,
        label: `${source.label} (Copy)`,
        order: prev.fields.length,
      };

      return {
        ...prev,
        fields: [...prev.fields, clonedField],
      };
    });
    setHasChanges(true);
  };

  const toggleFieldActive = (id) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) =>
          f.id === id ? { ...f, active: !f.active } : f
        ),
      };
    });
    setHasChanges(true);
  };

  const moveField = (id, direction) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      const fields = [...prev.fields];
      const index = fields.findIndex((f) => f.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= fields.length) return prev;

      // Swap
      const temp = fields[index];
      fields[index] = fields[targetIndex];
      fields[targetIndex] = temp;

      // Re-index order
      const reindexed = fields.map((f, idx) => ({ ...f, order: idx }));
      return {
        ...prev,
        fields: reindexed,
      };
    });
    setHasChanges(true);
  };

  const reorderAllFields = (orderedFieldIds) => {
    setDraftForm((prev) => {
      if (!prev) return prev;
      const fieldMap = new Map(prev.fields.map((f) => [f.id, f]));
      const newFields = orderedFieldIds
        .map((id, idx) => {
          const field = fieldMap.get(id);
          return field ? { ...field, order: idx } : null;
        })
        .filter(Boolean);

      return {
        ...prev,
        fields: newFields,
      };
    });
    setHasChanges(true);
  };

  const saveDraft = async () => {
    if (!draftForm) return;
    setSaving(true);
    try {
      const res = await api.saveDraftForm(draftForm.fields, draftForm.name);
      if (res.success && res.data) {
        setDraftForm(res.data);
        setHasChanges(false);
        return { success: true, message: 'Draft saved successfully!' };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async () => {
    setSaving(true);
    try {
      const res = await api.deleteDraftForm();
      if (res.success && res.data) {
        setDraftForm(res.data);
        setHasChanges(false);
        return { success: true, message: res.message || 'Draft discarded and reset successfully!' };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async (changelog = '') => {
    if (!draftForm) return;
    setSaving(true);
    try {
      // First ensure draft is saved
      await api.saveDraftForm(draftForm.fields, draftForm.name);
      // Publish
      const res = await api.publishForm(changelog);
      if (res.success && res.data) {
        setHasChanges(false);
        await fetchDraftForm();
        await fetchVersions();
        return { success: true, message: res.message, data: res.data };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormBuilderContext.Provider
      value={{
        draftForm,
        loading,
        saving,
        hasChanges,
        selectedFieldId,
        setSelectedFieldId,
        versions,
        error,
        addField,
        updateField,
        deleteField,
        duplicateField,
        toggleFieldActive,
        moveField,
        reorderAllFields,
        saveDraft,
        deleteDraft,
        publishForm,
        fetchDraftForm,
        fetchVersions,
      }}
    >
      {children}
    </FormBuilderContext.Provider>
  );
};

export const useFormBuilder = () => {
  const context = useContext(FormBuilderContext);
  if (!context) throw new Error('useFormBuilder must be used within a FormBuilderProvider');
  return context;
};
