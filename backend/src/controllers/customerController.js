const Customer = require('../models/Customer');
const CustomerForm = require('../models/CustomerForm');
const { generateNextId } = require('../utils/idGenerator');

// @desc Get all customers with dynamic search, filter, sort & pagination
// @route GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      customerType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Date range filter with validation
    const isValidDate = (d) => d && d !== 'undefined' && d !== 'null' && !isNaN(new Date(d).getTime());
    if (isValidDate(startDate) || isValidDate(endDate)) {
      query.createdAt = {};
      if (isValidDate(startDate)) query.createdAt.$gte = new Date(startDate);
      if (isValidDate(endDate)) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Customer Type filter if provided
    if (customerType && customerType !== 'all' && customerType !== 'undefined') {
      query['data.customerType'] = customerType;
    }

    // Status filter if provided
    if (status && status !== 'all' && status !== 'undefined') {
      query['data.status'] = status;
    }

    // Dynamic search across Customer ID, and dynamic data fields
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerId: searchRegex },
        { 'data.customerName': searchRegex },
        { 'data.phone': searchRegex },
        { 'data.location': searchRegex },
        { 'data.salesperson': searchRegex },
        { 'data.status': searchRegex },
        { 'data.houseStage': searchRegex },
        { 'data.email': searchRegex },
        { 'data.customerType': searchRegex },
        { 'data.requirements': searchRegex },
        { notes: searchRegex },
      ];
    }

    // Role-based record scoping for employees (view only their own records)
    if (req.user && req.user.role === 'employee') {
      const firstName = req.user.name ? req.user.name.split(' ')[0] : '';
      const employeeFilter = {
        $or: [
          { 'createdBy.userId': req.user._id },
          { 'data.salesperson': req.user.name },
          ...(firstName ? [{ 'data.salesperson': new RegExp(firstName, 'i') }] : []),
        ],
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, employeeFilter];
        delete query.$or;
      } else {
        query.$or = employeeFilter.$or;
      }
    }

    // Build sort
    const sort = {};
    const direction = sortOrder === 'asc' ? 1 : -1;
    if (sortBy.startsWith('data.')) {
      sort[sortBy] = direction;
    } else {
      sort[sortBy] = direction;
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy.userId', 'name email role')
      .lean();

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single customer by ID
// @route GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { customerId: id }],
    }).lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Also fetch the form configuration used by this customer or active form
    const formConfig = await CustomerForm.findOne({ version: customer.formVersion })
      || await CustomerForm.findOne({ status: 'published' }).sort({ version: -1 });

    res.json({
      success: true,
      data: customer,
      formConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create a new customer (Atomic Customer ID generation + dynamic data)
// @route POST /api/customers
const createCustomer = async (req, res) => {
  try {
    // Generate guaranteed unique atomic Customer ID
    const nextSeq = await generateNextId('customer_id');
    const customerId = nextSeq.id;

    // req.sanitizedCustomerData was verified & prepared by validateCustomerData middleware
    const customerData = req.sanitizedCustomerData || req.body.data || {};
    const formVersion = req.activeFormVersion || 1;

    const customer = await Customer.create({
      customerId,
      formVersion,
      data: customerData,
      status: customerData.status || req.body.status || 'New Lead',
      notes: req.body.notes || '',
      createdBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Showroom Employee',
        role: req.user?.role || 'employee',
      },
    });


    res.status(201).json({
      success: true,
      message: `Customer ${customerId} created successfully`,
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update customer dynamic information
// @route PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { customerId: id }],
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customerData = req.sanitizedCustomerData || req.body.data || {};

    // Safely extract existing data regardless of whether it is a Mongoose Map, standard Map, or plain JS object
    let existingData = {};
    if (customer.data) {
      if (customer.data instanceof Map) {
        existingData = Object.fromEntries(customer.data);
      } else if (typeof customer.data.toObject === 'function') {
        existingData = customer.data.toObject();
      } else if (typeof customer.data === 'object') {
        existingData = { ...customer.data };
      }
    }

    // Merge existing data with new updated fields
    const mergedData = { ...existingData, ...customerData };

    customer.data = mergedData;
    customer.markModified('data');

    if (req.body.notes !== undefined) customer.notes = req.body.notes;
    if (req.body.status) {
      customer.status = req.body.status;
    } else if (mergedData.status) {
      customer.status = mergedData.status;
    }

    customer.updatedBy = {
      userId: req.user?._id,
      name: req.user?.name || 'Staff',
      role: req.user?.role || 'employee',
    };
    customer.updatedAt = new Date();

    await customer.save();

    res.json({
      success: true,
      message: `Customer ${customer.customerId} updated successfully`,
      data: customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete a customer
// @route DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is an employee - employees are forbidden from deleting records
    if (req.user && req.user.role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Showroom salespersons and employees are not permitted to delete customer records.',
      });
    }

    const customer = await Customer.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { customerId: id }],
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: `Customer ${customer.customerId} removed successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Lookup customer by phone number to detect repeat/existing customers
// @route GET /api/customers/lookup-phone/:phone
const lookupCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.json({ success: true, exists: false });
    }

    const last10 = cleanPhone.slice(-10);

    // Search for any customer matching the 10-digit number
    const matchingCustomers = await Customer.find({
      'data.phone': { $regex: last10 },
    }).sort({ createdAt: -1 }).lean();

    if (!matchingCustomers || matchingCustomers.length === 0) {
      return res.json({ success: true, exists: false });
    }

    const latestDoc = matchingCustomers[0];
    const d = latestDoc.data instanceof Map ? Object.fromEntries(latestDoc.data) : (latestDoc.data || {});

    // Count past orders
    const pastOrders = matchingCustomers.filter((c) => {
      const cd = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
      return cd.status === 'Order Confirmed';
    });

    res.json({
      success: true,
      exists: true,
      count: matchingCustomers.length,
      customer: {
        _id: latestDoc._id,
        customerId: latestDoc.customerId,
        customerName: d.customerName || 'Existing Customer',
        customerType: d.customerType || 'Building Owner',
        phone: d.phone,
        location: d.location || '',
        salesperson: d.salesperson || '',
        leadSource: d.leadSource || 'Walk-in',
        tileBudget: d.tileBudget || '',
        lastOrderValue: d.orderValue || d.quotationValue || 0,
        pastOrdersCount: pastOrders.length,
        status: d.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Bulk import customers from CSV/JSON and update ID sequence counter
// @route POST /api/customers/bulk-import
const bulkImportCustomers = async (req, res) => {
  try {
    const { rows = [] } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No customer data rows provided for import.' });
    }

    const Sequence = require('../models/Sequence');
    let successCount = 0;
    let maxIdVal = 0;

    let seqDoc = await Sequence.findOne({ key: 'customer_id' });
    if (!seqDoc) {
      seqDoc = await Sequence.create({
        key: 'customer_id',
        prefix: 'CUS-',
        currentValue: 1,
        startValue: 1,
        padding: 6,
        step: 1,
      });
    }

    let currentSeqNum = seqDoc.currentValue;
    const docsToInsert = [];

    for (const item of rows) {
      const customerData = item.data ? (item.data instanceof Map ? Object.fromEntries(item.data) : item.data) : item;
      
      let customerId = item.customerId || customerData.customerId;
      if (!customerId) {
        currentSeqNum++;
        const padded = String(currentSeqNum).padStart(seqDoc.padding || 6, '0');
        customerId = `${seqDoc.prefix || 'CUS-'}${padded}`;
      } else {
        const numMatch = customerId.match(/\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          if (num > maxIdVal) maxIdVal = num;
        }
      }

      docsToInsert.push({
        customerId,
        formVersion: item.formVersion || 1,
        data: customerData,
        notes: item.notes || customerData.notes || 'Imported via Data Hub',
        createdBy: {
          userId: req.user?._id,
          name: req.user?.name || 'Showroom Owner',
          role: req.user?.role || 'owner',
        },
      });
      successCount++;
    }

    if (docsToInsert.length > 0) {
      const bulkOps = docsToInsert.map((doc) => ({
        updateOne: {
          filter: { customerId: doc.customerId },
          update: {
            $set: {
              formVersion: doc.formVersion,
              data: doc.data,
              notes: doc.notes,
              updatedBy: doc.createdBy,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              customerId: doc.customerId,
              createdBy: doc.createdBy,
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await Customer.bulkWrite(bulkOps, { ordered: false });

      const newMax = Math.max(currentSeqNum, maxIdVal);
      await Sequence.findOneAndUpdate(
        { key: 'customer_id' },
        { $set: { currentValue: newMax } },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      importedCount: successCount,
      message: `Successfully bulk imported ${successCount} records into CRM database!`,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  lookupCustomerByPhone,
  bulkImportCustomers,
};
