import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });
const NEON_URL = process.env.DATABASE_URL;
const sql = postgres(NEON_URL, { max: 1 });

// Check what nextval defaults look like in Neon
const cols = await sql`
  SELECT table_name, column_name, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_default LIKE '%nextval%'
  LIMIT 5
`;

for (const c of cols) {
  console.log(`TABLE: ${c.table_name}`);
  console.log(`  COL: ${c.column_name}`);
  console.log(`  DEFAULT: [${c.column_default}]`);
  console.log(`  DEFAULT HEX: ${Buffer.from(c.column_default).toString('hex')}`);
  console.log();
}

await sql.end();
