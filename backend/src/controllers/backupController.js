const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Mongoose Models
const Customer = require('../models/Customer');
const LostSale = require('../models/LostSale');
const DailyKPI = require('../models/DailyKPI');
const CustomerForm = require('../models/CustomerForm');
const Sequence = require('../models/Sequence');
const Branding = require('../models/Branding');
const User = require('../models/User');

// Default Backup Directory (Configurable by User)
const DEFAULT_BACKUP_DIR = path.join(process.env.USERPROFILE || 'C:\\', 'Vasantham_CRM_Backups');
const MAX_BACKUPS_RETAINED = 30;

// Config file path to persist custom storage location
const CONFIG_FILE_PATH = path.join(__dirname, '..', '..', 'backup_config.json');

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

    const trimmedPath = backupDir.trim();

    // Ensure target path directory is valid and writable
    if (!fs.existsSync(trimmedPath)) {
      fs.mkdirSync(trimmedPath, { recursive: true });
    }

    const config = getBackupConfig();
    config.backupDir = trimmedPath;
    saveBackupConfig(config);

    // Enforce retention policy on new location
    enforceRetentionPolicy(trimmedPath, config.maxRetained || MAX_BACKUPS_RETAINED);

    res.json({
      success: true,
      message: 'Backup storage location updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Error updating backup config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/backup/run
 * Performs full database backup (Customers, LostSales, KPIs, Forms, Sequence, Branding, Users)
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
    ] = await Promise.all([
      Customer.find({}).lean(),
      LostSale.find({}).lean(),
      DailyKPI.find({}).lean(),
      CustomerForm.find({}).lean(),
      Sequence.find({}).lean(),
      Branding.find({}).lean(),
      User.find({}, '-password').lean(),
    ]);

    // Convert Mongoose Map data field for customers
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
        users: users.length,
      },
      data: {
        customers: processedCustomers,
        lostSales,
        dailyKpis,
        customerForms,
        sequenceConfigs,
        branding,
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
