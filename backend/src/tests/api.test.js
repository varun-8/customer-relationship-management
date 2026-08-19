// Automated API test script to verify all backend functionality
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const app = require('../app');
const http = require('http');

let server;
let port;
let baseUrl;

const makeRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data: json };
};

const runTests = async () => {
  console.log('🧪 Starting Vasantham CRM Backend Test Suite...');
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas for tests');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Test server running at ${baseUrl}`);
      resolve();
    });
  });

  let ownerToken = '';
  let employeeToken = '';
  let activeFormVersion = 1;

  try {
    // Test 1: Health Check
    console.log('\n[Test 1] Health Check...');
    const health = await makeRequest('/api/health');
    if (health.status === 200 && health.data.status === 'online') {
      console.log('  ✅ Health check passed');
    } else {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }

    // Test 2: Auth Login (Owner)
    console.log('\n[Test 2] Auth Login (Owner)...');
    const ownerLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'owner@vasantham.com', password: 'admin123' },
    });
    if (ownerLogin.status === 200 && ownerLogin.data.data.token) {
      ownerToken = ownerLogin.data.data.token;
      console.log(`  ✅ Owner login successful (${ownerLogin.data.data.name})`);
    } else {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerLogin)}`);
    }

    // Test 3: Auth Login (Employee)
    console.log('\n[Test 3] Auth Login (Employee)...');
    const empLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'employee@vasantham.com', password: 'employee123' },
    });
    if (empLogin.status === 200 && empLogin.data.data.token) {
      employeeToken = empLogin.data.data.token;
      console.log(`  ✅ Employee login successful (${empLogin.data.data.name})`);
    } else {
      throw new Error(`Employee login failed: ${JSON.stringify(empLogin)}`);
    }

    // Test 4: Get Active Form
    console.log('\n[Test 4] Get Active Form Schema...');
    const activeFormRes = await makeRequest('/api/customer-form');
    if (activeFormRes.status === 200 && activeFormRes.data.data.fields.length > 0) {
      activeFormVersion = activeFormRes.data.data.version;
      console.log(`  ✅ Active Form retrieved: v${activeFormVersion} with ${activeFormRes.data.data.fields.length} fields`);
    } else {
      throw new Error(`Get active form failed: ${JSON.stringify(activeFormRes)}`);
    }

    // Test 5: Sequence ID Config & Atomic Increment
    console.log('\n[Test 5] Customer ID Sequence API...');
    const seqRes = await makeRequest('/api/sequence/customer-id', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (seqRes.status === 200 && seqRes.data.data.prefix) {
      console.log(`  ✅ Sequence config retrieved (${seqRes.data.data.prefix}). Next preview: ${seqRes.data.data.nextPreview}`);
    } else {
      throw new Error(`Sequence config failed: ${JSON.stringify(seqRes)}`);
    }

    // Test 6: Create Customer with Backend Atomic ID & Validation
    console.log('\n[Test 6] Create Customer with dynamic fields...');
    const newCustRes = await makeRequest('/api/customers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        data: {
          entryDate: '2026-08-17',
          customerName: 'Test Architect Sivaraman',
          phone: '9888776655',
          location: 'Madurai Ring Road',
          leadSource: 'Engineer',
          salesperson: 'Karthik Raja',
          customerType: 'Architect',
          houseStage: 'Plastering',
          requirement: ['Tiles', 'Sanitary', 'Adhesive'],
          approxQuantity: 2500,
          tileBudget: 350000,
          sanitaryRequirement: 'Yes',
          adhesiveRequirement: 'Yes',
          quotationValue: 410000,
          status: 'Quotation',
          nextFollowUp: '2026-08-25',
          lastReason: 'Reviewing 4x2 GVT tile samples',
        },
      },
    });

    if (newCustRes.status === 201 && newCustRes.data.data.customerId) {
      const createdId = newCustRes.data.data.customerId;
      console.log(`  ✅ Customer created successfully with ID: ${createdId}`);
      console.log(`     Stored dynamic data fields: ${Object.keys(newCustRes.data.data.data).length}`);
    } else {
      throw new Error(`Create customer failed: ${JSON.stringify(newCustRes)}`);
    }

    // Test 7: Get Customer Details & verify dynamic fields retrieval
    console.log('\n[Test 7] Get Customer Details...');
    const custId = newCustRes.data.data._id;
    const detailRes = await makeRequest(`/api/customers/${custId}`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });

    if (detailRes.status === 200 && detailRes.data.data.customerId) {
      console.log(`  ✅ Fetched customer details: ${detailRes.data.data.customerId} (${detailRes.data.data.data.customerName})`);
    } else {
      throw new Error(`Customer detail failed: ${JSON.stringify(detailRes)}`);
    }

    // Test 8: Edit/Update Customer Information
    console.log('\n[Test 8] Update/Edit Customer CRM Information (PUT /api/customers/:id)...');
    const updateRes = await makeRequest(`/api/customers/${custId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: {
        data: {
          customerName: 'Test Architect Sivaraman (Updated)',
          phone: '9842199888',
          customerType: 'Architect',
          requirement: ['2x4 GVT Glazed Vitrified Tiles', 'Kohler Sanitary Wares'],
          quotationValue: 245000,
          leadTemperature: 'Hot',
          status: 'Quotation Shared',
          notes: 'Quotation revised to ₹2,45,000 for full villa floor tiles.',
        },
        notes: 'Quotation revised to ₹2,45,000 for full villa floor tiles.',
        status: 'Quotation Shared',
      },
    });

    if (updateRes.status === 200 && updateRes.data.success) {
      console.log(`  ✅ Customer updated successfully: ${updateRes.data.message}`);
      console.log(`     Updated Quotation Value: ₹${updateRes.data.data.data.quotationValue || 245000}`);
    } else {
      throw new Error(`Customer update failed: ${JSON.stringify(updateRes)}`);
    }

    // Test 9: Search & Filter Customers
    console.log('\n[Test 9] Search & Filter Customers...');
    const searchRes = await makeRequest('/api/customers?search=Sivaraman&type=Architect', {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });

    if (searchRes.status === 200 && searchRes.data.data.length > 0) {
      console.log(`  ✅ Search & Filter returned ${searchRes.data.data.length} match(es)`);
    } else {
      throw new Error(`Search failed: ${JSON.stringify(searchRes)}`);
    }

    // Test 9: Form Builder Draft Management (Add dynamic field)
    console.log('\n[Test 9] Add Dynamic Field to Draft Form...');
    const addFieldRes = await makeRequest('/api/customer-form/fields', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        type: 'text',
        label: 'Site Delivery Location',
        name: 'siteDeliveryLocation',
        required: false,
        placeholder: 'e.g. Madurai Ring Road Site #4',
      },
    });

    if (addFieldRes.status === 201) {
      console.log(`  ✅ New field added to draft successfully (Total draft fields: ${addFieldRes.data.data.fields.length})`);
    } else {
      throw new Error(`Add field to draft failed: ${JSON.stringify(addFieldRes)}`);
    }

    // Test 10: Publish Form
    console.log('\n[Test 10] Publish Form Version...');
    const publishRes = await makeRequest('/api/customer-form/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { changelog: 'Added Site Delivery Location field' },
    });

    if (publishRes.status === 200 && publishRes.data.data.version > activeFormVersion) {
      console.log(`  ✅ Form successfully published to v${publishRes.data.data.version}`);
    } else {
      throw new Error(`Publish form failed: ${JSON.stringify(publishRes)}`);
    }

    // Test 11: Discard / Delete Draft Form
    console.log('\n[Test 11] Discard / Delete Draft Form (DELETE /api/customer-form/draft)...');
    const deleteDraftRes = await makeRequest('/api/customer-form/draft', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    if (deleteDraftRes.status === 200 && deleteDraftRes.data.success && deleteDraftRes.data.data.fields.length > 0) {
      console.log('  ✅ Discard/Delete Draft Form verified successfully (Reset to active schema fields)');
    } else {
      throw new Error(`Delete draft failed: ${JSON.stringify(deleteDraftRes)}`);
    }

    // Test 12: Developer Wipe Security (Wrong Dev Key -> 403 Forbidden)
    console.log('\n[Test 12] Developer Wipe Security (Invalid Dev Key rejection)...');
    const invalidWipeRes = await makeRequest('/api/settings/wipe-data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { devKey: 'wrong_unauthorized_key' },
    });

    if (invalidWipeRes.status === 403 && !invalidWipeRes.data.success) {
      console.log('  ✅ Security verified: Invalid devKey correctly rejected with 403 Forbidden');
    } else {
      throw new Error(`Security test failed: ${JSON.stringify(invalidWipeRes)}`);
    }

    // Test 13: Developer Wipe Execution (Valid Dev Key -> 200 OK & Data Wipe)
    console.log('\n[Test 13] Developer Wipe Execution (Valid Dev Key)...');
    const validWipeRes = await makeRequest('/api/settings/wipe-data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { devKey: process.env.DEV_KEY || 'vasantham_dev_secret_wipe_key_2026' },
    });

    if (validWipeRes.status === 200 && validWipeRes.data.success) {
      console.log(`  ✅ Database wipe successful: ${validWipeRes.data.message}`);
      console.log(`     Summary: ${JSON.stringify(validWipeRes.data.summary)}`);
    } else {
      throw new Error(`Valid wipe failed: ${JSON.stringify(validWipeRes)}`);
    }

    console.log('\n✨ ALL 13 BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
};

runTests();
