const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const ENV_FILE = path.join(__dirname, '.env.desktop');

let mainWindow = null;
let httpServer = null;

function loadDesktopEnv() {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }

  const dbAbsPath = path.join(ROOT_DIR, 'prisma', 'pageant.db');
  process.env.DATABASE_URL = `file:${dbAbsPath}`;
  process.env.NODE_ENV = 'production';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Pageant Tabulation System',
    icon: path.join(ROOT_DIR, 'public', 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startNextServer() {
  const PORT = 3000;
  const DB_PATH = path.join(ROOT_DIR, 'prisma', 'pageant.db');
  const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

  if (!fs.existsSync(DB_PATH)) {
    console.log('[desktop] Database not found, creating...');
    const { execSync } = require('child_process');
    const SCHEMA_PATH = path.join(ROOT_DIR, 'prisma', 'schema.desktop.prisma');
    try {
      execSync(`npx prisma db push --schema="${SCHEMA_PATH}" --skip-generate`, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: process.env,
      });
      require('./seed');
    } catch (err) {
      console.error('[desktop] DB setup error:', err.message);
    }
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const next = require('next');
  const nextApp = next({ dev: false, dir: ROOT_DIR });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const extMap = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  };

  httpServer = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname.startsWith('/uploads/')) {
      const filePath = path.join(ROOT_DIR, url.pathname);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = extMap[ext] || 'application/octet-stream';
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        return;
      } catch { /* fall through to Next.js */ }
    }

    handle(req, res);
  });

  return new Promise((resolve, reject) => {
    httpServer.listen(PORT, () => {
      console.log(`[desktop] Server running at http://localhost:${PORT}`);
      resolve();
    });
    httpServer.on('error', reject);
  });
}

app.on('ready', async () => {
  loadDesktopEnv();

  try {
    await startNextServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start the application server.\n\n${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (httpServer) httpServer.close();
  app.quit();
});

app.on('before-quit', () => {
  if (httpServer) httpServer.close();
});
