require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Sequence = require('../models/Sequence');
const CustomerForm = require('../models/CustomerForm');
const Customer = require('../models/Customer');
const { DEFAULT_INITIAL_FIELDS } = require('../controllers/formController');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Seed Users
    console.log('[Seed] Seeding Users...');
    await User.deleteMany({});

    const owner = await User.create({
      name: 'Vasantham Admin & Owner',
      email: 'owner@vasantham.com',
      password: 'admin123',
      role: 'owner',
      phone: '9840123456',
    });

    const employee = await User.create({
      name: 'Karthik Raja (Showroom Executive)',
      email: 'employee@vasantham.com',
      password: 'employee123',
      role: 'employee',
      phone: '9840987654',
    });

    console.log(`[Seed] Created Owner (${owner.email}) & Employee (${employee.email})`);

    // 2. Seed Sequence
    console.log('[Seed] Seeding Customer ID Sequence...');
    await Sequence.deleteMany({});
    const sequence = await Sequence.create({
      key: 'customer_id',
      prefix: 'CUS-',
      currentValue: 4,
      startValue: 1,
      padding: 6,
      step: 1,
      description: 'Main Vasantham Customer Code Sequence',
    });
    console.log(`[Seed] Initialized Sequence ${sequence.prefix}000001 (Current: ${sequence.currentValue})`);

    // 3. Seed Published Form & Main Draft Form with all 23 fields
    console.log('[Seed] Seeding 23-field Published Customer CRM Form and Draft...');
    await CustomerForm.deleteMany({});

    const publishedForm = await CustomerForm.create({
      name: 'Vasantham 23-Field CRM Form',
      version: 1,
      status: 'published',
      fields: DEFAULT_INITIAL_FIELDS,
      createdBy: owner._id,
      publishedBy: owner._id,
      publishedAt: new Date(),
      changelog: 'Official 23-field specification for Vasantham Tiles & Sanitary Wares showroom',
    });

    const draftForm = await CustomerForm.create({
      name: 'Draft Customer Form',
      version: 2,
      status: 'draft',
      fields: DEFAULT_INITIAL_FIELDS,
      createdBy: owner._id,
    });

    console.log(`[Seed] Created Form v1 (Published) & Draft v2 with ${DEFAULT_INITIAL_FIELDS.length} fields`);

    // 4. Seed Initial Sample Customers with all 23 fields
    console.log('[Seed] Seeding Sample Customers...');
    await Customer.deleteMany({});

    const sampleCustomers = [
      {
        customerId: 'CUS-000001',
        formVersion: 1,
        data: {
          entryDate: '2026-08-15',
          customerName: 'Sivaraman & Co (Siva Builders)',
          phone: '9876543210',
          location: 'Madurai Bye-pass Road',
          leadSource: 'Walk-in',
          salesperson: 'Karthik Raja',
          customerType: 'Building Owner',
          houseStage: 'Plastering',
          requirement: ['Tiles', 'Sanitary', 'Adhesive'],
          approxQuantity: 3200,
          tileBudget: 180000,
          sanitaryRequirement: 'Yes',
          adhesiveRequirement: 'Yes',
          quotationValue: 245000,
          quotationDate: '2026-08-16',
          status: 'Quotation',
          nextFollowUp: '2026-08-20',
          lastFollowUp: '2026-08-16',
          followUpCount: 2,
          orderValue: 0,
          lastReason: 'Reviewing 4x2 GVT tile catalogue and wall-hung commode models',
          crossSell: ['Grout & Epoxy', 'Tile Spacers & Levellers', 'Waterproofing Chemicals'],
        },
        createdBy: {
          userId: employee._id,
          name: employee.name,
          role: employee.role,
        },
      },
      {
        customerId: 'CUS-000002',
        formVersion: 1,
        data: {
          entryDate: '2026-08-12',
          customerName: 'Er. Murugesan (Sri Sai Builders)',
          phone: '9841234567',
          location: 'KK Nagar, Madurai',
          leadSource: 'Engineer',
          salesperson: 'Senthil Kumar',
          customerType: 'Architect',
          houseStage: 'Brickwork',
          requirement: ['Tiles', 'Sanitary'],
          approxQuantity: 5500,
          tileBudget: 420000,
          sanitaryRequirement: 'Yes',
          adhesiveRequirement: 'Yes',
          quotationValue: 510000,
          quotationDate: '2026-08-14',
          status: 'Negotiation',
          nextFollowUp: '2026-08-19',
          lastFollowUp: '2026-08-15',
          followUpCount: 3,
          orderValue: 0,
          lastReason: 'Requested 5% bulk discount for commercial complex flooring',
          crossSell: ['Waterproofing Chemicals', 'Bath Fittings & Faucets'],
        },
        createdBy: {
          userId: owner._id,
          name: owner.name,
          role: owner.role,
        },
      },
      {
        customerId: 'CUS-000003',
        formVersion: 1,
        data: {
          entryDate: '2026-08-10',
          customerName: 'M. Jayaprakash (Mason Head)',
          phone: '9444112233',
          location: 'Melur Town',
          leadSource: 'Referral',
          salesperson: 'Karthik Raja',
          customerType: 'Mason',
          houseStage: 'Painting',
          requirement: ['Tiles', 'Clipping', 'Adhesive'],
          approxQuantity: 1200,
          tileBudget: 75000,
          sanitaryRequirement: 'No',
          adhesiveRequirement: 'Yes',
          quotationValue: 88000,
          quotationDate: '2026-08-11',
          status: 'Order Confirmed',
          nextFollowUp: '2026-08-25',
          lastFollowUp: '2026-08-14',
          followUpCount: 4,
          orderValue: 88000,
          lastReason: 'Advance paid ₹25,000. Material delivery scheduled for Friday.',
          crossSell: ['Grout & Epoxy', 'Tile Spacers & Levellers'],
        },
        createdBy: {
          userId: employee._id,
          name: employee.name,
          role: employee.role,
        },
      },
      {
        customerId: 'CUS-000004',
        formVersion: 1,
        data: {
          entryDate: '2026-08-17',
          customerName: 'Dr. Anitha Meenakshi',
          phone: '9840556677',
          location: 'Anna Nagar West',
          leadSource: 'Walk-in',
          salesperson: 'Priya Dharshini',
          customerType: 'Building Owner',
          houseStage: 'Foundation',
          requirement: ['Tiles', 'Sanitary'],
          approxQuantity: 2800,
          tileBudget: 250000,
          sanitaryRequirement: 'Yes',
          adhesiveRequirement: 'No',
          quotationValue: 0,
          quotationDate: null,
          status: 'Newly Contacted',
          nextFollowUp: '2026-08-22',
          lastFollowUp: '2026-08-17',
          followUpCount: 1,
          orderValue: 0,
          lastReason: 'Initial showroom visit, exploring Italian marble finish tile collections',
          crossSell: ['Mirror Cabinets & Vanity', 'Bath Fittings & Faucets'],
        },
        createdBy: {
          userId: employee._id,
          name: employee.name,
          role: employee.role,
        },
      },
    ];

    await Customer.insertMany(sampleCustomers);
    console.log(`[Seed] Inserted ${sampleCustomers.length} showroom demo customers with full 23 fields.`);

    console.log('[Seed] Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
