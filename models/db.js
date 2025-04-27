const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mini_website',
    password: '1363267469',
    port: 5432,
});

module.exports = pool;