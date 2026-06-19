import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const migrationFiles = ['migrate-images.sql', 'migrate-add-is-completed.sql'];
    for (const fileName of migrationFiles) {
      const migratePath = join(root, 'db', fileName);
      if (!existsSync(migratePath)) {
        console.warn(`${fileName} not found, skipping`);
        continue;
      }
      console.log(`Applying migration: ${fileName}`);
      await pool.query(readFileSync(migratePath, 'utf8'));
    }
    console.log('✅ Migrations completed');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
