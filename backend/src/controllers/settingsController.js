const Customer = require('../models/Customer');
const DailyKPI = require('../models/DailyKPI');
const LostSale = require('../models/LostSale');
const Sequence = require('../models/Sequence');
const ConnectedDevice = require('../models/ConnectedDevice');
const SystemSetting = require('../models/SystemSetting');
const aiService = require('../services/aiService');

/**
 * Wipe all customer data, follow-ups, KPIs, lost sales, and reset sequences.
 * Requires verification against DEV_KEY in .env.
 */
exports.wipeDatabase = async (req, res) => {
  try {
    const { devKey } = req.body;

    const expectedDevKey = process.env.DEV_KEY;
    if (!expectedDevKey) {
      return res.status(500).json({
        success: false,
        message: 'DEV_KEY is not configured in backend .env file.',
      });
    }

    if (!devKey || String(devKey).trim() !== String(expectedDevKey).trim()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Developer Key. Verification failed. Check DEV_KEY in backend .env.',
      });
    }

    // 1. Delete all Customer records (including dynamic follow-up states)
    const customerDeleteResult = await Customer.deleteMany({});

    // 2. Delete all Daily KPI tracking entries
    const kpiDeleteResult = await DailyKPI.deleteMany({});

    // 3. Delete all Lost Sale records
    const lostSaleDeleteResult = await LostSale.deleteMany({});

    // 4. Reset Customer ID Sequence generator to 0 and record wipe timestamp
    await Sequence.findOneAndUpdate(
      { key: 'customer_id' },
      { currentValue: 0, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    const wipeTimestamp = Date.now();
    await Sequence.findOneAndUpdate(
      { key: 'last_wiped_at' },
      { currentValue: wipeTimestamp, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`🧹 [DEV WIPE] Database wiped by developer key.`);
    console.log(`   - Customers deleted: ${customerDeleteResult.deletedCount}`);
    console.log(`   - KPIs deleted: ${kpiDeleteResult.deletedCount}`);
    console.log(`   - Lost Sales deleted: ${lostSaleDeleteResult.deletedCount}`);
    console.log(`   - Sequence counter reset to 0.`);
    console.log(`   - Wipe timestamp recorded: ${wipeTimestamp}`);

    return res.status(200).json({
      success: true,
      message: 'All CRM data has been successfully wiped and sequence counters reset.',
      summary: {
        customersDeleted: customerDeleteResult.deletedCount,
        kpisDeleted: kpiDeleteResult.deletedCount,
        lostSalesDeleted: lostSaleDeleteResult.deletedCount,
        sequenceReset: true,
      },
    });
  } catch (error) {
    console.error('Error during database wipe:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to wipe database.',
    });
  }
};

const os = require('os');

/**
 * Get Mobile Pairing QR Code Payload & Active Local Network Interfaces
 * @route GET /api/settings/mobile-pairing
 */
exports.getMobilePairingInfo = async (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const networkInterfaces = [];
    let preferredIp = null;

    for (const ifaceName of Object.keys(interfaces)) {
      for (const iface of interfaces[ifaceName]) {
        // Only include non-internal IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          const isVirtual = ifaceName.toLowerCase().includes('virtual') || 
                            ifaceName.toLowerCase().includes('vethernet') || 
                            ifaceName.toLowerCase().includes('loopback') ||
                            ifaceName.toLowerCase().includes('wsl');
          
          networkInterfaces.push({
            name: ifaceName,
            ip: iface.address,
            mac: iface.mac,
            isVirtual,
          });

          // Prioritize Wi-Fi or physical adapters over virtual ones
          if (!preferredIp && !isVirtual) {
            preferredIp = iface.address;
          } else if (
            (ifaceName.toLowerCase().includes('wi-fi') || 
             ifaceName.toLowerCase().includes('wireless') || 
             ifaceName.toLowerCase().includes('wlan') || 
             ifaceName.toLowerCase().includes('ethernet')) &&
            !isVirtual
          ) {
            preferredIp = iface.address;
          }
        }
      }
    }

    // Fallback to first available IP or localhost
    const serverIp = preferredIp || (networkInterfaces.length > 0 ? networkInterfaces[0].ip : '127.0.0.1');
    const port = Number(process.env.PORT) || 5000;
    const apiBaseUrl = `http://${serverIp}:${port}/api`;

    // Gather all candidate host URLs across physical network adapters (Ethernet, Wi-Fi, LAN)
    const physicalIps = networkInterfaces.filter((item) => !item.isVirtual).map((item) => item.ip);
    if (!physicalIps.includes(serverIp)) physicalIps.unshift(serverIp);
    const allHostUrls = physicalIps.map((ip) => `http://${ip}:${port}/api`);

    const pairingPayload = {
      type: 'VASANTHAM_CRM_PAIR',
      v: 1,
      appName: 'Vasantham CRM',
      serverIp,
      port,
      apiBaseUrl,
      allHostUrls,
      healthUrl: `http://${serverIp}:${port}/api/health`,
      ts: Date.now(),
    };

    return res.status(200).json({
      success: true,
      data: {
        serverIp,
        port,
        apiBaseUrl,
        allHostUrls,
        pairingPayload,
        pairingString: JSON.stringify(pairingPayload),
        networkInterfaces,
      },
    });
  } catch (error) {
    console.error('Error retrieving mobile pairing info:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve pairing info',
    });
  }
};

/**
 * Record or update Mobile Device Heartbeat
 * @route POST /api/settings/device-heartbeat
 */
exports.recordDeviceHeartbeat = async (req, res) => {
  try {
    const { deviceId, deviceName, platform, appVersion, userProfile, action } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required.',
      });
    }

    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
    const cleanIp = String(rawIp).replace(/^.*:/, '').trim() || 'Local Client';

    const now = new Date();
    const updateData = {
      deviceName: deviceName || (platform === 'ios' ? 'Apple iPhone' : 'Android Smartphone'),
      platform: platform || 'android',
      appVersion: appVersion || '1.0.0',
      ipAddress: cleanIp,
      isOnline: true,
      lastAction: action || 'Active Session',
      lastSeenAt: now,
    };

    if (userProfile && typeof userProfile === 'object') {
      updateData.userProfile = {
        name: userProfile.name || 'Showroom Staff',
        role: userProfile.role || 'employee',
        email: userProfile.email || '',
        icon: userProfile.icon || (userProfile.role === 'owner' ? '👑' : '👔'),
      };
    }

    const device = await ConnectedDevice.findOneAndUpdate(
      { deviceId },
      {
        $set: updateData,
        $setOnInsert: { pairedAt: now, deviceId },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Device heartbeat recorded.',
      data: device,
    });
  } catch (error) {
    console.error('Error recording device heartbeat:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record device heartbeat',
    });
  }
};

/**
 * Get all connected mobile devices with live status
 * @route GET /api/settings/connected-devices
 */
exports.getConnectedDevices = async (req, res) => {
  try {
    const devices = await ConnectedDevice.find().sort({ lastSeenAt: -1 }).lean();
    const now = Date.now();

    const formatted = devices.map((d) => {
      const lastSeenMs = d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : 0;
      const diffSeconds = Math.max(0, Math.floor((now - lastSeenMs) / 1000));

      let status = 'offline';
      let statusLabel = 'Offline';

      if (diffSeconds < 45) {
        status = 'active';
        statusLabel = 'Active Now';
      } else if (diffSeconds < 300) {
        status = 'idle';
        statusLabel = `Idle (${Math.floor(diffSeconds / 60)}m ago)`;
      } else {
        status = 'offline';
        const mins = Math.floor(diffSeconds / 60);
        if (mins < 60) {
          statusLabel = `${mins}m ago`;
        } else {
          const hours = Math.floor(mins / 60);
          statusLabel = `${hours}h ago`;
        }
      }

      return {
        ...d,
        status,
        statusLabel,
        diffSeconds,
        isOnline: status === 'active',
      };
    });

    const activeCount = formatted.filter((d) => d.status === 'active').length;
    const idleCount = formatted.filter((d) => d.status === 'idle').length;

    return res.status(200).json({
      success: true,
      count: formatted.length,
      activeCount,
      idleCount,
      data: formatted,
    });
  } catch (error) {
    console.error('Error fetching connected devices:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch connected devices',
    });
  }
};

/**
 * Disconnect or remove a device session
 * @route DELETE /api/settings/connected-devices/:deviceId
 */
exports.disconnectDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await ConnectedDevice.findOneAndDelete({ deviceId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Device ${result.deviceName || deviceId} disconnected successfully.`,
    });
  } catch (error) {
    console.error('Error disconnecting device:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect device',
    });
  }
};

/**
 * GET /api/settings/ai-config
 */
exports.getAiConfig = async (req, res) => {
  try {
    const [providerSetting, keySetting, modelSetting, openAiKeySetting, openAiModelSetting] = await Promise.all([
      SystemSetting.findOne({ key: 'aiProvider' }),
      SystemSetting.findOne({ key: 'geminiApiKey' }),
      SystemSetting.findOne({ key: 'geminiModel' }),
      SystemSetting.findOne({ key: 'openaiApiKey' }),
      SystemSetting.findOne({ key: 'openaiModel' }),
    ]);

    const provider = providerSetting?.value || process.env.AI_PROVIDER || 'openai';

    // Gemini
    const rawKey = keySetting?.value || process.env.GEMINI_API_KEY || '';
    const maskedKey = rawKey
      ? rawKey.length > 8
        ? `${rawKey.slice(0, 4)}••••••••${rawKey.slice(-4)}`
        : '••••••••'
      : '';

    // OpenAI
    const rawOpenAiKey = openAiKeySetting?.value || process.env.OPENAI_API_KEY || '';
    const maskedOpenAiKey = rawOpenAiKey
      ? rawOpenAiKey.length > 8
        ? `${rawOpenAiKey.slice(0, 4)}••••••••${rawOpenAiKey.slice(-4)}`
        : '••••••••'
      : '';

    return res.json({
      success: true,
      provider,
      // Gemini
      hasApiKey: Boolean(rawKey),
      maskedKey,
      model: modelSetting?.value || 'gemini-1.5-flash',
      // OpenAI ChatGPT
      hasOpenAiKey: Boolean(rawOpenAiKey),
      maskedOpenAiKey,
      openaiModel: openAiModelSetting?.value || 'gpt-4o-mini',
    });
  } catch (err) {
    console.error('Error fetching AI config:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/settings/ai-config
 */
exports.updateAiConfig = async (req, res) => {
  try {
    const { provider, apiKey, model, openaiApiKey, openaiModel } = req.body;

    if (provider) {
      await SystemSetting.findOneAndUpdate(
        { key: 'aiProvider' },
        { value: String(provider).trim().toLowerCase() },
        { upsert: true, new: true }
      );
    }

    // Gemini keys
    if (apiKey !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'geminiApiKey' },
        { value: String(apiKey).trim() },
        { upsert: true, new: true }
      );
    }
    if (model) {
      await SystemSetting.findOneAndUpdate(
        { key: 'geminiModel' },
        { value: String(model).trim() },
        { upsert: true, new: true }
      );
    }

    // OpenAI keys
    if (openaiApiKey !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'openaiApiKey' },
        { value: String(openaiApiKey).trim() },
        { upsert: true, new: true }
      );
    }
    if (openaiModel) {
      await SystemSetting.findOneAndUpdate(
        { key: 'openaiModel' },
        { value: String(openaiModel).trim() },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      message: 'AI Configuration saved successfully!',
    });
  } catch (err) {
    console.error('Error updating AI config:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/settings/ai-config/test
 */
exports.testAiConfig = async (req, res) => {
  try {
    const { provider = 'openai', apiKey, model, openaiApiKey, openaiModel } = req.body;

    if (provider === 'openai') {
      let key = openaiApiKey;
      if (!key) {
        key = await aiService.getOpenAiApiKey();
      }
      if (!key) {
        return res.status(400).json({
          success: false,
          code: 'NO_OPENAI_API_KEY',
          message: 'No OpenAI API Key found. Please enter your API key from OpenAI (https://platform.openai.com/api-keys) and save settings.',
        });
      }
      const testRes = await aiService.testOpenAiApiKey(key, openaiModel || 'gpt-4o-mini');
      return res.json(testRes);
    } else {
      // Gemini
      let key = apiKey;
      if (!key) {
        key = await aiService.getGeminiApiKey();
      }
      if (!key) {
        return res.status(400).json({
          success: false,
          code: 'NO_API_KEY',
          message: 'No Google Gemini API Key found. Please paste your API key from Google AI Studio (https://aistudio.google.com) and save settings.',
        });
      }
      const testRes = await aiService.testApiKey(key, model || 'gemini-1.5-flash');
      return res.json(testRes);
    }
  } catch (err) {
    console.error('AI Config Test Failed:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Verification failed. Please check your AI API Key.',
    });
  }
};

