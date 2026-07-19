import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const sqlContent = readFileSync('scripts/seed-crm-menus.sql', 'utf8');

await sql.unsafe(sqlContent);
console.log('Menus seed executed successfully');
