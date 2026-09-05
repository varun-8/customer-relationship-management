const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const MONGO_VERSION = '6.0.29';
const MONGO_URL = `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${MONGO_VERSION}.zip`;

const ROOT_DIR = path.resolve(__dirname, '..');
const BUNDLE_TARGET_DIR = path.join(ROOT_DIR, 'backend', 'bin', 'mongodb');
const TEMP_ZIP_PATH = path.join(ROOT_DIR, 'backend', 'bin', `mongodb-${MONGO_VERSION}.zip`);
const targetMongod = path.join(BUNDLE_TARGET_DIR, 'mongod.exe');

const forceRebuild = process.argv.includes('--force');

console.log('=======================================================');
console.log(`🍃 [MongoDB 6.0 Bundler] Preparing MongoDB v${MONGO_VERSION} for Windows 10`);
console.log('=======================================================');

// Check if mongod.exe already exists
if (!forceRebuild && fs.existsSync(targetMongod)) {
  console.log(`   ✓ MongoDB v${MONGO_VERSION} binary is already bundled at:`);
  console.log(`     ${targetMongod}`);
  console.log('   (Use --force flag to redownload and replace)');
  process.exit(0);
}

// 1. Purge existing MongoDB binaries/folder if redownloading
if (fs.existsSync(BUNDLE_TARGET_DIR)) {
  console.log('🧹 [Cleanup] Removing previous/existing MongoDB binary directory...');
  try {
    fs.rmSync(BUNDLE_TARGET_DIR, { recursive: true, force: true });
  } catch (e) {}
}
fs.mkdirSync(BUNDLE_TARGET_DIR, { recursive: true });

// 2. Download MongoDB 6.0 zip package
console.log(`📡 [Download] Downloading MongoDB v${MONGO_VERSION} Community Server for Windows...`);
console.log(`   Source: ${MONGO_URL}`);

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download MongoDB: HTTP Status ${response.statusCode}`));
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;
      let lastReport = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize > 0) {
          const percent = Math.floor((downloaded / totalSize) * 100);
          if (percent >= lastReport + 10) {
            lastReport = percent;
            console.log(`   Downloading: ${percent}% (${(downloaded / (1024 * 1024)).toFixed(1)} MB / ${(totalSize / (1024 * 1024)).toFixed(1)} MB)`);
          }
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  try {
    await downloadFile(MONGO_URL, TEMP_ZIP_PATH);
    console.log('   ✓ Download complete. Extracting MongoDB 6.0 binaries...');

    const tempExtractDir = path.join(ROOT_DIR, 'backend', 'bin', 'temp_extract');
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempExtractDir, { recursive: true });

    // Use PowerShell to expand archive natively on Windows 10
    const psCmd = `powershell -Command "Expand-Archive -Path '${TEMP_ZIP_PATH}' -DestinationPath '${tempExtractDir}' -Force"`;
    execSync(psCmd, { stdio: 'inherit' });

    // Find bin folder inside extracted directory
    const extractedFolders = fs.readdirSync(tempExtractDir);
    let extractedBinDir = null;
    for (const folder of extractedFolders) {
      const candidateBin = path.join(tempExtractDir, folder, 'bin');
      if (fs.existsSync(candidateBin)) {
        extractedBinDir = candidateBin;
        break;
      }
    }

    if (!extractedBinDir) {
      throw new Error('Could not locate bin directory in extracted MongoDB zip.');
    }

    // Copy binaries into backend/bin/mongodb/
    const filesToCopy = ['mongod.exe', 'mongosh.exe', 'mongo.exe'];
    filesToCopy.forEach((fileName) => {
      const srcFile = path.join(extractedBinDir, fileName);
      if (fs.existsSync(srcFile)) {
        const destFile = path.join(BUNDLE_TARGET_DIR, fileName);
        fs.copyFileSync(srcFile, destFile);
        console.log(`   ✓ Bundled ${fileName}`);
      }
    });

    // Copy any runtime DLLs from backend/bin into backend/bin/mongodb/
    const binDir = path.join(ROOT_DIR, 'backend', 'bin');
    if (fs.existsSync(binDir)) {
      const binFiles = fs.readdirSync(binDir);
      binFiles.forEach((file) => {
        if (file.toLowerCase().endsWith('.dll')) {
          const srcDll = path.join(binDir, file);
          const destDll = path.join(BUNDLE_TARGET_DIR, file);
          fs.copyFileSync(srcDll, destDll);
          console.log(`   ✓ Bundled DLL ${file}`);
        }
      });
    }

    // Cleanup temp zip and folder
    if (fs.existsSync(TEMP_ZIP_PATH)) {
      fs.unlinkSync(TEMP_ZIP_PATH);
    }
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }

    console.log(`\n🎉 [Success] MongoDB 6.0 bundled successfully at: ${BUNDLE_TARGET_DIR}`);
  } catch (err) {
    console.error(`❌ [MongoDB Setup Error] ${err.message}`);
    process.exit(1);
  }
}

run();
