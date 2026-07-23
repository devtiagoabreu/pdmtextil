import postgres from 'postgres';

const BASE_URL = "postgresql://postgres:dqgh3ffrdg@94550ac37bb5.sn.mynetname.net:21237";
const DATABASES = ["pdm_pro_textil", "pdm_ibirapuera"];

async function createDatabases() {
    // Connect to default postgres database
    const sql = postgres(BASE_URL, { prepare: false });
    
    try {
        for (const dbName of DATABASES) {
            console.log(`Creating database: ${dbName}`);
            await sql.unsafe(`CREATE DATABASE "${dbName}"`);
            console.log(`✓ Database ${dbName} created successfully`);
        }
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Databases already exist, skipping creation');
        } else {
            console.error('Error creating databases:', error.message);
        }
    } finally {
        await sql.end();
    }
}

createDatabases();