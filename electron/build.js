/**
 * Desktop build orchestrator.
 *
 * Steps:
 *   1. Generate Prisma client from the SQLite desktop schema
 *   2. Create the SQLite DB and seed it
 *   3. Build Next.js
 *   4. Package with electron-builder for Windows
 *   5. Restore the PostgreSQL Prisma client so cloud dev is unaffected
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const DESKTOP_SCHEMA = path.join(ROOT, 'prisma', 'schema.desktop.prisma');
const DB_FILE = path.join(ROOT, 'prisma', 'pageant.db');
const ENV_FILE = path.join(__dirname, '.env.desktop');

function buildEnv(useAbsoluteDbPath) {
  const env = {};
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of content.split('\n')) {
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
    env[key] = value;
  }

  // Prisma CLI resolves file: paths relative to the schema file directory,
  // but Prisma Client resolves them relative to CWD. Use absolute path
  // for steps that run the Client (seed, next build).
  if (useAbsoluteDbPath) {
    env.DATABASE_URL = `file:${DB_FILE}`;
  }

  return env;
}

function run(cmd, label, { absoluteDbPath = false } = {}) {
  console.log(`\n=== ${label} ===`);
  console.log(`> ${cmd}\n`);
  execSync(cmd, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...buildEnv(absoluteDbPath) },
  });
}

async function build() {
  const startTime = Date.now();

  // Step 1: Generate Prisma client from desktop (SQLite) schema
  run(
    `npx prisma generate --schema="${DESKTOP_SCHEMA}"`,
    'Step 1/5: Generate SQLite Prisma client'
  );

  // Step 2: Create SQLite DB (prisma CLI resolves file: relative to schema dir)
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
    console.log('Removed existing desktop database for fresh build.');
  }

  run(
    `npx prisma db push --schema="${DESKTOP_SCHEMA}" --skip-generate`,
    'Step 2/5: Create SQLite database'
  );

  // Step 3: Seed (uses Prisma Client, needs absolute DB path)
  run(
    'node electron/seed.js',
    'Step 3/5: Seed database',
    { absoluteDbPath: true }
  );

  // Step 4: Build Next.js (uses Prisma Client, needs absolute DB path)
  run(
    'npx next build',
    'Step 4/5: Build Next.js',
    { absoluteDbPath: true }
  );

  // Step 5: Package with electron-builder (dir target)
  run(
    'npx electron-builder --win --config electron-builder.config.js',
    'Step 5/7: Package Windows app'
  );

  // Step 6: Copy Prisma engine files into packaged app
  // Electron-builder skips hidden directories like .prisma, so we copy manually.
  const winUnpackedDir = path.join(ROOT, 'dist', 'win-unpacked');
  const appNodeModules = path.join(winUnpackedDir, 'resources', 'app', 'node_modules');

  if (fs.existsSync(appNodeModules)) {
    console.log('\n=== Step 6/7: Copy Prisma engine for Windows ===');
    const src = path.join(ROOT, 'node_modules', '.prisma');
    const dest = path.join(appNodeModules, '.prisma');

    execSync(`cp -r "${src}" "${dest}"`, { stdio: 'inherit' });

    // Remove Linux/Darwin engines from the copy to save space
    const clientDir = path.join(dest, 'client');
    if (fs.existsSync(clientDir)) {
      const files = fs.readdirSync(clientDir);
      for (const f of files) {
        if (f.includes('linux') || f.includes('darwin') || f.includes('debian') || f.includes('rhel')) {
          fs.unlinkSync(path.join(clientDir, f));
        }
      }
    }

    const windowsEngine = path.join(dest, 'client', 'query_engine-windows.dll.node');
    if (fs.existsSync(windowsEngine)) {
      const size = (fs.statSync(windowsEngine).size / (1024 * 1024)).toFixed(1);
      console.log(`Windows query engine included (${size} MB)`);
    } else {
      console.warn('WARNING: Windows query engine NOT found! Login/DB queries will fail on Windows.');
    }
  }

  if (fs.existsSync(winUnpackedDir)) {
    console.log(`\n=== Step 7/7: Create distributable archive ===`);
    const tarName = 'Pageant-Tabulation-System-Windows.tar.gz';
    const tarPath = path.join(ROOT, 'dist', tarName);
    if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

    try {
      execSync(`tar -czf "${tarName}" -C "${path.join(ROOT, 'dist')}" "win-unpacked"`, {
        cwd: path.join(ROOT, 'dist'),
        stdio: 'inherit',
      });
      const archiveSize = (fs.statSync(tarPath).size / (1024 * 1024)).toFixed(1);
      console.log(`Created: dist/${tarName} (${archiveSize} MB)`);
    } catch {
      console.log('Archive creation skipped (tar not available).');
      console.log('You can manually zip the dist/win-unpacked/ folder.');
    }
  }

  // Restore PostgreSQL Prisma client
  console.log('\n=== Restoring PostgreSQL Prisma client ===');
  try {
    execSync('npx prisma generate', { cwd: ROOT, stdio: 'inherit' });
    console.log('PostgreSQL client restored successfully.');
  } catch (err) {
    console.warn('Warning: Could not restore PostgreSQL client. Run "npx prisma generate" manually.');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Build complete in ${elapsed}s ===`);
  console.log('Output: dist/win-unpacked/  (copy this folder to a Windows PC and run the .exe)');
}

build().catch((err) => {
  console.error('\nBuild failed:', err.message);

  // Always try to restore the PostgreSQL client even on failure
  console.log('\nRestoring PostgreSQL Prisma client...');
  try {
    execSync('npx prisma generate', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.warn('Warning: Could not restore PostgreSQL client. Run "npx prisma generate" manually.');
  }

  process.exit(1);
});
