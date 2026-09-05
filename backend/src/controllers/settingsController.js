const Customer = require('../models/Customer');
const DailyKPI = require('../models/DailyKPI');
const LostSale = require('../models/LostSale');
const Sequence = require('../models/Sequence');
const ConnectedDevice = require('../models/ConnectedDevice');

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
    const validCandidates = [];

    const isVirtualName = (nameStr) => {
      const lower = String(nameStr || '').toLowerCase();
      return (
        lower.includes('virtual') ||
        lower.includes('vethernet') ||
        lower.includes('loopback') ||
        lower.includes('wsl') ||
        lower.includes('vmware') ||
        lower.includes('vbox') ||
        lower.includes('virtualbox') ||
        lower.includes('docker') ||
        lower.includes('hyper-v') ||
        lower.includes('tailscale') ||
        lower.includes('zerotier') ||
        lower.includes('bluetooth') ||
        lower.includes('npcap')
      );
    };

    for (const ifaceName of Object.keys(interfaces)) {
      for (const iface of interfaces[ifaceName]) {
        // Include non-internal IPv4 addresses, skipping APIPA 169.254.x.x
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
          const isVirtual = isVirtualName(ifaceName);
          const lowerName = ifaceName.toLowerCase();
          const ip = iface.address;

          let rankScore = 0;
          if (isVirtual) {
            rankScore -= 500;
          } else {
            if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
              rankScore += 100;
            } else if (lowerName.includes('ethernet') || lowerName.includes('eth0') || lowerName.includes('en0')) {
              rankScore += 50;
            }

            if (ip.startsWith('192.168.')) {
              rankScore += 30;
            } else if (ip.startsWith('10.')) {
              rankScore += 20;
            } else if (ip.startsWith('172.')) {
              rankScore += 10;
            }
          }

          const entry = {
            name: ifaceName,
            ip,
            address: ip,
            mac: iface.mac,
            isVirtual,
            rankScore,
          };

          networkInterfaces.push(entry);
          if (!isVirtual) {
            validCandidates.push(entry);
          }
        }
      }
    }

    // Sort valid candidate interfaces by score descending
    validCandidates.sort((a, b) => b.rankScore - a.rankScore);
    networkInterfaces.sort((a, b) => b.rankScore - a.rankScore);

    const allIps = [...new Set(validCandidates.map((c) => c.ip))];
    const serverIp = allIps.length > 0 ? allIps[0] : (networkInterfaces.length > 0 ? networkInterfaces[0].ip : '127.0.0.1');
    const port = Number(process.env.PORT) || 5000;
    const apiBaseUrl = `http://${serverIp}:${port}/api`;

    const pairingPayload = {
      type: 'VASANTHAM_CRM_PAIR',
      v: 1,
      appName: 'Vasantham CRM',
      serverIp,
      allIps: allIps.length > 0 ? allIps : [serverIp],
      port,
      apiBaseUrl,
      healthUrl: `http://${serverIp}:${port}/api/health`,
      ts: Date.now(),
    };

    return res.status(200).json({
      success: true,
      data: {
        serverIp,
        allIps: allIps.length > 0 ? allIps : [serverIp],
        port,
        apiBaseUrl,
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
 * Unblock port 5000 in Windows Defender Firewall via UAC prompt
 * @route POST /api/settings/fix-firewall
 */
exports.fixWindowsFirewall = async (req, res) => {
  try {
    if (process.platform !== 'win32') {
      return res.status(200).json({ success: true, message: 'Firewall configuration is only applicable on Windows.' });
    }

    const { exec } = require('child_process');
    const port = Number(process.env.PORT) || 5000;
    const ruleName = 'Vasantham CRM Mobile Pairing';

    const psCmd = `Start-Process netsh -ArgumentList 'advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=TCP localport=${port} profile=any' -Verb RunAs`;
    exec(`powershell -Command "${psCmd}"`, (err) => {
      if (err) {
        console.warn('Windows Firewall elevation prompt error:', err.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Windows Administrator elevation prompt launched. Click "Yes" on your PC screen to allow mobile Wi-Fi pairing.',
    });
  } catch (error) {
    console.error('Error launching firewall fix:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger firewall setup',
    });
  }
};
