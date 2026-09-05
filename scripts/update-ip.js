const fs = require('fs');
const path = require('path');
const os = require('os');

function getActiveSystemIp() {
  const interfaces = os.networkInterfaces();
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

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        const lowerName = name.toLowerCase();
        const isVirtual = isVirtualName(name);
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

        if (!isVirtual) {
          validCandidates.push({ ip, rankScore });
        }
      }
    }
  }

  validCandidates.sort((a, b) => b.rankScore - a.rankScore);
  return validCandidates.length > 0 ? validCandidates[0].ip : '127.0.0.1';
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
  desktopEnv.VITE_API_URL = `http://${systemIp}:${backendEnv.PORT}/api`;
  writeEnv(desktopEnvPath, desktopEnv);
  console.log(`   ✓ Updated desktop/.env (VITE_SERVER_IP=${systemIp})`);

  // 3. Mobile .env
  const mobileEnvPath = path.join(rootDir, 'mobile', '.env');
  const mobileEnv = parseEnv(mobileEnvPath);
  mobileEnv.EXPO_PUBLIC_SERVER_IP = systemIp;
  mobileEnv.EXPO_PUBLIC_API_URL = `http://${systemIp}:${backendEnv.PORT}/api`;
  mobileEnv.REACT_NATIVE_PACKAGER_HOSTNAME = systemIp;
  writeEnv(mobileEnvPath, mobileEnv);
  console.log(`   ✓ Updated mobile/.env (EXPO_PUBLIC_SERVER_IP=${systemIp}, REACT_NATIVE_PACKAGER_HOSTNAME=${systemIp})`);

  tryEnsureWindowsFirewall(backendEnv.PORT || '5000');
}

function tryEnsureWindowsFirewall(port = '5000') {
  if (process.platform !== 'win32') return;
  try {
    const { execSync } = require('child_process');
    const ruleName = 'Vasantham CRM Mobile Pairing';
    const checkCmd = `powershell -Command "Get-NetFirewallRule -DisplayName '*Vasantham*' -ErrorAction SilentlyContinue"`;
    const result = execSync(checkCmd, { encoding: 'utf8' }).trim();

    if (!result) {
      console.log(`🛡️ [Firewall Setup] Registering Windows Defender Firewall rule for port ${port}...`);
      const psCmd = `powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\\\"Vasantham CRM Mobile Pairing\\\" dir=in action=allow protocol=TCP localport=${port} profile=any' -Verb RunAs"`;
      execSync(psCmd, { stdio: 'ignore' });
    } else {
      console.log(`   ✓ Windows Firewall rule is active for TCP port ${port}`);
    }
  } catch (e) {}
}

updateAllEnvs();
