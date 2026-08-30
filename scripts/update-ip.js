const fs = require('fs');
const path = require('path');
const os = require('os');

function getActiveSystemIp() {
  const interfaces = os.networkInterfaces();
  let preferredIp = null;
  let fallbackIp = null;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const lowerName = name.toLowerCase();
        const isVirtual =
          lowerName.includes('virtual') ||
          lowerName.includes('vethernet') ||
          lowerName.includes('loopback') ||
          lowerName.includes('wsl') ||
          lowerName.includes('vmware') ||
          lowerName.includes('vbox') ||
          lowerName.includes('docker') ||
          lowerName.includes('hyper-v');

        if (!isVirtual) {
          if (
            lowerName.includes('wi-fi') ||
            lowerName.includes('wireless') ||
            lowerName.includes('wlan') ||
            lowerName.includes('ethernet') ||
            lowerName.includes('en0') ||
            lowerName.includes('eth0')
          ) {
            preferredIp = iface.address;
          } else if (!fallbackIp) {
            fallbackIp = iface.address;
          }
        }
      }
    }
  }

  return preferredIp || fallbackIp || '127.0.0.1';
}

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      env[key] = val;
    }
  });
  return env;
}

function writeEnv(filePath, envMap) {
  const lines = Object.entries(envMap).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function updateAllEnvs() {
  const systemIp = getActiveSystemIp();
  console.log(`📡 [IP Auto-Sync] Detected active system IPv4: ${systemIp}`);

  const rootDir = path.resolve(__dirname, '..');

  // 1. Backend .env
  const backendEnvPath = path.join(rootDir, 'backend', '.env');
  const backendEnv = parseEnv(backendEnvPath);
  backendEnv.PORT = backendEnv.PORT || '5000';
  backendEnv.SERVER_IP = systemIp;
  if (!backendEnv.MONGODB_URI) {
    backendEnv.MONGODB_URI = 'mongodb://127.0.0.1:27017/vasantham_crm';
  }
  if (!backendEnv.JWT_SECRET) {
    backendEnv.JWT_SECRET = 'vasantham_jwt_secret_key_2026';
  }
  if (!backendEnv.DEV_KEY) {
    backendEnv.DEV_KEY = 'vasantham_dev_secret_wipe_key_2026';
  }
  if (!backendEnv.NODE_ENV) {
    backendEnv.NODE_ENV = 'development';
  }
  writeEnv(backendEnvPath, backendEnv);
  console.log(`   ✓ Updated backend/.env (SERVER_IP=${systemIp})`);

  // 2. Desktop .env
  const desktopEnvPath = path.join(rootDir, 'desktop', '.env');
  const desktopEnv = parseEnv(desktopEnvPath);
  desktopEnv.VITE_SERVER_IP = systemIp;
  desktopEnv.VITE_API_URL = backendEnv.VITE_API_URL || `http://127.0.0.1:${backendEnv.PORT}/api`;
  writeEnv(desktopEnvPath, desktopEnv);
  console.log(`   ✓ Updated desktop/.env (VITE_SERVER_IP=${systemIp})`);

  // 3. Mobile .env
  const mobileEnvPath = path.join(rootDir, 'mobile', '.env');
  const mobileEnv = parseEnv(mobileEnvPath);
  mobileEnv.EXPO_PUBLIC_SERVER_IP = systemIp;
  mobileEnv.EXPO_PUBLIC_API_URL = `http://${systemIp}:${backendEnv.PORT}/api`;
  writeEnv(mobileEnvPath, mobileEnv);
  console.log(`   ✓ Updated mobile/.env (EXPO_PUBLIC_SERVER_IP=${systemIp}, EXPO_PUBLIC_API_URL=${mobileEnv.EXPO_PUBLIC_API_URL})`);
}

updateAllEnvs();
