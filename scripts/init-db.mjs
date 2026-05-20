import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

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

  // Создаём папку для загрузок, если её нет
  mkdirSync(join(root, 'public', 'uploads'), { recursive: true });

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Читаем и выполняем schema.sql
    const schemaPath = join(root, 'db', 'schema.sql');
    if (!existsSync(schemaPath)) {
      console.error('schema.sql not found at', schemaPath);
      process.exit(1);
    }
    const schema = readFileSync(schemaPath, 'utf8');
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('✓ Tables created');

    const migratePath = join(root, 'db', 'migrate-images.sql');
    if (existsSync(migratePath)) {
      console.log('Applying migrations...');
      await pool.query(readFileSync(migratePath, 'utf8'));
      console.log('✓ Migrations applied');
    }

    console.log('Resetting data...');
    await pool.query('TRUNCATE user_events, events, users RESTART IDENTITY CASCADE');

    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'admin')`,
      ['admin@eventcity.com', passwordHash, 'Администратор']
    );
    console.log('✓ Admin user created (id=1)');

    // Читаем и выполняем seed.sql
    const seedPath = join(root, 'db', 'seed.sql');
    if (!existsSync(seedPath)) {
      console.warn('seed.sql not found, skipping demo data');
    } else {
      const seed = readFileSync(seedPath, 'utf8');
      console.log('Seeding demo events...');
      await pool.query(seed);
      console.log('✓ Demo events seeded');
    }

    // Проверяем результат
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM events');
    console.log(`✅ Database init completed! Events in DB: ${rows[0].count}`);
    console.log('📧 Admin: admin@eventcity.com');
    console.log('🔑 Password: admin123');
    
  } catch (err) {
    console.error('Database init failed:', err.message);
    console.error('Details:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();