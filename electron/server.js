const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT_DIR, 'prisma', 'schema.desktop.prisma');
const DB_PATH = path.join(ROOT_DIR, 'prisma', 'pageant.db');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const PORT = parseInt(process.env.PORT || '3000', 10);

// Ensure DATABASE_URL uses absolute path for Prisma Client
process.env.DATABASE_URL = `file:${DB_PATH}`;

function ensureDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('[desktop] Creating SQLite database...');
    execSync(`npx prisma db push --schema="${SCHEMA_PATH}" --skip-generate`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: process.env,
    });

    console.log('[desktop] Seeding database...');
    try {
      require('./seed');
    } catch (err) {
      console.error('[desktop] Seed error:', err.message);
    }
  } else {
    console.log('[desktop] Database already exists, skipping setup.');
  }
}

function serveStaticFile(filePath, res) {
  const extMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  const ext = path.extname(filePath).toLowerCase();
  const contentType = extMap[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

async function startServer() {
  ensureDatabase();

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const next = require('next');
  const nextApp = next({ dev: false, dir: ROOT_DIR });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname.startsWith('/uploads/')) {
      const filePath = path.join(ROOT_DIR, url.pathname);
      if (serveStaticFile(filePath, res)) return;
    }

    handle(req, res);
  });

  server.listen(PORT, () => {
    console.log(`[desktop] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[desktop] Failed to start server:', err);
  process.exit(1);
});
