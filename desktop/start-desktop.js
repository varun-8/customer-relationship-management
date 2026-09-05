import { spawn, exec } from 'child_process';
import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.resolve(__dirname, '../backend');
const DESKTOP_DIR = __dirname;

const processes = [];

// Helper to check if a TCP port is open / listening
function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Helper to check if an HTTP URL is currently alive
function isUrlAlive(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Helper to wait for a specific HTTP URL to become available
function waitForUrl(url, timeoutMs = 25000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode) {
          resolve(true);
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
      } else {
        setTimeout(check, 350);
      }
    };

    check();
  });
}

function killAllProcesses() {
  console.log('\n🛑 Shutting down Vasantham CRM desktop processes...');
  processes.forEach((proc) => {
    try {
      if (proc && !proc.killed) {
        if (process.platform === 'win32' && proc.pid) {
          exec(`taskkill /pid ${proc.pid} /T /F`, () => {});
        } else {
          proc.kill('SIGTERM');
        }
      }
    } catch (e) {
      // ignore kill errors on exit
    }
  });
}

process.on('SIGINT', () => {
  killAllProcesses();
  process.exit(0);
});

process.on('SIGTERM', () => {
  killAllProcesses();
  process.exit(0);
});

process.on('exit', () => {
  killAllProcesses();
});

async function main() {
  console.log('=======================================================');
  console.log('💎 Vasantham CRM — Launching Desktop Mode with Backend');
  console.log('=======================================================');

  // 0. Auto-Start Bundled MongoDB 6.0 if local service isn't active on port 27017
  const isMongoActive = await isPortOpen(27017);
  if (isMongoActive) {
    console.log('✅ MongoDB Database is active on port 27017.');
  } else {
    const bundledMongodPath = path.join(BACKEND_DIR, 'bin', 'mongodb', 'mongod.exe');
    if (fs.existsSync(bundledMongodPath)) {
      const dataDir = path.join(BACKEND_DIR, 'data', 'db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      console.log('🍃 [Embedded Database] Starting Bundled MongoDB 6.0 Server (port 27017)...');
      const mongoProc = spawn(bundledMongodPath, ['--dbpath', dataDir, '--port', '27017', '--bind_ip', '127.0.0.1'], {
        stdio: 'ignore',
        shell: false,
      });
      processes.push(mongoProc);
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  // 1. Backend Server Check & Launch
  const backendAlreadyRunning = await isUrlAlive('http://localhost:5000/api/health');
  if (backendAlreadyRunning) {
    console.log('✅ Backend API Server is already active on http://localhost:5000');
  } else {
    console.log('🚀 [1/3] Starting Backend API Server (port 5000)...');
    const backendProc = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      shell: true,
    });
    processes.push(backendProc);
  }

  // 2. Vite Dev Server Check & Launch
  const viteAlreadyRunning = await isUrlAlive('http://localhost:5173');
  if (viteAlreadyRunning) {
    console.log('✅ Desktop Frontend is already active on http://localhost:5173');
  } else {
    console.log('⚡ [2/3] Starting Desktop Frontend Dev Server (port 5173)...');
    const viteProc = spawn(/^win/.test(process.platform) ? 'npx.cmd' : 'npx', ['vite'], {
      cwd: DESKTOP_DIR,
      stdio: 'inherit',
      shell: true,
    });
    processes.push(viteProc);

    try {
      await waitForUrl('http://localhost:5173', 25000);
      console.log('✨ Desktop Frontend is live at http://localhost:5173');
    } catch (err) {
      console.warn('⚠️ Vite took longer than expected to respond, attempting window launch...');
    }
  }

  // 3. Launch Native Desktop Application Window (Electron EXE / WebView View)
  console.log('🖥️  [3/3] Opening Native Desktop Window (EXE / WebView Mode)...');
  
  const electronProc = spawn(/^win/.test(process.platform) ? 'npx.cmd' : 'npx', ['electron', '.'], {
    cwd: DESKTOP_DIR,
    stdio: 'inherit',
    shell: true,
  });
  processes.push(electronProc);

  electronProc.on('exit', (code) => {
    console.log(`\n🚪 Desktop Application Window closed.`);
    killAllProcesses();
    process.exit(0);
  });

  electronProc.on('error', (err) => {
    console.error('Failed to launch Electron desktop window:', err);
    console.log('Falling back: Desktop frontend is running at http://localhost:5173');
  });
}

main().catch((err) => {
  console.error('Error starting desktop environment:', err);
  killAllProcesses();
  process.exit(1);
});
