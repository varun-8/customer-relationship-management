const CustomerForm = require('../models/CustomerForm');
const User = require('../models/User');

// Helper: Sanitize field label (strip corrupted currency symbols and emojis)
const sanitizeLabel = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\s*\([₹\u20B9\ufffd?,/]+\)/gi, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu, '')
    .trim();
};

// Default initial 23-field specification for Vasantham Tiles & Sanitary Wares Customer CRM
const DEFAULT_INITIAL_FIELDS = [
  // 1. Customer ID
  {
    id: 'field_customer_id',
    name: 'customerId',
    label: 'Customer ID',
    type: 'auto_number',
    required: false,
    active: true,
    order: 0,
    placeholder: 'System-generated (e.g. CUS-000001)',
    description: 'System-generated unique ID',
    defaultValue: '',
    options: [],
    validation: {},
  },
  // 2. Date
  {
    id: 'field_date',
    name: 'entryDate',
    label: 'Date',
    type: 'date',
    required: true,
    active: true,
    order: 1,
    placeholder: 'YYYY-MM-DD',
    description: 'Entry / visit date',
    defaultValue: null,
    options: [],
    validation: {},
  },
  // 3. Customer Number / Name
  {
    id: 'field_customer_number',
    name: 'customerName',
    label: 'Customer Number / Name',
    type: 'text',
    required: true,
    active: true,
    order: 2,
    placeholder: 'e.g. Rajesh Kumar',
    description: 'Customer contact name or number',
    defaultValue: '',
    options: [],
    validation: { minLength: 2, maxLength: 100 },
  },
  // 4. Mobile Number
  {
    id: 'field_mobile_number',
    name: 'phone',
    label: 'Mobile Number',
    type: 'phone',
    required: true,
    active: true,
    order: 3,
    placeholder: '10-digit mobile number',
    description: 'Primary customer phone number',
    defaultValue: '',
    options: [],
    validation: { regex: '^[0-9]{10}$' },
  },
  // 5. Location
  {
    id: 'field_location',
    name: 'location',
    label: 'Location',
    type: 'text',
    required: false,
    active: true,
    order: 4,
    placeholder: 'e.g. Anna Nagar, Chennai',
    description: 'Customer or site address / area',
    defaultValue: '',
    options: [],
    validation: { maxLength: 200 },
  },
  // 6. Lead Source
  {
    id: 'field_lead_source',
    name: 'leadSource',
    label: 'Lead Source',
    type: 'select',
    required: false,
    active: true,
    order: 5,
    placeholder: '-- Select Lead Source --',
    description: 'Walk-in, Existing Customer, Engineer, Contractor, Builder, Referral, Other',
    defaultValue: 'Walk-in',
    options: [
      { label: 'Walk-in', value: 'Walk-in', isDefault: true },
      { label: 'Existing Customer', value: 'Existing Customer', isDefault: false },
      { label: 'Engineer', value: 'Engineer', isDefault: false },
      { label: 'Contractor', value: 'Contractor', isDefault: false },
      { label: 'Builder', value: 'Builder', isDefault: false },
      { label: 'Referral', value: 'Referral', isDefault: false },
      { label: 'Other', value: 'Other', isDefault: false },
    ],
    validation: {},
  },
  // 7. Salesperson
  {
    id: 'field_salesperson',
    name: 'salesperson',
    label: 'Salesperson',
    type: 'select',
    required: false,
    active: true,
    order: 6,
    placeholder: '-- Select Salesperson --',
    description: 'Salesperson list loaded from showroom staff',
    defaultValue: '',
    options: [],
    validation: {},
  },
  // 8. Customer Type
  {
    id: 'field_customer_type',
    name: 'customerType',
    label: 'Customer Type',
    type: 'select',
    required: true,
    active: true,
    order: 7,
    placeholder: '-- Select Customer Type --',
    description: 'Building Owner, Mason, Architect',
    defaultValue: 'Building Owner',
    options: [
      { label: 'Building Owner', value: 'Building Owner', isDefault: true },
      { label: 'Mason', value: 'Mason', isDefault: false },
      { label: 'Architect', value: 'Architect', isDefault: false },
    ],
    validation: {},
  },
  // 9. House Stage
  {
    id: 'field_house_stage',
    name: 'houseStage',
    label: 'House Stage',
    type: 'select',
    required: false,
    active: true,
    order: 8,
    placeholder: '-- Select Construction Stage --',
    description: 'Current construction progress',
    defaultValue: 'Plastering',
    options: [
      { label: 'Foundation', value: 'Foundation', isDefault: false },
      { label: 'Brickwork', value: 'Brickwork', isDefault: false },
      { label: 'Plastering', value: 'Plastering', isDefault: true },
      { label: 'Painting', value: 'Painting', isDefault: false },
      { label: 'Building Completion', value: 'Building Completion', isDefault: false },
    ],
    validation: {},
  },
  // 10. Requirement
  {
    id: 'field_requirement',
    name: 'requirement',
    label: 'Requirement',
    type: 'multiselect',
    required: false,
    active: true,
    order: 9,
    placeholder: 'Select primary requirements',
    description: 'Tiles, Sanitary, Adhesive / Epoxy, CP Fittings',
    defaultValue: ['Tiles', 'Sanitary'],
    options: [
      { label: 'Tiles', value: 'Tiles', isDefault: true },
      { label: 'Sanitary', value: 'Sanitary', isDefault: true },
      { label: 'Adhesive / Epoxy', value: 'Adhesive / Epoxy', isDefault: false },
      { label: 'CP Fittings', value: 'CP Fittings', isDefault: false },
    ],
    validation: {},
  },
  // 11. Approx. Quantity
  {
    id: 'field_approx_quantity',
    name: 'approxQuantity',
    label: 'Approx. Quantity (Sq.Ft / Units)',
    type: 'number',
    required: false,
    active: true,
    order: 10,
    placeholder: 'e.g. 1500',
    description: 'Quantity + unit (Square feet / pieces)',
    defaultValue: null,
    options: [],
    validation: { min: 0 },
  },
  // 12. Tile Budget
  {
    id: 'field_tile_budget',
    name: 'tileBudget',
    label: 'Tile Budget',
    type: 'currency',
    required: false,
    active: true,
    order: 11,
    placeholder: '75000',
    description: 'Allocated budget for tiles in ₹',
    defaultValue: null,
    options: [],
    validation: { currencySymbol: '₹', min: 0 },
  },
  // 13. Adhesive Requirement
  {
    id: 'field_adhesive_req',
    name: 'adhesiveRequirement',
    label: 'Adhesive Requirement',
    type: 'radio',
    required: false,
    active: true,
    order: 13,
    placeholder: '',
    description: 'Yes or No requirement for tile adhesive & chemical',
    defaultValue: 'Yes',
    options: [
      { label: 'Yes', value: 'Yes', isDefault: true },
      { label: 'No', value: 'No', isDefault: false },
    ],
    validation: {},
  },
  // 15. Quotation Value
  {
    id: 'field_quotation_val',
    name: 'quotationValue',
    label: 'Quotation Value',
    type: 'currency',
    required: false,
    active: true,
    order: 14,
    placeholder: '120000',
    description: 'Quotation amount provided in ₹',
    defaultValue: null,
    options: [],
    validation: { currencySymbol: '₹', min: 0 },
  },
  // 16. Quotation Date
  {
    id: 'field_quotation_date',
    name: 'quotationDate',
    label: 'Quotation Date',
    type: 'date',
    required: false,
    active: true,
    order: 15,
    placeholder: '',
    description: 'Date quotation was given',
    defaultValue: null,
    options: [],
    validation: {},
  },
  // 17. Status
  {
    id: 'field_status',
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    active: true,
    order: 16,
    placeholder: '-- Select Pipeline Status --',
    description: 'Deal pipeline stage',
    defaultValue: 'New Lead',
    options: [
      { label: 'New Lead', value: 'New Lead', isDefault: true },
      { label: 'Quotation', value: 'Quotation', isDefault: false },
      { label: 'Follow-up', value: 'Follow-up', isDefault: false },
      { label: 'Negotiation', value: 'Negotiation', isDefault: false },
      { label: 'Order Confirmed', value: 'Order Confirmed', isDefault: false },
      { label: 'Lost', value: 'Lost', isDefault: false },
      { label: 'Future Requirement', value: 'Future Requirement', isDefault: false },
    ],
    validation: {},
  },
  // 18. Next Follow-up
  {
    id: 'field_next_follow_up',
    name: 'nextFollowUp',
    label: 'Next Follow-up',
    type: 'date',
    required: false,
    active: true,
    order: 17,
    placeholder: '',
    description: 'Next scheduled follow-up date',
    defaultValue: null,
    options: [],
    validation: {},
  },
  // 19. Last Follow-up
  {
    id: 'field_last_follow_up',
    name: 'lastFollowUp',
    label: 'Last Follow-up',
    type: 'date',
    required: false,
    active: true,
    readOnly: true,
    order: 18,
    placeholder: 'Auto-updated upon follow-up',
    description: 'Most recent follow-up date (auto-managed)',
    defaultValue: null,
    options: [],
    validation: {},
  },
  // 20. Follow-up Count
  {
    id: 'field_follow_up_count',
    name: 'followUpCount',
    label: 'Follow-up Count',
    type: 'number',
    required: false,
    active: true,
    readOnly: true,
    order: 19,
    placeholder: '0',
    description: 'Number of showroom interactions (auto-managed)',
    defaultValue: 0,
    options: [],
    validation: { min: 0 },
  },
  // 21. Order Value
  {
    id: 'field_order_value',
    name: 'orderValue',
    label: 'Order Value',
    type: 'currency',
    required: false,
    active: true,
    order: 20,
    placeholder: '0',
    description: 'Confirmed order revenue in ₹',
    defaultValue: null,
    options: [],
    validation: { currencySymbol: '₹', min: 0 },
  },
  // 22. Last Reason
  {
    id: 'field_last_reason',
    name: 'lastReason',
    label: 'Last Reason / Interaction Notes',
    type: 'text',
    required: false,
    active: true,
    order: 21,
    placeholder: 'Reason for latest interaction / status update',
    description: 'Reason for latest interaction/status',
    defaultValue: '',
    options: [],
    validation: { maxLength: 500 },
  },
  // 23. Cross-sell
  {
    id: 'field_cross_sell',
    name: 'crossSell',
    label: 'Cross-sell Products',
    type: 'multiselect',
    required: false,
    active: true,
    order: 22,
    placeholder: 'Select recommended products',
    description: 'Products / services recommended or sold',
    defaultValue: [],
    options: [
      { label: 'Grout & Epoxy', value: 'Grout & Epoxy', isDefault: false },
      { label: 'Tile Spacers & Levellers', value: 'Tile Spacers & Levellers', isDefault: false },
      { label: 'Waterproofing Chemicals', value: 'Waterproofing Chemicals', isDefault: false },
      { label: 'Bath Fittings & Faucets', value: 'Bath Fittings & Faucets', isDefault: false },
      { label: 'Kitchen Sinks', value: 'Kitchen Sinks', isDefault: false },
      { label: 'Mirror Cabinets & Vanity', value: 'Mirror Cabinets & Vanity', isDefault: false },
    ],
    validation: {},
  },
];

// @desc Get active published customer form (used by Mobile & Desktop Add/Edit/List)
// @route GET /api/customer-form
const getActiveForm = async (req, res) => {
  try {
    let activeForm = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });

    if (!activeForm) {
      // Seed default published form if none exists
      activeForm = await CustomerForm.create({
        name: 'Vasantham Standard Customer Form',
        version: 1,
        status: 'published',
        fields: DEFAULT_INITIAL_FIELDS,
        publishedAt: new Date(),
      });
    }

    // Sort fields by order
    activeForm.fields.sort((a, b) => a.order - b.order);

    // Dynamically inject live active sales executives into the salesperson field options
    const users = await User.find({ active: { $ne: false } }).select('name role').sort({ role: 1, name: 1 }).lean();
    const liveStaffOptions = users
      .filter((u) => u.role !== 'owner')
      .map((u, idx) => ({
        label: u.name,
        value: u.name,
        isDefault: idx === 0,
      }));

    const formObj = activeForm.toObject ? activeForm.toObject() : JSON.parse(JSON.stringify(activeForm));
    formObj.fields = (formObj.fields || []).map((f) => {
      const updated = { ...f };
      if (updated.label) {
        updated.label = sanitizeLabel(updated.label);
      }
      if (updated.name === 'salesperson' && liveStaffOptions.length > 0) {
        updated.options = liveStaffOptions;
        updated.defaultValue = liveStaffOptions[0]?.value || '';
      }
      return updated;
    });

    res.json({
      success: true,
      data: formObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get draft form for Form Builder
// @route GET /api/customer-form/draft
const getDraftForm = async (req, res) => {
  try {
    let draftForm = await CustomerForm.findOne({ status: 'draft' }).sort({ updatedAt: -1 });

    if (!draftForm) {
      // If no draft exists, copy from the latest published version
      const activeForm = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });

      const fields = activeForm ? activeForm.fields : DEFAULT_INITIAL_FIELDS;
      const nextVersion = activeForm ? activeForm.version + 1 : 1;

      draftForm = await CustomerForm.create({
        name: 'Draft Customer Form',
        version: nextVersion,
        status: 'draft',
        fields: fields,
      });
    }

    const draftObj = draftForm.toObject ? draftForm.toObject() : JSON.parse(JSON.stringify(draftForm));
    draftObj.fields.sort((a, b) => a.order - b.order);
    draftObj.fields = (draftObj.fields || []).map((f) => ({
      ...f,
      label: sanitizeLabel(f.label),
    }));

    res.json({
      success: true,
      data: draftObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Save draft form fields (Owner/Admin only)
// @route POST /api/customer-form/draft
const saveDraftForm = async (req, res) => {
  try {
    const { fields, name } = req.body;

    if (!Array.isArray(fields)) {
      return res.status(400).json({ success: false, message: 'Fields must be an array' });
    }

    // Deduplicate fields by name and re-index order
    const seenNames = new Set();
    const uniqueFields = [];
    for (const f of fields) {
      const fieldName = f.name?.trim();
      if (fieldName && !seenNames.has(fieldName)) {
        seenNames.add(fieldName);
        uniqueFields.push(f);
      }
    }

    const orderedFields = uniqueFields.map((f, idx) => ({
      ...f,
      order: idx,
    }));

    let draftForm = await CustomerForm.findOne({ status: 'draft' });

    if (!draftForm) {
      const activeForm = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });
      draftForm = new CustomerForm({
        name: name || 'Draft Customer Form',
        version: activeForm ? activeForm.version + 1 : 1,
        status: 'draft',
        createdBy: req.user?._id,
      });
    }

    draftForm.fields = orderedFields;
    if (name) draftForm.name = name;
    draftForm.updatedAt = new Date();

    await draftForm.save();

    res.json({
      success: true,
      message: 'Draft form saved successfully',
      data: draftForm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Publish draft form as active version (Owner/Admin only)
// @route POST /api/customer-form/publish
const publishForm = async (req, res) => {
  try {
    const { changelog } = req.body;

    const draftForm = await CustomerForm.findOne({ status: 'draft' });

    if (!draftForm || draftForm.fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No draft form available to publish' });
    }

    const latestPublished = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });
    const nextVersion = latestPublished ? latestPublished.version + 1 : 1;

    // Create a new published document
    const newPublishedForm = await CustomerForm.create({
      name: draftForm.name || `Customer Form v${nextVersion}`,
      version: nextVersion,
      status: 'published',
      fields: draftForm.fields,
      publishedBy: req.user?._id,
      publishedAt: new Date(),
      changelog: changelog || `Published version ${nextVersion}`,
    });

    // Delete the draft since it is now published
    await CustomerForm.deleteOne({ _id: draftForm._id });

    res.json({
      success: true,
      message: `Customer Form v${nextVersion} published successfully! All mobile and desktop clients will now use this configuration.`,
      data: newPublishedForm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a new field to draft
// @route POST /api/customer-form/fields
const addField = async (req, res) => {
  try {
    const fieldData = req.body;

    if (!fieldData.name || !fieldData.label || !fieldData.type) {
      return res.status(400).json({ success: false, message: 'Field name, label, and type are required' });
    }

    // Ensure draft form exists
    let draftForm = await CustomerForm.findOne({ status: 'draft' });
    if (!draftForm) {
      const activeForm = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });
      draftForm = await CustomerForm.create({
        name: 'Draft Customer Form',
        version: activeForm ? activeForm.version + 1 : 1,
        status: 'draft',
        fields: activeForm ? activeForm.fields : DEFAULT_INITIAL_FIELDS,
      });
    }

    // Generate unique field ID if missing
    const fieldId = fieldData.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newOrder = draftForm.fields.length;

    const newField = {
      ...fieldData,
      id: fieldId,
      order: newOrder,
      active: fieldData.active !== undefined ? fieldData.active : true,
      required: fieldData.required !== undefined ? fieldData.required : false,
      options: fieldData.options || [],
      validation: fieldData.validation || {},
    };

    draftForm.fields.push(newField);
    draftForm.updatedAt = new Date();
    await draftForm.save();

    res.status(201).json({
      success: true,
      message: 'Field added to draft successfully',
      data: draftForm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update an existing field in draft
// @route PUT /api/customer-form/fields/:id
const updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let draftForm = await CustomerForm.findOne({ status: 'draft' });
    if (!draftForm) {
      return res.status(404).json({ success: false, message: 'Draft form not found' });
    }

    const fieldIndex = draftForm.fields.findIndex((f) => f.id === id);
    if (fieldIndex === -1) {
      return res.status(404).json({ success: false, message: 'Field not found in draft' });
    }

    draftForm.fields[fieldIndex] = {
      ...draftForm.fields[fieldIndex].toObject(),
      ...updateData,
      id, // Preserve ID
    };

    draftForm.updatedAt = new Date();
    await draftForm.save();

    res.json({
      success: true,
      message: 'Field updated successfully in draft',
      data: draftForm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete a field from draft
// @route DELETE /api/customer-form/fields/:id
const deleteField = async (req, res) => {
  try {
    const { id } = req.params;

    let draftForm = await CustomerForm.findOne({ status: 'draft' });
    if (!draftForm) {
      return res.status(404).json({ success: false, message: 'Draft form not found' });
    }

    draftForm.fields = draftForm.fields.filter((f) => f.id !== id);

    // Re-index remaining fields
    draftForm.fields.forEach((f, idx) => {
      f.order = idx;
    });

    draftForm.updatedAt = new Date();
    await draftForm.save();

    res.json({
      success: true,
      message: 'Field removed from draft successfully',
      data: draftForm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Reorder fields in draft
// @route PUT /api/customer-form/reorder
const reorderFields = async (req, res) => {
  try {
    const { fieldIds } = req.body;

    if (!Array.isArray(fieldIds)) {
      return res.status(400).json({ success: false, message: 'fieldIds array is required' });
    }

    let draftForm = await CustomerForm.findOne({ status: 'draft' });
    if (!draftForm) {
      return res.status(404).json({ success: false, message: 'Draft form not found' });
    }

    const fieldMap = new Map();
    draftForm.fields.forEach((f) => fieldMap.set(f.id, f));

    const reordered = [];
    fieldIds.forEach((id, idx) => {
      if (fieldMap.has(id)) {
        const field = fieldMap.get(id);
        field.order = idx;
        reordered.push(field);
        fieldMap.delete(id);
      }
    });

    // Append any fields not in the fieldIds array at the end
    fieldMap.forEach((field) => {
      field.order = reordered.length;
      reordered.push(field);
    });

    draftForm.fields = reordered;
    draftForm.updatedAt = new Date();
    await draftForm.save();

    res.json({
      success: true,
      message: 'Fields reordered successfully',
      data: draftForm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all historical published versions
// @route GET /api/customer-form/versions
const getFormVersions = async (req, res) => {
  try {
    const versions = await CustomerForm.find({ status: 'published' })
      .select('version name status fields publishedAt changelog')
      .sort({ version: -1 })
      .populate('publishedBy', 'name email role');

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete/discard current draft form and reset to latest published version
// @route DELETE /api/customer-form/draft
const deleteDraftForm = async (req, res) => {
  try {
    await CustomerForm.deleteMany({ status: 'draft' });

    // Re-initialize draft from active published version
    const activeForm = await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });
    const nextVersion = activeForm ? activeForm.version + 1 : 1;

    const freshDraft = await CustomerForm.create({
      name: 'Draft Customer Form',
      version: nextVersion,
      status: 'draft',
      fields: activeForm ? activeForm.fields : DEFAULT_INITIAL_FIELDS,
      createdBy: req.user?._id,
    });

    freshDraft.fields.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      message: 'Draft form discarded successfully and reset to latest published version',
      data: freshDraft,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveForm,
  getDraftForm,
  saveDraftForm,
  publishForm,
  deleteDraftForm,
  addField,
  updateField,
  deleteField,
  reorderFields,
  getFormVersions,
  DEFAULT_INITIAL_FIELDS,
};
