import 'dotenv/config'; 
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false 
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Connection to Render Failed:', err.stack);
    }
    console.log('Connected to Render PostgreSQL');
    release();
});

export const query = async (text, params) => {
    try {
        return await pool.query(text, params);
    } catch (err) {
        console.error('Database query error:', err.message);
        console.error('Query:', text);
        console.error('Params:', params);
        throw err;
    }
};