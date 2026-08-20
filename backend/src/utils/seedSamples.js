require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Sequence = require('../models/Sequence');
const User = require('../models/User');
const CustomerForm = require('../models/CustomerForm');
const { DEFAULT_INITIAL_FIELDS } = require('../controllers/formController');

const sampleCustomers = [
  {
    customerId: 'CUS-000001',
    formVersion: 1,
    data: {
      customerId: 'CUS-000001',
      entryDate: '2026-08-01',
      customerName: 'Sivaraman & Co (Siva Builders)',
      phone: '9876543210',
      location: 'Madurai Bypass Road',
      leadSource: 'Walk-in',
      salesperson: 'Karthik Raja',
      customerType: 'Building Owner',
      houseStage: 'Plastering',
      requirement: ['Tiles', 'Sanitary', 'Adhesive'],
      approxQuantity: '2500 Sq.Ft',
      tileBudget: 245000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'Yes',
      quotationValue: 245000,
      quotationDate: '2026-08-02',
      status: 'Quotation',
      nextFollowUp: '2026-08-20',
      lastFollowUp: '2026-08-15',
      followUpCount: 2,
      orderValue: 0,
      lastReason: 'Reviewing tile catalogue for living room and master bath',
      crossSell: ['Grout & Epoxy', 'Tile Spacers & Levellers'],
    },
    createdBy: { name: 'Karthik Raja', role: 'owner' },
  },
  {
    customerId: 'CUS-000002',
    formVersion: 1,
    data: {
      customerId: 'CUS-000002',
      entryDate: '2026-08-03',
      customerName: 'Er. Murugesan (Sri Sai Builders)',
      phone: '9841234567',
      location: 'KK Nagar, Madurai',
      leadSource: 'Engineer',
      salesperson: 'Senthil Kumar',
      customerType: 'Architect',
      houseStage: 'Brickwork',
      requirement: ['Tiles', 'Sanitary', 'Clipping'],
      approxQuantity: '5000 Sq.Ft',
      tileBudget: 510000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'Yes',
      quotationValue: 510000,
      quotationDate: '2026-08-05',
      status: 'Negotiation',
      nextFollowUp: '2026-08-19',
      lastFollowUp: '2026-08-14',
      followUpCount: 3,
      orderValue: 0,
      lastReason: 'Bulk commercial rate discount discussion in progress',
      crossSell: ['Waterproofing Chemicals', 'Bath Fittings & Faucets'],
    },
    createdBy: { name: 'Senthil Kumar', role: 'employee' },
  },
  {
    customerId: 'CUS-000003',
    formVersion: 1,
    data: {
      customerId: 'CUS-000003',
      entryDate: '2026-08-05',
      customerName: 'M. Jayaprakash (Mason Head)',
      phone: '9444112233',
      location: 'Melur Town',
      leadSource: 'Contractor',
      salesperson: 'Karthik Raja',
      customerType: 'Mason',
      houseStage: 'Painting',
      requirement: ['Adhesive', 'Clipping'],
      approxQuantity: '1200 Sq.Ft',
      tileBudget: 88000,
      sanitaryRequirement: 'No',
      adhesiveRequirement: 'Yes',
      quotationValue: 88000,
      quotationDate: '2026-08-06',
      status: 'Order Confirmed',
      nextFollowUp: '2026-08-25',
      lastFollowUp: '2026-08-16',
      followUpCount: 1,
      orderValue: 88000,
      lastReason: 'Order booked and dispatch scheduled for Friday',
      crossSell: ['Tile Spacers & Levellers'],
    },
    createdBy: { name: 'Karthik Raja', role: 'owner' },
  },
  {
    customerId: 'CUS-000004',
    formVersion: 1,
    data: {
      customerId: 'CUS-000004',
      entryDate: '2026-08-08',
      customerName: 'Dr. Anitha Meenakshi',
      phone: '9840055443',
      location: 'Anna Nagar, Madurai',
      leadSource: 'Direct Walk-in',
      salesperson: 'Karthik Raja',
      customerType: 'Building Owner',
      houseStage: 'Flooring',
      requirement: ['Sanitary', 'CP Fittings'],
      approxQuantity: '1800 Sq.Ft',
      tileBudget: 360000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'Yes',
      quotationValue: 360000,
      quotationDate: '2026-08-09',
      status: 'Quotation',
      nextFollowUp: '2026-08-21',
      lastFollowUp: '2026-08-16',
      followUpCount: 2,
      orderValue: 0,
      lastReason: 'Selected Kohler sanitaryware setup',
      crossSell: ['Glass Enclosures', 'Vanity Cabinets'],
    },
    createdBy: { name: 'Karthik Raja', role: 'owner' },
  },
  {
    customerId: 'CUS-000005',
    formVersion: 1,
    data: {
      customerId: 'CUS-000005',
      entryDate: '2026-08-10',
      customerName: 'Mobile Realtime Test Customer',
      phone: '9894112244',
      location: 'TVS Nagar, Madurai',
      leadSource: 'Mobile App',
      salesperson: 'Senthil Kumar',
      customerType: 'Direct Client',
      houseStage: 'Tiling',
      requirement: ['Tiles', 'Grout'],
      approxQuantity: '1500 Sq.Ft',
      tileBudget: 175000,
      sanitaryRequirement: 'No',
      adhesiveRequirement: 'Yes',
      quotationValue: 175000,
      quotationDate: '2026-08-10',
      status: 'In Progress',
      nextFollowUp: '2026-08-22',
      lastFollowUp: '2026-08-17',
      followUpCount: 1,
      orderValue: 0,
      lastReason: 'Mobile QR enquiry created during site visit',
      crossSell: ['Epoxy Grout', 'Corner Profiles'],
    },
    createdBy: { name: 'Senthil Kumar', role: 'employee' },
  },
  {
    customerId: 'CUS-000006',
    formVersion: 1,
    data: {
      customerId: 'CUS-000006',
      entryDate: '2026-08-11',
      customerName: 'Vasanth Kumar (Greenfield Villa)',
      phone: '9840199887',
      location: 'Othakadai',
      leadSource: 'Architect',
      salesperson: 'Karthik Raja',
      customerType: 'Building Owner',
      houseStage: 'Flooring',
      requirement: ['Tiles', 'Sanitary'],
      approxQuantity: '3800 Sq.Ft',
      tileBudget: 420000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'Yes',
      quotationValue: 420000,
      quotationDate: '2026-08-12',
      status: 'Quotation',
      nextFollowUp: '2026-08-22',
      lastFollowUp: '2026-08-16',
      followUpCount: 2,
      orderValue: 0,
      lastReason: 'Comparing matte Italian vitrified tile samples',
      crossSell: ['Submersible Pump', 'Water Tank'],
    },
    createdBy: { name: 'Karthik Raja', role: 'owner' },
  },
  {
    customerId: 'CUS-000007',
    formVersion: 1,
    data: {
      customerId: 'CUS-000007',
      entryDate: '2026-08-12',
      customerName: 'Rajesh & Associates (Architects)',
      phone: '9840011223',
      location: 'Chokkikulam',
      leadSource: 'Architect',
      salesperson: 'Senthil Kumar',
      customerType: 'Architect',
      houseStage: 'Design Phase',
      requirement: ['Tiles', 'Sanitary', 'Adhesive', 'Clipping'],
      approxQuantity: '8000 Sq.Ft',
      tileBudget: 650000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'Yes',
      quotationValue: 650000,
      quotationDate: '2026-08-13',
      status: 'Negotiation',
      nextFollowUp: '2026-08-23',
      lastFollowUp: '2026-08-17',
      followUpCount: 4,
      orderValue: 0,
      lastReason: 'Commercial showroom flooring proposal under review',
      crossSell: ['Expansion Joint Strips'],
    },
    createdBy: { name: 'Senthil Kumar', role: 'employee' },
  },
  {
    customerId: 'CUS-000008',
    formVersion: 1,
    data: {
      customerId: 'CUS-000008',
      entryDate: '2026-08-14',
      customerName: 'Kannan Mason Works',
      phone: '9443322110',
      location: 'Sellur',
      leadSource: 'Contractor',
      salesperson: 'Karthik Raja',
      customerType: 'Mason',
      houseStage: 'Tiling',
      requirement: ['Adhesive'],
      approxQuantity: '600 Sq.Ft',
      tileBudget: 45000,
      sanitaryRequirement: 'No',
      adhesiveRequirement: 'Yes',
      quotationValue: 45000,
      quotationDate: '2026-08-14',
      status: 'Order Confirmed',
      nextFollowUp: '2026-08-24',
      lastFollowUp: '2026-08-17',
      followUpCount: 1,
      orderValue: 45000,
      lastReason: '50 bags MYK Laticrete tile adhesive delivered',
      crossSell: ['Notched Trowels'],
    },
    createdBy: { name: 'Karthik Raja', role: 'owner' },
  },
  {
    customerId: 'CUS-000009',
    formVersion: 1,
    data: {
      customerId: 'CUS-000009',
      entryDate: '2026-08-15',
      customerName: 'Kavitha Sundaram',
      phone: '9840233445',
      location: 'SS Colony',
      leadSource: 'Walk-in',
      salesperson: 'Senthil Kumar',
      customerType: 'Building Owner',
      houseStage: 'Plastering',
      requirement: ['Sanitary', 'CP Fittings'],
      approxQuantity: '1600 Sq.Ft',
      tileBudget: 195000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'No',
      quotationValue: 195000,
      quotationDate: '2026-08-16',
      status: 'In Progress',
      nextFollowUp: '2026-08-22',
      lastFollowUp: '2026-08-16',
      followUpCount: 1,
      orderValue: 0,
      lastReason: 'Shower panel & thermostat mixer quotation provided',
      crossSell: ['Towel Rails & Accessories'],
    },
    createdBy: { name: 'Senthil Kumar', role: 'employee' },
  },
  {
    customerId: 'CUS-000010',
    formVersion: 1,
    data: {
      customerId: 'CUS-000010',
      entryDate: '2026-08-16',
      customerName: 'Meenakshi Hospital Extension',
      phone: '9894012345',
      location: 'East Veli Street',
      leadSource: 'Builder',
      salesperson: 'Karthik Raja',
      customerType: 'Building Owner',
      houseStage: 'Painting',
      requirement: ['Tiles', 'Sanitary', 'Adhesive'],
      approxQuantity: '12000 Sq.Ft',
      tileBudget: 1200000,
      sanitaryRequirement: 'Yes',
      adhesiveRequirement: 'Yes',
      quotationValue: 1200000,
      quotationDate: '2026-08-17',
      status: 'Negotiation',
      nextFollowUp: '2026-08-21',
      lastFollowUp: '2026-08-17',
      followUpCount: 3,
      orderValue: 0,
      lastReason: 'Hospitality & anti-skid antibacterial tiles presentation',
      crossSell: ['Grout & Epoxy', 'Waterproofing Chemicals'],
    },
    createdBy: { name: 'Karthik Raja', role: 'owner' },
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vasantham_crm';

  await mongoose.connect(uri);
  console.log(`[Seed] Connected to database: ${uri}`);

  // 1. Seed Users (Owner & Employee)
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
  console.log(`[Seed] Seeded Users: Owner (${owner.email}) & Employee (${employee.email})`);

  // 2. Seed Customer Form Schema
  const existingForm = await CustomerForm.findOne({ status: 'published' });
  if (!existingForm) {
    await CustomerForm.create({
      name: 'Vasantham 23-Field CRM Form',
      version: 1,
      status: 'published',
      fields: DEFAULT_INITIAL_FIELDS,
      createdBy: owner._id,
      publishedBy: owner._id,
      publishedAt: new Date(),
      changelog: 'Official 23-field specification for Vasantham Tiles & Sanitary Wares showroom',
    });
    console.log(`[Seed] Seeded Published Customer CRM Form v1 with ${DEFAULT_INITIAL_FIELDS.length} fields`);
  }

  // 3. Clear existing and seed sample records
  await Customer.deleteMany({});
  console.log('[Seed] Cleared existing customer records');

  for (const item of sampleCustomers) {
    const doc = new Customer(item);
    await doc.save();
    console.log(`[Seed] Saved Customer: ${item.customerId} - ${item.data.customerName}`);
  }

  // 4. Update Sequence to 10
  await Sequence.findOneAndUpdate(
    { key: 'customer_id' },
    { $set: { currentValue: 10, prefix: 'CUS-', padding: 6, step: 1 } },
    { upsert: true }
  );
  await Sequence.findOneAndUpdate(
    { key: 'customer' },
    { $set: { currentValue: 10, prefix: 'CUS-', padding: 6, step: 1 } },
    { upsert: true }
  );
  console.log('[Seed] Updated Customer ID sequence currentValue to 10');

  console.log('🎉 Seed completed successfully! Users, Form Schema, and 10 customer records ready.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
