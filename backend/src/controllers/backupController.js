const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const mongoose = require('mongoose');

// Mongoose Models
const Customer = require('../models/Customer');
const LostSale = require('../models/LostSale');
const DailyKPI = require('../models/DailyKPI');
const CustomerForm = require('../models/CustomerForm');
const Sequence = require('../models/Sequence');
const Branding = require('../models/Branding');
const User = require('../models/User');
const SalesTarget = require('../models/SalesTarget');

// Default Backup Directory (Configurable by User)
const DEFAULT_BACKUP_DIR = path.join(process.env.USERPROFILE || 'C:\\', 'Vasantham_CRM_Backups');
const MAX_BACKUPS_RETAINED = 30;

// User AppData directory for persistent runtime config
const USER_DATA_DIR = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'vasantham-crm-desktop')
  : path.join(process.env.USERPROFILE || 'C:\\', 'Vasantham_CRM_Data');

if (!fs.existsSync(USER_DATA_DIR)) {
  try { fs.mkdirSync(USER_DATA_DIR, { recursive: true }); } catch (e) {}
}

const CONFIG_FILE_PATH = path.join(USER_DATA_DIR, 'backup_config.json');

const getBackupConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read backup_config.json, using defaults:', e.message);
  }
  return {
    backupDir: DEFAULT_BACKUP_DIR,
    maxRetained: MAX_BACKUPS_RETAINED,
    lastAutoBackupDate: null,
  };
};

const saveBackupConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save backup_config.json:', e);
  }
};

/**
 * Ensures backup directory exists and cleans up backups exceeding MAX_BACKUPS_RETAINED (30)
 */
const enforceRetentionPolicy = (targetDir, maxRetained = MAX_BACKUPS_RETAINED) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(targetDir)
    .filter((file) => file.startsWith('Vasantham_AutoBackup_') && file.endsWith('.json'))
    .map((file) => {
      const filePath = path.join(targetDir, file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stat.size,
        mtime: stat.mtimeMs,
        createdAt: stat.birthtime || stat.mtime,
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // Most recent first

  // If count exceeds maxRetained (30), delete older files
  if (files.length > maxRetained) {
    const toDelete = files.slice(maxRetained);
    toDelete.forEach((f) => {
      try {
        fs.unlinkSync(f.path);
        console.log(`[Backup Retention] Deleted old backup exceeding ${maxRetained} limit: ${f.name}`);
      } catch (err) {
        console.error(`[Backup Retention] Failed to delete file ${f.name}:`, err);
      }
    });
  }

  return files.slice(0, maxRetained);
};

/**
 * GET /api/backup/config
 * Retrieves backup configuration, directory path, last backup date, and file list
 */
exports.getBackupConfigInfo = async (req, res) => {
  try {
    const config = getBackupConfig();
    const activeDir = config.backupDir || DEFAULT_BACKUP_DIR;
    const backupFiles = enforceRetentionPolicy(activeDir, config.maxRetained || MAX_BACKUPS_RETAINED);

    res.json({
      success: true,
      data: {
        backupDir: activeDir,
        maxRetained: config.maxRetained || MAX_BACKUPS_RETAINED,
        lastAutoBackupDate: config.lastAutoBackupDate,
        totalBackupsCount: backupFiles.length,
        backups: backupFiles.map((b) => ({
          name: b.name,
          sizeFormatted: `${(b.size / 1024).toFixed(1)} KB`,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching backup config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/backup/config
 * Updates custom backup directory path
 */
exports.updateBackupConfig = async (req, res) => {
  try {
    const { backupDir } = req.body;

    if (!backupDir || typeof backupDir !== 'string' || !backupDir.trim()) {
      return res.status(400).json({ success: false, message: 'Valid backup storage path is required' });
    }

    const trimmedPath = path.resolve(backupDir.trim());

    // Ensure target path directory is valid and writable
    if (!fs.existsSync(trimmedPath)) {
      fs.mkdirSync(trimmedPath, { recursive: true });
    }

    // Test write permission
    const testFile = path.join(trimmedPath, '.write_test');
    fs.writeFileSync(testFile, 'ok', 'utf8');
    fs.unlinkSync(testFile);

    const config = getBackupConfig();
    config.backupDir = trimmedPath;
    saveBackupConfig(config);

    // Enforce retention policy on new location
    enforceRetentionPolicy(trimmedPath, config.maxRetained || MAX_BACKUPS_RETAINED);

    res.json({
      success: true,
      message: `Backup storage location successfully updated to: ${trimmedPath}`,
      data: config,
    });
  } catch (error) {
    console.error('Error updating backup config:', error);
    res.status(500).json({ success: false, message: `Cannot access backup directory: ${error.message}` });
  }
};

/**
 * POST /api/backup/open-folder
 * Opens configured backup directory in Windows File Explorer
 */
exports.openBackupFolder = async (req, res) => {
  try {
    const config = getBackupConfig();
    const activeDir = config.backupDir || DEFAULT_BACKUP_DIR;

    if (!fs.existsSync(activeDir)) {
      fs.mkdirSync(activeDir, { recursive: true });
    }

    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const cmd = isWindows
      ? `explorer "${activeDir}"`
      : (isMac ? `open "${activeDir}"` : `xdg-open "${activeDir}"`);

    exec(cmd, (err) => {
      if (err) console.warn('Could not launch file manager:', err.message);
    });

    res.json({
      success: true,
      message: `Opened backup directory in file manager: ${activeDir}`,
      directory: activeDir,
    });
  } catch (error) {
    console.error('Error opening backup directory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/backup/run
 * Performs full database backup (Customers, LostSales, KPIs, Forms, Sequence, Branding, Users, SalesTarget)
 * Only runs once per day unless force=true is passed.
 * Automatically enforces 30-backup retention policy.
 */
exports.runFullBackup = async (req, res) => {
  try {
    const force = req.body.force === true;
    const config = getBackupConfig();
    const activeDir = config.backupDir || DEFAULT_BACKUP_DIR;

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if backup already performed today (unless forced)
    if (!force && config.lastAutoBackupDate === todayStr) {
      return res.json({
        success: true,
        alreadyRanToday: true,
        message: 'Daily auto-backup already completed today.',
        lastAutoBackupDate: config.lastAutoBackupDate,
      });
    }

    // Ensure directory exists
    if (!fs.existsSync(activeDir)) {
      fs.mkdirSync(activeDir, { recursive: true });
    }

    // 1. Fetch all collections
    const [
      rawCustomers,
      lostSales,
      dailyKpis,
      customerForms,
      sequenceConfigs,
      branding,
      users,
      salesTargets,
    ] = await Promise.all([
      Customer.find({}).lean(),
      LostSale.find({}).lean(),
      DailyKPI.find({}).lean(),
      CustomerForm.find({}).lean(),
      Sequence.find({}).lean(),
      Branding.find({}).lean(),
      User.find({}, '-password').lean(),
      SalesTarget.find({}).lean(),
    ]);

    // Convert Mongoose Map data field for customers to clean plain object
    const processedCustomers = rawCustomers.map((c) => {
      let dataObj = c.data || {};
      if (dataObj instanceof Map) {
        dataObj = Object.fromEntries(dataObj);
      }
      return {
        ...c,
        data: dataObj,
      };
    });

    const now = new Date();
    const timestampStr = `${todayStr}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `Vasantham_AutoBackup_${timestampStr}.json`;
    const fullPath = path.join(activeDir, fileName);

    const backupPayload = {
      app: 'Vasantham Tiles & Sanitary Wares CRM',
      version: '1.0.0',
      backupType: force ? 'Manual Backup' : 'Daily Auto-Backup',
      createdAt: now.toISOString(),
      dateStr: todayStr,
      counts: {
        customers: processedCustomers.length,
        lostSales: lostSales.length,
        dailyKpis: dailyKpis.length,
        customerForms: customerForms.length,
        salesTargets: salesTargets.length,
        users: users.length,
      },
      data: {
        customers: processedCustomers,
        lostSales,
        dailyKpis,
        customerForms,
        sequenceConfigs,
        branding,
        salesTargets,
        users,
      },
    };

    // Write file to disk
    fs.writeFileSync(fullPath, JSON.stringify(backupPayload, null, 2), 'utf8');

    // Update config with last backup date
    config.lastAutoBackupDate = todayStr;
    saveBackupConfig(config);

    // Enforce retention policy (keep max 30)
    const remainingBackups = enforceRetentionPolicy(activeDir, config.maxRetained || MAX_BACKUPS_RETAINED);

    res.json({
      success: true,
      alreadyRanToday: false,
      message: `Full database auto-backup completed successfully! Saved to ${fileName}`,
      fileName,
      filePath: fullPath,
      createdAt: now.toISOString(),
      counts: backupPayload.counts,
      totalBackupsRetained: remainingBackups.length,
    });
  } catch (error) {
    console.error('Error running auto backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/backup/restore
 * Restores CRM database from uploaded/provided JSON backup
 * Supports both auto-backup ({ data: { customers, ... } }) and manual export ({ customers, ... })
 */
exports.restoreBackup = async (req, res) => {
  try {
    const payload = req.body?.backupData || req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid backup data provided.' });
    }

    // Support both data-wrapped and flat backup objects
    const sourceData = (payload.data && typeof payload.data === 'object') ? payload.data : payload;
    const rawCustomers = sourceData.customers || [];
    const branding = sourceData.branding || null;
    const sequenceConfigs = sourceData.sequenceConfigs || (sourceData.sequenceConfig ? [sourceData.sequenceConfig] : []);
    const customerForms = sourceData.customerForms || (sourceData.formSchema ? [sourceData.formSchema] : []);
    const lostSales = sourceData.lostSales || [];
    const dailyKpis = sourceData.dailyKpis || [];
    const salesTargets = sourceData.salesTargets || [];

    let restoredCustomers = 0;
    let maxIdVal = 0;

    // 1. Restore Customers via resilient bulkWrite upsert
    if (Array.isArray(rawCustomers) && rawCustomers.length > 0) {
      const ops = [];
      for (const item of rawCustomers) {
        const customerData = item.data ? (item.data instanceof Map ? Object.fromEntries(item.data) : item.data) : item;
        const customerId = item.customerId || customerData.customerId;
        if (!customerId) continue;

        const numMatch = String(customerId).match(/\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          if (num > maxIdVal) maxIdVal = num;
        }

        ops.push({
          updateOne: {
            filter: { customerId },
            update: {
              $set: {
                customerId,
                formVersion: item.formVersion || 1,
                data: customerData,
                status: item.status || customerData.status || 'Newly Contacted',
                notes: item.notes || customerData.notes || 'Restored from Backup',
                updatedBy: item.updatedBy || item.createdBy || { name: 'System Restore' },
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                createdBy: item.createdBy || { name: 'System Restore' },
              },
            },
            upsert: true,
          },
        });
      }

      if (ops.length > 0) {
        const result = await Customer.bulkWrite(ops, { ordered: false });
        restoredCustomers = (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.matchedCount || 0);
      }
    }

    // 2. Synchronize Sequence Counter to prevent subsequent ID collisions
    if (maxIdVal > 0) {
      await Sequence.findOneAndUpdate(
        { key: 'customer_id' },
        { $max: { currentValue: maxIdVal } },
        { upsert: true }
      );
    }

    // 3. Restore Branding if provided
    let restoredBranding = false;
    if (branding && typeof branding === 'object') {
      const bObj = Array.isArray(branding) ? branding[0] : branding;
      if (bObj) {
        delete bObj._id;
        delete bObj.__v;
        await Branding.findOneAndUpdate({}, { $set: bObj }, { upsert: true });
        restoredBranding = true;
      }
    }

    // 4. Restore Sequence configurations if provided
    if (Array.isArray(sequenceConfigs) && sequenceConfigs.length > 0) {
      for (const seq of sequenceConfigs) {
        if (!seq.key) continue;
        const seqData = { ...seq };
        delete seqData._id;
        delete seqData.__v;
        if (seq.key === 'customer_id' && maxIdVal > 0) {
          seqData.currentValue = Math.max(seqData.currentValue || 0, maxIdVal);
        }
        await Sequence.findOneAndUpdate({ key: seq.key }, { $set: seqData }, { upsert: true });
      }
    }

    // 5. Restore Lost Sales if provided
    let restoredLostSales = 0;
    if (Array.isArray(lostSales) && lostSales.length > 0) {
      const lsOps = lostSales.map((ls) => {
        const copy = { ...ls };
        const id = copy._id;
        delete copy._id;
        delete copy.__v;
        return {
          updateOne: {
            filter: id ? { _id: id } : { customerId: copy.customerId },
            update: { $set: copy },
            upsert: true,
          },
        };
      });
      if (lsOps.length > 0) {
        await LostSale.bulkWrite(lsOps, { ordered: false });
        restoredLostSales = lsOps.length;
      }
    }

    // 6. Restore Customer Forms if provided
    let restoredForms = 0;
    if (Array.isArray(customerForms) && customerForms.length > 0) {
      for (const form of customerForms) {
        const fCopy = { ...form };
        delete fCopy._id;
        delete fCopy.__v;
        if (fCopy.version) {
          await CustomerForm.findOneAndUpdate({ version: fCopy.version }, { $set: fCopy }, { upsert: true });
          restoredForms++;
        }
      }
    }

    // 7. Restore Sales Targets if provided
    let restoredTargets = 0;
    if (Array.isArray(salesTargets) && salesTargets.length > 0) {
      for (const target of salesTargets) {
        const tCopy = { ...target };
        delete tCopy._id;
        delete tCopy.__v;
        if (tCopy.month) {
          await SalesTarget.findOneAndUpdate({ month: tCopy.month }, { $set: tCopy }, { upsert: true });
          restoredTargets++;
        }
      }
    }

    res.json({
      success: true,
      message: `Database successfully restored! Restored ${restoredCustomers} customers, updated ID counter to ${maxIdVal}, and restored system configurations.`,
      counts: {
        customers: restoredCustomers,
        lostSales: restoredLostSales,
        forms: restoredForms,
        salesTargets: restoredTargets,
        branding: restoredBranding,
      },
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
