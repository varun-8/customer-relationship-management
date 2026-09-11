const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vasantham_crm');
  const formsColl = mongoose.connection.collection('customerforms');
  const forms = await formsColl.find({}).toArray();
  console.log('Migrating', forms.length, 'forms...');

  for (const form of forms) {
    let fields = form.fields || [];
    // 1. Remove sanitaryRequirement
    fields = fields.filter(f => f.name !== 'sanitaryRequirement' && f.id !== 'field_sanitary_req');

    // 2. Requirement options & 3. Status options & 4. Readonly fields
    fields = fields.map(f => {
      if (f.name === 'requirement') {
        const opts = (f.options || []).map(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          if (val === 'Clipping') return { label: 'CP Fittings', value: 'CP Fittings', isDefault: false };
          if (val === 'Adhesive') return { label: 'Adhesive / Epoxy', value: 'Adhesive / Epoxy', isDefault: false };
          return opt;
        });
        return { ...f, options: opts, description: 'Tiles, Sanitary, Adhesive / Epoxy, CP Fittings' };
      }

      if (f.name === 'status') {
        let opts = (f.options || []).filter(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          return val !== 'Walk-in';
        }).map(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          if (val === 'Newly Contacted') return { label: 'New Lead', value: 'New Lead', isDefault: true };
          return opt;
        });
        return { ...f, defaultValue: 'New Lead', options: opts };
      }

      if (f.name === 'lastFollowUp') {
        return { ...f, readOnly: true, placeholder: 'Auto-updated upon follow-up', description: 'Most recent follow-up date (auto-managed)' };
      }
      if (f.name === 'followUpCount') {
        return { ...f, readOnly: true, placeholder: '0', description: 'Number of showroom interactions (auto-managed)' };
      }

      return f;
    });

    await formsColl.updateOne({ _id: form._id }, { $set: { fields } });
  }

  // Update existing customers with Newly Contacted to New Lead
  const custColl = mongoose.connection.collection('customers');
  const res1 = await custColl.updateMany(
    { 'data.status': 'Newly Contacted' },
    { $set: { 'data.status': 'New Lead' } }
  );
  console.log('Updated customer status Newly Contacted -> New Lead count:', res1.modifiedCount);

  console.log('Form migration successfully completed!');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
